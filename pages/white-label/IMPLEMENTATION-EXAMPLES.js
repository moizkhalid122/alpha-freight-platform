/**
 * White-Label Platform - Implementation Examples
 * 
 * This file contains ready-to-use code examples for backend integration.
 * Copy and adapt these functions to your backend framework.
 */

// ============================================
// 1. CLIENT AUTHENTICATION
// ============================================

async function loginClient(email, password) {
    // Example: Express.js route handler
    const user = await db.query(
        'SELECT * FROM client_users WHERE email = $1',
        [email]
    );

    if (!user.rows[0]) {
        throw new Error('Invalid credentials');
    }

    const isValid = await bcrypt.compare(password, user.rows[0].password_hash);
    if (!isValid) {
        throw new Error('Invalid credentials');
    }

    const token = jwt.sign(
        {
            clientId: user.rows[0].client_id,
            userId: user.rows[0].id,
            email: user.rows[0].email,
            type: 'client_admin'
        },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
    );

    return {
        token,
        user: {
            id: user.rows[0].id,
            email: user.rows[0].email,
            role: user.rows[0].role
        }
    };
}

// ============================================
// 2. GET CLIENT DASHBOARD STATS
// ============================================

async function getClientDashboardStats(clientId) {
    const stats = await db.query(`
        SELECT 
            total_loads,
            active_carriers,
            revenue_month,
            api_requests_month
        FROM client_statistics
        WHERE client_id = $1 
        AND month_year = TO_CHAR(CURRENT_DATE, 'YYYY-MM')
    `, [clientId]);

    // If no stats for current month, get from last month or return defaults
    if (stats.rows.length === 0) {
        return {
            totalLoads: 0,
            activeCarriers: 0,
            revenue: '£0',
            apiRequests: 0
        };
    }

    const data = stats.rows[0];
    return {
        totalLoads: data.total_loads || 0,
        activeCarriers: data.active_carriers || 0,
        revenue: `£${(data.revenue_month || 0).toLocaleString()}`,
        apiRequests: data.api_requests_month || 0
    };
}

// ============================================
// 3. SAVE BRANDING CONFIGURATION
// ============================================

async function saveBrandingConfig(clientId, brandingData) {
    const {
        logo,
        primaryColor,
        fontFamily,
        domainType,
        subdomain,
        customDomain
    } = brandingData;

    // Update branding in database
    await db.query(`
        INSERT INTO client_branding (client_id, logo_url, primary_color, font_family)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (client_id) 
        DO UPDATE SET
            logo_url = $2,
            primary_color = $3,
            font_family = $4,
            updated_at = CURRENT_TIMESTAMP
    `, [clientId, logo, primaryColor, fontFamily]);

    // Update domain settings in clients table
    if (domainType === 'custom' && customDomain) {
        await db.query(`
            UPDATE clients
            SET custom_domain = $1, updated_at = CURRENT_TIMESTAMP
            WHERE id = $2
        `, [customDomain, clientId]);
    } else if (domainType === 'subdomain' && subdomain) {
        await db.query(`
            UPDATE clients
            SET subdomain = $1, updated_at = CURRENT_TIMESTAMP
            WHERE id = $2
        `, [subdomain, clientId]);
    }

    // Also save to Firebase for real-time updates
    await saveToFirebase(clientId, 'branding', {
        logo,
        primaryColor,
        fontFamily,
        domainType,
        subdomain,
        customDomain
    });

    return { success: true };
}

// ============================================
// 4. GENERATE API KEY
// ============================================

async function generateApiKey(clientId) {
    // Generate secure random API key
    const apiKey = 'sk_live_' + crypto.randomBytes(32).toString('hex');
    const apiSecret = crypto.randomBytes(32).toString('hex');

    // Hash the API key for storage
    const hashedKey = await bcrypt.hash(apiKey, 10);
    const hashedSecret = await bcrypt.hash(apiSecret, 10);

    // Deactivate old keys
    await db.query(`
        UPDATE client_api_keys
        SET is_active = false
        WHERE client_id = $1
    `, [clientId]);

    // Insert new key
    await db.query(`
        INSERT INTO client_api_keys (client_id, api_key, api_secret)
        VALUES ($1, $2, $3)
    `, [clientId, hashedKey, hashedSecret]);

    // Return plain text key (only shown once)
    return {
        apiKey,
        apiSecret,
        message: 'Save this key securely. It will not be shown again.'
    };
}

// ============================================
// 5. VERIFY API KEY (for API requests)
// ============================================

async function verifyApiKey(apiKey) {
    // Get all active API keys for comparison
    const keys = await db.query(`
        SELECT cak.*, c.id as client_id, c.status as client_status
        FROM client_api_keys cak
        JOIN clients c ON cak.client_id = c.id
        WHERE cak.is_active = true AND c.status = 'active'
    `);

    for (const keyRecord of keys.rows) {
        const isValid = await bcrypt.compare(apiKey, keyRecord.api_key);
        if (isValid) {
            // Update last used timestamp
            await db.query(`
                UPDATE client_api_keys
                SET last_used_at = CURRENT_TIMESTAMP
                WHERE id = $1
            `, [keyRecord.id]);

            // Increment API request counter
            await incrementApiRequestCount(keyRecord.client_id);

            return {
                valid: true,
                clientId: keyRecord.client_id
            };
        }
    }

    return { valid: false };
}

// ============================================
// 6. SAVE WEBHOOK CONFIGURATION
// ============================================

async function saveWebhookConfig(clientId, webhookUrl, events) {
    // Generate webhook secret
    const secretToken = crypto.randomBytes(32).toString('hex');

    await db.query(`
        INSERT INTO client_webhooks (client_id, webhook_url, events, secret_token)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (client_id)
        DO UPDATE SET
            webhook_url = $2,
            events = $3,
            secret_token = $4,
            updated_at = CURRENT_TIMESTAMP
    `, [clientId, webhookUrl, events, secretToken]);

    return { success: true, secretToken };
}

// ============================================
// 7. SEND WEBHOOK EVENT
// ============================================

async function sendWebhookEvent(clientId, eventType, eventData) {
    const webhook = await db.query(`
        SELECT * FROM client_webhooks
        WHERE client_id = $1 AND is_active = true
    `, [clientId]);

    if (webhook.rows.length === 0) {
        return; // No webhook configured
    }

    const config = webhook.rows[0];

    // Check if client subscribed to this event
    if (!config.events.includes(eventType)) {
        return; // Not subscribed to this event
    }

    const payload = {
        event: eventType,
        data: eventData,
        timestamp: new Date().toISOString()
    };

    // Generate signature
    const signature = crypto
        .createHmac('sha256', config.secret_token)
        .update(JSON.stringify(payload))
        .digest('hex');

    try {
        const response = await axios.post(config.webhook_url, payload, {
            headers: {
                'X-Webhook-Signature': signature,
                'X-Webhook-Event': eventType,
                'Content-Type': 'application/json'
            },
            timeout: 10000
        });

        // Log successful delivery
        await logWebhookDelivery(clientId, eventType, true);
    } catch (error) {
        // Log failed delivery
        await logWebhookDelivery(clientId, eventType, false, error.message);
        console.error(`Webhook delivery failed:`, error);
    }
}

// ============================================
// 8. SUBDOMAIN ROUTING MIDDLEWARE
// ============================================

function subdomainRoutingMiddleware(req, res, next) {
    const hostname = req.hostname;
    const parts = hostname.split('.');

    // Extract subdomain (e.g., 'client' from 'client.alphafreightuk.com')
    if (parts.length >= 3) {
        const subdomain = parts[0];
        
        // Skip common subdomains
        if (!['www', 'api', 'admin'].includes(subdomain)) {
            req.subdomain = subdomain;
        }
    }

    // Check for custom domain
    if (hostname !== 'alphafreightuk.com' && !hostname.includes('alphafreightuk.com')) {
        req.customDomain = hostname;
    }

    next();
}

// ============================================
// 9. GET CLIENT FROM REQUEST
// ============================================

async function getClientFromRequest(req) {
    let client;

    if (req.subdomain) {
        client = await db.query(
            'SELECT * FROM clients WHERE subdomain = $1 AND status = $2',
            [req.subdomain, 'active']
        );
    } else if (req.customDomain) {
        client = await db.query(
            'SELECT * FROM clients WHERE custom_domain = $1 AND status = $2',
            [req.customDomain, 'active']
        );
    }

    if (client && client.rows.length > 0) {
        return client.rows[0];
    }

    return null;
}

// ============================================
// 10. STRIPE SUBSCRIPTION CREATION
// ============================================

async function createClientSubscription(clientId, planType, paymentMethodId) {
    const client = await db.query('SELECT * FROM clients WHERE id = $1', [clientId]);
    const clientData = client.rows[0];

    // Create or get Stripe customer
    let stripeCustomer;
    if (clientData.stripe_customer_id) {
        stripeCustomer = await stripe.customers.retrieve(clientData.stripe_customer_id);
    } else {
        stripeCustomer = await stripe.customers.create({
            email: clientData.email,
            name: clientData.company_name,
            metadata: { clientId: clientId }
        });

        // Save Stripe customer ID
        await db.query(
            'UPDATE clients SET stripe_customer_id = $1 WHERE id = $2',
            [stripeCustomer.id, clientId]
        );
    }

    // Attach payment method
    await stripe.paymentMethods.attach(paymentMethodId, {
        customer: stripeCustomer.id
    });

    // Set as default
    await stripe.customers.update(stripeCustomer.id, {
        invoice_settings: {
            default_payment_method: paymentMethodId
        }
    });

    // Price IDs from Stripe dashboard
    const priceMap = {
        'starter': process.env.STRIPE_STARTER_PRICE_ID,
        'pro': process.env.STRIPE_PRO_PRICE_ID,
        'enterprise': process.env.STRIPE_ENTERPRISE_PRICE_ID
    };

    // Create subscription
    const subscription = await stripe.subscriptions.create({
        customer: stripeCustomer.id,
        items: [{ price: priceMap[planType] }],
        expand: ['latest_invoice.payment_intent']
    });

    // Create setup fee invoice
    const setupFeeMap = {
        'starter': 300000,    // £3,000 in pence
        'pro': 500000,       // £5,000 in pence
        'enterprise': 1000000 // £10,000 in pence
    };

    const invoice = await stripe.invoices.create({
        customer: stripeCustomer.id,
        auto_advance: true
    });

    await stripe.invoiceItems.create({
        customer: stripeCustomer.id,
        invoice: invoice.id,
        amount: setupFeeMap[planType],
        currency: 'gbp',
        description: `${planType.charAt(0).toUpperCase() + planType.slice(1)} Plan Setup Fee`
    });

    await stripe.invoices.finalizeInvoice(invoice.id);
    await stripe.invoices.pay(invoice.id);

    // Save subscription ID
    await db.query(
        'UPDATE clients SET stripe_subscription_id = $1 WHERE id = $2',
        [subscription.id, clientId]
    );

    return {
        subscriptionId: subscription.id,
        invoiceId: invoice.id,
        clientSecret: subscription.latest_invoice.payment_intent.client_secret
    };
}

// ============================================
// 11. HELPER FUNCTIONS
// ============================================

async function incrementApiRequestCount(clientId) {
    const monthYear = new Date().toISOString().slice(0, 7); // YYYY-MM
    
    await db.query(`
        INSERT INTO client_statistics (client_id, api_requests_month, month_year)
        VALUES ($1, 1, $2)
        ON CONFLICT (client_id, month_year)
        DO UPDATE SET
            api_requests_month = client_statistics.api_requests_month + 1,
            updated_at = CURRENT_TIMESTAMP
    `, [clientId, monthYear]);
}

async function logWebhookDelivery(clientId, eventType, success, errorMessage = null) {
    await db.query(`
        INSERT INTO webhook_delivery_logs (client_id, event_type, success, error_message)
        VALUES ($1, $2, $3, $4)
    `, [clientId, eventType, success, errorMessage]);
}

async function saveToFirebase(clientId, collection, data) {
    // Firebase Admin SDK example
    const db = admin.firestore();
    await db.collection('clients').doc(clientId).set({
        [collection]: data,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
}

// ============================================
// EXPORT FUNCTIONS (Node.js)
// ============================================

module.exports = {
    loginClient,
    getClientDashboardStats,
    saveBrandingConfig,
    generateApiKey,
    verifyApiKey,
    saveWebhookConfig,
    sendWebhookEvent,
    subdomainRoutingMiddleware,
    getClientFromRequest,
    createClientSubscription
};
