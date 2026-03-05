/**
 * White Label System - Stripe Payment Routes
 */

const express = require('express');
const router = express.Router();
const db = require('./database');
const auth = require('./auth');

// Stripe setup fee amounts (in pence)
const SETUP_FEES = {
    starter: 300000,    // £3,000
    pro: 500000,       // £5,000
    enterprise: 1000000 // £10,000
};

// Monthly subscription prices (in pence)
const MONTHLY_PRICES = {
    starter: 50000,    // £500/month
    pro: 100000,      // £1,000/month
    enterprise: 200000 // £2,000/month
};

// Create PaymentIntent for setup fee
router.post('/payments/create-intent', async (req, res) => {
    try {
        const { amount, currency = 'gbp', tenantId, planType } = req.body;
        
        if (!amount && !planType) {
            return res.status(400).json({ error: 'Amount or planType is required' });
        }
        
        const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
        if (!stripe) {
            return res.status(500).json({ error: 'Stripe not configured' });
        }
        
        const paymentAmount = amount || SETUP_FEES[planType] || 500000;
        
        // Get or create Stripe customer
        let client = null;
        let customerId = null;
        
        if (tenantId) {
            client = db.getClientById(tenantId);
            if (client && client.stripeCustomerId) {
                customerId = client.stripeCustomerId;
            } else if (client) {
                // Create new Stripe customer
                const customer = await stripe.customers.create({
                    email: client.email || 'client@example.com',
                    name: client.companyName,
                    metadata: {
                        clientId: client.id,
                        planType: client.planType
                    }
                });
                
                customerId = customer.id;
                db.updateClient(client.id, { stripeCustomerId: customerId });
            }
        }
        
        // Create PaymentIntent
        const paymentIntent = await stripe.paymentIntents.create({
            amount: paymentAmount,
            currency: currency,
            customer: customerId,
            metadata: {
                tenantId: tenantId || '',
                planType: planType || '',
                type: 'setup_fee'
            },
            automatic_payment_methods: {
                enabled: true
            }
        });
        
        res.json({
            success: true,
            clientSecret: paymentIntent.client_secret,
            paymentIntentId: paymentIntent.id,
            amount: paymentAmount
        });
    } catch (error) {
        console.error('Create payment intent error:', error);
        res.status(500).json({ error: error.message || 'Failed to create payment intent' });
    }
});

// Confirm payment and activate account
router.post('/payments/confirm', async (req, res) => {
    try {
        const { paymentIntentId, tenantId } = req.body;
        
        if (!paymentIntentId) {
            return res.status(400).json({ error: 'PaymentIntent ID is required' });
        }
        
        const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
        
        if (paymentIntent.status !== 'succeeded') {
            return res.status(400).json({ error: 'Payment not completed' });
        }
        
        // Activate client account
        if (tenantId) {
            const client = db.getClientById(tenantId);
            if (client) {
                // Update client status to active
                db.updateClient(client.id, { status: 'active' });
                
                // Create subscription for monthly billing
                try {
                    const customerId = client.stripeCustomerId || paymentIntent.customer;
                    
                    if (customerId && paymentIntent.metadata.planType) {
                        // Get price ID from environment or use amount
                        const monthlyAmount = MONTHLY_PRICES[paymentIntent.metadata.planType] || 100000;
                        
                        // Create subscription
                        const subscription = await stripe.subscriptions.create({
                            customer: customerId,
                            items: [{
                                price_data: {
                                    currency: 'gbp',
                                    product_data: {
                                        name: `${paymentIntent.metadata.planType.charAt(0).toUpperCase() + paymentIntent.metadata.planType.slice(1)} Plan - Monthly`,
                                    },
                                    unit_amount: monthlyAmount,
                                    recurring: {
                                        interval: 'month'
                                    }
                                }
                            }],
                            metadata: {
                                clientId: client.id,
                                planType: paymentIntent.metadata.planType
                            }
                        });
                        
                        db.updateClient(client.id, {
                            stripeSubscriptionId: subscription.id,
                            status: 'active'
                        });
                    }
                } catch (subError) {
                    console.error('Subscription creation error:', subError);
                    // Continue even if subscription creation fails
                }
                
                // Create payment record
                db.createPayment(client.id, {
                    amount: paymentIntent.amount / 100, // Convert from pence
                    status: 'completed',
                    stripePaymentIntentId: paymentIntentId
                });
            }
        }
        
        res.json({
            success: true,
            message: 'Payment confirmed and account activated',
            paymentIntent: {
                id: paymentIntent.id,
                status: paymentIntent.status,
                amount: paymentIntent.amount
            }
        });
    } catch (error) {
        console.error('Confirm payment error:', error);
        res.status(500).json({ error: error.message || 'Failed to confirm payment' });
    }
});

// Get payment history
router.get('/payments/history', auth.authenticateClient, (req, res) => {
    try {
        const payments = db.getPaymentsByClientId(req.clientId);
        
        res.json({
            success: true,
            payments: payments.map(p => ({
                id: p.id,
                amount: p.amount,
                status: p.status,
                loadId: p.loadId,
                carrierId: p.carrierId,
                createdAt: p.createdAt
            }))
        });
    } catch (error) {
        console.error('Get payment history error:', error);
        res.status(500).json({ error: 'Failed to fetch payment history' });
    }
});

// Stripe webhook handler
router.post('/stripe/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
    try {
        const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
        const sig = req.headers['stripe-signature'];
        const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
        
        if (!webhookSecret) {
            console.warn('Stripe webhook secret not configured');
            return res.status(400).send('Webhook secret not configured');
        }
        
        let event;
        try {
            event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
        } catch (err) {
            console.error('Webhook signature verification failed:', err.message);
            return res.status(400).send(`Webhook Error: ${err.message}`);
        }
        
        // Handle the event
        switch (event.type) {
            case 'payment_intent.succeeded':
                const paymentIntent = event.data.object;
                // Handle successful payment
                if (paymentIntent.metadata.tenantId) {
                    const client = db.getClientById(paymentIntent.metadata.tenantId);
                    if (client) {
                        db.updateClient(client.id, { status: 'active' });
                    }
                }
                break;
                
            case 'invoice.payment_succeeded':
                const invoice = event.data.object;
                // Handle successful subscription payment
                console.log('Subscription payment succeeded:', invoice.id);
                break;
                
            case 'invoice.payment_failed':
                const failedInvoice = event.data.object;
                // Handle failed payment
                if (failedInvoice.metadata.clientId) {
                    const client = db.getClientById(failedInvoice.metadata.clientId);
                    if (client) {
                        // Optionally suspend account after multiple failures
                        console.log('Payment failed for client:', client.id);
                    }
                }
                break;
                
            case 'customer.subscription.deleted':
                const subscription = event.data.object;
                // Handle subscription cancellation
                if (subscription.metadata.clientId) {
                    const client = db.getClientById(subscription.metadata.clientId);
                    if (client) {
                        db.updateClient(client.id, { status: 'cancelled' });
                    }
                }
                break;
                
            default:
                console.log(`Unhandled event type: ${event.type}`);
        }
        
        res.json({ received: true });
    } catch (error) {
        console.error('Webhook error:', error);
        res.status(500).json({ error: 'Webhook processing failed' });
    }
});

module.exports = router;
