/**
 * Push Notifications Integration
 * Alpha Freight - Real-time notifications for load matches and messages
 */

// Initialize push notifications when page loads
document.addEventListener('DOMContentLoaded', function() {
    // Wait for Firebase to be initialized before setting up notifications
    let retryCount = 0;
    const maxRetries = 50; // Max 10 seconds (50 * 200ms)
    
    function initializeNotifications() {
        retryCount++;
        
        // Check if Firebase is initialized
        if (typeof firebase === 'undefined' || !firebase.apps || firebase.apps.length === 0) {
            if (retryCount < maxRetries) {
                // Wait a bit and retry
                setTimeout(initializeNotifications, 200);
            } else {
                console.warn('⚠️ Firebase initialization timeout - notifications may not work');
            }
            return;
        }

        // Initialize FCM if available
        if (typeof NotificationManager !== 'undefined') {
            NotificationManager.init().then(() => {
                // Setup real-time listeners
                NotificationManager.setupRealtime();
                
                // Update badge on load
                NotificationManager.updateBadge();
                
                // Refresh badge every 30 seconds
                setInterval(() => {
                    NotificationManager.updateBadge();
                }, 30000);
            }).catch(error => {
                console.error('Error initializing notifications:', error);
            });
        } else {
            if (retryCount < maxRetries) {
                // Wait a bit for NotificationManager to load
                setTimeout(initializeNotifications, 200);
            } else {
                console.warn('⚠️ NotificationManager not loaded - notifications may not work');
            }
        }
    }
    
    initializeNotifications();
});

// Function to notify supplier when carrier applies for load
async function notifySupplierLoadMatch(loadId, carrierData, bidData = null) {
    try {
        if (typeof NotificationManager === 'undefined' || !NotificationManager.triggers) {
            console.warn('NotificationManager not available');
            return;
        }

        // Check if Firebase is initialized
        if (typeof firebase === 'undefined' || !firebase.apps || firebase.apps.length === 0) {
            console.warn('Firebase not initialized, cannot notify supplier');
            return;
        }

        // Get load data
        const db = firebase.database();
        const loadSnapshot = await db.ref(`globalLoads/${loadId}`).once('value');
        const loadData = loadSnapshot.val();

        if (!loadData) {
            console.error('Load not found:', loadId);
            return;
        }

        // Get supplier ID from load
        const supplierId = loadData.supplierId || loadData.supplier_id;
        if (!supplierId) {
            console.error('Supplier ID not found in load data');
            return;
        }

        // Notify supplier
        if (bidData) {
            await NotificationManager.triggers.loadBidReceived(loadData, bidData, supplierId);
        } else {
            await NotificationManager.triggers.loadMatch(loadData, carrierData, supplierId);
        }

        console.log('✅ Supplier notified about load match');
    } catch (error) {
        console.error('Error notifying supplier:', error);
    }
}

// Function to notify carrier when supplier accepts/rejects load
async function notifyCarrierLoadResponse(loadId, carrierId, accepted) {
    try {
        if (typeof NotificationManager === 'undefined' || !NotificationManager.triggers) {
            console.warn('NotificationManager not available');
            return;
        }

        // Check if Firebase is initialized
        if (typeof firebase === 'undefined' || !firebase.apps || firebase.apps.length === 0) {
            console.warn('Firebase not initialized, cannot notify carrier');
            return;
        }

        // Get load data
        const db = firebase.database();
        const loadSnapshot = await db.ref(`globalLoads/${loadId}`).once('value');
        const loadData = loadSnapshot.val();

        if (!loadData) {
            console.error('Load not found:', loadId);
            return;
        }

        // Notify carrier
        if (accepted) {
            await NotificationManager.triggers.loadAccepted(loadData, carrierId);
        } else {
            await NotificationManager.triggers.loadRejected(loadData, carrierId);
        }

        console.log('✅ Carrier notified about load response');
    } catch (error) {
        console.error('Error notifying carrier:', error);
    }
}

// Function to notify user when new message received
async function notifyNewMessage(messageData, recipientId, recipientType) {
    try {
        if (typeof NotificationManager === 'undefined' || !NotificationManager.triggers) {
            console.warn('NotificationManager not available');
            return;
        }

        // Check if Firebase is initialized
        if (typeof firebase === 'undefined' || !firebase.apps || firebase.apps.length === 0) {
            console.warn('Firebase not initialized, cannot get sender name');
            // Still notify with default name
            await NotificationManager.triggers.newMessage(messageData, recipientId, recipientType, 'Someone');
            return;
        }

        // Get sender name
        const db = firebase.database();
        let senderName = 'Someone';
        
        try {
            if (messageData.senderType === 'carrier') {
                const senderSnapshot = await db.ref(`carriers/${messageData.senderId}`).once('value');
                const senderData = senderSnapshot.val();
                senderName = senderData?.companyName || senderData?.firstName + ' ' + senderData?.lastName || 'Carrier';
            } else if (messageData.senderType === 'supplier') {
                const senderSnapshot = await db.ref(`suppliers/${messageData.senderId}`).once('value');
                const senderData = senderSnapshot.val();
                senderName = senderData?.companyName || senderData?.firstName + ' ' + senderData?.lastName || 'Supplier';
            }
        } catch (error) {
            console.error('Error getting sender name:', error);
        }

        await NotificationManager.triggers.newMessage(messageData, recipientId, recipientType, senderName);
        console.log('✅ User notified about new message');
    } catch (error) {
        console.error('Error notifying user:', error);
    }
}

// Function to notify all carriers when new load posted
async function notifyAllCarriersNewLoad(loadData) {
    try {
        if (typeof NotificationManager === 'undefined' || !NotificationManager.triggers) {
            console.warn('NotificationManager not available');
            return;
        }

        await NotificationManager.triggers.newLoadPosted(loadData);
        console.log('✅ All carriers notified about new load');
    } catch (error) {
        console.error('Error notifying carriers:', error);
    }
}

// Function to notify load status update
async function notifyLoadStatusUpdate(loadId, status, userId, userType) {
    try {
        if (typeof NotificationManager === 'undefined' || !NotificationManager.triggers) {
            console.warn('NotificationManager not available');
            return;
        }

        // Check if Firebase is initialized
        if (typeof firebase === 'undefined' || !firebase.apps || firebase.apps.length === 0) {
            console.warn('Firebase not initialized, cannot notify load status update');
            return;
        }

        // Get load data
        const db = firebase.database();
        const loadSnapshot = await db.ref(`globalLoads/${loadId}`).once('value');
        const loadData = loadSnapshot.val();

        if (!loadData) {
            console.error('Load not found:', loadId);
            return;
        }

        await NotificationManager.triggers.loadStatusUpdate(loadData, status, userId, userType);
        console.log('✅ User notified about load status update');
    } catch (error) {
        console.error('Error notifying load status update:', error);
    }
}

// Export functions globally
window.PushNotifications = {
    notifySupplierLoadMatch: notifySupplierLoadMatch,
    notifyCarrierLoadResponse: notifyCarrierLoadResponse,
    notifyNewMessage: notifyNewMessage,
    notifyAllCarriersNewLoad: notifyAllCarriersNewLoad,
    notifyLoadStatusUpdate: notifyLoadStatusUpdate
};

console.log('📱 Push Notifications Integration loaded');

