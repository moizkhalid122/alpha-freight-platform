# White-Label Platform - Backend Integration Guide

This guide provides step-by-step instructions for integrating the White-Label Platform with your backend infrastructure.

## Table of Contents
1. [Database Setup](#database-setup)
2. [Authentication System](#authentication-system)
3. [Multi-Tenant Architecture](#multi-tenant-architecture)
4. [Subdomain Routing](#subdomain-routing)
5. [Payment Integration (Stripe)](#payment-integration-stripe)
6. [Firebase Configuration](#firebase-configuration)
7. [API Endpoints](#api-endpoints)
8. [Webhook Implementation](#webhook-implementation)

---

## Database Setup

### Multi-Tenant Database Schema

```sql
-- Clients Table
CREATE TABLE clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_name VARCHAR(255) NOT NULL,
    subdomain VARCHAR(100) UNIQUE NOT NULL,
    custom_domain VARCHAR(255) UNIQUE,
    plan_type VARCHAR(50) NOT NULL, -- 'starter', 'pro', 'enterprise'
    status VARCHAR(50) DEFAULT 'active', -- 'active', 'suspended', 'cancelled'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Client Branding Table
CREATE TABLE client_branding (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    logo_url TEXT,
    primary_color VARCHAR(7) DEFAULT '#635bff',
    font_family VARCHAR(100) DEFAULT 'Inter',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Client API Keys Table
CREATE TABLE client_api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    api_key VARCHAR(255) UNIQUE NOT NULL,
    api_secret VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    last_used_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Client Webhooks Table
CREATE TABLE client_webhooks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    webhook_url TEXT NOT NULL,
    events TEXT[], -- Array of event types
    is_active BOOLEAN DEFAULT true,
    secret_token VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Client Users Table (for admin access)
CREATE TABLE client_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'admin', -- 'admin', 'manager', 'viewer'
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Client Statistics Table
CREATE TABLE client_statistics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    total_loads INTEGER DEFAULT 0,
    active_carriers INTEGER DEFAULT 0,
    revenue_month DECIMAL(10, 2) DEFAULT 0,
    api_requests_month INTEGER DEFAULT 0,
    month_year VARCHAR(7) NOT NULL, -- Format: 'YYYY-MM'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(client_id, month_year)
);
```

---

## Authentication System

### JWT Token Implementation

```javascript
// auth.js
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRY = '7d';

// Generate JWT token for client user
function generateToken(clientId, userId, email) {
    return jwt.sign(
        { 
            clientId, 
            userId, 
            email,
            type: 'client_admin'
        },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRY }
    );
}

// Verify JWT token
function verifyToken(token) {
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch (error) {
        return null;
    }
}

// Hash password
async function hashPassword(password) {
    return await bcrypt.hash(password, 10);
}

// Verify password
async function verifyPassword(password, hash) {
    return await bcrypt.compare(password, hash);
}

// Middleware to authenticate client admin
async function authenticateClientAdmin(req, res, next) {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
        return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = verifyToken(token);
    if (!decoded || decoded.type !== 'client_admin') {
        return res.status(401).json({ error: 'Invalid token' });
    }

    req.clientId = decoded.clientId;
    req.userId = decoded.userId;
    next();
}

module.exports = {
    generateToken,
    verifyToken,
    hashPassword,
    verifyPassword,
    authenticateClientAdmin
};
```

---

## Multi-Tenant Architecture

### Client Context Middleware

```javascript
// middleware/clientContext.js
async function getClientFromSubdomain(subdomain) {
    const client = await db.query(
        'SELECT * FROM clients WHERE subdomain = $1 AND status = $2',
        [subdomain, 'active']
    );
    return client.rows[0];
}

async function getClientFromDomain(domain) {
    const client = await db.query(
        'SELECT * FROM clients WHERE custom_domain = $1 AND status = $2',
        [domain, 'active']
    );
    return client.rows[0];
}

// Middleware to set client context
async function setClientContext(req, res, next) {
    const hostname = req.hostname;
    
    // Check for subdomain (e.g., client.alphafreightuk.com)
    const subdomain = hostname.split('.')[0];
    
    let client;
    if (subdomain !== 'www' && subdomain !== 'api') {
        client = await getClientFromSubdomain(subdomain);
    }
    
    // If not found, check custom domain
    if (!client) {
        client = await getClientFromDomain(hostname);
    }
    
    if (!client) {
        return res.status(404).json({ error: 'Client not found' });
    }
    
    req.client = client;
    req.clientId = client.id;
    next();
}
```

---

## Subdomain Routing

### Nginx Configuration

```nginx
# /etc/nginx/sites-available/white-label
server {
    listen 80;
    server_name *.alphafreightuk.com alphafreightuk.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Client-Subdomain $subdomain;
    }
}
```

### Express.js Routing

```javascript
// routes/white-label.js
const express = require('express');
const router = express.Router();
const { setClientContext } = require('../middleware/clientContext');

// Apply client context to all routes
router.use(setClientContext);

// Client dashboard route
router.get('/client-dashboard', authenticateClientAdmin, async (req, res) => {
    const stats = await getClientStats(req.clientId);
    res.json(stats);
});

// Branding routes
router.get('/branding', authenticateClientAdmin, async (req, res) => {
    const branding = await getClientBranding(req.clientId);
    res.json(branding);
});

router.post('/branding', authenticateClientAdmin, async (req, res) => {
    const { logo, primaryColor, fontFamily, domainType, subdomain, customDomain } = req.body;
    
    await updateClientBranding(req.clientId, {
        logo,
        primaryColor,
        fontFamily,
        domainType,
        subdomain,
        customDomain
    });
    
    res.json({ success: true });
});

// API settings routes
router.get('/api-settings', authenticateClientAdmin, async (req, res) => {
    const apiKey = await getClientApiKey(req.clientId);
    const webhook = await getClientWebhook(req.clientId);
    const stats = await getApiUsageStats(req.clientId);
    
    res.json({ apiKey, webhook, stats });
});

router.post('/api/regenerate-key', authenticateClientAdmin, async (req, res) => {
    const newKey = await regenerateApiKey(req.clientId);
    res.json({ apiKey: newKey });
});

router.post('/webhook', authenticateClientAdmin, async (req, res) => {
    const { url, events } = req.body;
    await updateWebhookConfig(req.clientId, url, events);
    res.json({ success: true });
});
```

---

## Payment Integration (Stripe)

### Stripe Setup

```javascript
// payments/stripe.js
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Create customer for client
async function createStripeCustomer(clientData) {
    const customer = await stripe.customers.create({
        email: clientData.email,
        name: clientData.companyName,
        metadata: {
            clientId: clientData.id,
            planType: clientData.planType
        }
    });
    
    return customer;
}

// Create subscription
async function createSubscription(customerId, planType) {
    const priceMap = {
        'starter': process.env.STRIPE_STARTER_PRICE_ID,
        'pro': process.env.STRIPE_PRO_PRICE_ID,
        'enterprise': process.env.STRIPE_ENTERPRISE_PRICE_ID
    };
    
    const subscription = await stripe.subscriptions.create({
        customer: customerId,
        items: [{ price: priceMap[planType] }],
        payment_behavior: 'default_incomplete',
        payment_settings: { save_default_payment_method: 'on_subscription' },
        expand: ['latest_invoice.payment_intent'],
    });
    
    return subscription;
}

// Handle setup fee (one-time payment)
async function createSetupFeeInvoice(customerId, planType) {
    const setupFeeMap = {
        'starter': 3000, // £3,000
        'pro': 5000,     // £5,000
        'enterprise': 10000 // £10,000
    };
    
    const invoice = await stripe.invoices.create({
        customer: customerId,
        collection_method: 'send_invoice',
        days_until_due: 7,
        auto_advance: true,
    });
    
    await stripe.invoiceItems.create({
        customer: customerId,
        invoice: invoice.id,
        amount: setupFeeMap[planType] * 100, // Convert to pence
        currency: 'gbp',
        description: `${planType.charAt(0).toUpperCase() + planType.slice(1)} Plan Setup Fee`
    });
    
    return await stripe.invoices.finalizeInvoice(invoice.id);
}

// Webhook handler for Stripe events
async function handleStripeWebhook(event) {
    switch (event.type) {
        case 'customer.subscription.created':
        case 'customer.subscription.updated':
            await handleSubscriptionUpdate(event.data.object);
            break;
            
        case 'customer.subscription.deleted':
            await handleSubscriptionCancelled(event.data.object);
            break;
            
        case 'invoice.payment_succeeded':
            await handlePaymentSucceeded(event.data.object);
            break;
            
        case 'invoice.payment_failed':
            await handlePaymentFailed(event.data.object);
            break;
    }
}
```

---

## Firebase Configuration

### Firebase Setup for Client Configurations

```javascript
// firebase/config.js
const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// Save client branding to Firebase
async function saveClientBranding(clientId, brandingData) {
    const clientRef = db.collection('clients').doc(clientId);
    await clientRef.set({
        branding: {
            logo: brandingData.logo,
            primaryColor: brandingData.primaryColor,
            fontFamily: brandingData.fontFamily,
            domain: {
                type: brandingData.domainType,
                subdomain: brandingData.subdomain,
                custom: brandingData.customDomain
            },
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        }
    }, { merge: true });
}

// Get client branding from Firebase
async function getClientBranding(clientId) {
    const clientRef = db.collection('clients').doc(clientId);
    const doc = await clientRef.get();
    
    if (!doc.exists) {
        return null;
    }
    
    return doc.data().branding;
}

// Save API key to Firebase
async function saveApiKey(clientId, apiKey) {
    const clientRef = db.collection('clients').doc(clientId);
    await clientRef.set({
        api: {
            key: apiKey,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        }
    }, { merge: true });
}
```

---

## API Endpoints

### Complete API Route Structure

```javascript
// routes/api.js
const express = require('express');
const router = express.Router();

// Client Authentication
router.post('/auth/login', async (req, res) => {
    const { email, password } = req.body;
    // Verify credentials and return JWT token
});

router.post('/auth/register', async (req, res) => {
    const { companyName, email, password, planType } = req.body;
    // Create new client account
});

// Client Dashboard
router.get('/dashboard/stats', authenticateClientAdmin, async (req, res) => {
    // Return dashboard statistics
});

router.get('/dashboard/activity', authenticateClientAdmin, async (req, res) => {
    // Return recent activity feed
});

// Branding Management
router.get('/branding', authenticateClientAdmin, getBranding);
router.post('/branding', authenticateClientAdmin, updateBranding);
router.post('/branding/logo', authenticateClientAdmin, uploadLogo);

// API Key Management
router.get('/api/key', authenticateClientAdmin, getApiKey);
router.post('/api/key/regenerate', authenticateClientAdmin, regenerateApiKey);

// Webhook Management
router.get('/webhook', authenticateClientAdmin, getWebhook);
router.post('/webhook', authenticateClientAdmin, updateWebhook);

// API Usage Stats
router.get('/api/stats', authenticateClientAdmin, getApiStats);
```

---

## Webhook Implementation

### Webhook Event System

```javascript
// webhooks/events.js
const axios = require('axios');
const crypto = require('crypto');

// Event types
const EVENT_TYPES = {
    LOAD_POSTED: 'load.posted',
    LOAD_MATCHED: 'load.matched',
    LOAD_COMPLETED: 'load.completed',
    CARRIER_REGISTERED: 'carrier.registered',
    PAYMENT_RECEIVED: 'payment.received',
    USER_CREATED: 'user.created'
};

// Send webhook to client
async function sendWebhook(clientId, eventType, eventData) {
    const webhook = await getClientWebhook(clientId);
    
    if (!webhook || !webhook.is_active) {
        return;
    }
    
    // Check if client subscribed to this event
    if (!webhook.events.includes(eventType)) {
        return;
    }
    
    const payload = {
        event: eventType,
        data: eventData,
        timestamp: new Date().toISOString()
    };
    
    // Generate signature
    const signature = generateWebhookSignature(
        JSON.stringify(payload),
        webhook.secret_token
    );
    
    try {
        await axios.post(webhook.webhook_url, payload, {
            headers: {
                'X-Webhook-Signature': signature,
                'X-Webhook-Event': eventType,
                'Content-Type': 'application/json'
            },
            timeout: 10000
        });
    } catch (error) {
        console.error(`Webhook delivery failed for client ${clientId}:`, error);
        // Log failed webhook delivery
        await logWebhookDelivery(clientId, eventType, false, error.message);
    }
}

// Generate webhook signature
function generateWebhookSignature(payload, secret) {
    return crypto
        .createHmac('sha256', secret)
        .update(payload)
        .digest('hex');
}

// Verify webhook signature (for incoming webhooks)
function verifyWebhookSignature(payload, signature, secret) {
    const expectedSignature = generateWebhookSignature(payload, secret);
    return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature)
    );
}
```

---

## Environment Variables

Create a `.env` file with the following variables:

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/alphafreight
DATABASE_SSL=true

# JWT
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRY=7d

# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_STARTER_PRICE_ID=price_...
STRIPE_PRO_PRICE_ID=price_...
STRIPE_ENTERPRISE_PRICE_ID=price_...

# Firebase
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY=your-private-key
FIREBASE_CLIENT_EMAIL=your-client-email

# Server
PORT=3000
NODE_ENV=production
BASE_URL=https://alphafreightuk.com

# File Storage (for logo uploads)
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_S3_BUCKET=alphafreight-logos
AWS_REGION=eu-west-2
```

---

## Testing Checklist

- [ ] Client registration and authentication
- [ ] Subdomain routing works correctly
- [ ] Custom domain routing works correctly
- [ ] Branding updates reflect in real-time
- [ ] API key generation and regeneration
- [ ] Webhook delivery and signature verification
- [ ] Stripe subscription creation and management
- [ ] Payment processing for setup fees
- [ ] Multi-tenant data isolation
- [ ] Client statistics calculation
- [ ] Logo upload and storage
- [ ] Domain validation and DNS checks

---

## Security Considerations

1. **API Key Security**: Store API keys hashed in database
2. **Webhook Signatures**: Always verify webhook signatures
3. **Rate Limiting**: Implement rate limiting on API endpoints
4. **CORS**: Configure CORS properly for subdomain access
5. **SQL Injection**: Use parameterized queries
6. **XSS Protection**: Sanitize all user inputs
7. **HTTPS**: Enforce HTTPS for all communications
8. **Token Expiry**: Implement token refresh mechanism

---

## Support & Resources

- API Documentation: `/api/docs`
- Webhook Guide: `/webhooks/guide`
- Client Dashboard: `https://client.alphafreightuk.com/client-dashboard`
- Support Email: support@alphafreightuk.com

---

**Last Updated**: 2024
**Version**: 1.0.0
