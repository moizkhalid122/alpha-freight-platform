/**
 * White Label System - API Routes
 */

const express = require('express');
const router = express.Router();
const db = require('./database');
const auth = require('./auth');
const crypto = require('crypto');

// ============================================
// AUTHENTICATION ROUTES
// ============================================

// Register new client
router.post('/auth/register', async (req, res) => {
    try {
        const { companyName, email, password, planType, subdomain } = req.body;
        
        // Validation
        if (!companyName || !email || !password || !planType || !subdomain) {
            return res.status(400).json({ error: 'All fields are required' });
        }
        
        // Check subdomain availability
        if (!db.checkSubdomainAvailability(subdomain)) {
            return res.status(400).json({ error: 'Subdomain already taken' });
        }
        
        // Check if email already exists
        if (db.getClientUserByEmail(email)) {
            return res.status(400).json({ error: 'Email already registered' });
        }
        
        // Create client
        const client = db.createClient({
            companyName,
            email,
            subdomain,
            planType
        });
        
        // Create admin user
        const user = db.createClientUser({
            clientId: client.id,
            email,
            name: companyName,
            passwordHash: auth.hashPassword(password),
            role: 'admin'
        });
        
        // Initialize branding with defaults
        db.saveBranding(client.id, {
            colors: {
                primary: '#635bff',
                secondary: '#7c3aed',
                success: '#10b981',
                danger: '#ef4444'
            },
            fonts: {
                primary: 'Inter'
            }
        });
        
        res.status(201).json({
            success: true,
            client: {
                id: client.id,
                companyName: client.companyName,
                subdomain: client.subdomain,
                planType: client.planType,
                status: client.status
            },
            user: {
                id: user.id,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Registration failed' });
    }
});

// Login
router.post('/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password required' });
        }
        
        const user = db.getClientUserByEmail(email);
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        if (!auth.comparePassword(password, user.passwordHash)) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        const client = db.getClientById(user.clientId);
        if (!client) {
            return res.status(401).json({ error: 'Client not found' });
        }
        
        if (client.status !== 'active' && client.status !== 'pending') {
            return res.status(403).json({ error: 'Account is suspended' });
        }
        
        const token = auth.generateToken({
            userId: user.id,
            clientId: client.id,
            email: user.email,
            role: user.role
        });
        
        res.json({
            success: true,
            token,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role
            },
            client: {
                id: client.id,
                companyName: client.companyName,
                subdomain: client.subdomain,
                planType: client.planType,
                status: client.status
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
});

// Verify token
router.get('/auth/verify', auth.authenticateClient, (req, res) => {
    res.json({
        success: true,
        user: {
            id: req.user.id,
            email: req.user.email,
            role: req.user.role
        },
        client: {
            id: req.client.id,
            companyName: req.client.companyName,
            subdomain: req.client.subdomain
        }
    });
});

// ============================================
// DASHBOARD ROUTES
// ============================================

router.get('/dashboard/stats', auth.authenticateClient, (req, res) => {
    try {
        const stats = db.getClientStatistics(req.clientId);
        const loads = db.getLoadsByClientId(req.clientId);
        const carriers = db.getCarriersByClientId(req.clientId);
        const payments = db.getPaymentsByClientId(req.clientId);
        
        // Calculate revenue
        const revenue = payments
            .filter(p => p.status === 'completed')
            .reduce((sum, p) => sum + (p.amount || 0), 0);
        
        res.json({
            success: true,
            stats: {
                totalLoads: loads.length,
                activeCarriers: carriers.filter(c => c.verificationStatus === 'verified').length,
                revenue: `£${revenue.toLocaleString()}`,
                apiRequests: stats.apiRequests || 0,
                pendingPayments: payments.filter(p => p.status === 'pending').length
            }
        });
    } catch (error) {
        console.error('Dashboard stats error:', error);
        res.status(500).json({ error: 'Failed to fetch stats' });
    }
});

// ============================================
// BRANDING ROUTES
// ============================================

router.get('/branding', auth.authenticateClient, (req, res) => {
    try {
        const branding = db.getBranding(req.clientId);
        if (!branding) {
            return res.json({
                success: true,
                branding: {
                    logo: {
                        full: null,
                        small: null,
                        favicon: null,
                        loginBg: null,
                        emailLogo: null,
                        pdfLogo: null,
                        heroImage: null,
                        ogImage: null
                    },
                    colors: {
                        primary: '#635bff',
                        secondary: '#7c3aed',
                        success: '#10b981',
                        danger: '#ef4444',
                        bg: '#ffffff',
                        cardBg: '#f9fafb',
                        textPrimary: '#1f2937',
                        textSecondary: '#6b7280'
                    },
                    fonts: {
                        primary: 'Inter',
                        heading: 'Plus Jakarta Sans',
                        googleFontsUrl: ''
                    },
                    general: {},
                    email: {},
                    advanced: {}
                }
            });
        }
        
        res.json({
            success: true,
            branding
        });
    } catch (error) {
        console.error('Get branding error:', error);
        res.status(500).json({ error: 'Failed to fetch branding' });
    }
});

router.post('/branding', auth.authenticateClient, (req, res) => {
    try {
        const brandingData = req.body;
        const branding = db.saveBranding(req.clientId, brandingData);
        
        res.json({
            success: true,
            message: 'Branding updated successfully',
            branding
        });
    } catch (error) {
        console.error('Save branding error:', error);
        res.status(500).json({ error: 'Failed to save branding' });
    }
});

// ============================================
// API KEY ROUTES
// ============================================

router.get('/api/key', auth.authenticateClient, (req, res) => {
    try {
        const apiKeyData = db.getApiKeyByClientId(req.clientId);
        
        if (!apiKeyData) {
            return res.json({
                success: true,
                hasKey: false,
                message: 'No API key generated yet'
            });
        }
        
        // Don't send full key, only masked version
        const maskedKey = apiKeyData.apiKey.substring(0, 12) + '...' + apiKeyData.apiKey.substring(apiKeyData.apiKey.length - 4);
        
        res.json({
            success: true,
            hasKey: true,
            apiKey: maskedKey,
            lastUsedAt: apiKeyData.lastUsedAt,
            createdAt: apiKeyData.createdAt
        });
    } catch (error) {
        console.error('Get API key error:', error);
        res.status(500).json({ error: 'Failed to fetch API key' });
    }
});

router.post('/api/key/regenerate', auth.authenticateClient, (req, res) => {
    try {
        const apiKey = 'sk_live_' + crypto.randomBytes(32).toString('hex');
        const apiSecret = crypto.randomBytes(32).toString('hex');
        
        const keyData = db.createApiKey(req.clientId, apiKey, apiSecret);
        
        res.json({
            success: true,
            message: 'API key regenerated successfully',
            apiKey, // Only shown once
            apiSecret,
            warning: 'Save this key securely. It will not be shown again.'
        });
    } catch (error) {
        console.error('Regenerate API key error:', error);
        res.status(500).json({ error: 'Failed to regenerate API key' });
    }
});

// ============================================
// WEBHOOK ROUTES
// ============================================

router.get('/webhook', auth.authenticateClient, (req, res) => {
    try {
        const webhook = db.getWebhook(req.clientId);
        
        res.json({
            success: true,
            webhook: webhook || null
        });
    } catch (error) {
        console.error('Get webhook error:', error);
        res.status(500).json({ error: 'Failed to fetch webhook' });
    }
});

router.post('/webhook', auth.authenticateClient, (req, res) => {
    try {
        const { webhookUrl, events } = req.body;
        
        if (!webhookUrl) {
            return res.status(400).json({ error: 'Webhook URL is required' });
        }
        
        const secretToken = crypto.randomBytes(32).toString('hex');
        const webhook = db.saveWebhook(req.clientId, {
            webhookUrl,
            events: events || [],
            secretToken,
            isActive: true
        });
        
        res.json({
            success: true,
            message: 'Webhook configured successfully',
            webhook: {
                webhookUrl: webhook.webhookUrl,
                events: webhook.events,
                secretToken // Only shown once
            }
        });
    } catch (error) {
        console.error('Save webhook error:', error);
        res.status(500).json({ error: 'Failed to save webhook' });
    }
});

// ============================================
// SUBDOMAIN CHECK ROUTE
// ============================================

router.get('/subdomain/check', (req, res) => {
    try {
        const { subdomain } = req.query;
        
        if (!subdomain) {
            return res.status(400).json({ error: 'Subdomain is required' });
        }
        
        const available = db.checkSubdomainAvailability(subdomain);
        
        res.json({
            success: true,
            available,
            message: available ? 'Subdomain is available' : 'Subdomain is already taken'
        });
    } catch (error) {
        console.error('Subdomain check error:', error);
        res.status(500).json({ error: 'Failed to check subdomain' });
    }
});

// ============================================
// TENANT CONFIG ROUTE (for multi-tenant routing)
// ============================================

router.get('/tenant/config', (req, res) => {
    try {
        const { tenantId, domain } = req.query;
        
        let client = null;
        if (tenantId) {
            // Try subdomain first
            client = db.getClientBySubdomain(tenantId);
            if (!client) {
                client = db.getClientById(tenantId);
            }
        } else if (domain) {
            client = db.getClientByCustomDomain(domain);
        }
        
        if (!client) {
            return res.status(404).json({ error: 'Tenant not found' });
        }
        
        const branding = db.getBranding(client.id);
        
        res.json({
            tenantId: client.id,
            companyName: client.companyName,
            subdomain: client.subdomain,
            customDomain: client.customDomain,
            status: client.status,
            logo: branding?.logo || {
                full: '/default-logo.png',
                small: '/default-logo-small.png',
                favicon: '/default-favicon.ico',
                loginBg: null,
                emailLogo: null,
                pdfLogo: null,
                heroImage: null,
                ogImage: null
            },
            colors: branding?.colors || {
                primary: '#635bff',
                secondary: '#7c3aed',
                success: '#10b981',
                danger: '#ef4444',
                bg: '#ffffff',
                cardBg: '#f9fafb',
                textPrimary: '#1f2937',
                textSecondary: '#6b7280'
            },
            fonts: branding?.fonts || {
                primary: 'Inter',
                heading: 'Plus Jakarta Sans',
                googleFontsUrl: ''
            },
            general: branding?.general || {},
            email: branding?.email || {},
            advanced: branding?.advanced || {}
        });
    } catch (error) {
        console.error('Tenant config error:', error);
        res.status(500).json({ error: 'Failed to fetch tenant config' });
    }
});

module.exports = router;
