const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const formData = require('form-data');
const Mailgun = require('mailgun.js');
const axios = require('axios');
const path = require('path');
require('dotenv').config();

// Stripe Configuration
// IMPORTANT: Stripe key MUST be set in environment variables for security
// NEVER hardcode secret keys in source code - they will be exposed if code is public
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
if (!STRIPE_SECRET_KEY) {
  console.error('❌ ERROR: STRIPE_SECRET_KEY environment variable is not set!');
  console.error('⚠️  Please set STRIPE_SECRET_KEY in your environment variables (e.g., Render dashboard).');
} else {
  console.log('✅ Using STRIPE_SECRET_KEY from environment variable');
}
const stripe = STRIPE_SECRET_KEY ? require('stripe')(STRIPE_SECRET_KEY) : null;

const app = express();
const PORT = process.env.PORT || 3000;
const FUEL_PRICE_CACHE_TTL = parseInt(process.env.FUEL_PRICE_CACHE_TTL || '900000', 10);

let cachedFuelPrice = null;

// Middleware
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    // Allow localhost and 127.0.0.1 on any port
    if (origin.match(/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/)) {
      return callback(null, true);
    }
    // Allow alphafreight domains
    if (origin.includes('alphafreight') || origin.includes('alphabrokrage')) {
      return callback(null, true);
    }
    callback(null, true); // Allow all for development
  },
  credentials: true
}));
app.use(express.json());

// In-memory OTP storage (in production, use Redis or database)
const otpStore = {};

// Email service configuration
// Priority: Mailgun API > SendGrid API > SMTP
let emailService = 'smtp'; // 'mailgun', 'sendgrid', or 'smtp'

// Initialize Mailgun if API key is provided
let mailgun;
if (process.env.MAILGUN_API_KEY && process.env.MAILGUN_DOMAIN) {
  emailService = 'mailgun';
  const mailgunClient = new Mailgun(formData);
  mailgun = mailgunClient.client({
    username: 'api',
    key: process.env.MAILGUN_API_KEY
  });
}

// Initialize SMTP transporter (fallback)
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASSWORD || '' // Use App Password for Gmail
  }
});

// Generate 6-digit OTP
function generateOTP() {
  return crypto.randomInt(100000, 999999).toString();
}

// Email HTML Template
function getOTPEmailHTML(otp) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h2 style="color: white; margin: 0;">Alpha Freight</h2>
      </div>
      <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
        <h3 style="color: #333; margin-top: 0;">Email Verification</h3>
        <p style="color: #666; font-size: 16px;">Your OTP for email verification is:</p>
        <div style="background: white; border: 2px dashed #667eea; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
          <h1 style="color: #667eea; font-size: 42px; letter-spacing: 8px; margin: 0; font-weight: bold;">${otp}</h1>
        </div>
        <p style="color: #666; font-size: 14px;">This OTP will expire in <strong>10 minutes</strong>.</p>
        <p style="color: #999; font-size: 12px; margin-top: 30px;">If you didn't request this OTP, please ignore this email.</p>
      </div>
      <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
        <p>&copy; ${new Date().getFullYear()} Alpha Freight. All rights reserved.</p>
      </div>
    </div>
  `;
}

function normalizeFuelPricePayload(payload = {}) {
  const response = {
    success: true,
    provider: payload.provider || payload.source || 'CollectAPI',
    currency: 'GBP',
    pricePerLitre: null,
    petrolType: 'petrol',
    priceUnit: 'per_litre',
    fetchedAt: new Date().toISOString(),
    raw: payload
  };

  const candidate = Array.isArray(payload.result)
    ? payload.result[0]
    : payload.result || payload.data || payload;

  if (!candidate) {
    throw new Error('Fuel provider response missing payload.');
  }

  const priceKey = ['gasoline', 'petrol', 'pricePerLitre', 'price', 'petrolPrice'].find(
    (key) => candidate[key] !== undefined
  );

  let priceValue = candidate.pricePerLitre || (priceKey ? candidate[priceKey] : undefined);
  if (typeof priceValue === 'string') {
    priceValue = priceValue.replace(',', '.');
  }

  const parsedPrice = parseFloat(priceValue);
  if (!Number.isFinite(parsedPrice)) {
    throw new Error('Fuel provider returned invalid petrol price.');
  }

  response.pricePerLitre = parsedPrice;
  response.currency = candidate.currency || payload.currency || 'GBP';
  response.petrolType = candidate.fuelType || candidate.fuel || 'petrol';
  response.updatedAt = candidate.date || candidate.updatedAt || payload.date || response.fetchedAt;

  return response;
}

// Send OTP Email
async function sendOTPEmail(email, otp) {
  const emailHTML = getOTPEmailHTML(otp);
  const fromEmail = process.env.MAILGUN_FROM_EMAIL || process.env.SMTP_USER || 'noreply@alphabrokrage.co.uk';
  const fromName = 'Alpha Freight';

  // Use Mailgun if configured
  if (emailService === 'mailgun' && mailgun && process.env.MAILGUN_DOMAIN) {
    try {
      const messageData = {
        from: `"${fromName}" <${fromEmail}>`,
        to: email,
        subject: 'Email Verification OTP - Alpha Freight',
        html: emailHTML
      };

      const response = await mailgun.messages.create(process.env.MAILGUN_DOMAIN, messageData);
      console.log('Email sent via Mailgun:', response.id);
      return { success: true, messageId: response.id };
    } catch (error) {
      console.error('Error sending email via Mailgun:', error);
      return { success: false, error: error.message };
    }
  }

  // Fallback to SMTP
  const mailOptions = {
    from: `"${fromName}" <${fromEmail}>`,
    to: email,
    subject: 'Email Verification OTP - Alpha Freight',
    html: emailHTML
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent via SMTP:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending email via SMTP:', error);
    return { success: false, error: error.message };
  }
}

// API Routes

// Create Stripe payment intent (Simplified & Working)
app.post('/api/create-payment-intent', async (req, res) => {
  try {
    // Check if Stripe is configured
    if (!stripe) {
      return res.status(500).json({
        error: { message: 'Stripe is not configured. Please set STRIPE_SECRET_KEY environment variable.' }
      });
    }
    
    const {
      amount,
      currency = 'gbp',
      loadId = '',
      paymentFor = '',
      paymentType = ''
    } = req.body || {};

    const parsedAmount = Number(amount);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({
        error: { message: 'Invalid payment amount.' }
      });
    }

    // Simple payment intent creation (Stripe handles payment methods automatically)
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(parsedAmount),
      currency: currency,
      automatic_payment_methods: { enabled: true },
      metadata: {
        loadId: loadId || '',
        paymentFor: paymentFor || '',
        paymentType: paymentType || ''
      }
    });

    return res.status(200).json({
      clientSecret: paymentIntent.client_secret,
      status: paymentIntent.status
    });
  } catch (error) {
    console.error('Stripe payment intent error:', error);
    return res.status(500).json({
      error: { message: error.message || 'Payment failed.' }
    });
  }
});

// Send OTP
app.post('/api/send-otp', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, error: 'Email is required' });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ success: false, error: 'Invalid email format' });
    }

    // Generate OTP
    const otp = generateOTP();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

    // Store OTP
    otpStore[email] = {
      otp,
      expiresAt,
      verified: false,
      attempts: 0
    };

    // Send email
    const emailResult = await sendOTPEmail(email, otp);

    if (!emailResult.success) {
      delete otpStore[email];
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to send email. Please check SMTP configuration.' 
      });
    }

    res.json({ 
      success: true, 
      message: 'OTP sent successfully',
      expiresIn: 10 * 60 * 1000 // 10 minutes in milliseconds
    });

  } catch (error) {
    console.error('Error in send-otp:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Verify OTP
app.post('/api/verify-otp', (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ success: false, error: 'Email and OTP are required' });
    }

    const storedOTP = otpStore[email];

    if (!storedOTP) {
      return res.status(404).json({ success: false, error: 'OTP not found. Please request a new OTP.' });
    }

    // Check if expired
    if (Date.now() > storedOTP.expiresAt) {
      delete otpStore[email];
      return res.status(400).json({ success: false, error: 'OTP has expired. Please request a new one.' });
    }

    // Check attempts (max 5 attempts)
    if (storedOTP.attempts >= 5) {
      delete otpStore[email];
      return res.status(429).json({ success: false, error: 'Too many attempts. Please request a new OTP.' });
    }

    // Verify OTP
    if (storedOTP.otp !== otp) {
      storedOTP.attempts++;
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid OTP',
        attemptsLeft: 5 - storedOTP.attempts
      });
    }

    // Mark as verified
    storedOTP.verified = true;

    res.json({ 
      success: true, 
      message: 'Email verified successfully' 
    });

    // Clean up after 5 minutes
    setTimeout(() => {
      delete otpStore[email];
    }, 5 * 60 * 1000);

  } catch (error) {
    console.error('Error in verify-otp:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Check if email is verified
app.post('/api/check-verification', (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, error: 'Email is required' });
    }

    const storedOTP = otpStore[email];

    if (!storedOTP) {
      return res.json({ verified: false, message: 'No OTP found for this email' });
    }

    if (storedOTP.verified) {
      return res.json({ verified: true, message: 'Email is verified' });
    }

    res.json({ verified: false, message: 'Email not verified yet' });

  } catch (error) {
    console.error('Error in check-verification:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Fuel price proxy (keeps API keys server-side)
app.get('/api/fuel-price', async (req, res) => {
  try {
    if (cachedFuelPrice && cachedFuelPrice.expiresAt > Date.now() && req.query.force !== 'true') {
      return res.json(cachedFuelPrice.data);
    }

    if (!process.env.FUEL_PRICE_API_URL) {
      return res.status(500).json({
        success: false,
        error: 'FUEL_PRICE_API_URL is not configured on the server.'
      });
    }

    const axiosConfig = {
      method: process.env.FUEL_PRICE_API_METHOD || 'get',
      url: process.env.FUEL_PRICE_API_URL,
      headers: {}
    };

    if (process.env.FUEL_PRICE_API_KEY) {
      const headerName = process.env.FUEL_PRICE_API_HEADER || 'authorization';
      const prefix = process.env.FUEL_PRICE_API_PREFIX || 'apikey ';
      axiosConfig.headers[headerName] = `${prefix}${process.env.FUEL_PRICE_API_KEY}`;
    }

    if (process.env.FUEL_PRICE_API_HOST) {
      axiosConfig.headers['x-rapidapi-host'] = process.env.FUEL_PRICE_API_HOST;
    }

    const response = await axios(axiosConfig);
    const normalized = normalizeFuelPricePayload(response.data);

    cachedFuelPrice = {
      expiresAt: Date.now() + FUEL_PRICE_CACHE_TTL,
      data: normalized
    };

    res.json(normalized);
  } catch (error) {
    console.error('Fuel price API error:', error.response?.data || error.message);
    res.status(500).json({
      success: false,
      error: 'Unable to fetch fuel price at the moment.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Alpha Freight OTP API is running',
    timestamp: new Date().toISOString()
  });
});

// White Label System Routes
try {
  const whiteLabelRoutes = require('./server/white-label/routes');
  const whiteLabelStripeRoutes = require('./server/white-label/stripe-routes');
  
  app.use('/api/white-label', whiteLabelRoutes);
  app.use('/api/white-label', whiteLabelStripeRoutes);
  
  console.log('✅ White Label API routes loaded');
} catch (error) {
  console.error('⚠️  White Label routes not loaded:', error.message);
}

// Serve static files (HTML, CSS, JS, images, etc.)
const staticPath = path.join(__dirname, '..');
app.use(express.static(staticPath));

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Alpha Freight Server running on port ${PORT}`);
  console.log(`📧 Email Service: ${emailService.toUpperCase()}`);
  
  if (emailService === 'mailgun') {
    console.log(`📧 Mailgun Domain: ${process.env.MAILGUN_DOMAIN || 'Not configured'}`);
  } else {
    console.log(`📧 SMTP configured for: ${process.env.SMTP_USER || 'Not configured'}`);
  }
  
  // Stripe configuration status
  if (stripe) {
    console.log(`💳 Stripe: ✅ Configured`);
  } else {
    console.log(`💳 Stripe: ❌ Not configured - Check STRIPE_SECRET_KEY in environment variables`);
  }
  
  console.log(`\n📁 Serving static files from: ${staticPath}`);
  console.log(`\nAvailable endpoints:`);
  console.log(`  POST /api/send-otp`);
  console.log(`  POST /api/verify-otp`);
  console.log(`  POST /api/check-verification`);
  console.log(`  POST /api/create-payment-intent ${stripe ? '✅' : '❌'}`);
  console.log(`  GET  /api/health`);
  console.log(`  GET  /api/fuel-price`);
  console.log(`\nWhite Label API endpoints:`);
  console.log(`  POST /api/white-label/auth/register`);
  console.log(`  POST /api/white-label/auth/login`);
  console.log(`  GET  /api/white-label/auth/verify`);
  console.log(`  GET  /api/white-label/dashboard/stats`);
  console.log(`  GET  /api/white-label/branding`);
  console.log(`  POST /api/white-label/branding`);
  console.log(`  GET  /api/white-label/api/key`);
  console.log(`  POST /api/white-label/api/key/regenerate`);
  console.log(`  GET  /api/white-label/webhook`);
  console.log(`  POST /api/white-label/webhook`);
  console.log(`  GET  /api/white-label/subdomain/check`);
  console.log(`  GET  /api/white-label/tenant/config`);
  console.log(`  POST /api/white-label/payments/create-intent`);
  console.log(`  POST /api/white-label/payments/confirm`);
  console.log(`  GET  /api/white-label/payments/history`);
  console.log(`  POST /api/white-label/stripe/webhook`);
  console.log(`\n🌐 Open in browser:`);
  console.log(`  http://localhost:${PORT}/index.html`);
  console.log(`  http://localhost:${PORT}/pages/white-label/signup.html\n`);
});
