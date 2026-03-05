// Alpha Freight - Document Verification System
// Complete document verification workflow for admin

class DocumentVerification {
    constructor() {
        this.db = null;
        this.initFirebase();
    }

    initFirebase() {
        if (window.AlphaBrokrage && window.AlphaBrokrage.firebaseDb) {
            this.db = window.AlphaBrokrage.firebaseDb;
        } else if (typeof firebase !== 'undefined' && firebase.database) {
            this.db = firebase.database();
        } else {
            console.warn('Firebase not initialized for document verification');
        }
    }

    // Verify carrier documents
    async verifyCarrier(carrierId, status, reason, adminId, adminName) {
        if (!this.db) {
            return { success: false, error: 'Database not initialized' };
        }

        if (!['verified', 'rejected', 'pending'].includes(status)) {
            return { success: false, error: 'Invalid status' };
        }

        try {
            const verificationData = {
                status: status,
                verifiedAt: new Date().toISOString(),
                verifiedBy: adminId,
                verifiedByName: adminName,
                reason: reason || '',
                previousStatus: null
            };

            // Get current status
            const carrierSnapshot = await this.db.ref(`carriers/${carrierId}`).once('value');
            const carrier = carrierSnapshot.val();
            if (carrier && carrier.verificationStatus) {
                verificationData.previousStatus = carrier.verificationStatus;
            }

            // Update carrier verification status
            await this.db.ref(`carriers/${carrierId}/verificationStatus`).set(status);
            await this.db.ref(`carriers/${carrierId}/verificationData`).set(verificationData);
            await this.db.ref(`carriers/${carrierId}/lastUpdated`).set(new Date().toISOString());

            // If verified, mark documents as verified
            if (status === 'verified') {
                await this.db.ref(`carriers/${carrierId}/documentsVerified`).set(true);
                await this.db.ref(`carriers/${carrierId}/documentsVerifiedAt`).set(new Date().toISOString());
            }

            // Create verification log
            await this.db.ref('verificationLogs').push({
                carrierId: carrierId,
                type: 'carrier',
                status: status,
                reason: reason || '',
                verifiedBy: adminId,
                verifiedByName: adminName,
                timestamp: new Date().toISOString()
            });

            // Send notification to carrier
            await this.sendVerificationNotification(carrierId, 'carrier', status, reason);

            return { success: true };
        } catch (error) {
            console.error('Error verifying carrier:', error);
            return { success: false, error: error.message };
        }
    }

    // Verify supplier documents
    async verifySupplier(supplierId, status, reason, adminId, adminName) {
        if (!this.db) {
            return { success: false, error: 'Database not initialized' };
        }

        if (!['verified', 'rejected', 'pending'].includes(status)) {
            return { success: false, error: 'Invalid status' };
        }

        try {
            const verificationData = {
                status: status,
                verifiedAt: new Date().toISOString(),
                verifiedBy: adminId,
                verifiedByName: adminName,
                reason: reason || '',
                previousStatus: null
            };

            // Get current status
            const supplierSnapshot = await this.db.ref(`suppliers/${supplierId}`).once('value');
            const supplier = supplierSnapshot.val();
            if (supplier && supplier.verificationStatus) {
                verificationData.previousStatus = supplier.verificationStatus;
            }

            // Update supplier verification status
            await this.db.ref(`suppliers/${supplierId}/verificationStatus`).set(status);
            await this.db.ref(`suppliers/${supplierId}/verificationData`).set(verificationData);
            await this.db.ref(`suppliers/${supplierId}/lastUpdated`).set(new Date().toISOString());

            // If verified, mark documents as verified
            if (status === 'verified') {
                await this.db.ref(`suppliers/${supplierId}/documentsVerified`).set(true);
                await this.db.ref(`suppliers/${supplierId}/documentsVerifiedAt`).set(new Date().toISOString());
            }

            // Create verification log
            await this.db.ref('verificationLogs').push({
                supplierId: supplierId,
                type: 'supplier',
                status: status,
                reason: reason || '',
                verifiedBy: adminId,
                verifiedByName: adminName,
                timestamp: new Date().toISOString()
            });

            // Send notification
            await this.sendVerificationNotification(supplierId, 'supplier', status, reason);

            return { success: true };
        } catch (error) {
            console.error('Error verifying supplier:', error);
            return { success: false, error: error.message };
        }
    }

    // Get pending verifications
    async getPendingVerifications(type = 'all', callback) {
        if (!this.db) {
            if (callback) callback([]);
            return [];
        }

        try {
            const pending = [];

            if (type === 'all' || type === 'carrier') {
                const carriersSnapshot = await this.db.ref('carriers')
                    .orderByChild('verificationStatus')
                    .equalTo('pending')
                    .once('value');

                carriersSnapshot.forEach((child) => {
                    const carrier = child.val();
                    pending.push({
                        id: child.key,
                        type: 'carrier',
                        name: `${carrier.firstName || ''} ${carrier.lastName || ''}`.trim() || carrier.companyName || 'Unknown',
                        companyName: carrier.companyName || 'N/A',
                        email: carrier.email || 'N/A',
                        submittedAt: carrier.createdAt || carrier.timestamp,
                        documents: carrier.uploadedDocuments || {}
                    });
                });
            }

            if (type === 'all' || type === 'supplier') {
                const suppliersSnapshot = await this.db.ref('suppliers')
                    .orderByChild('verificationStatus')
                    .equalTo('pending')
                    .once('value');

                suppliersSnapshot.forEach((child) => {
                    const supplier = child.val();
                    pending.push({
                        id: child.key,
                        type: 'supplier',
                        name: `${supplier.firstName || ''} ${supplier.lastName || ''}`.trim() || supplier.companyName || 'Unknown',
                        companyName: supplier.companyName || 'N/A',
                        email: supplier.email || 'N/A',
                        submittedAt: supplier.createdAt || supplier.timestamp,
                        documents: supplier.uploadedDocuments || {}
                    });
                });
            }

            // Sort by submission date (oldest first)
            pending.sort((a, b) => new Date(a.submittedAt) - new Date(b.submittedAt));

            if (callback) callback(pending);
            return pending;
        } catch (error) {
            console.error('Error getting pending verifications:', error);
            if (callback) callback([]);
            return [];
        }
    }

    // Get verification history
    async getVerificationHistory(userId, userType, callback) {
        if (!this.db) {
            if (callback) callback([]);
            return [];
        }

        try {
            const snapshot = await this.db.ref('verificationLogs')
                .orderByChild(userType === 'carrier' ? 'carrierId' : 'supplierId')
                .equalTo(userId)
                .once('value');

            const history = [];
            snapshot.forEach((child) => {
                history.push({
                    id: child.key,
                    ...child.val()
                });
            });

            // Sort by timestamp (newest first)
            history.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

            if (callback) callback(history);
            return history;
        } catch (error) {
            console.error('Error getting verification history:', error);
            if (callback) callback([]);
            return [];
        }
    }

    // Send verification notification
    async sendVerificationNotification(userId, userType, status, reason) {
        if (!this.db) return;

        try {
            const message = {
                [userType === 'carrier' ? 'carrierId' : 'supplierId']: userId,
                senderName: 'Alpha Freight Admin',
                sender: 'System',
                message: status === 'verified' 
                    ? `âœ… Your account has been verified! You can now access all features.`
                    : `âŒ Your verification was rejected. Reason: ${reason || 'Please check your documents and resubmit.'}`,
                timestamp: new Date().toISOString(),
                read: false,
                type: 'verification_update',
                status: status
            };

            await this.db.ref('messages').push(message);
        } catch (error) {
            console.error('Error sending verification notification:', error);
        }
    }

    // Check document completeness
    checkDocumentCompleteness(documents, userType) {
        const requiredDocs = userType === 'carrier' 
            ? ['license', 'insurance', 'vehicleRegistration']
            : ['businessLicense', 'taxId', 'companyRegistration'];

        const missing = [];
        requiredDocs.forEach(doc => {
            if (!documents[doc] || !documents[doc].url) {
                missing.push(doc);
            }
        });

        return {
            complete: missing.length === 0,
            missing: missing,
            percentage: ((requiredDocs.length - missing.length) / requiredDocs.length * 100).toFixed(0)
        };
    }
}

// Initialize global instance
window.DocumentVerification = new DocumentVerification();

console.log('âœ… Document Verification System loaded');


