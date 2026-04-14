/**
 * White Label System - Database Layer
 * In-memory database (can be replaced with MongoDB/PostgreSQL)
 */

// In-memory storage (replace with actual database in production)
const db = {
    clients: new Map(),
    clientUsers: new Map(),
    clientBranding: new Map(),
    clientApiKeys: new Map(),
    clientWebhooks: new Map(),
    loads: new Map(),
    carriers: new Map(),
    payments: new Map(),
    subscriptions: new Map(),
    statistics: new Map()
};

// Helper function to generate IDs
function generateId() {
    return 'wl_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// ============================================
// CLIENT OPERATIONS
// ============================================

function createClient(data) {
    const clientId = generateId();
    const client = {
        id: clientId,
        companyName: data.companyName,
        email: data.email,
        subdomain: data.subdomain,
        customDomain: data.customDomain || null,
        planType: data.planType, // 'starter', 'pro', 'enterprise'
        status: 'pending', // 'pending', 'active', 'suspended', 'cancelled'
        stripeCustomerId: null,
        stripeSubscriptionId: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    db.clients.set(clientId, client);
    return client;
}

function getClientById(clientId) {
    return db.clients.get(clientId) || null;
}

function getClientBySubdomain(subdomain) {
    for (const client of db.clients.values()) {
        if (client.subdomain === subdomain) {
            return client;
        }
    }
    return null;
}

function getClientByCustomDomain(domain) {
    for (const client of db.clients.values()) {
        if (client.customDomain === domain) {
            return client;
        }
    }
    return null;
}

function updateClient(clientId, updates) {
    const client = db.clients.get(clientId);
    if (!client) return null;
    
    Object.assign(client, updates, { updatedAt: new Date().toISOString() });
    db.clients.set(clientId, client);
    return client;
}

function checkSubdomainAvailability(subdomain) {
    return !getClientBySubdomain(subdomain);
}

// ============================================
// CLIENT USER OPERATIONS
// ============================================

function createClientUser(data) {
    const userId = generateId();
    const user = {
        id: userId,
        clientId: data.clientId,
        email: data.email,
        name: data.name,
        passwordHash: data.passwordHash,
        role: data.role || 'admin', // 'admin', 'member', 'viewer'
        permissions: data.permissions || [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    db.clientUsers.set(userId, user);
    return user;
}

function getClientUserByEmail(email) {
    for (const user of db.clientUsers.values()) {
        if (user.email === email) {
            return user;
        }
    }
    return null;
}

function getClientUserById(userId) {
    return db.clientUsers.get(userId) || null;
}

function getClientUsersByClientId(clientId) {
    const users = [];
    for (const user of db.clientUsers.values()) {
        if (user.clientId === clientId) {
            users.push(user);
        }
    }
    return users;
}

// ============================================
// BRANDING OPERATIONS
// ============================================

function saveBranding(clientId, brandingData) {
    const branding = {
        clientId,
        logo: {
            full: brandingData.logo?.full || null,
            small: brandingData.logo?.small || null,
            favicon: brandingData.logo?.favicon || null,
            loginBg: brandingData.logo?.loginBg || null,
            emailLogo: brandingData.logo?.emailLogo || null,
            pdfLogo: brandingData.logo?.pdfLogo || null,
            heroImage: brandingData.logo?.heroImage || null,
            ogImage: brandingData.logo?.ogImage || null
        },
        colors: {
            primary: brandingData.colors?.primary || '#635bff',
            secondary: brandingData.colors?.secondary || '#7c3aed',
            success: brandingData.colors?.success || '#10b981',
            danger: brandingData.colors?.danger || '#ef4444',
            bg: brandingData.colors?.bg || '#ffffff',
            cardBg: brandingData.colors?.cardBg || '#f9fafb',
            textPrimary: brandingData.colors?.textPrimary || '#1f2937',
            textSecondary: brandingData.colors?.textSecondary || '#6b7280'
        },
        fonts: {
            primary: brandingData.fonts?.primary || 'Inter',
            heading: brandingData.fonts?.heading || 'Plus Jakarta Sans',
            googleFontsUrl: brandingData.fonts?.googleFontsUrl || ''
        },
        general: brandingData.general || {},
        email: brandingData.email || {},
        advanced: brandingData.advanced || {},
        updatedAt: new Date().toISOString()
    };
    db.clientBranding.set(clientId, branding);
    return branding;
}

function getBranding(clientId) {
    return db.clientBranding.get(clientId) || null;
}

// ============================================
// API KEY OPERATIONS
// ============================================

function createApiKey(clientId, apiKey, apiSecret) {
    // Deactivate old keys
    for (const [key, value] of db.clientApiKeys.entries()) {
        if (value.clientId === clientId && value.isActive) {
            value.isActive = false;
            db.clientApiKeys.set(key, value);
        }
    }
    
    const keyId = generateId();
    const keyData = {
        id: keyId,
        clientId,
        apiKey, // Store hashed in production
        apiSecret, // Store hashed in production
        isActive: true,
        lastUsedAt: null,
        createdAt: new Date().toISOString()
    };
    db.clientApiKeys.set(keyId, keyData);
    return keyData;
}

function getApiKeyByClientId(clientId) {
    for (const keyData of db.clientApiKeys.values()) {
        if (keyData.clientId === clientId && keyData.isActive) {
            return keyData;
        }
    }
    return null;
}

function verifyApiKey(apiKey) {
    for (const keyData of db.clientApiKeys.values()) {
        if (keyData.apiKey === apiKey && keyData.isActive) {
            const client = getClientById(keyData.clientId);
            if (client && client.status === 'active') {
                // Update last used
                keyData.lastUsedAt = new Date().toISOString();
                db.clientApiKeys.set(keyData.id, keyData);
                return { valid: true, clientId: keyData.clientId };
            }
        }
    }
    return { valid: false };
}

// ============================================
// WEBHOOK OPERATIONS
// ============================================

function saveWebhook(clientId, webhookData) {
    const webhook = {
        clientId,
        webhookUrl: webhookData.webhookUrl,
        events: webhookData.events || [],
        secretToken: webhookData.secretToken,
        isActive: webhookData.isActive !== false,
        updatedAt: new Date().toISOString()
    };
    db.clientWebhooks.set(clientId, webhook);
    return webhook;
}

function getWebhook(clientId) {
    return db.clientWebhooks.get(clientId) || null;
}

// ============================================
// STATISTICS OPERATIONS
// ============================================

function getClientStatistics(clientId) {
    const stats = db.statistics.get(clientId);
    if (stats) return stats;
    
    // Return default stats
    return {
        totalLoads: 0,
        activeCarriers: 0,
        revenue: 0,
        apiRequests: 0,
        monthYear: new Date().toISOString().slice(0, 7)
    };
}

function updateClientStatistics(clientId, updates) {
    const current = getClientStatistics(clientId);
    const updated = { ...current, ...updates };
    db.statistics.set(clientId, updated);
    return updated;
}

// ============================================
// LOADS OPERATIONS (Per Tenant)
// ============================================

function createLoad(clientId, loadData) {
    const loadId = generateId();
    const load = {
        id: loadId,
        clientId,
        pickupLocation: loadData.pickupLocation,
        dropLocation: loadData.dropLocation,
        weight: loadData.weight,
        loadType: loadData.loadType,
        price: loadData.price,
        status: loadData.status || 'available',
        carrierId: loadData.carrierId || null,
        createdAt: new Date().toISOString()
    };
    db.loads.set(loadId, load);
    return load;
}

function getLoadsByClientId(clientId) {
    const loads = [];
    for (const load of db.loads.values()) {
        if (load.clientId === clientId) {
            loads.push(load);
        }
    }
    return loads;
}

// ============================================
// CARRIERS OPERATIONS (Per Tenant)
// ============================================

function createCarrier(clientId, carrierData) {
    const carrierId = generateId();
    const carrier = {
        id: carrierId,
        clientId,
        companyName: carrierData.companyName,
        verificationStatus: carrierData.verificationStatus || 'pending',
        rating: carrierData.rating || 0,
        completedLoads: carrierData.completedLoads || 0,
        createdAt: new Date().toISOString()
    };
    db.carriers.set(carrierId, carrier);
    return carrier;
}

function getCarriersByClientId(clientId) {
    const carriers = [];
    for (const carrier of db.carriers.values()) {
        if (carrier.clientId === clientId) {
            carriers.push(carrier);
        }
    }
    return carriers;
}

// ============================================
// PAYMENTS OPERATIONS
// ============================================

function createPayment(clientId, paymentData) {
    const paymentId = generateId();
    const payment = {
        id: paymentId,
        clientId,
        loadId: paymentData.loadId,
        carrierId: paymentData.carrierId,
        amount: paymentData.amount,
        status: paymentData.status || 'pending', // 'pending', 'completed', 'failed', 'refunded'
        stripePaymentIntentId: paymentData.stripePaymentIntentId || null,
        createdAt: new Date().toISOString()
    };
    db.payments.set(paymentId, payment);
    return payment;
}

function getPaymentsByClientId(clientId) {
    const payments = [];
    for (const payment of db.payments.values()) {
        if (payment.clientId === clientId) {
            payments.push(payment);
        }
    }
    return payments;
}

// ============================================
// EXPORTS
// ============================================

module.exports = {
    // Client
    createClient,
    getClientById,
    getClientBySubdomain,
    getClientByCustomDomain,
    updateClient,
    checkSubdomainAvailability,
    
    // Client Users
    createClientUser,
    getClientUserByEmail,
    getClientUserById,
    getClientUsersByClientId,
    
    // Branding
    saveBranding,
    getBranding,
    
    // API Keys
    createApiKey,
    getApiKeyByClientId,
    verifyApiKey,
    
    // Webhooks
    saveWebhook,
    getWebhook,
    
    // Statistics
    getClientStatistics,
    updateClientStatistics,
    
    // Loads
    createLoad,
    getLoadsByClientId,
    
    // Carriers
    createCarrier,
    getCarriersByClientId,
    
    // Payments
    createPayment,
    getPaymentsByClientId
};
