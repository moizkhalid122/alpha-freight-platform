/**
 * Firebase Cloud Messaging (FCM) Notification System
 * Alpha Freight - Notification Manager
 */

// Prevent duplicate loading of this script - MUST be first
(function() {
    'use strict';
    if (window.__NOTIFICATIONS_JS_LOADED__) {
        return; // Exit immediately if already loaded
    }
    window.__NOTIFICATIONS_JS_LOADED__ = true;
})();

// Only continue if script hasn't been loaded before
if (!window.__NOTIFICATIONS_JS_LOADED__) {
    // This should never execute, but just in case
    window.__NOTIFICATIONS_JS_LOADED__ = true;
}

// Firebase Cloud Messaging VAPID Key - Use window object to avoid duplicate declaration
// Initialize VAPID_KEY safely - check multiple times to prevent any declaration errors
(function initVAPIDKey() {
    'use strict';
    if (typeof window === 'undefined') {
        return;
    }
    
    // Multiple checks to prevent duplicate initialization
    if (window.__VAPID_KEY_INITIALIZED__) {
        return;
    }
    
    // Use Object.defineProperty for safest initialization
    try {
        if (!window.hasOwnProperty('VAPID_KEY') || typeof window.VAPID_KEY === 'undefined') {
            Object.defineProperty(window, 'VAPID_KEY', {
                value: 'BNde2f20zUGPxhZ_ovKK1rkALMcvibeZa8DMOsIwHrGIKVJoUAuw-rzOE9Hn9G0UlRkVvW9Zm47-A_cSoAM-azc',
                writable: true,
                configurable: true,
                enumerable: true
            });
        }
        window.__VAPID_KEY_INITIALIZED__ = true;
    } catch (e) {
        // Fallback to simple assignment if defineProperty fails
        try {
            if (typeof window.VAPID_KEY === 'undefined') {
                window.VAPID_KEY = 'BNde2f20zUGPxhZ_ovKK1rkALMcvibeZa8DMOsIwHrGIKVJoUAuw-rzOE9Hn9G0UlRkVvW9Zm47-A_cSoAM-azc';
            }
            window.__VAPID_KEY_INITIALIZED__ = true;
        } catch (e2) {
            // Silently fail - VAPID_KEY might already exist
            window.__VAPID_KEY_INITIALIZED__ = true;
        }
    }
})();

// Helper function to get VAPID key safely
function getVAPIDKey() {
    if (typeof window !== 'undefined' && window.VAPID_KEY) {
        return window.VAPID_KEY;
    }
    // Fallback
    return 'BNde2f20zUGPxhZ_ovKK1rkALMcvibeZa8DMOsIwHrGIKVJoUAuw-rzOE9Hn9G0UlRkVvW9Zm47-A_cSoAM-azc';
}

// Helper function to safely get Firebase database
function getFirebaseDatabase() {
    if (typeof firebase === 'undefined') {
        throw new Error('Firebase is not loaded');
    }
    if (!firebase.apps || firebase.apps.length === 0) {
        throw new Error('Firebase is not initialized');
    }
    try {
        return firebase.database();
    } catch (error) {
        throw new Error('Failed to get Firebase database: ' + error.message);
    }
}

let messaging = null;
let fcmToken = null;

// Initialize Firebase Cloud Messaging
async function initFCM() {
    try {
        // Wait for Firebase to be loaded and initialized
        let retries = 0;
        const maxRetries = 20; // Max 4 seconds (20 * 200ms)
        
        while (typeof firebase === 'undefined' || !firebase.apps || firebase.apps.length === 0) {
            if (retries >= maxRetries) {
                console.warn('Firebase initialization timeout - FCM may not work');
                return null;
            }
            await new Promise(resolve => setTimeout(resolve, 200));
            retries++;
        }

        // Check if messaging is available
        if (typeof firebase.messaging === 'undefined') {
            console.warn('Firebase Messaging not available');
            return null;
        }

        // Initialize messaging
        messaging = firebase.messaging();

        // Request notification permission (if not already granted/denied)
        let permission = Notification.permission;
        if (permission === 'default') {
            permission = await Notification.requestPermission();
        }
        
        if (permission === 'granted') {
            console.log('Notification permission granted');
            
            // Get FCM token (mobile ke liye SW pehle register karo)
            try {
                const vapidKey = getVAPIDKey();
                let swReg = null;
                if ('serviceWorker' in navigator) {
                    try {
                        // Use app service worker (offline + push) to avoid scope conflicts
                        swReg = await navigator.serviceWorker.register('/app-sw.js', { scope: '/' });
                        try { await swReg.update(); } catch (e) {}
                    } catch (e) { /* use default */ }
                }
                fcmToken = await messaging.getToken({ 
                    vapidKey: vapidKey,
                    serviceWorkerRegistration: swReg || undefined
                });
                
                if (fcmToken) {
                    console.log('FCM Token:', fcmToken);
                    await saveFCMToken(fcmToken);
                    
                    // Listen for token refresh
                    messaging.onTokenRefresh(async () => {
                        const refreshVapidKey = getVAPIDKey();
                        fcmToken = await messaging.getToken({ vapidKey: refreshVapidKey });
                        await saveFCMToken(fcmToken);
                    });
                }
            } catch (error) {
                console.error('Error getting FCM token:', error);
            }
        } else {
            console.log('Notification permission:', permission);
        }

        // Handle foreground messages
        messaging.onMessage((payload) => {
            console.log('Foreground message received:', payload);
            showNotification(payload);
            updateNotificationBadge();
        });

        return messaging;
    } catch (error) {
        console.error('FCM initialization error:', error);
        return null;
    }
}

// Get current user type and ID
function getCurrentUser() {
    const carrierAuth = JSON.parse(localStorage.getItem('carrierAuth') || '{}');
    const supplierAuth = JSON.parse(localStorage.getItem('supplierAuth') || '{}');
    const lastCarrier = JSON.parse(localStorage.getItem('lastCarrierProfile') || '{}');
    const lastSupplier = JSON.parse(localStorage.getItem('lastSupplierProfile') || '{}');
    const path = (window.location.pathname || '').toLowerCase();

    // Current page se decide karo - supplier page pe supplier, carrier page pe carrier
    const supId = supplierAuth.supplierId || supplierAuth.id || lastSupplier.supplierId || lastSupplier.id;
    const carId = carrierAuth.carrierId || carrierAuth.id || lastCarrier.carrierId || lastCarrier.id;
    if (path.includes('/supplier/') && supId) {
        return { type: 'supplier', id: supId, auth: supplierAuth.supplierId ? supplierAuth : lastSupplier };
    }
    if (path.includes('/carrier/') && carId) {
        return { type: 'carrier', id: carId, auth: carrierAuth.carrierId ? carrierAuth : lastCarrier };
    }
    // Fallback: pehle supplier, phir carrier
    if (supId) {
        return { type: 'supplier', id: supId, auth: supplierAuth.supplierId ? supplierAuth : lastSupplier };
    }
    if (carId) {
        return { type: 'carrier', id: carId, auth: carrierAuth.carrierId ? carrierAuth : lastCarrier };
    }
    return null;
}

// Save FCM token to Firebase
async function saveFCMToken(token) {
    try {
        const user = getCurrentUser();
        if (!user) {
            console.warn('No user found');
            return;
        }

        // Ensure Firebase Auth session is ready (DB rules require auth)
        try {
            if (typeof firebase !== 'undefined' && typeof firebase.auth === 'function') {
                const auth = firebase.auth();
                if (!auth.currentUser) {
                    await new Promise((resolve) => {
                        let done = false;
                        const timer = setTimeout(() => {
                            if (done) return;
                            done = true;
                            resolve();
                        }, 3500);
                        const unsub = auth.onAuthStateChanged(() => {
                            if (done) return;
                            done = true;
                            clearTimeout(timer);
                            try { unsub(); } catch (e) {}
                            resolve();
                        });
                    });
                }
                if (!auth.currentUser && typeof auth.signInAnonymously === 'function') {
                    try { await auth.signInAnonymously(); } catch (e) {}
                }
            }
        } catch (e) {}

        // Check if Firebase is initialized and get database
        let db;
        try {
            db = getFirebaseDatabase();
        } catch (error) {
            console.warn('Firebase not initialized, cannot save FCM token:', error.message);
            return;
        }
        const userRef = user.type === 'carrier' ? `carriers/${user.id}/fcmToken` : `suppliers/${user.id}/fcmToken`;
        
        try {
            await db.ref(userRef).set({
                token: token,
                updatedAt: new Date().toISOString(),
                userType: user.type
            });
            try { localStorage.setItem('lastFcmToken', token); } catch (e) {}
        } catch (e) {
            try {
                if (typeof firebase !== 'undefined' && typeof firebase.auth === 'function') {
                    const auth = firebase.auth();
                    const uid = auth && auth.currentUser && auth.currentUser.uid ? String(auth.currentUser.uid) : '';
                    if (uid) {
                        const profRef = user.type === 'carrier' ? 'carriers' : 'suppliers';
                        const snap = await db.ref(profRef).orderByChild('firebaseUid').equalTo(uid).limitToFirst(1).once('value');
                        if (snap.exists()) {
                            let key = '';
                            snap.forEach((ch) => { if (!key) key = ch.key; });
                            if (key) {
                                const fixedRef = user.type === 'carrier' ? `carriers/${key}/fcmToken` : `suppliers/${key}/fcmToken`;
                                await db.ref(fixedRef).set({
                                    token: token,
                                    updatedAt: new Date().toISOString(),
                                    userType: user.type
                                });
                                try { localStorage.setItem('lastFcmToken', token); } catch (e) {}
                                console.log(`FCM token saved for ${user.type} (resolved id)`);
                                return;
                            }
                        }
                    }
                }
            } catch (e3) {}
            try {
                localStorage.setItem('pendingFcmToken', JSON.stringify({ token, userType: user.type, userId: user.id, at: Date.now() }));
            } catch (e2) {}
            throw e;
        }

        console.log(`FCM token saved for ${user.type}`);
    } catch (error) {
        console.error('Error saving FCM token:', error);
    }
}

// Retry saving pending token after auth is ready
(function retryPendingFcmToken() {
    try {
        const raw = localStorage.getItem('pendingFcmToken');
        if (!raw) return;
        const pending = JSON.parse(raw);
        if (!pending || !pending.token) return;
        const user = getCurrentUser();
        if (!user || user.id !== pending.userId || user.type !== pending.userType) return;
        setTimeout(async () => {
            try {
                await saveFCMToken(pending.token);
                try { localStorage.removeItem('pendingFcmToken'); } catch (e) {}
            } catch (e) {}
        }, 2000);
    } catch (e) {}
})();

// Play notification sound
function playNotificationSound() {
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = 800;
        osc.type = 'sine';
        gain.gain.value = 0.3;
        osc.start();
        osc.stop(ctx.currentTime + 0.2);
    } catch (e) { /* ignore */ }
}

// Show notification (system popup + in-page toast + sound)
function showNotification(payload) {
    const title = payload.notification?.title || payload.data?.title || 'Alpha Freight';
    const body = payload.notification?.body || payload.data?.body || 'You have a new notification';
    const icon = payload.notification?.icon || '/assets/img/alpha-freight-logo.svg';

    // Sound play karo
    playNotificationSound();

    // In-page toast - user ko zaroor dikhega
    if (typeof window.showInfo === 'function') {
        window.showInfo(body, { title: title, duration: 5000 });
    } else if (typeof window.AlertSystem !== 'undefined') {
        window.AlertSystem.show(body, 'info', { title: title, duration: 5000 });
    }

    // System notification popup
    if ('Notification' in window && Notification.permission === 'granted') {
        try {
            const notification = new Notification(title, {
                body: body,
                icon: icon,
                badge: icon,
                tag: (payload.data?.type || 'notification') + '_' + Date.now(),
                data: payload.data,
                silent: false,
                requireInteraction: true
            });

            notification.onclick = (event) => {
                event.preventDefault();
                window.focus();
                const user = getCurrentUser();
                let url = user?.type === 'supplier' ? '/mobile-app/supplier/dashboard.html' : '/mobile-app/carrier/dashboard.html';
                if (payload.data) {
                    if (payload.data.type === 'load_accepted' || payload.data.type === 'load_completed') {
                        url = '/mobile-app/supplier/my-loads.html';
                    } else if (payload.data.url) {
                        url = payload.data.url;
                    }
                }
                window.location.href = url;
                notification.close();
            };
        } catch (e) {
            console.warn('System notification error:', e);
        }
    }
}

// Create notification in database
async function createNotification(type, title, message, data = {}, targetUserId = null, targetUserType = null) {
    try {
        const user = getCurrentUser();
        const userId = targetUserId || user?.id;
        const userType = targetUserType || user?.type;
        
        if (!userId) {
            console.warn('No user ID found');
            return null;
        }

        // Check if Firebase is initialized and get database
        let db;
        try {
            db = getFirebaseDatabase();
        } catch (error) {
            console.warn('Firebase not initialized, saving to local storage only:', error.message);
            // Fallback to local storage
            const localNotifications = JSON.parse(localStorage.getItem('localNotifications') || '[]');
            const notification = {
                id: 'local_' + Date.now(),
                user_id: userId,
                user_type: userType,
                type: type,
                title: title,
                message: message,
                data: data,
                read: false,
                created_at: new Date().toISOString()
            };
            localNotifications.push(notification);
            localStorage.setItem('localNotifications', JSON.stringify(localNotifications));
            updateNotificationBadge();
            return notification.id;
        }
        const notificationRef = db.ref('notifications').push();
        
        const notification = {
            user_id: userId,
            user_type: userType,
            type: type,
            title: title,
            message: message,
            data: data,
            read: false,
            created_at: new Date().toISOString()
        };

        try {
            // Try to save to Firebase, but don't block if it fails
            await notificationRef.set(notification).catch((firebaseError) => {
                // Silently fallback to local storage if permission denied
                if (firebaseError.code === 'PERMISSION_DENIED' || firebaseError.message?.includes('permission')) {
                    // Save to local storage as fallback (no console warning)
                    const localNotifications = JSON.parse(localStorage.getItem('localNotifications') || '[]');
                    localNotifications.push({
                        id: 'local_' + Date.now(),
                        ...notification
                    });
                    localStorage.setItem('localNotifications', JSON.stringify(localNotifications));
                }
                // Don't throw error - just use local storage fallback
            });

            try {
                let senderUid = '';
                try {
                    if (typeof firebase !== 'undefined' && typeof firebase.auth === 'function') {
                        const auth = firebase.auth();
                        senderUid = auth && auth.currentUser && auth.currentUser.uid ? String(auth.currentUser.uid) : '';
                    }
                } catch (e0) {}
                if (senderUid) {
                    await db.ref('notificationQueue').push({
                        senderUid,
                        toUserId: userId,
                        toUserType: userType,
                        title,
                        message,
                        type,
                        data,
                        createdAt: new Date().toISOString()
                    });
                }
            } catch (e1) {}

            try {
                if (userType === 'supplier') {
                    await db.ref(`notifications/suppliers/${userId}`).push({
                        title, message, type, data, read: false, createdAt: new Date().toISOString()
                    });
                } else if (userType === 'carrier') {
                    await db.ref(`notifications/carriers/${userId}`).push({
                        title, message, type, data, read: false, createdAt: new Date().toISOString()
                    });
                }
            } catch (e2) {
                // ignore secondary write errors
            }
        } catch (error) {
            // If Firebase write fails, save to local storage as fallback
            if (error.code === 'PERMISSION_DENIED' || error.message?.includes('permission')) {
                // Save to local storage silently (no console warning)
                const localNotifications = JSON.parse(localStorage.getItem('localNotifications') || '[]');
                localNotifications.push({
                    id: 'local_' + Date.now(),
                    ...notification
                });
                localStorage.setItem('localNotifications', JSON.stringify(localNotifications));
            }
            // Don't throw error - notifications will work with local storage
        }
        
        // Update notification badge
        updateNotificationBadge();
        
        return notificationRef.key || 'local_' + Date.now();
    } catch (error) {
        console.error('Error creating notification:', error);
        return null;
    }
}

// Get unread notification count
async function getUnreadCount() {
    try {
        const user = getCurrentUser();
        if (!user) {
            return 0;
        }

        // Check if Firebase is initialized and get database
        let db;
        try {
            db = getFirebaseDatabase();
        } catch (error) {
            // Fallback to local storage
            const localNotifications = JSON.parse(localStorage.getItem('localNotifications') || '[]');
            return localNotifications.filter(n => !n.read && n.user_id === user.id && n.user_type === user.type).length;
        }
        
        const listRef = user.type === 'carrier'
            ? `notifications/carriers/${user.id}`
            : `notifications/suppliers/${user.id}`;

        let snapshot;
        try {
            snapshot = await db.ref(listRef).limitToLast(250).once('value');
        } catch (error) {
            if (error.code === 'PERMISSION_DENIED' || error.message?.includes('permission')) {
                console.warn('Permission denied for notifications list - using local storage fallback');
                const localNotifications = JSON.parse(localStorage.getItem('localNotifications') || '[]');
                return localNotifications.filter(n => !n.read && n.user_id === user.id).length;
            }
            throw error;
        }

        let count = 0;
        if (snapshot.exists()) {
            snapshot.forEach((child) => {
                const n = child.val() || {};
                if (!n.read) count++;
            });
        }

        // Also check local storage fallback
        const localNotifications = JSON.parse(localStorage.getItem('localNotifications') || '[]');
        const localCount = localNotifications.filter(n => !n.read && n.user_id === user.id && n.user_type === user.type).length;

        return count + localCount;
    } catch (error) {
        console.error('Error getting unread count:', error);
        // Return 0 on error instead of crashing
        return 0;
    }
}

// Update notification badge
async function updateNotificationBadge() {
    try {
        const count = await getUnreadCount();
        const badges = document.querySelectorAll('.notification-badge');
        badges.forEach(badge => {
            if (count > 0) {
                badge.textContent = count > 99 ? '99+' : count;
                badge.style.display = 'flex';
            } else {
                badge.style.display = 'none';
            }
        });
    } catch (error) {
        console.error('Error updating badge:', error);
    }
}

// Mark notification as read
async function markAsRead(notificationId) {
    try {
        const user = getCurrentUser();
        if (!user || !notificationId) return;
        // Check if Firebase is initialized and get database
        let db;
        try {
            db = getFirebaseDatabase();
        } catch (error) {
            // Fallback to local storage
            const localNotifications = JSON.parse(localStorage.getItem('localNotifications') || '[]');
            const updated = localNotifications.map(n => {
                if (n.id === notificationId) {
                    return { ...n, read: true };
                }
                return n;
            });
            localStorage.setItem('localNotifications', JSON.stringify(updated));
            updateNotificationBadge();
            return;
        }
        const listRef = user.type === 'carrier'
            ? `notifications/carriers/${user.id}/${notificationId}/read`
            : `notifications/suppliers/${user.id}/${notificationId}/read`;
        await db.ref(listRef).set(true);
        updateNotificationBadge();
    } catch (error) {
        console.error('Error marking as read:', error);
    }
}

// Mark all as read
async function markAllAsRead() {
    try {
        const user = getCurrentUser();
        if (!user) {
            return;
        }

        // Check if Firebase is initialized and get database
        let db;
        try {
            db = getFirebaseDatabase();
        } catch (error) {
            // Fallback to local storage
            const localNotifications = JSON.parse(localStorage.getItem('localNotifications') || '[]');
            const updated = localNotifications.map(n => {
                if (n.user_id === user.id && n.user_type === user.type && !n.read) {
                    return { ...n, read: true };
                }
                return n;
            });
            localStorage.setItem('localNotifications', JSON.stringify(updated));
            updateNotificationBadge();
            return;
        }
        const listRef = user.type === 'carrier'
            ? `notifications/carriers/${user.id}`
            : `notifications/suppliers/${user.id}`;
        const snapshot = await db.ref(listRef).limitToLast(400).once('value');
        const updates = {};
        snapshot.forEach((child) => {
            const n = child.val() || {};
            if (!n.read) updates[`${listRef}/${child.key}/read`] = true;
        });
        if (Object.keys(updates).length > 0) await db.ref().update(updates);

        // Also mark local notifications as read
        const localNotifications = JSON.parse(localStorage.getItem('localNotifications') || '[]');
        const updatedLocal = localNotifications.map(n => {
            if (n.user_id === user.id && n.user_type === user.type && !n.read) {
                return { ...n, read: true };
            }
            return n;
        });
        localStorage.setItem('localNotifications', JSON.stringify(updatedLocal));

        updateNotificationBadge();
    } catch (error) {
        console.error('Error marking all as read:', error);
    }
}

// Notification triggers
const NotificationTriggers = {
    // New load posted - notify all carriers
    newLoadPosted: async (loadData) => {
        // This will be handled by real-time listener in dashboard
        // Notify all carriers about new load
        let db;
        try {
            db = getFirebaseDatabase();
        } catch (error) {
            console.warn('Firebase not initialized, cannot notify carriers:', error.message);
            return;
        }
        const carriersSnapshot = await db.ref('carriers').once('value');
        
        carriersSnapshot.forEach((carrier) => {
            const carrierData = carrier.val();
            if (carrierData.fcmToken && carrierData.fcmToken.token) {
                createNotification(
                    'new_load',
                    'New Load Available',
                    `New load: ${loadData.pickupLocation} to ${loadData.deliveryLocation} - £${loadData.totalCost || 'TBD'}`,
                    { loadId: loadData.id, type: 'new_load', url: '/app/carrier/loads.html' },
                    carrier.key,
                    'carrier'
                );
            }
        });
    },

    // Load match - carrier applied/bid on supplier's load
    loadMatch: async (loadData, carrierData, supplierId) => {
        await createNotification(
            'load_match',
            'New Load Application',
            `${carrierData.companyName || carrierData.firstName + ' ' + carrierData.lastName} applied for your load: ${loadData.pickupLocation} to ${loadData.deliveryLocation}`,
            { 
                loadId: loadData.id, 
                carrierId: carrierData.carrierId || carrierData.id,
                carrierName: carrierData.companyName || carrierData.firstName + ' ' + carrierData.lastName,
                type: 'load_match', 
                url: '/pages/supplier/my-loads.html' 
            },
            supplierId,
            'supplier'
        );
    },

    // Load bid received
    loadBidReceived: async (loadData, bidData, supplierId) => {
        await createNotification(
            'load_bid',
            'New Bid Received',
            `New bid of £${bidData.bidAmount || bidData.amount} received for load: ${loadData.pickupLocation} to ${loadData.deliveryLocation}`,
            { 
                loadId: loadData.id, 
                bidId: bidData.id,
                bidAmount: bidData.bidAmount || bidData.amount,
                type: 'load_bid', 
                url: '/pages/supplier/my-loads.html' 
            },
            supplierId,
            'supplier'
        );
    },

    // Load accepted - notify carrier
    loadAccepted: async (loadData, carrierId) => {
        await createNotification(
            'load_accepted',
            'Load Accepted',
            `Your application has been accepted for load: ${loadData.pickupLocation} to ${loadData.deliveryLocation}`,
            { loadId: loadData.id, type: 'load_accepted', url: '/app/carrier/my-loads.html' },
            carrierId,
            'carrier'
        );
    },

    // Load rejected - notify carrier
    loadRejected: async (loadData, carrierId) => {
        await createNotification(
            'load_rejected',
            'Load Application Rejected',
            `Your application for load: ${loadData.pickupLocation} to ${loadData.deliveryLocation} was not accepted`,
            { loadId: loadData.id, type: 'load_rejected', url: '/app/carrier/loads.html' },
            carrierId,
            'carrier'
        );
    },

    // Load status update
    loadStatusUpdate: async (loadData, status, userId, userType) => {
        const statusMessages = {
            'picked_up': 'Load has been picked up',
            'in_transit': 'Load is in transit',
            'delivered': 'Load has been delivered',
            'completed': 'Load completed successfully'
        };

        await createNotification(
            'load_update',
            'Load Status Updated',
            statusMessages[status] || `Load status updated to ${status}`,
            { loadId: loadData.id, type: 'load_update', status: status, url: userType === 'supplier' ? '/pages/supplier/my-loads.html' : '/app/carrier/my-loads.html' },
            userId,
            userType
        );
    },

    // New message received
    newMessage: async (messageData, recipientId, recipientType, senderName) => {
        await createNotification(
            'message',
            'New Message',
            `${senderName}: ${messageData.message?.substring(0, 50) || 'You have a new message'}...`,
            { 
                messageId: messageData.id || messageData.messageId,
                senderId: messageData.senderId,
                conversationId: messageData.conversationId,
                type: 'message', 
                url: recipientType === 'supplier' ? '/pages/supplier/messages.html' : '/app/carrier/messages.html' 
            },
            recipientId,
            recipientType
        );
    },

    // Money deposited
    moneyDeposited: async (amount, transactionId, userId, userType) => {
        await createNotification(
            'deposit',
            'Payment Received',
            `£${amount} has been deposited to your wallet`,
            { amount: amount, transactionId: transactionId, type: 'deposit', url: '/app/carrier/wallet.html' },
            userId,
            userType
        );
    },

    // Money withdrawn
    moneyWithdrawn: async (amount, transactionId, userId, userType) => {
        await createNotification(
            'withdrawal',
            'Withdrawal Processed',
            `£${amount} has been withdrawn from your wallet`,
            { amount: amount, transactionId: transactionId, type: 'withdrawal', url: '/app/carrier/wallet.html' },
            userId,
            userType
        );
    },

    // Payment received
    paymentReceived: async (amount, loadId, userId, userType) => {
        await createNotification(
            'payment',
            'Payment Received',
            `You received £${amount} for load completion`,
            { amount: amount, loadId: loadId, type: 'payment', url: userType === 'supplier' ? '/pages/supplier/payments.html' : '/app/carrier/wallet.html' },
            userId,
            userType
        );
    }
};

// Real-time notification listener
function setupRealtimeNotifications() {
    try {
        const user = getCurrentUser();
        if (!user) {
            return;
        }

        // Check if Firebase is initialized and get database
        let db;
        try {
            db = getFirebaseDatabase();
        } catch (error) {
            console.warn('Firebase not initialized, skipping real-time notifications setup:', error.message);
            return;
        }
        
        // Listen for new notifications
        db.ref('notifications')
            .orderByChild('user_id')
            .equalTo(user.id)
            .limitToLast(1)
            .on('child_added', (snapshot) => {
                const notification = snapshot.val();
                if (notification && notification.user_type === user.type && !notification.read) {
                    // Show browser notification
                    if ('Notification' in window && Notification.permission === 'granted') {
                        new Notification(notification.title, {
                            body: notification.message,
                            icon: '/image-removebg-preview - 2025-10-29T055946.105.png',
                            tag: notification.type,
                            data: notification.data
                        });
                    }
                    // Update badge
                    updateNotificationBadge();
                }
            });

        // Listen for new loads (for carriers)
        if (user.type === 'carrier') {
            db.ref('globalLoads')
                .orderByChild('status')
                .equalTo('active')
                .limitToLast(1)
                .on('child_added', (snapshot) => {
                    const load = snapshot.val();
                    if (load) {
                        NotificationTriggers.newLoadPosted(load);
                    }
                });
        }

        // Listen for new messages
        db.ref('messages')
            .orderByChild('recipientId')
            .equalTo(user.id)
            .limitToLast(1)
            .on('child_added', async (snapshot) => {
                const message = snapshot.val();
                if (message && !message.read) {
                    // Get sender name
                    let senderName = 'Someone';
                    try {
                        if (message.senderType === 'carrier') {
                            const senderSnapshot = await db.ref(`carriers/${message.senderId}`).once('value');
                            const senderData = senderSnapshot.val();
                            senderName = senderData?.companyName || senderData?.firstName + ' ' + senderData?.lastName || 'Carrier';
                        } else if (message.senderType === 'supplier') {
                            const senderSnapshot = await db.ref(`suppliers/${message.senderId}`).once('value');
                            const senderData = senderSnapshot.val();
                            senderName = senderData?.companyName || senderData?.firstName + ' ' + senderData?.lastName || 'Supplier';
                        }
                    } catch (error) {
                        console.error('Error getting sender name:', error);
                    }

                    await NotificationTriggers.newMessage(message, user.id, user.type, senderName);
                }
            });

        console.log('✅ Real-time notifications setup complete');
    } catch (error) {
        console.error('Error setting up real-time notifications:', error);
    }
}

// Export for use in other scripts
window.NotificationManager = {
    init: initFCM,
    enablePush: initFCM,
    create: createNotification,
    getUnreadCount: getUnreadCount,
    updateBadge: updateNotificationBadge,
    markAsRead: markAsRead,
    markAllAsRead: markAllAsRead,
    triggers: NotificationTriggers,
    setupRealtime: setupRealtimeNotifications,
    getCurrentUser: getCurrentUser
};

console.log('📬 Notification Manager loaded');
