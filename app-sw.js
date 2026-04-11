// Alpha Freight - App Service Worker for Offline Support
// This service worker caches app files and enables offline functionality

const CACHE_NAME = 'alpha-brokrage-app-v2';
const OFFLINE_CACHE = 'alpha-brokrage-offline-v2';

// Firebase Cloud Messaging (FCM) for background push notifications
try {
    importScripts('https://www.gstatic.com/firebasejs/8.10.1/firebase-app.js');
    importScripts('https://www.gstatic.com/firebasejs/8.10.1/firebase-messaging.js');

    const firebaseConfig = {
        apiKey: "AIzaSyBdn4T4IpwX_nN2pkhHaBI9yqyZ3faAF6o",
        authDomain: "alpha-brokerage.firebaseapp.com",
        databaseURL: "https://alpha-brokerage-default-rtdb.firebaseio.com",
        projectId: "alpha-brokerage",
        storageBucket: "alpha-brokerage.firebasestorage.app",
        messagingSenderId: "834712514965",
        appId: "1:834712514965:web:5dbe0aa2e4eab3cb16c69c"
    };

    if (!firebase.apps || firebase.apps.length === 0) {
        firebase.initializeApp(firebaseConfig);
    }

    const messaging = firebase.messaging();

    messaging.onBackgroundMessage((payload) => {
        const notificationTitle = payload.notification?.title || 'Alpha Freight';
        const icon = payload.notification?.icon || payload.data?.icon || '/image-removebg-preview - 2025-10-29T055946.105.png';
        const notificationOptions = {
            body: payload.notification?.body || payload.data?.body || 'You have a new notification',
            icon: icon,
            badge: icon,
            tag: (payload.data?.type || 'notification') + '_' + Date.now(),
            data: payload.data || {},
            requireInteraction: true,
            silent: false
        };
        self.registration.showNotification(notificationTitle, notificationOptions);
    });

    self.addEventListener('notificationclick', (event) => {
        event.notification.close();
        const data = event.notification.data || {};

        let url = '';
        if (data && data.url) {
            url = String(data.url);
        }
        if (!url) {
            url = '/mobile-app/carrier/dashboard.html';
            if (data && data.userType === 'supplier') url = '/mobile-app/supplier/dashboard.html';
        }

        if (!data.url && data.type === 'new_load') {
            url = '/mobile-app/carrier/loads.html';
        } else if (!data.url && data.type === 'load_accepted') {
            url = '/mobile-app/supplier/my-loads.html';
        } else if (!data.url && data.type === 'message') {
            url = (data.userType === 'supplier') ? '/mobile-app/supplier/messages.html' : '/mobile-app/carrier/messages.html';
        } else if (!data.url && (data.type === 'deposit' || data.type === 'withdrawal')) {
            url = '/mobile-app/carrier/wallet.html';
        }

        event.waitUntil(
            self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientsArr) => {
                for (const client of clientsArr) {
                    try {
                        if (url && client.url.includes(url) && 'focus' in client) return client.focus();
                    } catch (e) {}
                }
                if (self.clients.openWindow) return self.clients.openWindow(url || '/mobile-app/index.html');
            })
        );
    });
} catch (e) {
    // ignore - push will be disabled if scripts fail
}

// Files to cache for offline use
const STATIC_CACHE_FILES = [
    '/mobile-app/index.html',
    '/mobile-app/carrier/dashboard.html',
    '/mobile-app/carrier/loads.html',
    '/mobile-app/carrier/my-loads.html',
    '/mobile-app/carrier/messages.html',
    '/mobile-app/carrier/profile.html',
    '/mobile-app/supplier/dashboard.html',
    '/mobile-app/supplier/post-load.html',
    '/mobile-app/supplier/messages.html',
    '/mobile-app/supplier/profile.html',
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
    if (request.url.includes('/mobile-app/') && request.url.endsWith('.html')) {
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
                            return caches.match('/mobile-app/index.html');
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

