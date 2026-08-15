const CACHE_VERSION = 'cadmus-v4';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const IMAGE_CACHE = `${CACHE_VERSION}-images`;
const IMAGE_HOSTS = ['images.pixabay.com', 'api.openverse.org', 'upload.wikimedia.org', 'commons.wikimedia.org'];
const APP_SHELL = [
    '/',
    '/index.html',
    '/manifest.webmanifest',
    '/icons/favicon.svg',
    '/icons/icon-192.png',
    '/icons/icon-512.png',
    '/icons/icon-maskable-512.png',
    '/icons/apple-touch-icon.png',
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
        const fallback = await caches.match('/index.html');
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
