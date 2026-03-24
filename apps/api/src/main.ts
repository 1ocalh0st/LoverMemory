import 'reflect-metadata'
import { ValidationPipe } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import cookieParser from 'cookie-parser'
import { AppModule } from './modules/app.module.js'

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    cors: {
      origin: (process.env.APP_URL ?? 'http://localhost:5173').split(','),
      credentials: true
    }
  })

  app.use(cookieParser())
  app.setGlobalPrefix('api')
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true
    })
  )

  await app.listen(Number(process.env.PORT ?? 3000))
}

bootstrap()
