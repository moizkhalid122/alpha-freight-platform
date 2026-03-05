# Stripe Payment Testing Guide

## Test Mode Setup

### 1. Get Test Keys from Stripe Dashboard
- Log in to [Stripe Dashboard](https://dashboard.stripe.com)
- Switch to **Test Mode** (toggle in top right)
- Go to **Developers** > **API keys**
- Copy your **Publishable key** (starts with `pk_test_...`)

### 2. Update Code with Test Key
Replace the live key in `pages/supplier/payments.html`:
```javascript
const STRIPE_PUBLISHABLE_KEY = 'pk_test_YOUR_TEST_KEY_HERE';
```

## Test Card Numbers

### ✅ Successful Payment Cards

**Basic Card (Success):**
- Card Number: `4242 4242 4242 4242`
- Expiry: Any future date (e.g., `12/34`)
- CVC: Any 3 digits (e.g., `123`)
- ZIP: Any 5 digits (e.g., `12345`)

**Visa (Success):**
- Card Number: `4242 4242 4242 4242`
- Expiry: `12/34`
- CVC: `123`

**Mastercard (Success):**
- Card Number: `5555 5555 5555 4444`
- Expiry: `12/34`
- CVC: `123`

**American Express (Success):**
- Card Number: `3782 822463 10005`
- Expiry: `12/34`
- CVC: `1234`

### ❌ Declined Payment Cards

**Generic Decline:**
- Card Number: `4000 0000 0000 0002`
- Expiry: `12/34`
- CVC: `123`

**Insufficient Funds:**
- Card Number: `4000 0000 0000 9995`
- Expiry: `12/34`
- CVC: `123`

**Lost Card:**
- Card Number: `4000 0000 0000 9987`
- Expiry: `12/34`
- CVC: `123`

**Stolen Card:**
- Card Number: `4000 0000 0000 9979`
- Expiry: `12/34`
- CVC: `123`

### 🔐 3D Secure Cards (Requires Authentication)

**Requires Authentication:**
- Card Number: `4000 0025 0000 3155`
- Expiry: `12/34`
- CVC: `123`

**Always Requires Authentication:**
- Card Number: `4000 0027 6000 3184`
- Expiry: `12/34`
- CVC: `123`

### 💳 Card Validation Test Cards

**Invalid CVC:**
- Card Number: `4000 0000 0000 0127`
- Expiry: `12/34`
- CVC: `123` (will show CVC error)

**Invalid Expiry:**
- Card Number: `4000 0000 0000 0069`
- Expiry: Past date
- CVC: `123`

**Incorrect CVC:**
- Card Number: `4000 0000 0000 0101`
- Expiry: `12/34`
- CVC: Any (will show incorrect CVC error)

## Testing Steps

### Step 1: Test Successful Payment
1. Open payments page
2. Click "Pay Now" on any load
3. Select "Card Payment" tab
4. Enter test card: `4242 4242 4242 4242`
5. Enter expiry: `12/34`
6. Enter CVC: `123`
7. Enter cardholder name
8. Click "Pay Securely"
9. Should show success message

### Step 2: Test Declined Payment
1. Use declined card: `4000 0000 0000 0002`
2. Should show error message

### Step 3: Test Form Validation
1. Leave fields empty
2. Should show validation errors
3. Enter invalid card number
4. Should show error

### Step 4: Check Payment Status
1. After successful payment
2. Check payment history
3. Verify invoice is generated
4. Verify payment success page appears

## Important Notes

⚠️ **Live Key vs Test Key:**
- Current key is **LIVE** (`pk_live_...`)
- For testing, use **TEST** key (`pk_test_...`)
- Test cards only work with test keys
- Live key will charge real cards (use carefully!)

⚠️ **Backend Required:**
- Frontend integration is ready
- For production, backend needed for:
  - Creating Payment Intent
  - Confirming payment
  - Handling webhooks

## Quick Test Checklist

- [ ] Switch to test key in code
- [ ] Test successful payment (4242...4242)
- [ ] Test declined payment (4000...0002)
- [ ] Test form validation
- [ ] Test payment success redirect
- [ ] Check payment history update
- [ ] Verify invoice generation

## Common Issues

**Issue: Card element not showing**
- Check if Stripe.js is loaded
- Check console for errors
- Verify API key is correct

**Issue: Payment not processing**
- Check browser console for errors
- Verify backend is set up (if using Payment Intent)
- Check network tab for API calls

**Issue: Test cards not working**
- Make sure using test key (pk_test_...)
- Verify test mode is enabled in Stripe dashboard
- Check card number format (spaces allowed)

## Production Checklist

Before going live:
- [ ] Switch to live key (pk_live_...)
- [ ] Set up backend for Payment Intent
- [ ] Configure webhooks
- [ ] Test with real card (small amount)
- [ ] Set up error handling
- [ ] Configure proper error messages
