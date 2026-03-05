# OTP Email Verification Setup Guide

## 🚀 Quick Setup

### 1. Backend Server Setup

```bash
cd server
npm install
```

### 2. Configure Email Settings

Create `.env` file in `server` folder:

```env
PORT=3000
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
```

### 3. Gmail App Password (Recommended)

1. Go to: https://myaccount.google.com
2. Enable **2-Step Verification**
3. Go to: https://myaccount.google.com/apppasswords
4. Generate App Password for "Mail"
5. Use that password in `.env` (NOT regular Gmail password)

### 4. Start Backend Server

```bash
cd server
npm start
```

Server will run on: `http://localhost:3000`

## 📧 Alternative Email Services

### Option A: SendGrid (Recommended for Production)
1. Sign up: https://sendgrid.com
2. Get API Key
3. Update `server.js` to use SendGrid instead of nodemailer

### Option B: Mailgun
1. Sign up: https://mailgun.com
2. Get API Key and Domain
3. Update `server.js` accordingly

### Option C: AWS SES
1. Setup AWS SES
2. Get SMTP credentials
3. Update `.env` with AWS SES SMTP settings

## ✅ Frontend Configuration

Both register pages are already configured:
- `pages/supplier/register.html`
- `pages/carrier/register.html`

**Important:** If your backend server runs on different URL, update this in both files:

```javascript
const API_BASE_URL = 'http://localhost:3000'; // Change this
```

## 🧪 Testing

1. Start backend server: `npm start` (in server folder)
2. Open register page
3. Enter email and click "Send OTP"
4. Check email for OTP code
5. Enter OTP and verify
6. Complete registration

## 📝 Features

- ✅ 6-digit OTP generation
- ✅ Email verification before registration
- ✅ OTP expiry (10 minutes)
- ✅ Maximum 5 verification attempts
- ✅ Resend OTP with 60-second cooldown
- ✅ Works for both Supplier and Carrier registration

## 🔧 Troubleshooting

### "Failed to connect to server"
- Make sure backend server is running
- Check if port 3000 is available
- Update `API_BASE_URL` in register pages if needed

### "Failed to send email"
- Check SMTP credentials in `.env`
- For Gmail: Make sure you're using App Password (not regular password)
- Check if 2FA is enabled on Gmail account
- Test SMTP settings with a simple email client first

### "OTP not received"
- Check spam folder
- Verify email address is correct
- Check backend server logs for errors
- Make sure SMTP configuration is correct

## 🌐 Production Deployment

1. Update `API_BASE_URL` to production server URL
2. Use proper email service (SendGrid/Mailgun/AWS SES)
3. Use environment variables for sensitive data
4. Enable HTTPS for API endpoints
5. Consider using Redis for OTP storage instead of in-memory

## 📞 Support

For issues or questions, check:
- Backend server logs
- Browser console for frontend errors
- Email service provider dashboard
