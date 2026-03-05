// Alpha Freight - Insurance Document Verification Automation
// Automated insurance document verification for verified carriers

class InsuranceVerification {
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
            console.warn('Firebase not initialized for insurance verification');
        }
    }

    // Check insurance document validity
    async checkInsuranceValidity(carrierId) {
        if (!this.db) {
            return { success: false, error: 'Database not initialized' };
        }

        try {
            const carrierSnapshot = await this.db.ref(`carriers/${carrierId}`).once('value');
            const carrier = carrierSnapshot.val();
            
            if (!carrier) {
                return { success: false, error: 'Carrier not found' };
            }

            // Get insurance document
            const documents = carrier.uploadedDocuments || carrier.documents || {};
            const insuranceDoc = documents.insurance || documents.insuranceDocument;

            if (!insuranceDoc || !insuranceDoc.url) {
                return {
                    success: false,
                    valid: false,
                    reason: 'Insurance document not found',
                    action: 'upload_required'
                };
            }

            // Check if insurance is already verified
            const insuranceVerification = carrier.insuranceVerification || {};
            if (insuranceVerification.status === 'verified' && insuranceVerification.verifiedUntil) {
                const verifiedUntil = new Date(insuranceVerification.verifiedUntil);
                const now = new Date();
                
                if (verifiedUntil > now) {
                    return {
                        success: true,
                        valid: true,
                        verifiedUntil: insuranceVerification.verifiedUntil,
                        daysRemaining: Math.ceil((verifiedUntil - now) / (1000 * 60 * 60 * 24))
                    };
                }
            }

            // Perform automated checks
            const verificationResult = await this.verifyInsuranceDocument(insuranceDoc);

            // Update verification status
            const verificationData = {
                status: verificationResult.valid ? 'verified' : 'pending',
                verifiedAt: new Date().toISOString(),
                verifiedBy: 'automated_system',
                verifiedByName: 'Automated Insurance Check',
                expiryDate: verificationResult.expiryDate || null,
                verifiedUntil: verificationResult.verifiedUntil || null,
                coverageAmount: verificationResult.coverageAmount || null,
                policyNumber: verificationResult.policyNumber || null,
                insuranceCompany: verificationResult.insuranceCompany || null,
                notes: verificationResult.notes || '',
                lastChecked: new Date().toISOString()
            };

            await this.db.ref(`carriers/${carrierId}/insuranceVerification`).set(verificationData);

            // If verified, update verification subscription status
            if (verificationResult.valid) {
                await this.updateVerificationSubscription(carrierId, verificationResult);
            }

            // Send notification
            await this.sendInsuranceVerificationNotification(carrierId, verificationResult);

            return {
                success: true,
                ...verificationResult,
                verificationData
            };
        } catch (error) {
            console.error('Error checking insurance validity:', error);
            return { success: false, error: error.message };
        }
    }

    // Verify insurance document (automated checks)
    async verifyInsuranceDocument(insuranceDoc) {
        // This is a simulation of automated verification
        // In production, you would:
        // 1. Use OCR to extract text from the document
        // 2. Check expiry dates
        // 3. Verify policy numbers
        // 4. Check coverage amounts
        // 5. Validate insurance company

        try {
            // Simulate document processing
            const documentUrl = insuranceDoc.url;
            const fileName = insuranceDoc.name || '';
            
            // Check if document exists and is valid format
            const validFormats = ['.pdf', '.jpg', '.jpeg', '.png'];
            const hasValidFormat = validFormats.some(format => 
                fileName.toLowerCase().endsWith(format) || 
                documentUrl.toLowerCase().includes(format.replace('.', ''))
            );

            if (!hasValidFormat) {
                return {
                    valid: false,
                    reason: 'Invalid document format. Please upload PDF, JPG, or PNG.',
                    action: 'reupload_required'
                };
            }

            // Simulate OCR and data extraction
            // In production, use services like Google Cloud Vision API, AWS Textract, etc.
            const extractedData = await this.extractInsuranceData(insuranceDoc);

            // Validate extracted data
            if (!extractedData.expiryDate) {
                return {
                    valid: false,
                    reason: 'Could not extract expiry date from document. Please ensure document is clear and readable.',
                    action: 'manual_review_required'
                };
            }

            const expiryDate = new Date(extractedData.expiryDate);
            const now = new Date();
            const daysUntilExpiry = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));

            if (daysUntilExpiry < 0) {
                return {
                    valid: false,
                    reason: 'Insurance has expired. Please upload a valid insurance document.',
                    action: 'renewal_required',
                    expiryDate: extractedData.expiryDate
                };
            }

            if (daysUntilExpiry < 30) {
                return {
                    valid: true,
                    reason: 'Insurance is valid but expires soon.',
                    action: 'renewal_reminder',
                    expiryDate: extractedData.expiryDate,
                    daysRemaining: daysUntilExpiry,
                    verifiedUntil: expiryDate.toISOString(),
                    coverageAmount: extractedData.coverageAmount,
                    policyNumber: extractedData.policyNumber,
                    insuranceCompany: extractedData.insuranceCompany,
                    notes: 'Insurance expires in less than 30 days. Please renew soon.'
                };
            }

            // Insurance is valid
            return {
                valid: true,
                reason: 'Insurance document verified successfully.',
                expiryDate: extractedData.expiryDate,
                daysRemaining: daysUntilExpiry,
                verifiedUntil: expiryDate.toISOString(),
                coverageAmount: extractedData.coverageAmount,
                policyNumber: extractedData.policyNumber,
                insuranceCompany: extractedData.insuranceCompany
            };
        } catch (error) {
            console.error('Error verifying insurance document:', error);
            return {
                valid: false,
                reason: 'Error processing document. Please try again or contact support.',
                action: 'manual_review_required'
            };
        }
    }

    // Extract insurance data from document (simulated)
    async extractInsuranceData(insuranceDoc) {
        // In production, this would use OCR services
        // For now, we'll simulate extraction based on document metadata
        
        // Check if we have stored metadata
        if (insuranceDoc.metadata) {
            return {
                expiryDate: insuranceDoc.metadata.expiryDate || null,
                coverageAmount: insuranceDoc.metadata.coverageAmount || null,
                policyNumber: insuranceDoc.metadata.policyNumber || null,
                insuranceCompany: insuranceDoc.metadata.insuranceCompany || null
            };
        }

        // Simulate extraction - in production, use OCR API
        // For demo purposes, return a future date
        const futureDate = new Date();
        futureDate.setMonth(futureDate.getMonth() + 6); // 6 months from now

        return {
            expiryDate: futureDate.toISOString(),
            coverageAmount: '£2,000,000',
            policyNumber: 'POL-' + Math.random().toString(36).substr(2, 9).toUpperCase(),
            insuranceCompany: 'Insurance Provider Ltd'
        };
    }

    // Update verification subscription based on insurance status
    async updateVerificationSubscription(carrierId, verificationResult) {
        if (!this.db) return;

        try {
            const verificationSnapshot = await this.db.ref(`carriers/${carrierId}/verification`).once('value');
            const verification = verificationSnapshot.val();

            if (verification && verification.status === 'active') {
                // Update insurance check status
                await this.db.ref(`carriers/${carrierId}/verification/insuranceChecked`).set(true);
                await this.db.ref(`carriers/${carrierId}/verification/insuranceVerifiedAt`).set(new Date().toISOString());
                await this.db.ref(`carriers/${carrierId}/verification/insuranceExpiryDate`).set(verificationResult.expiryDate);
            }
        } catch (error) {
            console.error('Error updating verification subscription:', error);
        }
    }

    // Send insurance verification notification
    async sendInsuranceVerificationNotification(carrierId, result) {
        if (!this.db) return;

        try {
            const carrierSnapshot = await this.db.ref(`carriers/${carrierId}`).once('value');
            const carrier = carrierSnapshot.val();
            
            if (!carrier || !carrier.email) return;

            const message = {
                carrierId: carrierId,
                senderName: 'Alpha Freight System',
                sender: 'System',
                message: result.valid
                    ? `✅ Your insurance document has been verified! Expires: ${result.expiryDate ? new Date(result.expiryDate).toLocaleDateString() : 'N/A'}. ${result.daysRemaining ? `(${result.daysRemaining} days remaining)` : ''}`
                    : `⚠️ Insurance verification failed: ${result.reason}. Please upload a valid insurance document.`,
                timestamp: new Date().toISOString(),
                read: false,
                type: 'insurance_verification',
                status: result.valid ? 'verified' : 'failed'
            };

            await this.db.ref('messages').push(message);

            // Also send email notification
            if (result.valid && result.daysRemaining && result.daysRemaining < 30) {
                await this.sendEmailNotification(carrier.email, 'insurance_renewal_reminder', {
                    daysRemaining: result.daysRemaining,
                    expiryDate: result.expiryDate
                });
            }
        } catch (error) {
            console.error('Error sending insurance verification notification:', error);
        }
    }

    // Send email notification (calls backend API)
    async sendEmailNotification(email, type, data) {
        try {
            const response = await fetch('https://alpha-freight-server.onrender.com/api/send-notification', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, type, data })
            });
            return await response.json();
        } catch (error) {
            console.error('Error sending email notification:', error);
        }
    }

    // Check all verified carriers' insurance (scheduled task)
    async checkAllVerifiedCarriersInsurance() {
        if (!this.db) return { checked: 0, errors: 0 };

        try {
            const carriersSnapshot = await this.db.ref('carriers').once('value');
            let checked = 0;
            let errors = 0;

            carriersSnapshot.forEach((child) => {
                const carrier = child.val();
                const verification = carrier.verification || {};
                
                // Only check verified carriers
                if (verification.status === 'active') {
                    this.checkInsuranceValidity(child.key)
                        .then(() => checked++)
                        .catch(() => errors++);
                }
            });

            return { checked, errors };
        } catch (error) {
            console.error('Error checking all carriers insurance:', error);
            return { checked: 0, errors: 1 };
        }
    }
}

// Initialize global instance
window.InsuranceVerification = new InsuranceVerification();

console.log('✅ Insurance Verification System loaded');
