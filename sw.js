/* KREDITAS — service worker : notifications push (OneSignal) + installation de l'application */
importScripts("https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js");
const CACHE = "kreditas-v1";
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", e => e.waitUntil(self.clients.claim()));
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET" || e.request.mode !== "navigate") return;
  e.respondWith(fetch(e.request).then(r => {
    if (r && r.ok) { const c = r.clone(); caches.open(CACHE).then(x => x.put("/", c)); }
    return r;
  }).catch(() => caches.match("/")));
});
