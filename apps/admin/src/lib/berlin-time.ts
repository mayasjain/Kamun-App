const berlinFormat = new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Berlin", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
export const localTime = (value: string) => berlinFormat.format(new Date(value)).replace(" ", "T");
// Match the entered wall time against both Berlin offsets. Reject missing or
// repeated DST times instead of silently choosing the browser's timezone.
export function toInstant(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) throw new Error("Enter a complete start and end date and time.");
  const base = Date.parse(`${value}:00Z`);
  if (!Number.isFinite(base)) throw new Error("Enter a valid date and time.");
  const candidates = [1, 2].map((offset) => new Date(base - offset * 3600000).toISOString()).filter((instant) => localTime(instant) === value);
  if (candidates.length !== 1) throw new Error("This time is missing or repeated during Berlin's clock change. Choose a time outside the clock-change hour.");
  return candidates[0];
}

