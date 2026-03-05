# 🔑 Render mein Stripe Key Update Karne Ka Guide

## ⚠️ Problem
Console error: "Expired API Key provided: sk_live_..."
Backend server (Render) par purana expired key hai.

## ✅ Solution
Render dashboard mein `STRIPE_SECRET_KEY` environment variable update karo.

---

## 📋 Step-by-Step (Visual Guide)

### Step 1: Render Dashboard
1. Browser mein jao: https://dashboard.render.com
2. Login karo (GitHub se ya email se)

### Step 2: Service Dhoondho
1. Dashboard par **"Services"** section dikhega
2. List mein **"alpha-freight-server"** (ya jo naam ho) dhoondho
3. Us par **click karo**

### Step 3: Environment Tab
Service page par **top mein tabs** honge:
```
[Overview] [Logs] [Metrics] [Environment] [Settings] [Events]
                                    ↑
                            YAHAN CLICK KARO
```

### Step 4: Environment Variables Table
Environment tab open hoga, wahan **table** dikhega:

```
┌─────────────────────┬─────────────────────────────────────────────┐
│ KEY                 │ VALUE                                        │
├─────────────────────┼─────────────────────────────────────────────┤
│ PORT                │ 3000                                         │
│ NODE_ENV            │ production                                   │
│ STRIPE_SECRET_KEY   │ sk_live_OLD_KEY...  ← YAHAN EDIT KARO      │
└─────────────────────┴─────────────────────────────────────────────┘
```

### Step 5: Edit Variable
1. `STRIPE_SECRET_KEY` row ke **right side** par **"Edit"** ya **pencil icon** dikhega
2. Click karo
3. Value field mein **purana key delete karo**
4. **Naya key paste karo:**
   ```
   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
   ```
5. **"Save"** ya **"Update"** button click karo

### Step 6: Service Restart
- Save ke baad Render **automatically redeploy** karega
- Ya manually: **"Manual Deploy"** → **"Clear build cache & deploy"**

---

## 🔄 Alternative: Settings Tab

Agar **Environment tab** nahi dikh raha:

1. Service page par **"Settings"** tab click karo
2. Scroll down karo
3. **"Environment Variables"** section dikhega
4. Wahan se add/edit karo

---

## ✅ Verification

Update ke baad verify karo:

1. **Logs check karo:**
   - Service page → **"Logs"** tab
   - Agar error nahi dikh raha = Success ✅

2. **Payment test karo:**
   - Supplier paynow page open karo
   - Card payment try karo
   - Agar error nahi aata = Working ✅

---

## 🆘 Agar Abhi Bhi Nahi Ho Raha

### Option 1: Render Support
- Render dashboard → Help → Contact Support
- Unhe batao: "Need to update STRIPE_SECRET_KEY environment variable"

### Option 2: New Service Create Karo
1. Render → "New +" → "Web Service"
2. Same settings use karo
3. Environment variables mein **naya key** add karo
4. Deploy karo

### Option 3: Render CLI Use Karo
```bash
# Install Render CLI
npm install -g render-cli

# Login
render login

# Update environment variable
render env:set STRIPE_SECRET_KEY=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 --service alpha-freight-server
```

---

## 📝 Important Notes

1. **Secret Key** = Backend mein (Render)
2. **Publishable Key** = Frontend mein (paynow.html) - Already updated ✅
3. **Don't commit** secret keys to GitHub
4. **Always use** environment variables for secrets

---

## ✅ Checklist

- [ ] Render dashboard open kiya
- [ ] Service select kiya
- [ ] Environment tab open kiya
- [ ] STRIPE_SECRET_KEY edit kiya
- [ ] Naya key paste kiya
- [ ] Save kiya
- [ ] Service redeploy hua
- [ ] Logs check kiye (no errors)
- [ ] Payment test kiya (working)

---

**After update:** Console error resolve ho jayega aur payment kaam karega! ✅
