# Fix: auth/unauthorized-domain Error

## ⚠️ Error Message:
`Firebase: Error (auth/unauthorized-domain)`

Yeh error aa raha hai kyunki `127.0.0.1` domain Firebase Authentication ke authorized domains me add nahi hai.

## ✅ Solution (Step by Step):

### Step 1: Firebase Console me jayein
1. [Firebase Console](https://console.firebase.google.com/) me login karein
2. Project **"alpha-brokerage"** select karein

### Step 2: Authentication Settings me jayein
1. Left sidebar me **"Authentication"** click karein
2. Top me **"Settings"** tab click karein (Sign-in method tab nahi!)

### Step 3: Authorized Domains me `127.0.0.1` add karein
1. Page me scroll karein taake **"Authorized domains"** section dikhaye
2. "Authorized domains" section me yeh domains already honge:
   - `localhost` (by default)
   - `alpha-brokerage.firebaseapp.com`
   - `alpha-brokerage.web.app`
3. **"Add domain"** button click karein (right side pe)
4. Text box me type karein: `127.0.0.1`
5. **"Add"** button click karein
6. Domain list me `127.0.0.1` add ho jayega

### Step 4: Page Refresh Karein
1. Browser me page refresh karein (F5 ya Ctrl+R)
2. Phir "Continue with Google" button try karein

## 📍 Important Notes:

- ❌ **SMTP settings me add mat karein** - SMTP email sending ke liye hai
- ✅ **Authentication → Settings → Authorized domains** me add karein
- ✅ `localhost` by default authorized hota hai, lekin `127.0.0.1` manually add karna padta hai

## 🔍 Verify Karne Ke Liye:

Firebase Console me authorized domains list me yeh hona chahiye:
- localhost ✅
- 127.0.0.1 ✅ (aap ne add kiya)
- alpha-brokerage.firebaseapp.com ✅
- alpha-brokerage.web.app ✅

## 🎯 Alternative Solution:

Agar domain add karna mushkil ho, to browser me `localhost` use karein instead of `127.0.0.1`:
- Instead of: `http://127.0.0.1:5500/pages/supplier/register.html`
- Use: `http://localhost:5500/pages/supplier/register.html`

`localhost` by default authorized hota hai, to error nahi aayega.

