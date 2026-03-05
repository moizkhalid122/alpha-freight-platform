# Email Templates Usage Guide

## Overview
Professional email templates for Alpha Freight subscription and insurance notifications.

## Template IDs

### Available Templates:
1. **SUBSCRIPTION_RENEWAL_REMINDER** - Reminds carriers about upcoming subscription renewal
2. **SUBSCRIPTION_ACTIVATED** - Sent when subscription is successfully activated
3. **SUBSCRIPTION_EXPIRED** - Sent when subscription expires
4. **SUBSCRIPTION_CANCELLED** - Sent when subscription is cancelled
5. **INSURANCE_RENEWAL_REMINDER** - Reminds carriers about insurance expiry
6. **PAYMENT_FAILED** - Sent when payment processing fails

## API Usage

### Endpoint: `POST /api/send-notification`

#### Request Body:
```json
{
  "email": "carrier@example.com",
  "templateId": "SUBSCRIPTION_RENEWAL_REMINDER",
  "data": {
    "carrierName": "John Doe",
    "planName": "Verified Pro",
    "renewalDate": "2024-02-15",
    "amount": "49.99",
    "currency": "£",
    "daysUntilRenewal": 7,
    "manageUrl": "https://alphafreight.com/carrier/verification.html"
  }
}
```

## Template-Specific Data Requirements

### 1. SUBSCRIPTION_RENEWAL_REMINDER
```javascript
{
  carrierName: "John Doe",           // Optional
  planName: "Verified Pro",          // Required
  renewalDate: "2024-02-15",         // Required (format: YYYY-MM-DD)
  amount: "49.99",                   // Required
  currency: "£",                      // Optional (default: £)
  daysUntilRenewal: 7,               // Optional (default: 7)
  manageUrl: "https://..."           // Optional
}
```

### 2. SUBSCRIPTION_ACTIVATED
```javascript
{
  carrierName: "John Doe",           // Optional
  planName: "Verified Enterprise",   // Required
  amount: "99.99",                   // Required
  currency: "£",                      // Optional
  nextBillingDate: "2024-03-15",    // Optional
  dashboardUrl: "https://..."        // Optional
}
```

### 3. SUBSCRIPTION_EXPIRED
```javascript
{
  carrierName: "John Doe",           // Optional
  planName: "Verified Pro",          // Required
  expiredDate: "2024-02-01",         // Required
  renewUrl: "https://..."            // Optional
}
```

### 4. SUBSCRIPTION_CANCELLED
```javascript
{
  carrierName: "John Doe",           // Optional
  planName: "Verified Basic",        // Required
  cancellationDate: "2024-02-10",    // Required
  accessUntilDate: "2024-02-15",     // Optional
  reactivateUrl: "https://..."       // Optional
}
```

### 5. INSURANCE_RENEWAL_REMINDER
```javascript
{
  carrierName: "John Doe",           // Optional
  expiryDate: "2024-03-01",          // Required
  daysRemaining: 30,                 // Required
  policyNumber: "POL-12345",         // Optional
  profileUrl: "https://..."          // Optional
}
```

### 6. PAYMENT_FAILED
```javascript
{
  carrierName: "John Doe",           // Optional
  planName: "Verified Pro",          // Required
  amount: "49.99",                   // Required
  currency: "£",                      // Optional
  failureReason: "Insufficient funds", // Optional
  retryDate: "2024-02-12",           // Optional
  updatePaymentUrl: "https://..."    // Optional
}
```

## Example Usage in Code

### Node.js/Express Example:
```javascript
const axios = require('axios');

// Send subscription renewal reminder
async function sendRenewalReminder(carrierEmail, carrierData) {
  try {
    const response = await axios.post('http://localhost:3000/api/send-notification', {
      email: carrierEmail,
      templateId: 'SUBSCRIPTION_RENEWAL_REMINDER',
      data: {
        carrierName: carrierData.name,
        planName: carrierData.plan,
        renewalDate: carrierData.renewalDate,
        amount: carrierData.amount,
        currency: '£',
        daysUntilRenewal: carrierData.daysUntilRenewal,
        manageUrl: 'https://alphafreight.com/carrier/verification.html'
      }
    });
    
    console.log('Email sent:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error sending email:', error.response?.data || error.message);
    throw error;
  }
}
```

### Direct Template Usage:
```javascript
const emailTemplates = require('./email-templates');

// Get HTML directly
const html = emailTemplates.getSubscriptionRenewalReminderTemplate({
  carrierName: "John Doe",
  planName: "Verified Pro",
  renewalDate: "2024-02-15",
  amount: "49.99",
  currency: "£",
  daysUntilRenewal: 7
});

// Then send using your email service
await sendEmail({
  to: 'carrier@example.com',
  subject: 'Subscription Renewal Reminder',
  html: html
});
```

## Backward Compatibility

The API still supports the old `type` parameter format:
```json
{
  "email": "carrier@example.com",
  "type": "subscription_renewal_reminder",
  "data": { ... }
}
```

Old types are automatically mapped to new template IDs:
- `subscription_renewal_reminder` → `SUBSCRIPTION_RENEWAL_REMINDER`
- `subscription_expired` → `SUBSCRIPTION_EXPIRED`
- `subscription_activated` → `SUBSCRIPTION_ACTIVATED`
- `subscription_cancelled` → `SUBSCRIPTION_CANCELLED`
- `insurance_renewal_reminder` → `INSURANCE_RENEWAL_REMINDER`
- `payment_failed` → `PAYMENT_FAILED`

## Testing

### Test Email Sending:
```bash
curl -X POST http://localhost:3000/api/send-notification \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "templateId": "SUBSCRIPTION_RENEWAL_REMINDER",
    "data": {
      "carrierName": "Test Carrier",
      "planName": "Verified Pro",
      "renewalDate": "2024-02-15",
      "amount": "49.99",
      "daysUntilRenewal": 7
    }
  }'
```

## Notes

- All templates are responsive and work on mobile devices
- Templates use inline CSS for maximum email client compatibility
- Colors match Alpha Freight brand (Blue/Purple gradient)
- All templates include proper footer with company information
- Template IDs are case-sensitive
