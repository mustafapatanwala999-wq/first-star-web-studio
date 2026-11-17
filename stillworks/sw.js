/* Offline shell. Same-origin only: never touches YouTube, X or any other host. */
const VERSION = "stillworks-v1";
const SHELL = [
  "./", "index.html", "styles.css", "app.js", "brand.js", "manifest.webmanifest",
  "fonts/big-shoulders-display.woff2", "fonts/schibsted-grotesk.woff2", "fonts/tilt-neon.woff2",
  "icons/favicon.svg", "icons/icon-192.png", "icons/icon-512.png",
  "data/news.json", "data/entries.json", "data/tips.json", "data/updates.json", "data/media.json", "data/checklists.json",
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;     // embeds and outbound links: hands off
  if (url.pathname.includes("/api/")) return;           // live API: always network, app handles failure
  const fresh = url.pathname.includes("/data/") || req.mode === "navigate";
  if (fresh) {
    // network first, cached copy when offline
    e.respondWith(fetch(req).then((res) => {
      if (res.ok) { const copy = res.clone(); caches.open(VERSION).then((c) => c.put(req, copy)); }
      return res;
    }).catch(() => caches.match(req).then((r) => r || caches.match("index.html"))));
    return;
  }
  e.respondWith(caches.match(req).then((hit) => hit || fetch(req).then((res) => {
    if (res.ok) { const copy = res.clone(); caches.open(VERSION).then((c) => c.put(req, copy)); }
    return res;
  })));
});
