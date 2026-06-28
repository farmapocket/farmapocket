// ============================================================
// FARMAPOCKET - Service Worker
// Cache strategies for offline support
// ============================================================

const CACHE_NAME = 'farma-pocket-v1';
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/app.html',
    '/manifest.json',
    'https://cdn.tailwindcss.com',
    'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2',
    'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap'
];

// Instalar: cachear assets estáticos
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            // Cacheia cada asset individualmente para que falhas em recursos
            // cross-origin (como o CDN do Tailwind) não quebrem todo o cache.
            return Promise.all(
                STATIC_ASSETS.map((url) =>
                    cache.add(url).catch((err) => {
                        console.warn(`[SW] Failed to cache ${url}:`, err.message);
                    })
                )
            );
        }).then(() => {
            return self.skipWaiting();
        })
    );
});

// Ativar: limpar caches antigos
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames
                    .filter((name) => name !== CACHE_NAME)
                    .map((name) => caches.delete(name))
            );
        }).then(() => {
            return self.clients.claim();
        })
    );
});

// Fetch: estratégia de cache
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Ignorar requisições do Supabase (não cachear API)
    if (url.hostname.includes('supabase.co')) {
        return;
    }

    // Ignorar requisições não-GET
    if (request.method !== 'GET') {
        return;
    }

    // Estratégia: Cache First, depois Network
    event.respondWith(
        caches.match(request).then((cachedResponse) => {
            if (cachedResponse) {
                // Retornar do cache e atualizar em background
                fetch(request).then((networkResponse) => {
                    if (networkResponse && networkResponse.status === 200) {
                        caches.open(CACHE_NAME).then((cache) => {
                            cache.put(request, networkResponse.clone());
                        });
                    }
                }).catch(() => {});

                return cachedResponse;
            }

            // Se não está no cache, buscar na rede
            return fetch(request).then((networkResponse) => {
                if (!networkResponse || networkResponse.status !== 200) {
                    return networkResponse;
                }

                // Salvar no cache para próxima vez
                const responseToCache = networkResponse.clone();
                caches.open(CACHE_NAME).then((cache) => {
                    cache.put(request, responseToCache);
                });

                return networkResponse;
            }).catch(() => {
                // Offline e não está no cache
                if (request.mode === 'navigate') {
                    return caches.match('/index.html');
                }

                return new Response('Offline', {
                    status: 503,
                    statusText: 'Service Unavailable'
                });
            });
        })
    );
});

// Mensagens do app principal
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});

// Background sync (quando suportado)
self.addEventListener('sync', (event) => {
    if (event.tag === 'sync-medications') {
        event.waitUntil(
            // Notificar o app principal para sincronizar
            self.clients.matchAll().then((clients) => {
                clients.forEach((client) => {
                    client.postMessage({ type: 'SYNC_REQUIRED' });
                });
            })
        );
    }
});
