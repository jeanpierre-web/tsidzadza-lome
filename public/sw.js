/* TSIDZADZA — cache du site (pas des tuiles de carte, pas de l'API).
   Après une visite en ligne, l'écran se rouvre sans réseau.
   Les signalements partagés restent gérés par l'application. */
const CACHE = 'tsidzadza-shell-v1'
const LIMIT = 60
const PRECACHE = []

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE)
    await Promise.all(PRECACHE.map(async (path) => {
      try {
        const url = new URL(path, self.location.href)
        const res = await fetch(url)
        if (res.ok) await store(cache, url, res)
      } catch {
        /* un fichier manquant n'empêche pas l'installation */
      }
    }))
    await self.skipWaiting()
  })())
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  const req = event.request
  if (req.method !== 'GET') return
  if (req.headers.get('range')) return
  const url = new URL(req.url)
  if (url.origin !== self.location.origin) return
  if (url.pathname.endsWith('/sw.js')) return
  event.respondWith(networkFirst(req))
})

async function store(cache, request, response) {
  try {
    await cache.put(request, response.clone())
  } catch {
    // GitHub Pages redirige parfois : une réponse « redirected » ne se met pas en cache telle quelle.
    try {
      await cache.put(request, new Response(await response.clone().blob(), {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
      }))
    } catch {
      /* le réseau a répondu : on n'empêche pas l'affichage */
    }
  }
}

async function networkFirst(req) {
  const cache = await caches.open(CACHE)
  try {
    const fresh = await fetch(req)
    if (fresh.ok && (fresh.type === 'basic' || fresh.type === 'default')) {
      await store(cache, req, fresh)
      if (req.mode === 'navigate') await store(cache, new URL('./index.html', self.location.href), fresh)
      await trim(cache)
      return fresh
    }
  } catch {
    /* hors ligne */
  }
  const cached = await cache.match(req, { ignoreVary: true })
  if (cached) return cached
  if (req.mode === 'navigate') {
    const shell = await cache.match(new URL('./index.html', self.location.href), { ignoreVary: true })
    if (shell) return shell
  }
  return fetch(req)
}

async function trim(cache) {
  const keys = await cache.keys()
  let overflow = keys.length - LIMIT
  for (const key of keys) {
    if (overflow <= 0) break
    if (key.url.endsWith('/index.html') || key.url.endsWith('/')) continue
    await cache.delete(key)
    overflow -= 1
  }
}
