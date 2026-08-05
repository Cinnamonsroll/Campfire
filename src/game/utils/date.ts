export function todayKey(now: Date = new Date()): string {
  return now.toISOString().slice(0, 10);
}

function msUntilTomorrow(now: Date = new Date()): number {
  const tomorrow = new Date(now);
  tomorrow.setUTCHours(24, 0, 0, 0);
  return Math.max(tomorrow.getTime() - now.getTime(), 1000);
}

export function secondsUntilTomorrow(now: Date = new Date()): number {
  return Math.ceil(msUntilTomorrow(now) / 1000);
}
