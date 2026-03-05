# ⚡ Quick Cloud Setup - 5 Minutes

## Problem
PC off = Server off = Users payment nahi kar sakte ❌

## Solution
Railway par deploy karo (Free, 5 minutes)

---

## 🚀 Quick Steps

### 1. Railway Account (2 min)
- https://railway.app par jao
- GitHub se sign up
- Free tier automatically activate

### 2. Deploy (2 min)
- Railway dashboard → "New Project"
- "Deploy from GitHub repo"
- Root directory: `server`
- Start command: `node server.js`

### 3. Environment Variables (1 min)
Railway → Variables tab:
```
STRIPE_SECRET_KEY=your-stripe-secret-key-here
PORT=3000
```

### 4. Get URL
Railway automatically URL dega:
```
https://alpha-freight-production.up.railway.app
```

### 5. Update Frontend
`pages/supplier/paynow.html` line 1432:
```javascript
// Replace with your Railway URL:
const STRIPE_BACKEND_ENDPOINT = 'https://alpha-freight-production.up.railway.app/api/create-payment-intent';
```

Same for `pages/broker/paynow.html` line 1123

---

## ✅ Done!

Ab:
- ✅ PC off kar sakte ho
- ✅ Server 24/7 chalega
- ✅ Users payment kar sakte hain
- ✅ Free tier available

---

## 🧪 Test
1. Railway URL check: `https://your-url.railway.app/api/health`
2. Payment test karo
3. Done! ✅
