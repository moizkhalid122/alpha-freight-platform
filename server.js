const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const formData = require('form-data');
const Mailgun = require('mailgun.js');
const axios = require('axios');
const path = require('path');
const fs = require('fs');
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

app.get('/pages/white-label/tenant-index.html', (req, res) => {
  try {
    return res.sendFile(path.join(__dirname, 'pages', 'white-label', 'tenant-index.html'));
    res.setHeader('X-WL-Tenant-Index', 'dynamic');
    const indexPath = path.join(__dirname, 'index.html');
    let html = fs.readFileSync(indexPath, 'utf8');

    const baseTag = '<base href="/" />';
    if (!html.includes('<base') && html.includes('<head>')) {
      html = html.replace('<head>', `<head>\n    ${baseTag}`);
    }

    const injected = `
    <script>
      (function () {
        function detectTenant() {
          try {
            const params = new URLSearchParams(window.location.search);
            const qpTenantId = params.get('tenantId') || params.get('tenant') || '';
            const qpDomain = params.get('domain') || '';

            if (qpTenantId || qpDomain) {
              return { tenantId: qpTenantId || null, domain: qpDomain || null };
            }

            const hostname = window.location.hostname;
            if (!hostname) return { tenantId: null, domain: null };

            const parts = hostname.split('.');
            if (parts.length >= 3 && parts[parts.length - 2] === 'alphafreightuk') {
              const sub = parts[0];
              if (sub && !['www', 'app', 'admin', 'api'].includes(sub)) {
                return { tenantId: sub, domain: null };
              }
            }

            if (parts.length === 2 || (parts.length === 3 && parts[0] === 'www')) {
              const domain = parts[0] === 'www' ? parts.slice(1).join('.') : hostname;
              return { tenantId: null, domain };
            }

            return { tenantId: null, domain: null };
          } catch (e) {
            return { tenantId: null, domain: null };
          }
        }

        function shiftColor(hex, amount) {
          const rgb = hexToRgb(hex);
          if (!rgb) return hex;
          const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
          const newL = clamp01(hsl.l + amount);
          const out = hslToRgb(hsl.h, hsl.s, newL);
          return rgbToHex(out.r, out.g, out.b);
        }

        function clamp01(n) { return Math.max(0, Math.min(1, n)); }
        function clamp255(n) { return Math.max(0, Math.min(255, Math.round(n))); }
        function hexToRgb(hex) {
          const normalized = (hex || '').replace('#', '').trim();
          if (normalized.length === 3) {
            const r = parseInt(normalized[0] + normalized[0], 16);
            const g = parseInt(normalized[1] + normalized[1], 16);
            const b = parseInt(normalized[2] + normalized[2], 16);
            return { r, g, b };
          }
          if (normalized.length !== 6) return null;
          const r = parseInt(normalized.slice(0, 2), 16);
          const g = parseInt(normalized.slice(2, 4), 16);
          const b = parseInt(normalized.slice(4, 6), 16);
          if ([r, g, b].some(n => Number.isNaN(n))) return null;
          return { r, g, b };
        }
        function rgbToHex(r, g, b) {
          const toHex = (n) => clamp255(n).toString(16).padStart(2, '0');
          return '#' + toHex(r) + toHex(g) + toHex(b);
        }
        function rgbToHsl(r, g, b) {
          const rn = r / 255, gn = g / 255, bn = b / 255;
          const max = Math.max(rn, gn, bn);
          const min = Math.min(rn, gn, bn);
          const d = max - min;
          let h = 0, s = 0;
          const l = (max + min) / 2;
          if (d !== 0) {
            s = d / (1 - Math.abs(2 * l - 1));
            switch (max) {
              case rn: h = ((gn - bn) / d) % 6; break;
              case gn: h = (bn - rn) / d + 2; break;
              case bn: h = (rn - gn) / d + 4; break;
            }
            h = h * 60;
            if (h < 0) h += 360;
          }
          return { h, s, l };
        }
        function hslToRgb(h, s, l) {
          const c = (1 - Math.abs(2 * l - 1)) * s;
          const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
          const m = l - c / 2;
          let r1 = 0, g1 = 0, b1 = 0;
          if (h >= 0 && h < 60) { r1 = c; g1 = x; b1 = 0; }
          else if (h >= 60 && h < 120) { r1 = x; g1 = c; b1 = 0; }
          else if (h >= 120 && h < 180) { r1 = 0; g1 = c; b1 = x; }
          else if (h >= 180 && h < 240) { r1 = 0; g1 = x; b1 = c; }
          else if (h >= 240 && h < 300) { r1 = x; g1 = 0; b1 = c; }
          else { r1 = c; g1 = 0; b1 = x; }
          return { r: (r1 + m) * 255, g: (g1 + m) * 255, b: (b1 + m) * 255 };
        }

        function ensureMeta(selector, attr, value) {
          let el = document.querySelector(selector);
          if (!el) {
            el = document.createElement('meta');
            const prop = selector.match(/property="([^"]+)"/)?.[1];
            const name = selector.match(/name="([^"]+)"/)?.[1];
            if (prop) el.setAttribute('property', prop);
            if (name) el.setAttribute('name', name);
            document.head.appendChild(el);
          }
          el.setAttribute(attr, value);
        }

        function applyTenantBranding(config) {
          if (!config) return;

          const root = document.documentElement;
          const primary = config.colors?.primary || '#1e3a8a';
          const secondary = config.colors?.secondary || '#635bff';
          const success = config.colors?.success || '#10b981';
          const danger = config.colors?.danger || '#ef4444';

          root.style.setProperty('--primary', primary);
          root.style.setProperty('--primary-dark', shiftColor(primary, -0.14));
          root.style.setProperty('--primary-light', shiftColor(primary, 0.22));
          root.style.setProperty('--accent', secondary);
          root.style.setProperty('--accent-hover', shiftColor(secondary, -0.10));
          root.style.setProperty('--success', success);
          root.style.setProperty('--danger', danger);

          if (config.colors?.bg) root.style.setProperty('--bg-white', config.colors.bg);
          if (config.colors?.cardBg) root.style.setProperty('--bg-gray', config.colors.cardBg);
          if (config.colors?.textPrimary) root.style.setProperty('--text-dark', config.colors.textPrimary);
          if (config.colors?.textSecondary) root.style.setProperty('--text-medium', config.colors.textSecondary);

          const title = (config.general?.siteTitle || '').trim();
          document.title = title || (config.companyName ? (config.companyName + ' - Freight Platform') : document.title);

          const desc = (config.general?.metaDescription || config.general?.tagline || '').trim();
          if (desc) {
            ensureMeta('meta[name="description"]', 'content', desc);
            ensureMeta('meta[property="og:description"]', 'content', desc);
            ensureMeta('meta[name="twitter:description"]', 'content', desc);
          }

          if (config.companyName || config.general?.productName) {
            const t = (config.general?.productName || config.companyName || '').trim();
            if (t) {
              ensureMeta('meta[property="og:title"]', 'content', t);
              ensureMeta('meta[name="twitter:title"]', 'content', t);
            }
          }

          if (config.logo?.ogImage) {
            ensureMeta('meta[property="og:image"]', 'content', config.logo.ogImage);
            ensureMeta('meta[name="twitter:image"]', 'content', config.logo.ogImage);
          }

          if (config.logo?.favicon) {
            const icons = Array.from(document.querySelectorAll('link[rel="icon"], link[rel="shortcut icon"], link[rel="apple-touch-icon"]'));
            icons.forEach(l => l.setAttribute('href', config.logo.favicon));
          }

          const headerLogoImg = document.querySelector('.header-logo img');
          if (headerLogoImg && config.logo?.full) {
            headerLogoImg.src = config.logo.full;
            headerLogoImg.alt = config.companyName || headerLogoImg.alt || 'Logo';
          }

          const footerLogoImg = document.querySelector('.footer-brand-logo img');
          if (footerLogoImg && config.logo?.full) {
            footerLogoImg.src = config.logo.full;
            footerLogoImg.alt = config.companyName || footerLogoImg.alt || 'Logo';
          }

          if (config.general?.productName) {
            const heroAccent = document.querySelector('.hero-title-accent');
            if (heroAccent) heroAccent.textContent = config.general.productName;
          }

          if (config.general?.tagline) {
            const heroSubtitle = document.querySelector('.hero-subtitle');
            if (heroSubtitle) heroSubtitle.textContent = config.general.tagline;
          }

          if (config.logo?.heroImage) {
            const heroImg = document.querySelector('.hero-graphic img');
            if (heroImg) heroImg.src = config.logo.heroImage;
          }

          const primaryBtn = document.querySelector('.btn-primary-custom');
          if (primaryBtn) {
            const label = (config.general?.primaryCtaLabel || '').trim();
            const url = (config.general?.primaryCtaUrl || '').trim();
            if (label) {
              const textNode = Array.from(primaryBtn.childNodes).find(n => n.nodeType === 3 && n.textContent.trim());
              if (textNode) textNode.textContent = label + ' ';
            }
            if (url) primaryBtn.setAttribute('href', url);
          }

          const secondaryBtn = document.querySelector('.btn-secondary-custom');
          if (secondaryBtn) {
            const label = (config.general?.secondaryCtaLabel || '').trim();
            const url = (config.general?.secondaryCtaUrl || '').trim();
            if (label) {
              const textNode = Array.from(secondaryBtn.childNodes).find(n => n.nodeType === 3 && n.textContent.trim());
              if (textNode) textNode.textContent = label + ' ';
            }
            if (url) secondaryBtn.setAttribute('href', url);
          }

          const footerText = (config.general?.footerDescription || '').trim();
          if (footerText) {
            const footerPara = document.querySelector('.footer-brand p');
            if (footerPara) footerPara.textContent = footerText;
          }

          const footerSocial = document.querySelector('.footer-social');
          if (footerSocial) {
            const setSocial = (key, iconClass, href) => {
              const trimmed = (href || '').trim();
              const existing = footerSocial.querySelector('a[data-wl-social="' + key + '"]');
              if (!trimmed) { if (existing) existing.remove(); return; }
              if (existing) { existing.setAttribute('href', trimmed); return; }
              const a = document.createElement('a');
              a.setAttribute('data-wl-social', key);
              a.setAttribute('href', trimmed);
              a.setAttribute('target', '_blank');
              a.setAttribute('rel', 'noopener noreferrer');
              const i = document.createElement('i');
              i.className = iconClass;
              a.appendChild(i);
              footerSocial.appendChild(a);
            };
            setSocial('linkedin', 'fab fa-linkedin', config.general?.socialLinkedIn);
            setSocial('facebook', 'fab fa-facebook', config.general?.socialFacebook);
            setSocial('x', 'fab fa-x-twitter', config.general?.socialX);
          }

          if (config.fonts?.googleFontsUrl) {
            const existing = document.getElementById('wl-google-fonts');
            if (existing) existing.remove();
            const link = document.createElement('link');
            link.id = 'wl-google-fonts';
            link.rel = 'stylesheet';
            link.href = config.fonts.googleFontsUrl;
            document.head.appendChild(link);
          }

          if (config.fonts?.primary) {
            document.body.style.fontFamily = config.fonts.primary + ', Inter, system-ui, sans-serif';
          }

          if (config.fonts?.heading) {
            const id = 'wl-tenant-heading-font';
            let styleTag = document.getElementById(id);
            if (!styleTag) {
              styleTag = document.createElement('style');
              styleTag.id = id;
              document.head.appendChild(styleTag);
            }
            styleTag.textContent = 'h1,h2,h3,h4,h5,h6{font-family:' + config.fonts.heading + \", 'Plus Jakarta Sans', Inter, system-ui, sans-serif;}\";
          }

          const css = (config.advanced?.customCSS || '').trim();
          if (css) {
            const id = 'wl-tenant-custom-css';
            let styleTag = document.getElementById(id);
            if (!styleTag) {
              styleTag = document.createElement('style');
              styleTag.id = id;
              document.head.appendChild(styleTag);
            }
            styleTag.textContent = css;
          }

          const js = (config.advanced?.customJS || '').trim();
          if (js) {
            const id = 'wl-tenant-custom-js';
            const old = document.getElementById(id);
            if (old) old.remove();
            const script = document.createElement('script');
            script.id = id;
            script.type = 'text/javascript';
            script.textContent = js;
            document.body.appendChild(script);
          }
        }

        function mergeConfigs(base, draft) {
          const merged = JSON.parse(JSON.stringify(base || {}));
          const d = draft || {};

          merged.companyName = d.companyName || merged.companyName;

          merged.general = { ...(merged.general || {}), ...(d.general || {}) };
          merged.colors = { ...(merged.colors || {}), ...(d.colors || {}) };
          merged.fonts = { ...(merged.fonts || {}), ...(d.fonts || {}) };
          merged.logo = { ...(merged.logo || {}), ...(d.logo || {}) };
          merged.advanced = { ...(merged.advanced || {}), ...(d.advanced || {}) };

          return merged;
        }

        function createCustomizerUI(state) {
          const styleId = 'wl-tenant-customizer-style';
          if (!document.getElementById(styleId)) {
            const style = document.createElement('style');
            style.id = styleId;
            style.textContent =
              '.wl-tenant-customize-btn{' +
              'position:fixed;right:18px;top:50%;transform:translateY(-50%);' +
              'z-index:99999;border:none;border-radius:999px;' +
              'padding:0.9rem 1.1rem;font-weight:900;cursor:pointer;' +
              'color:#fff;background:linear-gradient(135deg,var(--primary,#635bff) 0%,var(--primary-light,#8b5cf6) 100%);' +
              'box-shadow:0 14px 34px rgba(99,91,255,0.35);' +
              'display:inline-flex;align-items:center;gap:0.6rem;}' +
              '.wl-tenant-customizer-backdrop{' +
              'position:fixed;inset:0;z-index:99998;' +
              'background:rgba(15,23,42,0.35);backdrop-filter:blur(6px);' +
              'opacity:0;pointer-events:none;transition:opacity .2s ease;}' +
              '.wl-tenant-customizer-backdrop.open{opacity:1;pointer-events:auto;}' +
              '.wl-tenant-customizer-drawer{' +
              'position:fixed;top:0;right:0;height:100vh;width:min(460px,92vw);' +
              'z-index:100000;background:rgba(255,255,255,0.98);' +
              'backdrop-filter:blur(14px);border-left:1px solid rgba(226,232,240,0.92);' +
              'box-shadow:-18px 0 60px rgba(2,6,23,0.18);' +
              'transform:translateX(100%);transition:transform .25s ease;' +
              'display:flex;flex-direction:column;}' +
              '.wl-tenant-customizer-drawer.open{transform:translateX(0);}' +
              '.wl-tenant-customizer-header{' +
              'padding:1.25rem 1.25rem 1rem;border-bottom:1px solid rgba(226,232,240,0.92);' +
              'display:flex;align-items:center;justify-content:space-between;gap:1rem;}' +
              '.wl-tenant-customizer-title{margin:0;font-size:1.05rem;font-weight:900;color:#0f172a;}' +
              '.wl-tenant-customizer-close{' +
              'width:40px;height:40px;border-radius:12px;cursor:pointer;' +
              'border:1px solid rgba(226,232,240,0.92);background:rgba(248,250,252,0.9);' +
              'display:inline-flex;align-items:center;justify-content:center;color:#475569;}' +
              '.wl-tenant-customizer-body{padding:1rem 1.25rem 1.25rem;overflow:auto;}' +
              '.wl-tenant-section{' +
              'border:1px solid rgba(226,232,240,0.92);border-radius:16px;padding:1rem;' +
              'background:rgba(255,255,255,0.9);box-shadow:0 8px 20px rgba(2,6,23,0.06);' +
              'margin-bottom:1rem;}' +
              '.wl-tenant-section h3{margin:0 0 .9rem;font-size:.95rem;font-weight:900;color:#0f172a;}' +
              '.wl-tenant-field{margin-bottom:0.9rem;}' +
              '.wl-tenant-label{display:block;font-size:.85rem;font-weight:800;color:#334155;margin-bottom:.35rem;}' +
              '.wl-tenant-input,.wl-tenant-textarea{' +
              'width:100%;border:1px solid rgba(226,232,240,0.92);' +
              'border-radius:12px;padding:0.75rem 0.9rem;font-size:.95rem;' +
              'outline:none;background:#fff;color:#0f172a;}' +
              '.wl-tenant-textarea{min-height:110px;resize:vertical;font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,\\'Liberation Mono\\',\\'Courier New\\',monospace;}' +
              '.wl-tenant-row{display:grid;grid-template-columns:1fr 1fr;gap:0.75rem;}' +
              '.wl-tenant-actions{display:flex;gap:0.75rem;flex-wrap:wrap;margin-top:0.5rem;}' +
              '.wl-tenant-btn{' +
              'border-radius:12px;padding:0.75rem 1rem;font-weight:900;cursor:pointer;border:1px solid rgba(226,232,240,0.92);' +
              'background:#fff;color:#334155;}' +
              '.wl-tenant-btn.primary{border:none;color:#fff;background:linear-gradient(135deg,var(--primary,#635bff) 0%,var(--primary-light,#8b5cf6) 100%);}' +
              '.wl-tenant-btn.danger{background:#ef4444;border:none;color:#fff;}' +
              '@media (max-width: 640px){.wl-tenant-row{grid-template-columns:1fr;}}';
            document.head.appendChild(style);
          }

          if (document.getElementById('wlTenantCustomizeBtn')) return;

          const isOpen = () => document.getElementById('wlTenantCustomizerDrawer')?.classList.contains('open');
          const setOpen = (open) => {
            const drawer = document.getElementById('wlTenantCustomizerDrawer');
            const backdrop = document.getElementById('wlTenantCustomizerBackdrop');
            if (!drawer || !backdrop) return;
            drawer.classList.toggle('open', open);
            backdrop.classList.toggle('open', open);
          };

          const btn = document.createElement('button');
          btn.id = 'wlTenantCustomizeBtn';
          btn.className = 'wl-tenant-customize-btn';
          btn.type = 'button';
          btn.innerHTML = '<span style="font-size:1.05rem">⚙</span><span>Customize</span>';
          btn.addEventListener('click', () => setOpen(!isOpen()));

          const backdrop = document.createElement('div');
          backdrop.id = 'wlTenantCustomizerBackdrop';
          backdrop.className = 'wl-tenant-customizer-backdrop';
          backdrop.addEventListener('click', () => setOpen(false));

          const drawer = document.createElement('aside');
          drawer.id = 'wlTenantCustomizerDrawer';
          drawer.className = 'wl-tenant-customizer-drawer';
          drawer.setAttribute('aria-hidden', 'true');

          const header = document.createElement('div');
          header.className = 'wl-tenant-customizer-header';
          header.innerHTML = '<h2 class="wl-tenant-customizer-title">Customizer</h2><button class="wl-tenant-customizer-close" type="button" aria-label="Close">✕</button>';
          header.querySelector('button')?.addEventListener('click', () => setOpen(false));

          const body = document.createElement('div');
          body.className = 'wl-tenant-customizer-body';

          const sectionGeneral = document.createElement('div');
          sectionGeneral.className = 'wl-tenant-section';
          sectionGeneral.innerHTML =
            '<h3>General</h3>' +
            '<div class="wl-tenant-field"><label class="wl-tenant-label">Business Name</label><input class="wl-tenant-input" id="wlTBusinessName" type="text" placeholder="Your Company" /></div>' +
            '<div class="wl-tenant-field"><label class="wl-tenant-label">Product Name</label><input class="wl-tenant-input" id="wlTProductName" type="text" placeholder="Your Platform" /></div>' +
            '<div class="wl-tenant-field"><label class="wl-tenant-label">Tagline</label><input class="wl-tenant-input" id="wlTTagline" type="text" placeholder="Your tagline" /></div>' +
            '<div class="wl-tenant-row">' +
            '<div class="wl-tenant-field"><label class="wl-tenant-label">Primary Color</label><input class="wl-tenant-input" id="wlTPrimaryColor" type="color" style="height:48px;padding:0.4rem" /></div>' +
            '<div class="wl-tenant-field"><label class="wl-tenant-label">Secondary Color</label><input class="wl-tenant-input" id="wlTSecondaryColor" type="color" style="height:48px;padding:0.4rem" /></div>' +
            '</div>' +
            '<div class="wl-tenant-row">' +
            '<div class="wl-tenant-field"><label class="wl-tenant-label">Primary CTA Label</label><input class="wl-tenant-input" id="wlTCtaLabel" type="text" placeholder="Get Started" /></div>' +
            '<div class="wl-tenant-field"><label class="wl-tenant-label">Primary CTA URL</label><input class="wl-tenant-input" id="wlTCtaUrl" type="url" placeholder="https://yourdomain.com/signup" /></div>' +
            '</div>' +
            '<div class="wl-tenant-actions">' +
            '<button class="wl-tenant-btn" type="button" id="wlTUploadLogoBtn">Upload Logo</button>' +
            '<button class="wl-tenant-btn" type="button" id="wlTUploadFaviconBtn">Upload Favicon</button>' +
            '<button class="wl-tenant-btn" type="button" id="wlTUploadHeroBtn">Upload Hero</button>' +
            '</div>' +
            '<input id="wlTUploadLogo" type="file" accept="image/*" style="display:none" />' +
            '<input id="wlTUploadFavicon" type="file" accept="image/*" style="display:none" />' +
            '<input id="wlTUploadHero" type="file" accept="image/*" style="display:none" />';

          const sectionAdvanced = document.createElement('div');
          sectionAdvanced.className = 'wl-tenant-section';
          sectionAdvanced.innerHTML =
            '<h3>Advanced</h3>' +
            '<div class="wl-tenant-field"><label class="wl-tenant-label">Custom CSS</label><textarea class="wl-tenant-textarea" id="wlTCustomCSS" placeholder="/* Custom CSS */"></textarea></div>' +
            '<div class="wl-tenant-field"><label class="wl-tenant-label">Custom JS</label><textarea class="wl-tenant-textarea" id="wlTCustomJS" placeholder="// Custom JS"></textarea></div>' +
            '<div class="wl-tenant-actions">' +
            '<button class="wl-tenant-btn primary" type="button" id="wlTSaveDraft">Save</button>' +
            '<button class="wl-tenant-btn" type="button" id="wlTReloadDraft">Reload</button>' +
            '<button class="wl-tenant-btn danger" type="button" id="wlTResetDraft">Reset</button>' +
            '</div>';

          body.appendChild(sectionGeneral);
          body.appendChild(sectionAdvanced);

          drawer.appendChild(header);
          drawer.appendChild(body);

          document.body.appendChild(btn);
          document.body.appendChild(backdrop);
          document.body.appendChild(drawer);

          const setField = (id, value) => {
            const el = document.getElementById(id);
            if (!el) return;
            el.value = value || '';
          };

          const hydrate = () => {
            const current = mergeConfigs(state.baseConfig, state.draft);
            setField('wlTBusinessName', current.general?.businessName || current.companyName || '');
            setField('wlTProductName', current.general?.productName || '');
            setField('wlTTagline', current.general?.tagline || '');
            setField('wlTPrimaryColor', current.colors?.primary || '#635bff');
            setField('wlTSecondaryColor', current.colors?.secondary || '#7c3aed');
            setField('wlTCtaLabel', current.general?.primaryCtaLabel || '');
            setField('wlTCtaUrl', current.general?.primaryCtaUrl || '');
            setField('wlTCustomCSS', current.advanced?.customCSS || '');
            setField('wlTCustomJS', current.advanced?.customJS || '');
          };

          const apply = () => {
            const merged = mergeConfigs(state.baseConfig, state.draft);
            applyTenantBranding(merged);
          };

          const updateDraft = (path, value) => {
            const parts = path.split('.');
            let ref = state.draft;
            for (let i = 0; i < parts.length - 1; i++) {
              const k = parts[i];
              if (!ref[k] || typeof ref[k] !== 'object') ref[k] = {};
              ref = ref[k];
            }
            ref[parts[parts.length - 1]] = value;
            apply();
          };

          const bind = (id, path, transform) => {
            const el = document.getElementById(id);
            if (!el) return;
            el.addEventListener('input', () => updateDraft(path, transform ? transform(el.value) : el.value));
            el.addEventListener('change', () => updateDraft(path, transform ? transform(el.value) : el.value));
          };

          bind('wlTBusinessName', 'general.businessName');
          bind('wlTProductName', 'general.productName');
          bind('wlTTagline', 'general.tagline');
          bind('wlTPrimaryColor', 'colors.primary');
          bind('wlTSecondaryColor', 'colors.secondary');
          bind('wlTCtaLabel', 'general.primaryCtaLabel');
          bind('wlTCtaUrl', 'general.primaryCtaUrl');
          bind('wlTCustomCSS', 'advanced.customCSS');
          bind('wlTCustomJS', 'advanced.customJS');

          const upload = (inputId, destPath) => {
            const input = document.getElementById(inputId);
            if (!input) return;
            input.addEventListener('change', () => {
              const file = input.files && input.files[0];
              if (!file) return;
              const reader = new FileReader();
              reader.onload = (e) => {
                updateDraft(destPath, e.target.result);
              };
              reader.readAsDataURL(file);
            });
          };

          upload('wlTUploadLogo', 'logo.full');
          upload('wlTUploadFavicon', 'logo.favicon');
          upload('wlTUploadHero', 'logo.heroImage');

          document.getElementById('wlTUploadLogoBtn')?.addEventListener('click', () => document.getElementById('wlTUploadLogo')?.click());
          document.getElementById('wlTUploadFaviconBtn')?.addEventListener('click', () => document.getElementById('wlTUploadFavicon')?.click());
          document.getElementById('wlTUploadHeroBtn')?.addEventListener('click', () => document.getElementById('wlTUploadHero')?.click());

          document.getElementById('wlTSaveDraft')?.addEventListener('click', () => {
            try {
              localStorage.setItem(state.storageKey, JSON.stringify(state.draft || {}));
              setOpen(false);
            } catch (e) {
            }
          });

          document.getElementById('wlTReloadDraft')?.addEventListener('click', () => {
            try {
              state.draft = JSON.parse(localStorage.getItem(state.storageKey) || '{}') || {};
              hydrate();
              apply();
            } catch (e) {
            }
          });

          document.getElementById('wlTResetDraft')?.addEventListener('click', () => {
            try {
              localStorage.removeItem(state.storageKey);
              state.draft = {};
              hydrate();
              applyTenantBranding(state.baseConfig);
              setOpen(false);
            } catch (e) {
            }
          });

          hydrate();
        }

        function ensureCustomizeButton() {
          if (document.getElementById('wlTenantCustomizeBtn')) return;
          const btn = document.createElement('button');
          btn.id = 'wlTenantCustomizeBtn';
          btn.type = 'button';
          btn.className = 'wl-tenant-customize-btn';
          btn.style.position = 'fixed';
          btn.style.right = '18px';
          btn.style.top = '50%';
          btn.style.transform = 'translateY(-50%)';
          btn.style.zIndex = '99999';
          btn.style.border = 'none';
          btn.style.borderRadius = '999px';
          btn.style.padding = '0.9rem 1.1rem';
          btn.style.fontWeight = '900';
          btn.style.cursor = 'pointer';
          btn.style.color = '#ffffff';
          btn.style.background = 'linear-gradient(135deg,var(--primary,#635bff) 0%,var(--primary-light,#8b5cf6) 100%)';
          btn.style.boxShadow = '0 14px 34px rgba(99,91,255,0.35)';
          btn.style.display = 'none';
          btn.style.alignItems = 'center';
          btn.style.gap = '0.6rem';
          btn.innerHTML = '<span style="font-size:1.05rem">⚙</span><span>Customize</span>';
          btn.addEventListener('click', () => {
            const drawer = document.getElementById('wlTenantCustomizerDrawer');
            const backdrop = document.getElementById('wlTenantCustomizerBackdrop');
            if (drawer && backdrop) {
              drawer.classList.add('open');
              backdrop.classList.add('open');
              return;
            }
          });
          document.body.appendChild(btn);
        }

        function setCustomizeButtonVisible(visible) {
          const btn = document.getElementById('wlTenantCustomizeBtn');
          if (!btn) return;
          btn.style.display = visible ? 'inline-flex' : 'none';
        }

        function closeCustomizerDrawer() {
          const drawer = document.getElementById('wlTenantCustomizerDrawer');
          const backdrop = document.getElementById('wlTenantCustomizerBackdrop');
          if (drawer) drawer.classList.remove('open');
          if (backdrop) backdrop.classList.remove('open');
        }

        function ensureHeroModeToggle(tenantKey) {
          if (document.getElementById('wlHeroModeToggle')) return;

          const container = document.createElement('div');
          container.id = 'wlHeroModeToggle';
          container.style.position = 'absolute';
          container.style.right = '18px';
          container.style.top = '18px';
          container.style.zIndex = '99999';
          container.style.display = 'inline-flex';
          container.style.alignItems = 'center';
          container.style.gap = '0.4rem';
          container.style.padding = '0.35rem';
          container.style.borderRadius = '999px';
          container.style.background = 'rgba(255,255,255,0.92)';
          container.style.border = '1px solid rgba(226,232,240,0.92)';
          container.style.boxShadow = '0 10px 24px rgba(2,6,23,0.10)';
          container.style.backdropFilter = 'blur(10px)';

          const makeBtn = (id, label) => {
            const b = document.createElement('button');
            b.id = id;
            b.type = 'button';
            b.textContent = label;
            b.style.border = 'none';
            b.style.borderRadius = '999px';
            b.style.padding = '0.55rem 0.9rem';
            b.style.fontWeight = '900';
            b.style.cursor = 'pointer';
            b.style.background = 'transparent';
            b.style.color = '#475569';
            return b;
          };

          const editBtn = makeBtn('wlHeroModeEdit', 'Edit');
          const previewBtn = makeBtn('wlHeroModePreview', 'Preview');

          const setActive = (mode) => {
            const activeStyle = (btn, active) => {
              btn.style.background = active ? 'linear-gradient(135deg,var(--primary,#635bff) 0%,var(--primary-light,#8b5cf6) 100%)' : 'transparent';
              btn.style.color = active ? '#ffffff' : '#475569';
              btn.style.boxShadow = active ? '0 10px 22px rgba(99,91,255,0.25)' : 'none';
            };
            activeStyle(editBtn, mode === 'edit');
            activeStyle(previewBtn, mode === 'preview');
          };

          const storageKey = 'wlTenantMode:' + (tenantKey || 'local');

          const applyMode = (mode) => {
            try { localStorage.setItem(storageKey, mode); } catch (e) {}

            if (mode === 'edit') {
              setCustomizeButtonVisible(true);
              const drawer = document.getElementById('wlTenantCustomizerDrawer');
              const backdrop = document.getElementById('wlTenantCustomizerBackdrop');
              if (drawer && backdrop) {
                drawer.classList.add('open');
                backdrop.classList.add('open');
              }
            } else {
              setCustomizeButtonVisible(false);
              closeCustomizerDrawer();
            }
            setActive(mode);
          };

          editBtn.addEventListener('click', () => applyMode('edit'));
          previewBtn.addEventListener('click', () => applyMode('preview'));

          container.appendChild(editBtn);
          container.appendChild(previewBtn);

          const hero = document.querySelector('.hero-section');
          const heroContainer = document.querySelector('.hero-container');
          const anchor = heroContainer || hero || document.body;
          const isBody = anchor === document.body;
          if (isBody) {
            container.style.position = 'fixed';
            container.style.top = '86px';
            container.style.right = '18px';
          } else {
            const parent = anchor;
            const parentStyle = window.getComputedStyle(parent);
            if (parentStyle.position === 'static') parent.style.position = 'relative';
          }
          anchor.appendChild(container);

          let initial = 'preview';
          try {
            const saved = localStorage.getItem(storageKey);
            if (saved === 'edit' || saved === 'preview') initial = saved;
          } catch (e) {}
          applyMode(initial);
        }

        async function boot() {
          const params = new URLSearchParams(window.location.search);
          const hideCustomizer = params.get('hideCustomizer') === '1';
          const t = detectTenant();
          let config = null;

          if (t.tenantId || t.domain) {
            const query = t.tenantId ? ('tenantId=' + encodeURIComponent(t.tenantId)) : ('domain=' + encodeURIComponent(t.domain));
            const url = '/api/white-label/tenant/config?' + query;
            const res = await fetch(url, { headers: { 'Content-Type': 'application/json' } });
            if (res.ok) {
              config = await res.json();
            }
          }

          if (!config) {
            config = {
              companyName: 'Your Company',
              general: {},
              colors: {
                primary: '#635bff',
                secondary: '#7c3aed',
                success: '#10b981',
                danger: '#ef4444',
                bg: '#ffffff',
                cardBg: '#f8fafc',
                textPrimary: '#0f172a',
                textSecondary: '#475569'
              },
              fonts: {
                primary: 'Inter',
                heading: 'Plus Jakarta Sans',
                googleFontsUrl: ''
              },
              logo: {},
              advanced: {}
            };
          }

          applyTenantBranding(config);

          if (!hideCustomizer) {
            ensureCustomizeButton();
            const tenantKey = t.tenantId || t.domain || 'local';
            const storageKey = 'wlTenantCustomizerDraft:' + tenantKey;
            let draft = {};
            try {
              draft = JSON.parse(localStorage.getItem(storageKey) || '{}') || {};
            } catch (e) {
              draft = {};
            }

            const state = { baseConfig: config, draft, storageKey };
            const merged = mergeConfigs(config, draft);
            applyTenantBranding(merged);
            createCustomizerUI(state);
            ensureHeroModeToggle(tenantKey);
          }
        }

        document.addEventListener('DOMContentLoaded', () => {
          const params = new URLSearchParams(window.location.search);
          const hideCustomizer = params.get('hideCustomizer') === '1';
          if (!hideCustomizer) ensureCustomizeButton();
          boot().catch(() => {});
        });
      })();
    </script>
    `;

    if (html.includes('</head>') && !html.includes('wl-tenant-custom-css')) {
      html = html.replace('</head>', `${injected}\n</head>`);
    } else {
      html = html + injected;
    }

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.status(200).send(html);
  } catch (error) {
    console.error('Tenant index render error:', error);
    res.status(500).send('Failed to render tenant index');
  }
});

app.get('/white-label/tenant-index.html', (req, res) => {
  const searchIndex = req.originalUrl.indexOf('?');
  const query = searchIndex >= 0 ? req.originalUrl.slice(searchIndex) : '';
  res.redirect(302, `/pages/white-label/tenant-index.html${query}`);
});

app.get('/s/white-label/tenant-index.html', (req, res) => {
  const searchIndex = req.originalUrl.indexOf('?');
  const query = searchIndex >= 0 ? req.originalUrl.slice(searchIndex) : '';
  res.redirect(302, `/pages/white-label/tenant-index.html${query}`);
});

// Serve static files (HTML, CSS, JS, images, etc.)
const staticPath = __dirname;
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
