// Service worker : met l'appli en cache pour qu'elle marche sans réseau + rappels.
const CACHE = 'summerbody-v6';
const FILES = ['./', './index.html', './app.html', './manifest.webmanifest', './icon-192.png', './icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Réseau d'abord (pour recevoir les mises à jour), cache si hors ligne.
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request).then(res => {
      const copy = res.clone();
      caches.open(CACHE).then(c => c.put(e.request, copy));
      return res;
    }).catch(() => caches.match(e.request, { ignoreSearch: true }))
  );
});

// Rappel du jour (Android décide quand : au mieux 1 à 2 fois par jour, appli installée).
const PLAN = {
  1: '🏋️ Séance A aujourd\'hui (squat, développé couché…)',
  2: '🚶 Repos actif : 8 000 pas + mobilité',
  3: '🥋 Jiu-jitsu ce soir (1 h)',
  4: '🏋️ Séance B aujourd\'hui (soulevé de terre roumain, tirage…)',
  5: '🚶 Repos actif : 8 000 pas + mobilité',
  6: '🏋️ Séance C aujourd\'hui (presse, développé haltères…)',
  0: '🥋 Jiu-jitsu (2 h) + bilan du dimanche',
};
self.addEventListener('periodicsync', e => {
  if (e.tag !== 'sb-daily') return;
  const now = new Date(), h = now.getHours();
  if (h < 7 || h > 21) return;
  const end = new Date('2027-03-10T23:59:59');
  const left = Math.max(0, Math.ceil((end - now) / 864e5));
  e.waitUntil(self.registration.showNotification('Summer Body · J-' + left, {
    body: PLAN[now.getDay()] + '\nCréatine, 2 L d\'eau, 140 g de protéines 💪',
    tag: 'daily', icon: 'icon-192.png',
  }));
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
    for (const c of list) if ('focus' in c) return c.focus();
    return self.clients.openWindow('./app.html');
  }));
});
