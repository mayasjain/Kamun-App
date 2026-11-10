/** Keep published urgent notices ahead of routine news, newest first within each group. */
export function orderAnnouncements<T extends { priority: string; publishedAt: string }>(items: readonly T[]): T[] {
  return [...items].sort((a, b) =>
    Number(b.priority === 'urgent') - Number(a.priority === 'urgent')
    || (Date.parse(b.publishedAt) || 0) - (Date.parse(a.publishedAt) || 0));
}
