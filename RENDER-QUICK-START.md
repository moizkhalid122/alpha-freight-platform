# ⚡ Render Quick Start - 5 Minutes

## 🎯 Goal
Server ko Render par deploy karo taake PC off bhi ho sakta hai aur users payment kar sakte hain.

---

## 📋 Quick Steps

### 1️⃣ Render Account (1 min)
- https://render.com par jao
- "Get Started for Free" click
- GitHub se sign up

### 2️⃣ Create Web Service (2 min)
1. Render dashboard → "New +" → "Web Service"
2. GitHub repo connect/select karo
3. Settings:
   - **Name:** `alpha-freight-server`
   - **Root Directory:** `server` ⚠️
   - **Start Command:** `node server.js`
   - **Environment:** `Node`

### 3️⃣ Environment Variables (1 min)
Render → Environment tab:
```
STRIPE_SECRET_KEY=your-stripe-secret-key-here
PORT=3000
NODE_ENV=production
```

### 4️⃣ Deploy (1 min)
- "Create Web Service" click
- 2-3 minutes wait
- Render URL mil jayega: `https://alpha-freight-server.onrender.com`

### 5️⃣ Update Frontend
`pages/supplier/paynow.html` line 1432:
```javascript
const CLOUD_BACKEND_URL = 'https://alpha-freight-server.onrender.com';
```

`pages/broker/paynow.html` line 1123:
```javascript
const CLOUD_BACKEND_URL = 'https://alpha-freight-server.onrender.com';
```

---

## ✅ Test

1. Health check: `https://your-url.onrender.com/api/health`
2. Payment test karo
3. Done! ✅

---

## 🎉 Benefits

- ✅ 24/7 Available
- ✅ PC off kar sakte ho
- ✅ Users payment kar sakte hain
- ✅ Free tier available
- ✅ Auto-deploy from GitHub

---

## ⚠️ Note

Free tier mein server 15 min inactivity ke baad sleep ho jata hai. First request pe 30-60 sec lag sakta hai, phir fast ho jayega.

Paid plan ($7/month) = Always on, no sleep.

---

**Full Guide:** `RENDER-DEPLOYMENT-GUIDE.md` dekho
