# 🗺️ Google Maps API Key Setup Guide

## 📍 Step-by-Step Guide:

### **Step 1: Google Cloud Console mein jao**
1. Browser mein kholo: **https://console.cloud.google.com/**
2. Apne Google account se sign in karo

### **Step 2: Project banao**
1. Top par "Select a project" dropdown click karo
2. "New Project" click karo
3. Project name: **"Alpha Freight"** (ya kuch bhi)
4. "Create" button click karo
5. Project select karo

### **Step 3: Billing enable karo (Important!)**
1. Left menu se **"Billing"** click karo
2. "Link a billing account" click karo
3. Apna payment method add karo (Credit/Debit card)
4. **Note:** Google har mahine **$200 FREE credit** deta hai
   - Small businesses ke liye usually FREE hi rehta hai
   - Sirf tab charge hota hai jab $200/month se zyada use karo

### **Step 4: Maps JavaScript API enable karo**
1. Left menu se **"APIs & Services"** → **"Library"** click karo
2. Search box mein type karo: **"Maps JavaScript API"**
3. "Maps JavaScript API" click karo
4. **"ENABLE"** button click karo

### **Step 5: API Key banao**
1. Left menu se **"APIs & Services"** → **"Credentials"** click karo
2. Top par **"Create Credentials"** → **"API Key"** click karo
3. API key generate ho jayega (aisa dikhega: `AIzaSy...`)
4. **Copy karo** yeh key (important!)

### **Step 6: API Key ko secure karo (Optional but recommended)**
1. Apni API key par click karo (edit karne ke liye)
2. **"Key restrictions"** section mein:
   - **Application restrictions:** "HTTP referrers (web sites)" select karo
   - Apne domains add karo:
     - `localhost/*`
     - `file:///*` (local testing ke liye)
     - `yourdomain.com/*` (production ke liye)
   - **API restrictions:** "Restrict key" select karo
   - **"Maps JavaScript API"** select karo
3. **"Save"** click karo

### **Step 7: API Key ko code mein add karo**

**Option A: Config file mein (Recommended)**
- File: `assets/js/google-maps-config.js`
- API key yahan add karo

**Option B: Direct file mein**
- File: `mobile-app/carrier/share-location.html`
- Line mein API key paste karo

---

## 💰 Cost Information:

- **FREE:** $200 credit har mahine
- **Charges:** Sirf tab jab $200/month se zyada use karo
- **Small apps:** Usually FREE hi rehta hai
- **Monitor:** Google Cloud Console mein usage dekh sakte ho

---

## 🔒 Security Tips:

1. ✅ API key ko restrict karo (specific domains ke liye)
2. ✅ Production mein HTTPS use karo
3. ✅ Usage monitor karte raho
4. ✅ Billing alerts set karo

---

## 🧪 Testing:

1. API key add karne ke baad
2. Share location page kholo
3. Map load hona chahiye
4. Agar error aaye to browser console check karo

---

## ❓ Troubleshooting:

**Map load nahi ho raha?**
- API key sahi hai ya nahi check karo
- Browser console mein errors dekh lo
- API key restrictions check karo

**"API key not valid" error?**
- API key copy-paste sahi se hua hai ya nahi
- Maps JavaScript API enable hai ya nahi
- Billing account linked hai ya nahi

---

## 📝 Quick Reference:

**API Key Format:** `AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXX`

**Where to add:** 
- `assets/js/google-maps-config.js` (recommended)
- Ya direct `share-location.html` mein

**Test URL:** `mobile-app/carrier/share-location.html`
