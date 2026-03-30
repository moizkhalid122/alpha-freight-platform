// Firebase Cloud Messaging Service Worker
importScripts('https://www.gstatic.com/firebasejs/8.10.1/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/8.10.1/firebase-messaging.js');

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBdn4T4IpwX_nN2pkhHaBI9yqyZ3faAF6o",
    authDomain: "alpha-brokerage.firebaseapp.com",
    projectId: "alpha-brokerage",
    storageBucket: "alpha-brokerage.firebasestorage.app",
    messagingSenderId: "834712514965",
    appId: "1:834712514965:web:5dbe0aa2e4eab3cb16c69c"
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
    console.log('Background message received:', payload);
    
    const notificationTitle = payload.notification?.title || 'Alpha Freight';
    const notificationOptions = {
        body: payload.notification?.body || payload.data?.body || 'You have a new notification',
        icon: '/assets/img/alpha-freight-logo.svg',
        badge: '/assets/img/alpha-freight-logo.svg',
        tag: (payload.data?.type || 'notification') + '_' + Date.now(),
        data: payload.data,
        requireInteraction: true,
        silent: false
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    
    const data = event.notification.data;
    let url = '/mobile-app/carrier/dashboard.html';
    
    if (data) {
        if (data.type === 'new_load') {
            url = '/mobile-app/carrier/loads.html';
        } else if (data.type === 'load_accepted') {
            url = '/mobile-app/carrier/my-loads.html';
        } else if (data.type === 'deposit' || data.type === 'withdrawal') {
            url = '/mobile-app/carrier/wallet.html';
        } else if (data.url) {
            url = data.url;
        }
    }
    
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
            for (let i = 0; i < clientList.length; i++) {
                const client = clientList[i];
                if (client.url === url && 'focus' in client) {
                    return client.focus();
                }
            }
            if (clients.openWindow) {
                return clients.openWindow(url);
            }
        })
    );
});
