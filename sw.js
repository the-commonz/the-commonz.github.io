var CACHE = "commonz-v2";
var CORE = ["./", "index.html", "manifest.webmanifest", "icon-180.png", "icon-192.png", "icon-512.png"];

self.addEventListener("install", function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(CORE); }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener("activate", function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

self.addEventListener("fetch", function (e) {
  var req = e.request;
  if (req.method !== "GET") return;
  var url = new URL(req.url);
  var isFont = url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com";
  if (url.origin !== location.origin && !isFont) return;

  function refresh(key) {
    return fetch(req).then(function (r) {
      if (r && (r.ok || r.type === "opaque")) { var cp = r.clone(); caches.open(CACHE).then(function (c) { c.put(key, cp); }); }
      return r;
    });
  }

  if (req.mode === "navigate") {
    e.respondWith(caches.match("index.html").then(function (hit) {
      var net = refresh("index.html").catch(function () { return hit; });
      return hit || net;
    }));
    return;
  }
  e.respondWith(caches.match(req).then(function (hit) {
    var net = refresh(req).catch(function () { return hit; });
    return hit || net;
  }));
});
