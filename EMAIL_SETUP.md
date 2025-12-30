# Email Notification System Setup Guide

This guide will help you configure the template-based email notification system for your FreeMediaBuzz platform.

## Overview

The email notification system sends automated emails to the admin when:
1. A new creator signs up
2. A creator places a storage order

## Prerequisites

- A Gmail account (or any SMTP-compatible email service)
- Gmail App Password (for Gmail) or SMTP credentials

## Configuration Steps

### 1. Gmail Setup (Recommended)

1. **Enable 2-Factor Authentication** on your Gmail account
   - Go to Google Account settings
   - Security → 2-Step Verification → Enable

2. **Generate App Password**
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Select "Mail" and "Other (Custom name)"
   - Enter "FreeMediaBuzz" as the name
   - Copy the generated 16-character password

### 2. Environment Variables

Add the following environment variables to your `.env` file:

```env
# Email Configuration
ADMIN_EMAIL=your-admin-email@gmail.com
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password-here
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
ADMIN_PANEL_URL=https://your-domain.com/admin
```

**Important Notes:**
- `ADMIN_EMAIL`: The email address where notifications will be sent
- `SMTP_USER`: Your Gmail address (or SMTP username)
- `SMTP_PASS`: The 16-character App Password (for Gmail) or your SMTP password
- `SMTP_HOST`: `smtp.gmail.com` for Gmail (or your SMTP host)
- `SMTP_PORT`: `587` for Gmail (or `465` for SSL)
- `ADMIN_PANEL_URL`: The full URL to your admin panel

### 3. Alternative SMTP Providers

If you're not using Gmail, update the SMTP settings accordingly:

**Outlook/Hotmail:**
```env
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
```

**SendGrid:**
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
```

**Custom SMTP:**
```env
SMTP_HOST=your-smtp-server.com
SMTP_PORT=587
SMTP_USER=your-username
SMTP_PASS=your-password
```

## Email Templates

The system uses HTML templates located in the `emailTemplates/` folder:

- `creatorSignup.html` - Sent when a new creator signs up
- `newOrder.html` - Sent when a creator places an order

### Template Variables

Templates support dynamic placeholders that are replaced with actual values:

**creatorSignup.html:**
- `{{name}}` - Creator's name
- `{{email}}` - Creator's email
- `{{date}}` - Signup date
- `{{status}}` - Account status (pending/approved/rejected)
- `{{adminPanelUrl}}` - Link to admin panel
- `{{currentYear}}` - Current year

**newOrder.html:**
- `{{orderId}}` - Order ID
- `{{name}}` - Creator's name
- `{{email}}` - Creator's email
- `{{amount}}` - Order amount
- `{{date}}` - Order date
- `{{status}}` - Order status
- `{{storagePlan}}` - Storage plan (GB)
- `{{duration}}` - Duration (months)
- `{{paymentMethod}}` - Payment method
- `{{transactionId}}` - Transaction ID (for manual payments)
- `{{isManualPayment}}` - Boolean for conditional display
- `{{adminPanelUrl}}` - Link to admin panel
- `{{currentYear}}` - Current year

## Testing

To test the email configuration, you can:

1. **Create a test creator account** - This will trigger the creator signup email
2. **Place a test order** - This will trigger the new order email

The system will log email sending status in the console:
- ✅ Success: `📧 Email sent successfully to admin@example.com`
- ❌ Failure: `❌ Failed to send email: [error message]`

## Troubleshooting

### Email Not Sending

1. **Check Environment Variables**
   - Ensure all required variables are set in `.env`
   - Restart the server after adding variables

2. **Verify SMTP Credentials**
   - For Gmail: Use App Password, not your regular password
   - Check that 2FA is enabled (required for App Passwords)

3. **Check Console Logs**
   - Look for error messages in the server console
   - Common errors:
     - `EAUTH` - Authentication failed (wrong credentials)
     - `ECONNECTION` - Connection failed (wrong host/port)

4. **Firewall/Security**
   - Ensure your server can connect to SMTP servers
   - Some hosting providers block SMTP ports

### Gmail App Password Issues

- App Passwords only work with 2FA enabled
- Each App Password is 16 characters (no spaces)
- Generate a new App Password if the old one doesn't work

## Security Best Practices

1. **Never commit `.env` file** to version control
2. **Use App Passwords** instead of your main password
3. **Rotate passwords** periodically
4. **Use environment-specific** email addresses for testing

## Adding New Templates

To add a new email template:

1. Create a new HTML file in `emailTemplates/` folder
2. Use `{{variableName}}` for placeholders
3. Use `{{#if variable}}...{{/if}}` for conditional blocks
4. Call `sendAdminMail()` with the template name and variables

Example:
```typescript
await sendAdminMail(
  'Email Subject',
  'myTemplate', // template name (without .html)
  {
    variable1: 'value1',
    variable2: 'value2',
  }
);
```

## Support

For issues or questions:
- Check server console logs for detailed error messages
- Verify all environment variables are correctly set
- Test SMTP connection using email service test function
