export function getNextOccurrence(targetDate: Date, now = new Date()) {
  const occurrence = new Date(targetDate)
  occurrence.setFullYear(now.getFullYear())
  if (occurrence < now) {
    occurrence.setFullYear(now.getFullYear() + 1)
  }
  return occurrence
}

export function getReminderCandidates(targetDate: Date, reminderDays: number[], now = new Date()) {
  const occurrence = getNextOccurrence(targetDate, now)
  return [0, ...reminderDays]
    .filter((value, index, array) => array.indexOf(value) === index)
    .map((days) => {
      const scheduledFor = new Date(occurrence)
      scheduledFor.setDate(scheduledFor.getDate() - days)
      return { days, occurrence, scheduledFor }
    })
}

export function calculateCountdown(targetDate: Date, now = new Date()) {
  const ms = targetDate.getTime() - now.getTime()
  return Math.ceil(ms / (1000 * 60 * 60 * 24))
}
