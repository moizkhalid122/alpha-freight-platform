# 🔑 Stripe Keys Kaise Lein - Complete Guide

## ⚠️ Problem
Console error: "Invalid API Key provided: pk_live_..."
Publishable key galat hai ya secret key se match nahi kar rahi.

## ✅ Solution
Stripe Dashboard se **correct publishable key** lein jo aapke secret key se match kare.

---

## 📋 Steps to Get Stripe Keys

### Step 1: Stripe Dashboard Login
1. Browser mein jao: https://dashboard.stripe.com
2. Apne account se **login** karo

### Step 2: API Keys Section
1. Dashboard par **left sidebar** mein:
   - **"Developers"** → Click karo
   - **"API keys"** → Click karo

### Step 3: Live Keys (Production)
1. Page par **"Live mode"** toggle **ON** karo (top right)
2. Ab **Live keys** dikhengi (test keys nahi)

### Step 4: Publishable Key Copy Karo
1. **"Publishable key"** section mein:
   - **"Reveal test key"** ya **"Reveal live key"** button click karo
   - Key dikhegi: `pk_live_...` (shuru mein `pk_live_` hoga)
   - **Copy** karo

### Step 5: Secret Key Copy Karo
1. **"Secret key"** section mein:
   - **"Reveal test key"** ya **"Reveal live key"** button click karo
   - Key dikhegi: `sk_live_...` (shuru mein `sk_live_` hoga)
   - **Copy** karo

---

## ✅ Important Notes

1. **Live Mode** = Production keys (real payments)
2. **Test Mode** = Test keys (testing ke liye)
3. **Publishable Key** = Frontend mein (`pk_live_...`)
4. **Secret Key** = Backend mein (`sk_live_...`)
5. **Don't mix** - Live publishable key ke saath Live secret key hi use karo

---

## 🔄 Keys Update Karne Ka Process

### Frontend (paynow.html):
```javascript
const STRIPE_PUBLISHABLE_KEY = 'pk_live_YOUR_ACTUAL_KEY_FROM_STRIPE';
```

### Backend (Render):
```
STRIPE_SECRET_KEY=sk_live_YOUR_ACTUAL_KEY_FROM_STRIPE
```

---

## 🆘 Agar Keys Nahi Dikh Rahi

1. **Check Stripe Account:**
   - Account verified hai?
   - Live mode enabled hai?
   - Payment method added hai?

2. **Create New Keys:**
   - Stripe Dashboard → Developers → API keys
   - "Create secret key" button click karo
   - Naya key generate hoga

3. **Contact Stripe Support:**
   - Dashboard → Help → Contact Support
   - Unhe batao: "Need to get API keys"

---

## ✅ Verification

Keys update ke baad:

1. **Frontend test:**
   - paynow.html page open karo
   - Console mein error nahi aana chahiye

2. **Backend test:**
   - Render logs check karo
   - Payment intent create hona chahiye

3. **Full payment test:**
   - Test card use karo: `4242 4242 4242 4242`
   - Payment successful hona chahiye

---

**Important:** Stripe Dashboard se **exact keys** copy karo - manually type mat karo!
