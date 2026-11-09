type ConferenceDates = { startsAt: string; endsAt: string; timezone: string };

export function conferenceDayLabel(conference: ConferenceDates | undefined, now: number): string {
  const fallback = '13–15 NOV';
  if (!conference) return fallback;
  try {
    const calendar = new Intl.DateTimeFormat('en-GB', {
      timeZone: conference.timezone, year: 'numeric', month: '2-digit', day: '2-digit',
    });
    // Compare calendar days, rather than elapsed hours or the device's local date.
    const dayNumber = (value: Date) => {
      const parts = calendar.formatToParts(value);
      const part = (name: string) => Number(parts.find(item => item.type === name)?.value);
      return Date.UTC(part('year'), part('month') - 1, part('day')) / 86_400_000;
    };
    const today = new Date(now);
    const start = dayNumber(new Date(conference.startsAt));
    const end = dayNumber(new Date(conference.endsAt));
    const current = dayNumber(today);
    if (current > end || end < start) return fallback;
    const date = new Intl.DateTimeFormat('en-GB', {
      timeZone: conference.timezone, day: 'numeric', month: 'short',
    }).format(today);
    return `Day ${Math.max(0, current - start + 1)} - ${date}`;
  } catch {
    return fallback;
  }
}
