/**
 * Biometric Authentication System
 * Supports Fingerprint/Face ID login using Web Authentication API (WebAuthn)
 */

const BiometricAuth = {
    isSupported: false,
    isAvailable: false,
    credentials: null,

    /**
     * Initialize biometric authentication
     */
    async init() {
        // Check if WebAuthn is supported
        if (!window.PublicKeyCredential) {
            console.warn('WebAuthn is not supported in this browser');
            this.isSupported = false;
            return false;
        }

        // Check if we're in a secure context (HTTPS or localhost)
        const isSecureContext = window.isSecureContext || 
                                window.location.protocol === 'https:' ||
                                window.location.hostname === 'localhost' ||
                                window.location.hostname === '127.0.0.1' ||
                                window.location.protocol === 'file:';
        
        if (!isSecureContext) {
            console.warn('Biometric authentication requires HTTPS or localhost');
            this.isSupported = false;
            return false;
        }

        this.isSupported = true;

        // Check if user authenticator is available
        try {
            this.isAvailable = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
            
            if (!this.isAvailable) {
                console.warn('Biometric authenticator not available on this device');
                return false;
            }

            // Load saved credentials
            await this.loadCredentials();
            return true;
        } catch (error) {
            console.error('Error checking biometric availability:', error);
            this.isAvailable = false;
            return false;
        }
    },

    /**
     * Check if biometric login is enabled for current user
     */
    isEnabled(userId, userType = 'carrier') {
        const settingsKey = `${userType}Settings`;
        const settings = JSON.parse(localStorage.getItem(settingsKey) || '{}');
        return settings.biometricLogin === true && this.credentials !== null;
    },

    /**
     * Enable biometric login - Register credential
     */
    async enable(userId, userType = 'carrier') {
        // Check secure context first
        const isSecureContext = window.isSecureContext || 
                                window.location.protocol === 'https:' ||
                                window.location.hostname === 'localhost' ||
                                window.location.hostname === '127.0.0.1' ||
                                window.location.protocol === 'file:';
        
        if (!isSecureContext) {
            throw new Error('Biometric login requires HTTPS or localhost. Please access the app via HTTPS or use localhost for development.');
        }

        if (!this.isSupported || !this.isAvailable) {
            throw new Error('Biometric authentication is not supported or available on this device');
        }

        try {
            // Generate a unique user ID for WebAuthn (can be email or user ID)
            const auth = userType === 'carrier' 
                ? JSON.parse(localStorage.getItem('carrierAuth') || '{}')
                : JSON.parse(localStorage.getItem('supplierAuth') || '{}');
            
            const userEmail = auth.email || `user-${userId}@alphabrokrage.com`;
            const userName = auth.firstName && auth.lastName 
                ? `${auth.firstName} ${auth.lastName}`
                : auth.companyName || 'User';

            // Create challenge (in production, this should come from server)
            const challenge = new Uint8Array(32);
            crypto.getRandomValues(challenge);

            // Registration options
            const publicKeyCredentialCreationOptions = {
                challenge: challenge,
                rp: {
                    name: "Alpha Freight",
                    id: window.location.hostname,
                },
                user: {
                    id: new TextEncoder().encode(userId),
                    name: userEmail,
                    displayName: userName,
                },
                pubKeyCredParams: [
                    { alg: -7, type: "public-key" },  // ES256
                    { alg: -257, type: "public-key" } // RS256
                ],
                authenticatorSelection: {
                    authenticatorAttachment: "platform",
                    userVerification: "required"
                },
                timeout: 60000,
                attestation: "direct"
            };

            // Register credential
            const credential = await navigator.credentials.create({
                publicKey: publicKeyCredentialCreationOptions
            });

            // Save credential ID and public key
            const credentialData = {
                id: this.arrayBufferToBase64(credential.rawId),
                publicKey: this.arrayBufferToBase64(credential.response.getPublicKey()),
                userId: userId,
                userType: userType,
                createdAt: new Date().toISOString()
            };

            // Save to localStorage (in production, send to server)
            this.credentials = credentialData;
            await this.saveCredentials(userId, userType);

            // Update settings
            const settingsKey = `${userType}Settings`;
            const settings = JSON.parse(localStorage.getItem(settingsKey) || '{}');
            settings.biometricLogin = true;
            localStorage.setItem(settingsKey, JSON.stringify(settings));

            // Save to Firebase if available
            try {
                if (typeof firebase !== 'undefined' && firebase.apps && firebase.apps.length > 0) {
                    const db = firebase.database();
                    await db.ref(`${userType}s/${userId}/biometricCredential`).set(credentialData);
                    await db.ref(`${userType}s/${userId}/settings`).update({ biometricLogin: true });
                }
            } catch (error) {
                console.warn('Could not save to Firebase:', error);
            }

            return true;
        } catch (error) {
            console.error('Error enabling biometric login:', error);
            
            // Provide user-friendly error messages
            if (error.name === 'SecurityError' || error.message.includes('invalid domain')) {
                const isLocalhost = window.location.hostname === 'localhost' || 
                                   window.location.hostname === '127.0.0.1' || 
                                   window.location.protocol === 'file:';
                if (!isLocalhost && window.location.protocol !== 'https:') {
                    throw new Error('Biometric login requires HTTPS. Please access the app via HTTPS or use localhost for development.');
                } else {
                    throw new Error('Biometric authentication requires a secure context. Please ensure you are using HTTPS or localhost.');
                }
            } else if (error.name === 'NotAllowedError') {
                throw new Error('Biometric authentication was cancelled or denied');
            } else if (error.name === 'InvalidStateError') {
                throw new Error('Biometric login is already registered for this device');
            } else if (error.name === 'NotSupportedError') {
                throw new Error('Biometric authentication is not supported on this device');
            } else {
                throw new Error('Failed to enable biometric login: ' + error.message);
            }
        }
    },

    /**
     * Disable biometric login
     */
    async disable(userId, userType = 'carrier') {
        this.credentials = null;
        
        // Clear from localStorage
        const settingsKey = `${userType}Settings`;
        const settings = JSON.parse(localStorage.getItem(settingsKey) || '{}');
        settings.biometricLogin = false;
        localStorage.setItem(settingsKey, JSON.stringify(settings));

        // Clear credential storage
        localStorage.removeItem(`${userType}BiometricCredential`);

        // Clear from Firebase if available
        try {
            if (typeof firebase !== 'undefined' && firebase.apps && firebase.apps.length > 0) {
                const db = firebase.database();
                await db.ref(`${userType}s/${userId}/biometricCredential`).remove();
                await db.ref(`${userType}s/${userId}/settings`).update({ biometricLogin: false });
            }
        } catch (error) {
            console.warn('Could not update Firebase:', error);
        }

        return true;
    },

    /**
     * Authenticate using biometric
     */
    async authenticate(userId, userType = 'carrier') {
        if (!this.isSupported || !this.isAvailable) {
            throw new Error('Biometric authentication is not supported or available');
        }

        if (!this.credentials) {
            throw new Error('Biometric login is not enabled');
        }

        try {
            // Create challenge
            const challenge = new Uint8Array(32);
            crypto.getRandomValues(challenge);

            // Authentication options
            const publicKeyCredentialRequestOptions = {
                challenge: challenge,
                allowCredentials: [{
                    id: this.base64ToArrayBuffer(this.credentials.id),
                    type: 'public-key',
                    transports: ['internal']
                }],
                userVerification: "required",
                timeout: 60000
            };

            // Authenticate
            const assertion = await navigator.credentials.get({
                publicKey: publicKeyCredentialRequestOptions
            });

            // Verify the assertion (in production, send to server for verification)
            if (assertion) {
                return {
                    success: true,
                    userId: userId,
                    userType: userType,
                    credentialId: this.arrayBufferToBase64(assertion.rawId)
                };
            }

            throw new Error('Authentication failed');
        } catch (error) {
            console.error('Error authenticating with biometric:', error);
            
            if (error.name === 'NotAllowedError') {
                throw new Error('Biometric authentication was cancelled or denied');
            } else if (error.name === 'InvalidStateError') {
                throw new Error('Authentication failed');
            } else {
                throw new Error('Biometric authentication failed: ' + error.message);
            }
        }
    },

    /**
     * Load saved credentials
     */
    async loadCredentials(userId = null, userType = 'carrier') {
        try {
            // Try to get from localStorage first
            const credentialKey = `${userType}BiometricCredential`;
            const saved = localStorage.getItem(credentialKey);
            
            if (saved) {
                this.credentials = JSON.parse(saved);
                return true;
            }

            // Try to get from Firebase if userId provided
            if (userId && typeof firebase !== 'undefined' && firebase.apps && firebase.apps.length > 0) {
                try {
                    const db = firebase.database();
                    const snapshot = await db.ref(`${userType}s/${userId}/biometricCredential`).once('value');
                    
                    if (snapshot.exists()) {
                        this.credentials = snapshot.val();
                        localStorage.setItem(credentialKey, JSON.stringify(this.credentials));
                        return true;
                    }
                } catch (error) {
                    console.warn('Could not load from Firebase:', error);
                }
            }

            return false;
        } catch (error) {
            console.error('Error loading credentials:', error);
            return false;
        }
    },

    /**
     * Save credentials
     */
    async saveCredentials(userId, userType = 'carrier') {
        if (!this.credentials) return;

        const credentialKey = `${userType}BiometricCredential`;
        localStorage.setItem(credentialKey, JSON.stringify(this.credentials));
    },

    /**
     * Utility: Convert ArrayBuffer to Base64
     */
    arrayBufferToBase64(buffer) {
        const bytes = new Uint8Array(buffer);
        let binary = '';
        for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return btoa(binary);
    },

    /**
     * Utility: Convert Base64 to ArrayBuffer
     */
    base64ToArrayBuffer(base64) {
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
        }
        return bytes.buffer;
    }
};

// Make available globally
window.BiometricAuth = BiometricAuth;

console.log('🔐 Biometric Authentication System loaded');

