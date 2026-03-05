# 🚀 Quick Cloud Deployment - Alpha Freight Server

## ⚠️ Problem
Agar aapka PC off ho to server bhi off ho jata hai, isliye users payment nahi kar sakte.

## ✅ Solution
Server ko cloud par deploy karein (24/7 available, PC off bhi ho sakta hai)

---

## 🎯 Best Option: Railway (Free Tier Available)

### Why Railway?
- ✅ **Free tier** - 500 hours/month free
- ✅ **Easy setup** - 5 minutes mein deploy
- ✅ **Always on** - PC off bhi ho sakta hai
- ✅ **Automatic HTTPS** - Secure connection
- ✅ **No credit card required** - Free tier ke liye

---

## 📋 Step-by-Step Deployment

### Step 1: Railway Account
1. https://railway.app par jao
2. "Start a New Project" click karo
3. GitHub se sign up karo (best option)
4. Free tier automatically activate ho jayega

### Step 2: Create GitHub Repo (If not already)
```bash
# Terminal mein:
cd "d:\Alpha Brokrage"
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/your-username/alpha-freight.git
git push -u origin main
```

### Step 3: Deploy on Railway
1. Railway dashboard mein "New Project" click karo
2. "Deploy from GitHub repo" select karo
3. Apna repo select karo
4. Settings:
   - **Root Directory:** `server` (important!)
   - **Start Command:** `node server.js`
   - **Port:** Railway automatically assign karega

### Step 4: Environment Variables
Railway dashboard mein "Variables" tab mein add karo:

```
STRIPE_SECRET_KEY=your-stripe-secret-key-here
PORT=3000
NODE_ENV=production
```

### Step 5: Get Public URL
Railway automatically ek public URL dega:
```
https://alpha-freight-production.up.railway.app
```
(Ya koi aur URL - Railway automatically generate karega)

### Step 6: Update Frontend
`pages/supplier/paynow.html` aur `pages/broker/paynow.html` mein:

**Find this line:**
```javascript
const STRIPE_BACKEND_ENDPOINT = '/api/create-payment-intent';
```

**Replace with:**
```javascript
const STRIPE_BACKEND_ENDPOINT = 'https://alpha-freight-production.up.railway.app/api/create-payment-intent';
```
(Apni Railway URL use karo)

---

## 🧪 Test After Deployment

1. Railway URL check karo:
   ```
   https://your-railway-url.railway.app/api/health
   ```
   Agar "OK" dikhe = Server chal raha hai ✅

2. Payment test karo:
   - Supplier paynow page open karo
   - Card payment try karo
   - Ab kaam karna chahiye!

---

## 🔄 Alternative: Render (Also Free)

### Render Setup:
1. https://render.com par jao
2. Sign up (GitHub se)
3. "New +" → "Web Service"
4. GitHub repo connect karo
5. Settings:
   - **Root Directory:** `server`
   - **Start Command:** `node server.js`
6. Environment variables add karo (same as Railway)
7. Deploy!

**Note:** Render free tier sleep ho sakta hai after 15 min inactivity, lekin request aate hi wake up ho jata hai.

---

## 💡 Important Notes

### CORS Already Configured
Server mein CORS already configured hai, lekin agar custom domain use karo to update karna padega.

### Frontend Update Required
**MUST DO:** Payment pages mein backend URL update karna:
- `pages/supplier/paynow.html`
- `pages/broker/paynow.html`

### Benefits After Deployment:
1. ✅ **24/7 Available** - Server hamesha on
2. ✅ **PC Off Kar Sakte Ho** - Server cloud par chalega
3. ✅ **Users Payment Kar Sakte Hain** - Anytime, anywhere
4. ✅ **Secure HTTPS** - Automatic SSL certificate
5. ✅ **Monitoring** - Logs aur metrics available

---

## 🆓 Free Tier Limits

### Railway:
- 500 hours/month free
- $5 credit monthly
- Perfect for production

### Render:
- Free tier available
- Sleep after 15 min (wake on request)
- Good for low traffic

---

## 🎯 Recommended Action

1. **Railway par deploy karo** (easiest aur best)
2. **Frontend update karo** (payment pages mein URL change)
3. **Test karo** (payment try karo)
4. **Done!** ✅

Ab aapka PC off bhi kar sakte ho, server cloud par chalega aur users payment kar sakte hain!

---

## 📞 Need Help?

Agar deployment mein issue ho:
1. Check Railway logs (dashboard mein)
2. Verify environment variables
3. Test health endpoint
4. Check CORS configuration
