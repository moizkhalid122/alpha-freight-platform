// Email Templates for Alpha Freight
// Usage: Import this file and use the template functions

/**
 * Base email template wrapper
 */
function getBaseEmailTemplate(content, title = 'Alpha Freight') {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
      <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f5f5f5;">
        <tr>
          <td align="center" style="padding: 40px 20px;">
            <table role="presentation" style="max-width: 600px; width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
              <!-- Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #2563EB 0%, #6366F1 50%, #8B5CF6 100%); padding: 40px 30px; text-align: center;">
                  <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">Alpha Freight</h1>
                  <p style="margin: 8px 0 0 0; color: rgba(255, 255, 255, 0.9); font-size: 14px; font-weight: 400;">Your Trusted Freight Partner</p>
                </td>
              </tr>
              
              <!-- Content -->
              <tr>
                <td style="padding: 40px 30px;">
                  ${content}
                </td>
              </tr>
              
              <!-- Footer -->
              <tr>
                <td style="background-color: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
                  <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
                    <strong>Alpha Freight</strong><br>
                    Your trusted partner for freight and logistics solutions
                  </p>
                  <p style="margin: 20px 0 0 0; color: #9ca3af; font-size: 12px;">
                    © ${new Date().getFullYear()} Alpha Freight. All rights reserved.<br>
                    This is an automated email. Please do not reply to this message.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}

/**
 * Template ID: SUBSCRIPTION_RENEWAL_REMINDER
 * Subscription renewal reminder email
 */
function getSubscriptionRenewalReminderTemplate(data) {
  const { carrierName, planName, renewalDate, amount, currency = '£' } = data;
  const daysUntilRenewal = data.daysUntilRenewal || 7;
  
  const content = `
    <div style="text-align: center; margin-bottom: 30px;">
      <div style="width: 80px; height: 80px; margin: 0 auto 20px; background: linear-gradient(135deg, #F59E0B 0%, #D97706 100%); border-radius: 50%; display: flex; align-items: center; justify-content: center;">
        <span style="font-size: 40px;">⏰</span>
      </div>
      <h2 style="margin: 0 0 10px 0; color: #1f2937; font-size: 24px; font-weight: 700;">Subscription Renewal Reminder</h2>
      <p style="margin: 0; color: #6b7280; font-size: 16px;">Your subscription will renew soon</p>
    </div>
    
    <div style="background-color: #fef3c7; border-left: 4px solid #F59E0B; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
      <p style="margin: 0; color: #92400e; font-size: 15px; line-height: 1.6;">
        <strong>Hello ${carrierName || 'Valued Carrier'},</strong><br><br>
        Your <strong>${planName}</strong> subscription will automatically renew in <strong>${daysUntilRenewal} day${daysUntilRenewal > 1 ? 's' : ''}</strong> on <strong>${renewalDate}</strong>.
      </p>
    </div>
    
    <div style="background-color: #f8f9fa; border-radius: 8px; padding: 25px; margin-bottom: 30px;">
      <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Plan:</td>
          <td style="padding: 8px 0; text-align: right; color: #1f2937; font-size: 14px; font-weight: 600;">${planName}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Renewal Date:</td>
          <td style="padding: 8px 0; text-align: right; color: #1f2937; font-size: 14px; font-weight: 600;">${renewalDate}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Amount:</td>
          <td style="padding: 8px 0; text-align: right; color: #1f2937; font-size: 18px; font-weight: 700;">${currency}${amount}</td>
        </tr>
      </table>
    </div>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${data.manageUrl || 'https://alphafreight.com/carrier/verification.html'}" 
         style="display: inline-block; background: linear-gradient(135deg, #2563EB 0%, #6366F1 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(37, 99, 235, 0.3);">
        Manage Subscription
      </a>
    </div>
    
    <p style="margin: 20px 0 0 0; color: #6b7280; font-size: 14px; line-height: 1.6; text-align: center;">
      If you wish to cancel or change your plan, please visit your account settings before the renewal date.
    </p>
  `;
  
  return getBaseEmailTemplate(content, 'Subscription Renewal Reminder - Alpha Freight');
}

/**
 * Template ID: SUBSCRIPTION_ACTIVATED
 * Subscription activated successfully
 */
function getSubscriptionActivatedTemplate(data) {
  const { carrierName, planName, amount, currency = '£', nextBillingDate } = data;
  
  const content = `
    <div style="text-align: center; margin-bottom: 30px;">
      <div style="width: 80px; height: 80px; margin: 0 auto 20px; background: linear-gradient(135deg, #10B981 0%, #059669 100%); border-radius: 50%; display: flex; align-items: center; justify-content: center;">
        <span style="font-size: 40px;">✓</span>
      </div>
      <h2 style="margin: 0 0 10px 0; color: #1f2937; font-size: 24px; font-weight: 700;">Subscription Activated!</h2>
      <p style="margin: 0; color: #6b7280; font-size: 16px;">Welcome to ${planName}</p>
    </div>
    
    <div style="background-color: #d1fae5; border-left: 4px solid #10B981; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
      <p style="margin: 0; color: #065f46; font-size: 15px; line-height: 1.6;">
        <strong>Hello ${carrierName || 'Valued Carrier'},</strong><br><br>
        Congratulations! Your <strong>${planName}</strong> subscription has been successfully activated. You now have access to all premium features.
      </p>
    </div>
    
    <div style="background-color: #f8f9fa; border-radius: 8px; padding: 25px; margin-bottom: 30px;">
      <h3 style="margin: 0 0 20px 0; color: #1f2937; font-size: 18px; font-weight: 600;">Subscription Details</h3>
      <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Plan:</td>
          <td style="padding: 8px 0; text-align: right; color: #1f2937; font-size: 14px; font-weight: 600;">${planName}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Amount:</td>
          <td style="padding: 8px 0; text-align: right; color: #1f2937; font-size: 18px; font-weight: 700;">${currency}${amount}</td>
        </tr>
        ${nextBillingDate ? `
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Next Billing:</td>
          <td style="padding: 8px 0; text-align: right; color: #1f2937; font-size: 14px; font-weight: 600;">${nextBillingDate}</td>
        </tr>
        ` : ''}
      </table>
    </div>
    
    <div style="background-color: #eff6ff; border-radius: 8px; padding: 20px; margin-bottom: 30px;">
      <h3 style="margin: 0 0 15px 0; color: #1e40af; font-size: 16px; font-weight: 600;">What's Next?</h3>
      <ul style="margin: 0; padding-left: 20px; color: #1e3a8a; font-size: 14px; line-height: 1.8;">
        <li>Access priority load matching</li>
        <li>View detailed analytics dashboard</li>
        <li>Get verified badge on your profile</li>
        <li>Enjoy exclusive carrier benefits</li>
      </ul>
    </div>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${data.dashboardUrl || 'https://alphafreight.com/carrier/analytics-verified.html'}" 
         style="display: inline-block; background: linear-gradient(135deg, #2563EB 0%, #6366F1 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(37, 99, 235, 0.3);">
        View Analytics Dashboard
      </a>
    </div>
  `;
  
  return getBaseEmailTemplate(content, 'Subscription Activated - Alpha Freight');
}

/**
 * Template ID: SUBSCRIPTION_EXPIRED
 * Subscription expired notification
 */
function getSubscriptionExpiredTemplate(data) {
  const { carrierName, planName, expiredDate } = data;
  
  const content = `
    <div style="text-align: center; margin-bottom: 30px;">
      <div style="width: 80px; height: 80px; margin: 0 auto 20px; background: linear-gradient(135deg, #EF4444 0%, #DC2626 100%); border-radius: 50%; display: flex; align-items: center; justify-content: center;">
        <span style="font-size: 40px;">⚠️</span>
      </div>
      <h2 style="margin: 0 0 10px 0; color: #1f2937; font-size: 24px; font-weight: 700;">Subscription Expired</h2>
      <p style="margin: 0; color: #6b7280; font-size: 16px;">Your subscription has ended</p>
    </div>
    
    <div style="background-color: #fee2e2; border-left: 4px solid #EF4444; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
      <p style="margin: 0; color: #991b1b; font-size: 15px; line-height: 1.6;">
        <strong>Hello ${carrierName || 'Valued Carrier'},</strong><br><br>
        Your <strong>${planName}</strong> subscription expired on <strong>${expiredDate}</strong>. You no longer have access to premium features.
      </p>
    </div>
    
    <div style="background-color: #f8f9fa; border-radius: 8px; padding: 25px; margin-bottom: 30px;">
      <h3 style="margin: 0 0 15px 0; color: #1f2937; font-size: 18px; font-weight: 600;">What happens now?</h3>
      <ul style="margin: 0; padding-left: 20px; color: #4b5563; font-size: 14px; line-height: 1.8;">
        <li>Premium features are no longer available</li>
        <li>Your verified badge has been removed</li>
        <li>Priority load matching is disabled</li>
        <li>Analytics dashboard access is restricted</li>
      </ul>
    </div>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${data.renewUrl || 'https://alphafreight.com/carrier/verification.html'}" 
         style="display: inline-block; background: linear-gradient(135deg, #2563EB 0%, #6366F1 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(37, 99, 235, 0.3);">
        Renew Subscription
      </a>
    </div>
    
    <p style="margin: 20px 0 0 0; color: #6b7280; font-size: 14px; line-height: 1.6; text-align: center;">
      Don't miss out on premium features! Renew your subscription to continue enjoying priority matching and analytics.
    </p>
  `;
  
  return getBaseEmailTemplate(content, 'Subscription Expired - Alpha Freight');
}

/**
 * Template ID: SUBSCRIPTION_CANCELLED
 * Subscription cancelled notification
 */
function getSubscriptionCancelledTemplate(data) {
  const { carrierName, planName, cancellationDate, accessUntilDate } = data;
  
  const content = `
    <div style="text-align: center; margin-bottom: 30px;">
      <div style="width: 80px; height: 80px; margin: 0 auto 20px; background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%); border-radius: 50%; display: flex; align-items: center; justify-content: center;">
        <span style="font-size: 40px;">ℹ️</span>
      </div>
      <h2 style="margin: 0 0 10px 0; color: #1f2937; font-size: 24px; font-weight: 700;">Subscription Cancelled</h2>
      <p style="margin: 0; color: #6b7280; font-size: 16px;">Your subscription has been cancelled</p>
    </div>
    
    <div style="background-color: #f3f4f6; border-left: 4px solid #6b7280; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
      <p style="margin: 0; color: #374151; font-size: 15px; line-height: 1.6;">
        <strong>Hello ${carrierName || 'Valued Carrier'},</strong><br><br>
        Your <strong>${planName}</strong> subscription has been cancelled on <strong>${cancellationDate}</strong>.
        ${accessUntilDate ? `You will continue to have access to premium features until <strong>${accessUntilDate}</strong>.` : ''}
      </p>
    </div>
    
    <div style="background-color: #f8f9fa; border-radius: 8px; padding: 25px; margin-bottom: 30px;">
      <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Plan:</td>
          <td style="padding: 8px 0; text-align: right; color: #1f2937; font-size: 14px; font-weight: 600;">${planName}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Cancelled On:</td>
          <td style="padding: 8px 0; text-align: right; color: #1f2937; font-size: 14px; font-weight: 600;">${cancellationDate}</td>
        </tr>
        ${accessUntilDate ? `
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Access Until:</td>
          <td style="padding: 8px 0; text-align: right; color: #1f2937; font-size: 14px; font-weight: 600;">${accessUntilDate}</td>
        </tr>
        ` : ''}
      </table>
    </div>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${data.reactivateUrl || 'https://alphafreight.com/carrier/verification.html'}" 
         style="display: inline-block; background: linear-gradient(135deg, #2563EB 0%, #6366F1 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(37, 99, 235, 0.3);">
        Reactivate Subscription
      </a>
    </div>
    
    <p style="margin: 20px 0 0 0; color: #6b7280; font-size: 14px; line-height: 1.6; text-align: center;">
      We're sorry to see you go! If you change your mind, you can reactivate your subscription anytime.
    </p>
  `;
  
  return getBaseEmailTemplate(content, 'Subscription Cancelled - Alpha Freight');
}

/**
 * Template ID: INSURANCE_RENEWAL_REMINDER
 * Insurance renewal reminder
 */
function getInsuranceRenewalReminderTemplate(data) {
  const { carrierName, expiryDate, daysRemaining, policyNumber } = data;
  
  const content = `
    <div style="text-align: center; margin-bottom: 30px;">
      <div style="width: 80px; height: 80px; margin: 0 auto 20px; background: linear-gradient(135deg, #F59E0B 0%, #D97706 100%); border-radius: 50%; display: flex; align-items: center; justify-content: center;">
        <span style="font-size: 40px;">🛡️</span>
      </div>
      <h2 style="margin: 0 0 10px 0; color: #1f2937; font-size: 24px; font-weight: 700;">Insurance Renewal Reminder</h2>
      <p style="margin: 0; color: #6b7280; font-size: 16px;">Your insurance is expiring soon</p>
    </div>
    
    <div style="background-color: #fef3c7; border-left: 4px solid #F59E0B; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
      <p style="margin: 0; color: #92400e; font-size: 15px; line-height: 1.6;">
        <strong>Hello ${carrierName || 'Valued Carrier'},</strong><br><br>
        Your insurance policy will expire in <strong>${daysRemaining} day${daysRemaining > 1 ? 's' : ''}</strong> on <strong>${expiryDate}</strong>. Please renew your insurance to maintain your verified carrier status.
      </p>
    </div>
    
    <div style="background-color: #f8f9fa; border-radius: 8px; padding: 25px; margin-bottom: 30px;">
      <h3 style="margin: 0 0 20px 0; color: #1f2937; font-size: 18px; font-weight: 600;">Insurance Details</h3>
      <table role="presentation" style="width: 100%; border-collapse: collapse;">
        ${policyNumber ? `
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Policy Number:</td>
          <td style="padding: 8px 0; text-align: right; color: #1f2937; font-size: 14px; font-weight: 600;">${policyNumber}</td>
        </tr>
        ` : ''}
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Expiry Date:</td>
          <td style="padding: 8px 0; text-align: right; color: #1f2937; font-size: 14px; font-weight: 600;">${expiryDate}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Days Remaining:</td>
          <td style="padding: 8px 0; text-align: right; color: #EF4444; font-size: 14px; font-weight: 700;">${daysRemaining} day${daysRemaining > 1 ? 's' : ''}</td>
        </tr>
      </table>
    </div>
    
    <div style="background-color: #fee2e2; border-radius: 8px; padding: 15px; margin-bottom: 30px;">
      <p style="margin: 0; color: #991b1b; font-size: 13px; line-height: 1.6;">
        <strong>⚠️ Important:</strong> If your insurance expires, your verified carrier status will be suspended until you upload a renewed insurance document.
      </p>
    </div>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${data.profileUrl || 'https://alphafreight.com/carrier/profile.html'}" 
         style="display: inline-block; background: linear-gradient(135deg, #2563EB 0%, #6366F1 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(37, 99, 235, 0.3);">
        Upload Renewed Insurance
      </a>
    </div>
    
    <p style="margin: 20px 0 0 0; color: #6b7280; font-size: 14px; line-height: 1.6; text-align: center;">
      Please upload your renewed insurance document before the expiry date to avoid any interruption in service.
    </p>
  `;
  
  return getBaseEmailTemplate(content, 'Insurance Renewal Reminder - Alpha Freight');
}

/**
 * Template ID: PAYMENT_FAILED
 * Payment failed notification
 */
function getPaymentFailedTemplate(data) {
  const { carrierName, planName, amount, currency = '£', failureReason, retryDate } = data;
  
  const content = `
    <div style="text-align: center; margin-bottom: 30px;">
      <div style="width: 80px; height: 80px; margin: 0 auto 20px; background: linear-gradient(135deg, #EF4444 0%, #DC2626 100%); border-radius: 50%; display: flex; align-items: center; justify-content: center;">
        <span style="font-size: 40px;">❌</span>
      </div>
      <h2 style="margin: 0 0 10px 0; color: #1f2937; font-size: 24px; font-weight: 700;">Payment Failed</h2>
      <p style="margin: 0; color: #6b7280; font-size: 16px;">We couldn't process your payment</p>
    </div>
    
    <div style="background-color: #fee2e2; border-left: 4px solid #EF4444; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
      <p style="margin: 0; color: #991b1b; font-size: 15px; line-height: 1.6;">
        <strong>Hello ${carrierName || 'Valued Carrier'},</strong><br><br>
        We were unable to process your payment of <strong>${currency}${amount}</strong> for your <strong>${planName}</strong> subscription.
        ${failureReason ? `Reason: <strong>${failureReason}</strong>` : ''}
      </p>
    </div>
    
    <div style="background-color: #f8f9fa; border-radius: 8px; padding: 25px; margin-bottom: 30px;">
      <h3 style="margin: 0 0 20px 0; color: #1f2937; font-size: 18px; font-weight: 600;">Payment Details</h3>
      <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Plan:</td>
          <td style="padding: 8px 0; text-align: right; color: #1f2937; font-size: 14px; font-weight: 600;">${planName}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Amount:</td>
          <td style="padding: 8px 0; text-align: right; color: #1f2937; font-size: 18px; font-weight: 700;">${currency}${amount}</td>
        </tr>
        ${retryDate ? `
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Next Retry:</td>
          <td style="padding: 8px 0; text-align: right; color: #1f2937; font-size: 14px; font-weight: 600;">${retryDate}</td>
        </tr>
        ` : ''}
      </table>
    </div>
    
    <div style="background-color: #eff6ff; border-radius: 8px; padding: 15px; margin-bottom: 30px;">
      <p style="margin: 0; color: #1e40af; font-size: 13px; line-height: 1.6;">
        <strong>💡 What to do:</strong><br>
        • Check your payment method details<br>
        • Ensure sufficient funds are available<br>
        • Update your payment method if needed
      </p>
    </div>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${data.updatePaymentUrl || 'https://alphafreight.com/carrier/verification.html'}" 
         style="display: inline-block; background: linear-gradient(135deg, #2563EB 0%, #6366F1 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(37, 99, 235, 0.3);">
        Update Payment Method
      </a>
    </div>
    
    <p style="margin: 20px 0 0 0; color: #6b7280; font-size: 14px; line-height: 1.6; text-align: center;">
      Please update your payment method to avoid service interruption. Your subscription will be suspended if payment fails.
    </p>
  `;
  
  return getBaseEmailTemplate(content, 'Payment Failed - Alpha Freight');
}

// Export all templates
module.exports = {
  // Template IDs
  TEMPLATE_IDS: {
    SUBSCRIPTION_RENEWAL_REMINDER: 'SUBSCRIPTION_RENEWAL_REMINDER',
    SUBSCRIPTION_ACTIVATED: 'SUBSCRIPTION_ACTIVATED',
    SUBSCRIPTION_EXPIRED: 'SUBSCRIPTION_EXPIRED',
    SUBSCRIPTION_CANCELLED: 'SUBSCRIPTION_CANCELLED',
    INSURANCE_RENEWAL_REMINDER: 'INSURANCE_RENEWAL_REMINDER',
    PAYMENT_FAILED: 'PAYMENT_FAILED'
  },
  
  // Template functions
  getSubscriptionRenewalReminderTemplate,
  getSubscriptionActivatedTemplate,
  getSubscriptionExpiredTemplate,
  getSubscriptionCancelledTemplate,
  getInsuranceRenewalReminderTemplate,
  getPaymentFailedTemplate,
  
  // Helper function to get template by ID
  getTemplateById: (templateId, data) => {
    const templates = {
      'SUBSCRIPTION_RENEWAL_REMINDER': getSubscriptionRenewalReminderTemplate,
      'SUBSCRIPTION_ACTIVATED': getSubscriptionActivatedTemplate,
      'SUBSCRIPTION_EXPIRED': getSubscriptionExpiredTemplate,
      'SUBSCRIPTION_CANCELLED': getSubscriptionCancelledTemplate,
      'INSURANCE_RENEWAL_REMINDER': getInsuranceRenewalReminderTemplate,
      'PAYMENT_FAILED': getPaymentFailedTemplate
    };
    
    const templateFunction = templates[templateId];
    if (!templateFunction) {
      throw new Error(`Template with ID "${templateId}" not found`);
    }
    
    return templateFunction(data);
  }
};
