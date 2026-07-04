const CACHE_VERSION = 'v3';
const isAsset = (url) => url.startsWith(self.location.origin) && !url.includes('/api/');

self.addEventListener('install', (e) => {
  // 立即接管，不等旧SW退出
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k !== CACHE_VERSION).map(k => caches.delete(k))
    )).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const url = e.request.url;
  if (!isAsset(url)) return;

  // HTML导航请求(index.html)：网络优先，保证每次部署的新版本立刻生效，断网才回退缓存
  const isNav = e.request.mode === 'navigate' || url.endsWith('/') || url.endsWith('/index.html');
  if (isNav) {
    e.respondWith(
      fetch(e.request).then(res => {
        if (res.ok) { const clone = res.clone(); caches.open(CACHE_VERSION).then(c => c.put(e.request, clone)); }
        return res;
      }).catch(() => caches.match(e.request).then(c => c || caches.match('/')))
    );
    return;
  }

  // 带哈希的静态资源(js/css/图片)：文件名变了就是新文件，缓存优先没问题
  e.respondWith(
    caches.match(e.request).then(cached => {
      const fetchPromise = fetch(e.request).then(res => {
        if (res.ok) { const clone = res.clone(); caches.open(CACHE_VERSION).then(c => c.put(e.request, clone)); }
        return res;
      }).catch(() => cached);
      return cached || fetchPromise;
    })
  );
});
