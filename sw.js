// 오프라인에서도 열리도록 앱 파일을 기기에 저장해 둔다.
// 앱을 고친 뒤에는 CACHE 이름의 숫자를 올리면 새 버전으로 바뀐다.
const CACHE = "fsrs-v20";
const ASSETS = ["./", "./index.html", "./kanji.json", "./manifest.webmanifest", "./icon-192.png", "./icon-512.png", "./apple-touch-icon.png", "./vocab-template.xlsx"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

function cacheFirst(req) {
  return caches.match(req).then(hit => hit || fetch(req).then(res => {
    const copy = res.clone();
    caches.open(CACHE).then(c => c.put(req, copy));
    return res;
  }));
}

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  // PC에서 Live Server로 고칠 때는 저장해 둔 파일을 쓰지 않는다.
  if (self.location.hostname === "127.0.0.1" || self.location.hostname === "localhost") return;
  if (url.origin === self.location.origin) {
    if (req.mode === "navigate") {
      // 화면은 인터넷이 되면 최신 버전, 안 되면 저장해 둔 버전
      e.respondWith(
        fetch(req.url, { cache: "no-cache" }).then(res => {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put("./index.html", copy));
          return res;
        }).catch(() => caches.match("./index.html"))
      );
      return;
    }
    e.respondWith(cacheFirst(req));
  } else if (url.hostname.endsWith("fonts.googleapis.com") || url.hostname.endsWith("fonts.gstatic.com")) {
    e.respondWith(cacheFirst(req));
  }
});
