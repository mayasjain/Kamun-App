/* Notification-only worker: never caches app pages, API responses or credentials. */
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', event => event.waitUntil(self.clients.claim()));
self.addEventListener('push', event => {
  let tag = 'kamun-update';
  try {
    const payload = event.data?.json();
    if (/^kamun-[0-9a-f-]{36}$/i.test(payload?.tag)) tag = payload.tag;
  } catch { /* Always show a visible notification, even with an empty push. */ }
  event.waitUntil(Promise.all([
    self.registration.showNotification('New KAMUN update', {
      body: 'Open Updates to read the latest announcement.',
      icon: '/icon-192.png', badge: '/icon-192.png', tag,
      data: { url: '/updates' },
    }),
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clients => {
      clients.forEach(client => client.postMessage({ type: 'KAMUN_UPDATE' }));
    }),
  ]));
});
self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil((async () => {
    const url = new URL('/updates', self.location.origin).href;
    const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const client of clients) {
      if (new URL(client.url).origin === self.location.origin && 'navigate' in client) {
        await client.navigate(url);
        await client.focus();
        return;
      }
    }
    await self.clients.openWindow(url);
  })());
});
self.addEventListener('message', event => {
  if (event.data?.type === 'KAMUN_CLEAR_NOTIFICATIONS') {
    event.waitUntil(self.registration.getNotifications().then(notifications => notifications.forEach(n => n.close())));
  }
});
