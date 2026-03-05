// Alpha Freight - App Service Worker for Offline Support
// This service worker caches app files and enables offline functionality

const CACHE_NAME = 'alpha-brokrage-app-v1';
const OFFLINE_CACHE = 'alpha-brokrage-offline-v1';

// Files to cache for offline use
const STATIC_CACHE_FILES = [
    '/app/index.html',
    '/app/splash.html',
    '/app/onboarding.html',
    '/app/carrier/dashboard.html',
    '/app/carrier/loads.html',
    '/app/carrier/my-loads.html',
    '/app/carrier/messages.html',
    '/app/carrier/profile.html',
    '/app/supplier/dashboard.html',
    '/app/supplier/post-load.html',
    '/app/supplier/loads.html',
    '/app/supplier/messages.html',
    '/app/supplier/profile.html',
    '/assets/css/style.css',
    '/assets/js/notifications.js',
    '/assets/js/push-notifications-integration.js',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css',
    'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css'
];

// Install event - Cache static files
self.addEventListener('install', (event) => {
    console.log('Service Worker: Installing...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Service Worker: Caching static files');
                return cache.addAll(STATIC_CACHE_FILES.map(url => {
                    try {
                        return new Request(url, { mode: 'no-cors' });
                    } catch (e) {
                        return url;
                    }
                })).catch((error) => {
                    console.log('Service Worker: Some files failed to cache:', error);
                    // Continue even if some files fail
                });
            })
    );
    self.skipWaiting();
});

// Activate event - Clean up old caches
self.addEventListener('activate', (event) => {
    console.log('Service Worker: Activating...');
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME && cacheName !== OFFLINE_CACHE) {
                        console.log('Service Worker: Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    return self.clients.claim();
});

// Fetch event - Serve from cache when offline
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Skip non-GET requests
    if (request.method !== 'GET') {
        return;
    }

    // Skip Firebase and external API calls
    if (url.hostname.includes('firebase') || 
        url.hostname.includes('googleapis') ||
        url.hostname.includes('gstatic')) {
        return;
    }

    // For app HTML files, try cache first
    if (request.url.includes('/app/') && request.url.endsWith('.html')) {
        event.respondWith(
            caches.match(request)
                .then((cachedResponse) => {
                    if (cachedResponse) {
                        return cachedResponse;
                    }
                    return fetch(request)
                        .then((response) => {
                            // Cache successful responses
                            if (response.status === 200) {
                                const responseToCache = response.clone();
                                caches.open(CACHE_NAME).then((cache) => {
                                    cache.put(request, responseToCache);
                                });
                            }
                            return response;
                        })
                        .catch(() => {
                            // Return offline page if fetch fails
                            return caches.match('/app/index.html');
                        });
                })
        );
        return;
    }

    // For static assets (CSS, JS, images)
    if (request.url.includes('/assets/') || 
        request.url.includes('cdnjs.cloudflare.com') ||
        request.url.includes('cdn.jsdelivr.net')) {
        event.respondWith(
            caches.match(request)
                .then((cachedResponse) => {
                    return cachedResponse || fetch(request)
                        .then((response) => {
                            if (response.status === 200) {
                                const responseToCache = response.clone();
                                caches.open(CACHE_NAME).then((cache) => {
                                    cache.put(request, responseToCache);
                                });
                            }
                            return response;
                        });
                })
        );
        return;
    }
});

// Message event - Handle messages from main thread
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
    
    if (event.data && event.data.type === 'CACHE_URLS') {
        const urls = event.data.urls;
        event.waitUntil(
            caches.open(CACHE_NAME).then((cache) => {
                return cache.addAll(urls);
            })
        );
    }
});

console.log('Service Worker: Loaded');

