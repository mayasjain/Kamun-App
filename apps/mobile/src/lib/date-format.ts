const TIMEZONE = 'Europe/Berlin';

export function formatConferenceDateRange(startsAt: string, endsAt: string) {
  const start = new Date(startsAt);
  const end = new Date(endsAt);
  const monthYear = new Intl.DateTimeFormat('en-GB', { month: 'long', year: 'numeric', timeZone: TIMEZONE }).format(end);
  return `${start.getDate()}–${end.getDate()} ${monthYear}`;
}

export function formatEventTime(startsAt: string, endsAt: string) {
  const formatter = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: TIMEZONE });
  return `${formatter.format(new Date(startsAt))}–${formatter.format(new Date(endsAt))}`;
}

export function formatDay(value: string) {
  return new Intl.DateTimeFormat('en-GB', { weekday: 'long', day: 'numeric', month: 'long', timeZone: TIMEZONE }).format(new Date(value));
}

export function formatAnnouncementTime(value: string) {
  return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: TIMEZONE }).format(new Date(value));
}
