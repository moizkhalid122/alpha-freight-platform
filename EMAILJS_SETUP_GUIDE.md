# EmailJS Setup Guide - OTP Email System

## 📧 EmailJS Kya Hai?

EmailJS ek free email service hai jo aapko frontend se directly email bhejne ki permission deta hai. Backend ki zaroorat nahi!

**Free Plan:**
- 200 emails/month FREE
- No credit card required
- Easy setup

---

## 🚀 Step-by-Step Setup

### Step 1: Account Banayein

1. **Website par jayein:**
   - https://www.emailjs.com
   - "Sign Up" button click karein

2. **Account banayein:**
   - Email address enter karein
   - Password set karein
   - Verify email karein

---

### Step 2: Email Service Add Karein (Gmail/Outlook)

1. **Dashboard par jayein:**
   - Login ke baad dashboard open hoga

2. **Email Services section:**
   - Left sidebar mein "Email Services" click karein
   - "Add New Service" button click karein

3. **Service select karein:**
   - **Gmail** (recommended) ya **Outlook** select karein
   - "Connect Account" click karein
   - Gmail/Outlook account se login karein
   - Permissions allow karein

4. **Service ID copy karein:**
   - Service add hone ke baad, **Service ID** dikhega
   - Example: `service_abc123xyz`
   - Isko copy karein (yeh `serviceId` hai)

---

### Step 3: Email Template Banayein

1. **Templates section:**
   - Left sidebar mein "Email Templates" click karein
   - "Create New Template" button click karein

2. **Template setup:**
   - **Template Name:** "Password Change OTP" (ya kuch bhi)
   - **Subject:** `Your OTP for Password Change - Alpha Freight`

3. **Email Content:**
   ```
   Hello {{user_name}},

   Your OTP for password change is: {{otp_code}}

   This OTP will expire in 10 minutes.

   If you didn't request this, please ignore this email.

   Best regards,
   Alpha Freight Team
   ```

4. **Variables add karein:**
   - Template mein yeh variables use karein:
     - `{{to_email}}` - User ka email
     - `{{otp_code}}` - 6-digit OTP
     - `{{user_name}}` - User ka naam
     - `{{app_name}}` - App ka naam

5. **Template ID copy karein:**
   - Template save ke baad, **Template ID** dikhega
   - Example: `template_xyz789abc`
   - Isko copy karein (yeh `templateId` hai)

---

### Step 4: Public Key Lein

1. **Account Settings:**
   - Top right corner mein profile icon click karein
   - "Account" ya "API Keys" select karein

2. **Public Key copy karein:**
   - "Public Key" section mein key dikhegi
   - Example: `abcdefghijklmnop123456`
   - Isko copy karein (yeh `publicKey` hai)

---

### Step 5: Code Mein Add Karein

`privacy-security.html` file mein line 999-1001 par jayein aur values replace karein:

```javascript
const EMAILJS_CONFIG = {
    serviceId: 'service_abc123xyz',      // Step 2 se Service ID
    templateId: 'template_xyz789abc',    // Step 3 se Template ID
    publicKey: 'abcdefghijklmnop123456'   // Step 4 se Public Key
};
```

---

## ✅ Testing

1. **Browser console check karein:**
   - F12 press karein
   - Console tab open karein
   - Koi error nahi aana chahiye

2. **OTP test karein:**
   - Change Password button click karein
   - Form fill karein
   - OTP email aana chahiye

---

## 🔒 Security Tips

1. **Domain Restrictions:**
   - EmailJS dashboard mein "Security" section mein
   - Apne domain add karein (example: `alphabrokrage.com`)
   - Sirf apne domain se emails send hongi

2. **Rate Limiting:**
   - Free plan: 200 emails/month
   - Agar zyada chahiye, paid plan lein

---

## 🆘 Troubleshooting

### Error: "EmailJS not configured"
- Check karein ke sabhi 3 values properly set hain
- `YOUR_SERVICE_ID`, `YOUR_TEMPLATE_ID`, `YOUR_PUBLIC_KEY` replace ho gaye hain

### Error: "EmailJS library not loaded"
- Check karein ke EmailJS script tag properly loaded hai
- Internet connection check karein

### OTP email nahi aa raha
- Spam folder check karein
- EmailJS dashboard mein "Logs" section check karein
- Template variables sahi hain ya nahi check karein

---

## 📝 Example Template Variables

EmailJS template mein yeh variables automatically replace honge:

- `{{to_email}}` → User ka email address
- `{{otp_code}}` → 6-digit OTP code
- `{{user_name}}` → User ka first name
- `{{app_name}}` → "Alpha Freight"

---

## 💰 Pricing

- **Free:** 200 emails/month
- **Starter:** $15/month - 1,000 emails
- **Professional:** $35/month - 10,000 emails

Free plan sufficient hai testing ke liye!

---

## 📞 Support

Agar koi problem ho:
- EmailJS Documentation: https://www.emailjs.com/docs/
- EmailJS Support: support@emailjs.com

---

**Note:** Console mein OTP ab show nahi hoga. Direct email par jayega! ✅

