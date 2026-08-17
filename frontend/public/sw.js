const CACHE_VERSION = 'cadmus-v8';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const IMAGE_CACHE = `${CACHE_VERSION}-images`;
const IMAGE_HOSTS = ['images.pixabay.com', 'api.openverse.org', 'upload.wikimedia.org', 'commons.wikimedia.org'];

// Chemin de base déduit du scope du service worker ('/cadmus/' sur GitHub Pages, '/' en local)
const BASE_PATH = new URL(self.registration.scope).pathname;

const APP_SHELL = [
    BASE_PATH,
    `${BASE_PATH}index.html`,
    `${BASE_PATH}manifest.webmanifest`,
    `${BASE_PATH}icons/favicon.svg`,
    `${BASE_PATH}icons/icon-192.png`,
    `${BASE_PATH}icons/icon-512.png`,
    `${BASE_PATH}icons/icon-maskable-512.png`,
    `${BASE_PATH}icons/apple-touch-icon.png`,
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches
            .open(STATIC_CACHE)
            .then((cache) => cache.addAll(APP_SHELL))
            .then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches
            .keys()
            .then((keys) => Promise.all(keys.filter((key) => !key.startsWith(CACHE_VERSION)).map((key) => caches.delete(key))))
            .then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (event) => {
    const request = event.request;
    if (request.method !== 'GET') {
        return;
    }

    const url = new URL(request.url);

    if (IMAGE_HOSTS.includes(url.hostname)) {
        event.respondWith(cacheFirst(request, IMAGE_CACHE));
        return;
    }

    if (url.origin !== self.location.origin) {
        return;
    }

    if (request.mode === 'navigate') {
        event.respondWith(networkFirst(request));
        return;
    }

    event.respondWith(cacheFirst(request, STATIC_CACHE));
});

function toUrlKey(request) {
    return new Request(request.url);
}

async function networkFirst(request) {
    try {
        const response = await fetch(request);
        if (response?.ok) {
            const copy = response.clone();
            const cache = await caches.open(STATIC_CACHE);
            cache.put(toUrlKey(request), copy);
        }
        return response;
    } catch {
        const cached = await caches.match(toUrlKey(request));
        if (cached) {
            return cached;
        }
        const fallback = await caches.match(`${BASE_PATH}index.html`);
        if (fallback) {
            return fallback;
        }
        return new Response('Offline', { status: 503 });
    }
}

async function cacheFirst(request, cacheName) {
    const cached = await caches.match(toUrlKey(request));
    if (cached) {
        return cached;
    }
    try {
        const response = await fetch(request);
        if (response?.ok) {
            const copy = response.clone();
            const cache = await caches.open(cacheName);
            cache.put(toUrlKey(request), copy);
        }
        return response;
    } catch {
        return new Response('', { status: 408 });
    }
}
