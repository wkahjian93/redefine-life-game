// Offline support: caches the whole game on first load. Bump VERSION when files change.
const VERSION = 'rlg-v20';
const FILES = ['./', 'index.html', 'styles.css', 'data.js', 'rules.js', 'i18n.js', 'sound.js', 'cards.js', 'movie.js', 'scenes.js', 'chase.js', 'concepts.js', 'app.js', 'manifest.webmanifest', 'icons/icon-192.png', 'icons/icon-512.png', 'logo.png', 'logo-mark.png'];
// recorded narration files (voice/index.json) are cached too, so the agent's voice works offline
const voiceFiles = () => fetch('voice/index.json', { cache: 'no-cache' }).then(r => r.ok ? r.json() : { en: {}, zh: {} }).then(j => ['voice/index.json', ...['en', 'zh'].flatMap(l => Object.values(j[l] || {}).map(f => 'voice/' + l + '/' + f))]).catch(() => []);
self.addEventListener('install', e => { e.waitUntil(caches.open(VERSION).then(c => c.addAll(FILES).then(() => voiceFiles()).then(v => Promise.all(v.map(u => c.add(u).catch(() => {}))))).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;
  // network first (so updates arrive), cache when offline
  e.respondWith(fetch(e.request).then(r => { const copy = r.clone(); caches.open(VERSION).then(c => c.put(e.request, copy)); return r; })
    .catch(() => caches.match(e.request, { ignoreSearch: true }).then(r => r || caches.match('index.html'))));
});
