/**
 * Offline Mode Manager
 * Alpha Freight - Offline functionality for mobile app
 */

class OfflineModeManager {
    constructor() {
        this.isOnline = navigator.onLine;
        this.offlineQueue = JSON.parse(localStorage.getItem('offlineQueue') || '[]');
        this.syncInProgress = false;
        this.init();
    }

    init() {
        // Register service worker
        this.registerServiceWorker();
        
        // Setup online/offline listeners
        window.addEventListener('online', () => this.handleOnline());
        window.addEventListener('offline', () => this.handleOffline());
        
        // Check initial status
        this.updateOnlineStatus();
        
        // Start sync interval
        setInterval(() => this.syncOfflineQueue(), 30000); // Every 30 seconds
        
        // Sync on page load if online
        if (this.isOnline) {
            setTimeout(() => this.syncOfflineQueue(), 2000);
        }
    }

    // Register service worker for offline caching
    async registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            try {
                const registration = await navigator.serviceWorker.register('/app-sw.js');
                console.log('✅ Service Worker registered:', registration.scope);
                
                // Check for updates
                registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing;
                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            console.log('New service worker available. Refresh to update.');
                        }
                    });
                });
            } catch (error) {
                console.error('❌ Service Worker registration failed:', error);
            }
        }
    }

    // Handle online event
    handleOnline() {
        console.log('🌐 Online - Syncing offline queue...');
        this.isOnline = true;
        this.updateOnlineStatus();
        this.syncOfflineQueue();
    }

    // Handle offline event
    handleOffline() {
        console.log('📴 Offline mode activated');
        this.isOnline = false;
        this.updateOnlineStatus();
        this.showOfflineBanner();
    }

    // Update online status UI
    updateOnlineStatus() {
        const statusElements = document.querySelectorAll('.online-status, .offline-indicator');
        statusElements.forEach(el => {
            if (this.isOnline) {
                el.classList.remove('offline');
                el.classList.add('online');
                el.textContent = 'Online';
                el.style.display = 'none';
            } else {
                el.classList.remove('online');
                el.classList.add('offline');
                el.textContent = 'Offline';
                el.style.display = 'block';
            }
        });
    }

    // Show offline banner
    showOfflineBanner() {
        // Remove existing banner
        const existing = document.getElementById('offlineBanner');
        if (existing) existing.remove();

        const banner = document.createElement('div');
        banner.id = 'offlineBanner';
        banner.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            background: #ff9800;
            color: white;
            padding: 12px 20px;
            text-align: center;
            font-weight: 600;
            z-index: 10000;
            box-shadow: 0 2px 10px rgba(0,0,0,0.2);
        `;
        banner.innerHTML = `
            <i class="fas fa-wifi-slash"></i> 
            You're offline. Some features may be limited. Changes will sync when you're back online.
        `;
        document.body.insertBefore(banner, document.body.firstChild);

        // Adjust body padding for banner
        document.body.style.paddingTop = '50px';
    }

    // Hide offline banner
    hideOfflineBanner() {
        const banner = document.getElementById('offlineBanner');
        if (banner) {
            banner.remove();
            document.body.style.paddingTop = '';
        }
    }

    // Add action to offline queue
    addToQueue(action, data) {
        const queueItem = {
            id: Date.now() + '_' + Math.random().toString(36).substr(2, 9),
            action: action,
            data: data,
            timestamp: new Date().toISOString(),
            retries: 0
        };

        this.offlineQueue.push(queueItem);
        this.saveQueue();
        
        console.log('📦 Added to offline queue:', queueItem);
        
        // Try to sync immediately if online
        if (this.isOnline) {
            this.syncOfflineQueue();
        }
        
        return queueItem.id;
    }

    // Save queue to localStorage
    saveQueue() {
        try {
            localStorage.setItem('offlineQueue', JSON.stringify(this.offlineQueue));
        } catch (error) {
            console.error('Error saving offline queue:', error);
            // Keep only last 50 items if storage is full
            this.offlineQueue = this.offlineQueue.slice(-50);
            localStorage.setItem('offlineQueue', JSON.stringify(this.offlineQueue));
        }
    }

    // Sync offline queue when back online
    async syncOfflineQueue() {
        if (!this.isOnline || this.syncInProgress || this.offlineQueue.length === 0) {
            return;
        }

        this.syncInProgress = true;
        console.log('🔄 Syncing offline queue...', this.offlineQueue.length, 'items');

        const failedItems = [];

        for (let i = 0; i < this.offlineQueue.length; i++) {
            const item = this.offlineQueue[i];
            
            try {
                const success = await this.processQueueItem(item);
                
                if (success) {
                    console.log('✅ Synced:', item.action, item.id);
                } else {
                    item.retries++;
                    if (item.retries < 3) {
                        failedItems.push(item);
                    } else {
                        console.warn('❌ Max retries reached for:', item.id);
                    }
                }
            } catch (error) {
                console.error('Error processing queue item:', error);
                item.retries++;
                if (item.retries < 3) {
                    failedItems.push(item);
                }
            }
        }

        // Update queue with failed items
        this.offlineQueue = failedItems;
        this.saveQueue();

        this.syncInProgress = false;
        this.hideOfflineBanner();

        if (failedItems.length === 0 && this.offlineQueue.length === 0) {
            console.log('✅ All items synced successfully');
        }
    }

    // Process individual queue item
    async processQueueItem(item) {
        const { action, data } = item;

        try {
            switch (action) {
                case 'post_load':
                    return await this.syncPostLoad(data);
                
                case 'accept_load':
                    return await this.syncAcceptLoad(data);
                
                case 'send_message':
                    return await this.syncSendMessage(data);
                
                case 'update_load_status':
                    return await this.syncUpdateLoadStatus(data);
                
                case 'update_profile':
                    return await this.syncUpdateProfile(data);
                
                default:
                    console.warn('Unknown action:', action);
                    return false;
            }
        } catch (error) {
            console.error('Error processing action:', action, error);
            return false;
        }
    }

    // Sync post load
    async syncPostLoad(data) {
        if (typeof firebase === 'undefined' || !firebase.database) {
            return false;
        }

        const db = firebase.database();
        
        try {
            // Save to Firebase
            const loadRef = await db.ref('loads').push(data.loadData);
            const loadId = loadRef.key;

            // Also save to globalLoads
            const globalLoadData = {
                ...data.loadData,
                id: loadId,
                status: 'active'
            };

            // Update localStorage
            let globalLoads = JSON.parse(localStorage.getItem('globalLoads') || '[]');
            globalLoads.push(globalLoadData);
            if (globalLoads.length > 200) {
                globalLoads = globalLoads.slice(-200);
            }
            localStorage.setItem('globalLoads', JSON.stringify(globalLoads));

            // Notify carriers
            if (typeof PushNotifications !== 'undefined' && PushNotifications.notifyAllCarriersNewLoad) {
                PushNotifications.notifyAllCarriersNewLoad(globalLoadData);
            }

            return true;
        } catch (error) {
            console.error('Error syncing post load:', error);
            return false;
        }
    }

    // Sync accept load
    async syncAcceptLoad(data) {
        if (typeof firebase === 'undefined' || !firebase.database) {
            return false;
        }

        const db = firebase.database();
        
        try {
            const updates = {};
            updates[`loads/${data.loadId}/status`] = 'accepted';
            updates[`loads/${data.loadId}/carrierId`] = data.carrierId;
            updates[`loads/${data.loadId}/carrierName`] = data.carrierName;
            updates[`loads/${data.loadId}/acceptedAt`] = new Date().toISOString();

            if (data.signatureData) {
                updates[`loads/${data.loadId}/carrierAgreementSigned`] = true;
                updates[`loads/${data.loadId}/carrierSignatureData`] = data.signatureData;
                updates[`loads/${data.loadId}/carrierAgreementSignedAt`] = new Date().toISOString();
            }

            await db.ref().update(updates);

            // Notify supplier
            if (data.supplierId && typeof PushNotifications !== 'undefined' && PushNotifications.notifyCarrierLoadResponse) {
                PushNotifications.notifyCarrierLoadResponse(data.loadId, data.carrierId, true);
            }

            return true;
        } catch (error) {
            console.error('Error syncing accept load:', error);
            return false;
        }
    }

    // Sync send message
    async syncSendMessage(data) {
        if (typeof firebase === 'undefined' || !firebase.database) {
            return false;
        }

        const db = firebase.database();
        
        try {
            await db.ref('messages').push(data.messageData);

            // Notify recipient
            if (typeof PushNotifications !== 'undefined' && PushNotifications.notifyNewMessage) {
                PushNotifications.notifyNewMessage(
                    data.messageData,
                    data.recipientId,
                    data.recipientType
                );
            }

            return true;
        } catch (error) {
            console.error('Error syncing send message:', error);
            return false;
        }
    }

    // Sync update load status
    async syncUpdateLoadStatus(data) {
        if (typeof firebase === 'undefined' || !firebase.database) {
            return false;
        }

        const db = firebase.database();
        
        try {
            const updates = {};
            updates[`loads/${data.loadId}/status`] = data.status;
            updates[`loads/${data.loadId}/updatedAt`] = new Date().toISOString();

            if (data.location) {
                updates[`loads/${data.loadId}/currentLocation`] = data.location;
            }

            await db.ref().update(updates);

            // Notify user
            if (typeof PushNotifications !== 'undefined' && PushNotifications.notifyLoadStatusUpdate) {
                PushNotifications.notifyLoadStatusUpdate(
                    { id: data.loadId },
                    data.status,
                    data.userId,
                    data.userType
                );
            }

            return true;
        } catch (error) {
            console.error('Error syncing update load status:', error);
            return false;
        }
    }

    // Sync update profile
    async syncUpdateProfile(data) {
        if (typeof firebase === 'undefined' || !firebase.database) {
            return false;
        }

        const db = firebase.database();
        const userType = data.userType; // 'carrier' or 'supplier'
        const userId = data.userId;
        
        try {
            await db.ref(`${userType}s/${userId}`).update(data.profileData);
            return true;
        } catch (error) {
            console.error('Error syncing update profile:', error);
            return false;
        }
    }

    // Get queue status
    getQueueStatus() {
        return {
            total: this.offlineQueue.length,
            items: this.offlineQueue,
            isOnline: this.isOnline,
            syncInProgress: this.syncInProgress
        };
    }

    // Clear queue
    clearQueue() {
        this.offlineQueue = [];
        this.saveQueue();
        console.log('🗑️ Offline queue cleared');
    }
}

// Initialize offline mode manager
let offlineManager = null;

if (typeof window !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        offlineManager = new OfflineModeManager();
        window.OfflineMode = offlineManager;
    });
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = OfflineModeManager;
}

