# 🚀 Render.com Deployment Guide - Alpha Freight Server

## ✅ Why Render?
- ✅ **Free tier available** - Perfect for testing
- ✅ **Easy setup** - 5 minutes mein deploy
- ✅ **Automatic HTTPS** - Secure connection
- ✅ **Auto-deploy** - GitHub push = Auto deploy
- ✅ **No credit card required** - Free tier ke liye

---

## 📋 Step-by-Step Deployment on Render

### Step 1: Create Render Account
1. https://render.com par jao
2. "Get Started for Free" button click karo
3. GitHub se sign up karo (best option - automatic deployment)
4. Render automatically GitHub access le lega

### Step 2: Prepare GitHub Repo (If not already)
```bash
# Terminal mein:
cd "d:\Alpha Brokrage"
git init
git add .
git commit -m "Initial commit - Ready for Render deployment"
git remote add origin https://github.com/your-username/alpha-freight.git
git push -u origin main
```

**Important:** GitHub repo public ya private dono chalega, lekin Render ko access dena padega.

### Step 3: Create New Web Service on Render
1. Render dashboard mein "New +" button click karo
2. "Web Service" select karo
3. GitHub repo connect karo:
   - Agar pehle se connected hai to select karo
   - Agar nahi hai to "Connect account" click karo
4. Apna repo select karo: `alpha-freight` (ya jo bhi naam ho)

### Step 4: Configure Service Settings
Render mein yeh settings fill karo:

**Basic Settings:**
- **Name:** `alpha-freight-server` (ya koi bhi naam)
- **Region:** Choose closest (US/EU/Asia)
- **Branch:** `main` (ya `master`)

**Build & Deploy:**
- **Root Directory:** `server` ⚠️ **IMPORTANT!**
- **Environment:** `Node`
- **Build Command:** (leave empty - kuch nahi chahiye)
- **Start Command:** `node server.js`

**Advanced Settings (Optional):**
- **Auto-Deploy:** `Yes` (GitHub push = Auto deploy)
- **Health Check Path:** `/api/health`

### Step 5: Add Environment Variables
Render dashboard mein "Environment" section mein yeh variables add karo:

```
STRIPE_SECRET_KEY=your-stripe-secret-key-here
PORT=3000
NODE_ENV=production
```

**How to add:**
1. "Environment" tab click karo
2. "Add Environment Variable" click karo
3. Har variable add karo (name aur value)

### Step 6: Deploy!
1. "Create Web Service" button click karo
2. Render automatically:
   - Code clone karega
   - Dependencies install karega (`npm install`)
   - Server start karega
3. 2-3 minutes wait karo (first deploy mein time lagta hai)

### Step 7: Get Your Public URL
Deploy complete hone ke baad Render automatically ek URL dega:
```
https://alpha-freight-server.onrender.com
```
(Ya koi aur URL - Render automatically generate karega)

**Note:** Free tier mein first request pe 30-60 seconds lag sakta hai (cold start), lekin baad mein fast ho jayega.

---

## 🔧 Update Frontend for Render

### Update Payment Pages

**1. `pages/supplier/paynow.html` - Line 1432:**
```javascript
// Find this:
const CLOUD_BACKEND_URL = '';

// Replace with your Render URL:
const CLOUD_BACKEND_URL = 'https://alpha-freight-server.onrender.com';
```

**2. `pages/broker/paynow.html` - Line 1123:**
```javascript
// Find this:
const CLOUD_BACKEND_URL = '';

// Replace with your Render URL:
const CLOUD_BACKEND_URL = 'https://alpha-freight-server.onrender.com';
```

---

## 🧪 Test Deployment

### Step 1: Health Check
Browser mein yeh URL open karo:
```
https://your-app-name.onrender.com/api/health
```

Agar yeh response aaye = Server chal raha hai ✅:
```json
{
  "status": "OK",
  "message": "Alpha Freight OTP API is running",
  "timestamp": "..."
}
```

### Step 2: Test Payment
1. Supplier paynow page open karo
2. Card payment try karo
3. Ab kaam karna chahiye! ✅

---

## ⚙️ Render Free Tier Details

### What's Included:
- ✅ **750 hours/month** free
- ✅ **Automatic HTTPS** (SSL certificate)
- ✅ **Auto-deploy** from GitHub
- ✅ **Logs** aur monitoring
- ✅ **Custom domain** support

### Limitations:
- ⚠️ **Sleep after 15 min inactivity** - First request pe 30-60 sec lag sakta hai
- ⚠️ **512 MB RAM** limit
- ⚠️ **0.1 CPU** limit

**Note:** Sleep issue ke liye:
- Paid plan ($7/month) = Always on
- Ya free tier use karo - request aate hi wake up ho jata hai

---

## 🔄 Auto-Deploy Setup

Render automatically deploy karega jab bhi:
- GitHub mein code push karo
- Pull request merge karo
- Manual deploy trigger karo

**To enable:**
1. Render dashboard → Service settings
2. "Auto-Deploy" = `Yes`
3. Done! ✅

---

## 📊 Monitoring & Logs

### View Logs:
1. Render dashboard → Apna service click karo
2. "Logs" tab click karo
3. Real-time logs dikhenge

### View Metrics:
1. Render dashboard → Apna service click karo
2. "Metrics" tab click karo
3. CPU, Memory, Requests dikhenge

---

## 🔒 Security Notes

### CORS Configuration
Server mein CORS already configured hai, lekin agar custom domain use karo to update karna padega.

`server/server.js` mein:
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

---

## 🆚 Render vs Railway

| Feature | Render | Railway |
|---------|--------|---------|
| Free Tier | ✅ 750 hrs/month | ✅ 500 hrs/month |
| Sleep Mode | ⚠️ 15 min inactivity | ✅ Always on (paid) |
| Setup | ✅ Easy | ✅ Easy |
| Auto-Deploy | ✅ Yes | ✅ Yes |
| HTTPS | ✅ Automatic | ✅ Automatic |

**Recommendation:** Dono theek hain, Render free tier zyada hours deta hai!

---

## 🎯 Quick Checklist

- [ ] Render account create kiya
- [ ] GitHub repo connect kiya
- [ ] Web Service create kiya
- [ ] Root directory: `server` set kiya
- [ ] Start command: `node server.js` set kiya
- [ ] Environment variables add kiye
- [ ] Deploy complete hua
- [ ] Health check pass hua
- [ ] Frontend mein Render URL update kiya
- [ ] Payment test kiya ✅

---

## 🆘 Troubleshooting

### Deploy Failed?
1. Check logs (Render dashboard → Logs)
2. Verify `server/package.json` exists
3. Check environment variables
4. Verify root directory: `server`

### Payment Not Working?
1. Check Render URL correct hai
2. Health endpoint test karo: `/api/health`
3. Browser console mein errors check karo
4. CORS errors check karo

### Server Sleeping?
- Free tier mein 15 min inactivity ke baad sleep ho jata hai
- First request pe 30-60 sec lag sakta hai
- Baad mein fast ho jayega
- Paid plan ($7/month) = Always on

---

## ✅ Benefits After Deployment

1. ✅ **24/7 Available** - Server hamesha on (ya wake on request)
2. ✅ **PC Off Kar Sakte Ho** - Server cloud par chalega
3. ✅ **Users Payment Kar Sakte Hain** - Anytime, anywhere
4. ✅ **Secure HTTPS** - Automatic SSL certificate
5. ✅ **Auto-Deploy** - GitHub push = Auto deploy
6. ✅ **Monitoring** - Logs aur metrics available

---

## 📞 Need Help?

Agar deployment mein issue ho:
1. Render dashboard → Logs check karo
2. Health endpoint test karo
3. Environment variables verify karo
4. CORS configuration check karo

**Render Docs:** https://render.com/docs

---

## 🎉 Done!

Ab aapka server Render par deploy ho gaya hai! PC off bhi kar sakte ho, server cloud par chalega aur users payment kar sakte hain! 🚀
