/**
 * Email Service
 * Handles sending emails via SMTP using nodemailer
 */

import nodemailer from 'nodemailer';
import { loadEmailTemplate, TemplateVariables } from '../utils/emailTemplateLoader.js';

// Email configuration from environment variables
// Support both SMTP_* and MAIL_* variable names for flexibility
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || process.env.MAIL_ADMIN || '';
const SMTP_USER = process.env.SMTP_USER || process.env.MAIL_USER || '';
const SMTP_PASS = process.env.SMTP_PASS || process.env.MAIL_PASS || '';
const SMTP_HOST = process.env.SMTP_HOST || process.env.MAIL_HOST || 'smtp.gmail.com';
const SMTP_PORT = parseInt(process.env.SMTP_PORT || process.env.MAIL_PORT || '587', 10);
const ADMIN_PANEL_URL = process.env.ADMIN_PANEL_URL || 'http://localhost:8080/admin';

// Validate email configuration
function validateEmailConfig(): boolean {
  if (!ADMIN_EMAIL || !SMTP_USER || !SMTP_PASS) {
    console.warn('⚠️ Email service not configured. Missing required environment variables:');
    if (!ADMIN_EMAIL) console.warn('   - ADMIN_EMAIL');
    if (!SMTP_USER) console.warn('   - SMTP_USER');
    if (!SMTP_PASS) console.warn('   - SMTP_PASS');
    return false;
  }
  return true;
}

// Create reusable transporter
let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter | null {
  if (!validateEmailConfig()) {
    return null;
  }

  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_PORT === 465, // true for 465, false for other ports
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
    });
  }

  return transporter;
}

/**
 * Send email to admin using a template
 * @param subject - Email subject line
 * @param templateName - Name of the template (without .html extension)
 * @param variables - Variables to inject into the template
 * @returns Promise that resolves when email is sent
 */
export async function sendAdminMail(
  subject: string,
  templateName: string,
  variables: TemplateVariables = {}
): Promise<void> {
  try {
    // Validate configuration
    if (!validateEmailConfig()) {
      console.warn('📧 Email not sent - email service not configured');
      return;
    }

    const emailTransporter = getTransporter();
    if (!emailTransporter) {
      throw new Error('Email transporter not available');
    }

    // Add default variables
    const allVariables: TemplateVariables = {
      ...variables,
      currentYear: new Date().getFullYear().toString(),
      adminPanelUrl: ADMIN_PANEL_URL,
    };

    // Load and process template
    const html = await loadEmailTemplate(templateName, allVariables);

    // Send email
    const info = await emailTransporter.sendMail({
      from: `"FreeMediaBuzz Platform" <${SMTP_USER}>`,
      to: ADMIN_EMAIL,
      subject,
      html,
    });

    console.log(`📧 Email sent successfully to ${ADMIN_EMAIL}`);
    console.log(`   Subject: ${subject}`);
    console.log(`   Template: ${templateName}`);
    console.log(`   Message ID: ${info.messageId}`);
  } catch (error: any) {
    console.error('❌ Failed to send email:', error.message);
    // Don't throw - email failures shouldn't break the application
    // Log error for debugging
    if (error.code === 'EAUTH') {
      console.error('   Authentication failed. Check SMTP credentials.');
    } else if (error.code === 'ECONNECTION') {
      console.error('   Connection failed. Check SMTP host and port.');
    }
  }
}

/**
 * Test email configuration
 * Sends a test email to verify SMTP settings
 */
export async function testEmailConfig(): Promise<boolean> {
  try {
    if (!validateEmailConfig()) {
      return false;
    }

    const emailTransporter = getTransporter();
    if (!emailTransporter) {
      return false;
    }

    // Verify connection
    await emailTransporter.verify();
    console.log('✅ Email service configuration is valid');

    // Send test email
    await sendAdminMail(
      'Test Email - Email Service Configuration',
      'creatorSignup',
      {
        name: 'Test User',
        email: 'test@example.com',
        date: new Date().toLocaleString(),
        status: 'test',
      }
    );

    return true;
  } catch (error: any) {
    console.error('❌ Email configuration test failed:', error.message);
    return false;
  }
}
