export function getCountdown(weddingDate: Date, from: Date = new Date()) {
  const msPerDay = 1000 * 60 * 60 * 24;
  const diffMs = weddingDate.getTime() - from.getTime();
  const totalDays = Math.ceil(diffMs / msPerDay);

  const days = Math.max(totalDays, 0);
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30.44);

  return { totalDays: days, weeks, months, isPast: diffMs < 0 };
}
