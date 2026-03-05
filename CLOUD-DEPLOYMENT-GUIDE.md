# 🌐 Cloud Deployment Guide - Alpha Freight Server

## Problem
Agar PC off ho to server bhi off ho jata hai, isliye users payment nahi kar sakte.

## Solution
Server ko cloud par deploy karein (always on, 24/7 available)

---

## 🚀 Option 1: Railway (Recommended - Free Tier Available)

### Step 1: Railway Account
1. https://railway.app par jao
2. GitHub se sign up karo
3. Free tier available (500 hours/month)

### Step 2: Deploy Server
1. Railway dashboard mein "New Project" click karo
2. "Deploy from GitHub repo" select karo
3. Apna repo select karo
4. Root directory: `server` set karo
5. Start command: `node server.js`
6. Port: `3000` (Railway automatically assign karega)

### Step 3: Environment Variables
Railway dashboard mein "Variables" tab mein add karo:
```
STRIPE_SECRET_KEY=your-stripe-secret-key-here
PORT=3000
NODE_ENV=production
```

### Step 4: Get Public URL
Railway automatically ek public URL dega:
```
https://your-app-name.railway.app
```

### Step 5: Update Frontend
`pages/supplier/paynow.html` aur `pages/broker/paynow.html` mein:
```javascript
const STRIPE_BACKEND_ENDPOINT = 'https://your-app-name.railway.app/api/create-payment-intent';
```

---

## 🚀 Option 2: Render (Free Tier Available)

### Step 1: Render Account
1. https://render.com par jao
2. Sign up karo (GitHub se)

### Step 2: Deploy
1. "New +" button click karo
2. "Web Service" select karo
3. GitHub repo connect karo
4. Settings:
   - **Name:** alpha-freight-server
   - **Root Directory:** server
   - **Build Command:** (leave empty)
   - **Start Command:** `node server.js`
   - **Environment:** Node

### Step 3: Environment Variables
Render dashboard mein "Environment" section:
```
STRIPE_SECRET_KEY=your-stripe-secret-key-here
PORT=3000
```

### Step 4: Get Public URL
Render automatically URL dega:
```
https://alpha-freight-server.onrender.com
```

---

## 🚀 Option 3: Heroku (Paid, but reliable)

### Step 1: Heroku Account
1. https://heroku.com par jao
2. Free tier ab nahi hai, paid plan required

### Step 2: Deploy
```bash
# Heroku CLI install karo
# Then:
cd server
heroku create alpha-freight-server
heroku config:set STRIPE_SECRET_KEY=your-stripe-secret-key-here
git push heroku main
```

---

## 🔧 Quick Setup Script (Railway/Render)

### Railway Setup:
1. GitHub repo create karo
2. Railway mein connect karo
3. Root directory: `server`
4. Environment variables add karo
5. Deploy!

### Render Setup:
1. GitHub repo create karo
2. Render mein connect karo
3. Root directory: `server`
4. Environment variables add karo
5. Deploy!

---

## 📝 Important Notes

### CORS Configuration
`server/server.js` mein CORS already configured hai, lekin cloud URL add karna padega:

```javascript
app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    // Add your frontend domain
    if (origin.includes('alphafreightuk.com') || 
        origin.includes('your-domain.com') ||
        origin.match(/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/)) {
      return callback(null, true);
    }
    callback(null, true);
  },
  credentials: true
}));
```

### Frontend Update
Sab payment pages mein backend URL update karna:
- `pages/supplier/paynow.html`
- `pages/broker/paynow.html`

Change from:
```javascript
const STRIPE_BACKEND_ENDPOINT = '/api/create-payment-intent';
```

To:
```javascript
const STRIPE_BACKEND_ENDPOINT = 'https://your-cloud-url.railway.app/api/create-payment-intent';
```

---

## ✅ Benefits of Cloud Deployment

1. **24/7 Available** - Server hamesha on rahega
2. **No PC Required** - Apna PC off bhi kar sakte ho
3. **Automatic Scaling** - Traffic ke hisab se scale hoga
4. **SSL Certificate** - HTTPS automatically (secure)
5. **Monitoring** - Logs aur metrics available

---

## 🆓 Free Tier Limits

### Railway:
- 500 hours/month free
- $5 credit monthly
- Perfect for testing

### Render:
- Free tier available
- Sleep after 15 min inactivity (wake up on request)
- Good for low traffic

---

## 🎯 Recommended: Railway

Railway best option hai kyunki:
- ✅ Free tier available
- ✅ Easy setup
- ✅ Fast deployment
- ✅ Good documentation
- ✅ Automatic HTTPS

---

## 📞 Need Help?

Agar deployment mein issue ho to:
1. Check server logs (Railway/Render dashboard)
2. Verify environment variables
3. Test API endpoint: `https://your-url/api/health`
4. Check CORS configuration
