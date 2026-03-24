import { GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { PrismaClient } from '@prisma/client'
import sharp from 'sharp'
import webPush from 'web-push'

const prisma = new PrismaClient()
const pollIntervalMs = Number(process.env.WORKER_POLL_INTERVAL_MS ?? 60_000)

function getS3Client() {
  if (!process.env.S3_BUCKET || !process.env.S3_ENDPOINT) {
    return null
  }
  return new S3Client({
    region: process.env.S3_REGION ?? 'auto',
    endpoint: process.env.S3_ENDPOINT,
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY ?? '',
      secretAccessKey: process.env.S3_SECRET_KEY ?? ''
    },
    forcePathStyle: process.env.S3_FORCE_PATH_STYLE === 'true'
  })
}

function getReminderCandidates(targetDate: Date, reminderDays: number[], now = new Date()) {
  const occurrence = new Date(targetDate)
  occurrence.setFullYear(now.getFullYear())
  if (occurrence < now) {
    occurrence.setFullYear(now.getFullYear() + 1)
  }

  return [0, ...reminderDays]
    .filter((value, index, array) => array.indexOf(value) === index)
    .map((days) => {
      const scheduledFor = new Date(occurrence)
      scheduledFor.setDate(scheduledFor.getDate() - days)
      return { days, occurrence, scheduledFor }
    })
}

async function streamToBuffer(stream: any) {
  const chunks: Buffer[] = []
  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
  }
  return Buffer.concat(chunks)
}

function toDataUri(buffer: Buffer, mimeType: string) {
  return `data:${mimeType};base64,${buffer.toString('base64')}`
}

async function processAsset(assetId: string) {
  const client = getS3Client()
  if (!client || !process.env.S3_BUCKET) {
    return
  }

  const asset = await prisma.memoryAsset.findUnique({
    where: { id: assetId }
  })
  if (!asset) {
    return
  }

  try {
    const source = await client.send(
      new GetObjectCommand({
        Bucket: process.env.S3_BUCKET,
        Key: asset.storageKey
      })
    )
    const body = await streamToBuffer(source.Body)
    const image = sharp(body)
    const metadata = await image.metadata()

    const blurBuffer = await image.clone().resize(24).jpeg({ quality: 40 }).blur(4).toBuffer()
    const small = await image.clone().resize({ width: 640 }).webp({ quality: 82 }).toBuffer()
    const medium = await image.clone().resize({ width: 1200 }).webp({ quality: 82 }).toBuffer()
    const large = await image.clone().resize({ width: 1800 }).avif({ quality: 55 }).toBuffer()

    const baseKey = asset.storageKey.replace(/\.[^.]+$/, '')
    const outputs = [
      { key: `${baseKey}-sm.webp`, buffer: small, mimeType: 'image/webp', variant: 'sm' },
      { key: `${baseKey}-md.webp`, buffer: medium, mimeType: 'image/webp', variant: 'md' },
      { key: `${baseKey}-lg.avif`, buffer: large, mimeType: 'image/avif', variant: 'lg' }
    ] as const

    await Promise.all(
      outputs.map((output) =>
        client.send(
          new PutObjectCommand({
            Bucket: process.env.S3_BUCKET,
            Key: output.key,
            Body: output.buffer,
            ContentType: output.mimeType
          })
        )
      )
    )

    const baseUrl = process.env.ASSET_BASE_URL ?? `${process.env.S3_ENDPOINT}/${process.env.S3_BUCKET}`
    await prisma.memoryAsset.update({
      where: { id: asset.id },
      data: {
        width: asset.width ?? metadata.width ?? null,
        height: asset.height ?? metadata.height ?? null,
        blurDataUrl: toDataUri(blurBuffer, 'image/jpeg'),
        variants: Object.fromEntries(outputs.map((output) => [output.variant, `${baseUrl}/${output.key}`])),
        status: 'PROCESSED'
      }
    })
  } catch (error) {
    await prisma.memoryAsset.update({
      where: { id: assetId },
      data: { status: 'FAILED' }
    })
    console.error('asset processing failed', assetId, error)
  }
}

async function processPendingAssets() {
  const assets = await prisma.memoryAsset.findMany({
    where: { status: 'PENDING' },
    take: 4,
    orderBy: { createdAt: 'asc' }
  })

  for (const asset of assets) {
    await processAsset(asset.id)
  }
}

function notificationBody(title: string, days: number) {
  if (days === 0) {
    return `${title} is today.`
  }
  if (days === 1) {
    return `${title} is tomorrow.`
  }
  return `${title} is in ${days} days.`
}

async function sendPush(subscription: { endpoint: string; p256dh: string; auth: string }, payload: Record<string, unknown>) {
  if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY || !process.env.VAPID_SUBJECT) {
    return false
  }
  webPush.setVapidDetails(
    process.env.VAPID_SUBJECT,
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  )

  await webPush.sendNotification(
    {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: subscription.p256dh,
        auth: subscription.auth
      }
    },
    JSON.stringify(payload)
  )
  return true
}

async function processReminderSweep() {
  const now = new Date()
  const windowStart = new Date(now.getTime() - pollIntervalMs)
  const anniversaries = await prisma.anniversary.findMany({
    include: {
      coupleSpace: {
        include: {
          memberships: {
            where: { status: 'ACTIVE' },
            include: {
              user: {
                include: {
                  notificationSubscriptions: true
                }
              }
            }
          }
        }
      }
    }
  })

  for (const anniversary of anniversaries) {
    const candidates = getReminderCandidates(
      anniversary.targetDate,
      (anniversary.reminderDays as number[]) ?? [],
      now
    )

    for (const candidate of candidates) {
      if (candidate.scheduledFor < windowStart || candidate.scheduledFor > now) {
        continue
      }

      const daysLeft = Math.max(
        0,
        Math.ceil((candidate.occurrence.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      )

      for (const membership of anniversary.coupleSpace.memberships) {
        const payload = {
          anniversaryId: anniversary.id,
          title: anniversary.title,
          daysLeft,
          targetDate: candidate.occurrence.toISOString()
        }
        const dedupeInApp = `anniversary:${anniversary.id}:${membership.userId}:${candidate.occurrence.toISOString()}:${candidate.days}:in-app`
        await prisma.notificationRecord.upsert({
          where: { dedupeKey: dedupeInApp },
          update: {},
          create: {
            userId: membership.userId,
            coupleSpaceId: anniversary.coupleSpaceId,
            channel: 'IN_APP',
            title: anniversary.title,
            body: notificationBody(anniversary.title, daysLeft),
            payload,
            status: 'SENT',
            scheduledFor: candidate.scheduledFor,
            sentAt: new Date(),
            dedupeKey: dedupeInApp
          }
        })

        for (const subscription of membership.user.notificationSubscriptions) {
          const dedupePush = `anniversary:${anniversary.id}:${membership.userId}:${candidate.occurrence.toISOString()}:${candidate.days}:push:${subscription.id}`
          const existing = await prisma.notificationRecord.findUnique({
            where: { dedupeKey: dedupePush }
          })
          if (existing) {
            continue
          }

          try {
            const sent = await sendPush(subscription, {
              title: anniversary.title,
              body: notificationBody(anniversary.title, daysLeft),
              payload
            })
            await prisma.notificationRecord.create({
              data: {
                userId: membership.userId,
                coupleSpaceId: anniversary.coupleSpaceId,
                channel: 'WEB_PUSH',
                title: anniversary.title,
                body: notificationBody(anniversary.title, daysLeft),
                payload,
                status: sent ? 'SENT' : 'FAILED',
                scheduledFor: candidate.scheduledFor,
                sentAt: sent ? new Date() : null,
                dedupeKey: dedupePush
              }
            })
          } catch (error) {
            await prisma.notificationRecord.create({
              data: {
                userId: membership.userId,
                coupleSpaceId: anniversary.coupleSpaceId,
                channel: 'WEB_PUSH',
                title: anniversary.title,
                body: notificationBody(anniversary.title, daysLeft),
                payload,
                status: 'FAILED',
                scheduledFor: candidate.scheduledFor,
                dedupeKey: dedupePush
              }
            })
            console.error('push delivery failed', subscription.endpoint, error)
          }
        }
      }
    }
  }
}

async function sweep() {
  await processPendingAssets()
  await processReminderSweep()
}

async function main() {
  await sweep()
  setInterval(() => {
    sweep().catch((error) => console.error('worker sweep failed', error))
  }, pollIntervalMs)
}

main().catch((error) => {
  console.error('worker boot failed', error)
  process.exit(1)
})
