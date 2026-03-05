# 🚀 Complete Deployment Guide - Alpha Freight

## 📌 Current Situation
- ✅ Complete project ready (index.html, server, pages, etc.)
- ✅ Backend server (Node.js/Express) ready
- ✅ Frontend files ready
- ❌ Not yet deployed anywhere

---

## 🎯 Option 1: Render.com (RECOMMENDED) ✅

### Why Render?
- ✅ **Free tier** - No credit card needed
- ✅ **Node.js support** - Backend server chalega
- ✅ **Automatic HTTPS** - Secure connection
- ✅ **Auto-deploy** - GitHub push = Auto deploy
- ✅ **Custom domain** - alphafreightuk.com connect kar sakte ho

---

## 📋 Step-by-Step: Render Deployment

### Step 1: GitHub Account & Repository Setup

**1.1. GitHub Account:**
- Agar nahi hai to: https://github.com par account banayein
- Sign up karein (free)

**1.2. GitHub Repository Create Karein:**
```bash
# Terminal/PowerShell mein yeh commands run karein:

cd "d:\Alpha Brokrage"

# Git initialize karein (agar pehle se nahi hai)
git init

# Sab files add karein
git add .

# Commit karein
git commit -m "Initial commit - Alpha Freight complete project"

# GitHub par new repository banayein (github.com par jao, "New repository" click karo)
# Repository name: alpha-freight (ya koi bhi naam)

# Remote add karein (YOUR_USERNAME aur REPO_NAME replace karein)
git remote add origin https://github.com/YOUR_USERNAME/alpha-freight.git

# Push karein
git branch -M main
git push -u origin main
```

**Important:** 
- `YOUR_USERNAME` = Apna GitHub username
- `alpha-freight` = Repository name (jo aapne banaya)

---

### Step 2: Render Account Setup

**2.1. Render Account:**
1. https://render.com par jao
2. "Get Started for Free" click karo
3. "Sign up with GitHub" select karo (best option)
4. GitHub se login karo
5. Render ko GitHub access de do

---

### Step 3: Create Web Service on Render

**3.1. New Service:**
1. Render dashboard mein "New +" button click karo
2. "Web Service" select karo

**3.2. Connect Repository:**
1. "Connect account" click karo (agar pehle se connected nahi hai)
2. Apna GitHub repository select karo: `alpha-freight`

**3.3. Configure Settings:**

**Basic Settings:**
- **Name:** `alpha-freight-server` (ya koi bhi naam)
- **Region:** Choose closest (US/EU/Asia)
- **Branch:** `main`

**Build & Deploy:**
- **Root Directory:** `server` ⚠️ **IMPORTANT!**
- **Environment:** `Node`
- **Build Command:** (leave empty - kuch nahi)
- **Start Command:** `node server.js`

**Advanced Settings:**
- **Auto-Deploy:** `Yes` ✅
- **Health Check Path:** `/api/health`

---

### Step 4: Environment Variables

Render dashboard mein "Environment" tab mein yeh add karein:

```
PORT=3000
NODE_ENV=production
STRIPE_SECRET_KEY=your-stripe-secret-key-here
```

**Optional (Email ke liye):**
```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
```

**How to add:**
1. "Environment" tab click karo
2. "Add Environment Variable" click karo
3. Name aur Value add karo
4. Save karo

---

### Step 5: Deploy!

1. "Create Web Service" button click karo
2. 2-3 minutes wait karo
3. Deploy complete hone ke baad URL milega:
   ```
   https://alpha-freight-server.onrender.com
   ```

---

### Step 6: Custom Domain Connect (alphafreightuk.com)

**6.1. Render Dashboard:**
1. Apna service click karo
2. "Settings" tab mein scroll karo
3. "Custom Domains" section mein:
   - "Add Custom Domain" click karo
   - `alphafreightuk.com` add karo
   - `www.alphafreightuk.com` bhi add karo

**6.2. DNS Settings (Hostinger):**
Hostinger DNS mein yeh records add karein:

**Type A Record:**
- Name: `@` (ya blank)
- Value: Render ka IP address (Render dashboard mein dikhega)
- TTL: 3600

**Type CNAME Record:**
- Name: `www`
- Value: `alpha-freight-server.onrender.com` (ya jo bhi Render URL ho)
- TTL: 3600

**Note:** Render dashboard mein exact DNS instructions dikhenge.

---

### Step 7: Test

1. **Health Check:**
   ```
   https://alpha-freight-server.onrender.com/api/health
   ```
   Response: `{"status":"OK",...}` ✅

2. **Main Website:**
   ```
   https://www.alphafreightuk.com/
   ```
   Puri website dikhni chahiye ✅

---

## 🎯 Option 2: Hostinger Hosting (Static Files Only)

**⚠️ Warning:** Is option mein backend server nahi chalega!

### Step 1: Hostinger File Manager

1. Hostinger dashboard → File Manager
2. `public_html` folder mein jao
3. Sab files delete karo (agar kuch hai)

### Step 2: Upload Files

**Upload karein:**
- `index.html`
- `pages/` folder (complete)
- `assets/` folder (complete)
- Sab images, videos, etc.

**❌ Upload NAHIN karein:**
- `server/` folder (Hostinger par Node.js nahi chalega)
- `.git/` folder
- `node_modules/` folder

### Step 3: Test

```
https://www.alphafreightuk.com/
```

**Limitations:**
- ❌ Payment APIs kaam nahi karengi
- ❌ OTP emails kaam nahi karengi
- ❌ Backend features kaam nahi karenge
- ✅ Sirf frontend/static website chalega

---

## ✅ Recommended: Render.com

**Kyun?**
- Complete website chalega (frontend + backend)
- Payment APIs kaam karengi
- OTP emails kaam karengi
- Free tier available
- Custom domain support

---

## 🆘 Troubleshooting

### Deploy Failed?
1. Check Render logs (dashboard → Logs tab)
2. Verify `server/package.json` exists
3. Check environment variables
4. Verify root directory: `server`

### Domain Not Working?
1. DNS propagation wait karo (5-10 minutes)
2. DNS records verify karo
3. Browser cache clear karo

### Payment Not Working?
1. Check Render URL correct hai
2. Health endpoint test karo: `/api/health`
3. Browser console mein errors check karo

---

## 📞 Need Help?

Agar koi step mein problem ho:
1. Render logs check karo
2. Health endpoint test karo
3. DNS records verify karo

---

## 🎉 Done!

Ab aapki puri website live ho jayegi! 🚀
