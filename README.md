# Alpha Freight OTP Email Verification Server

## Setup Instructions

### 1. Install Dependencies
```bash
cd server
npm install
```

### 2. Configure Email Settings
Create a `.env` file in the `server` folder:

```
PORT=3000
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
```

### 3. Gmail App Password Setup (Recommended)
1. Go to your Google Account: https://myaccount.google.com
2. Enable 2-Step Verification
3. Go to App Passwords: https://myaccount.google.com/apppasswords
4. Generate a new App Password for "Mail"
5. Use that password in `.env` file (NOT your regular Gmail password)

### 4. Start Server
```bash
npm start
```

Or for development with auto-reload:
```bash
npm run dev
```

Server will run on `http://localhost:3000`

## API Endpoints

### POST /api/send-otp
Send OTP to email address
```json
{
  "email": "user@example.com"
}
```

### POST /api/verify-otp
Verify OTP code
```json
{
  "email": "user@example.com",
  "otp": "123456"
}
```

### POST /api/check-verification
Check if email is verified
```json
{
  "email": "user@example.com"
}
```

### GET /api/health
Health check endpoint

## Alternative Email Services

### SendGrid (Recommended for Production)
Replace nodemailer config with SendGrid:
```javascript
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const msg = {
  to: email,
  from: 'noreply@alphabrokrage.co.uk',
  subject: 'Email Verification OTP',
  html: `...`
};
await sgMail.send(msg);
```

### Mailgun
```javascript
const mailgun = require('mailgun-js')({
  apiKey: process.env.MAILGUN_API_KEY,
  domain: process.env.MAILGUN_DOMAIN
});
```

## Notes
- OTP expires in 10 minutes
- Maximum 5 verification attempts per OTP
- OTPs are stored in-memory (use Redis for production)