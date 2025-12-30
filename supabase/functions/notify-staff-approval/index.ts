/**
 * Supabase Edge Function: Notify Staff Approval
 * 
 * Triggered when admin approves a staff member's account.
 * Sends both EMAIL (via Resend) and SMS (via Africa's Talking).
 * 
 * Trigger: Database webhook on profiles table UPDATE
 * When: status changes from 'pending' to 'approved'
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const AFRICAS_TALKING_API_KEY = Deno.env.get('AFRICAS_TALKING_API_KEY') || '';
const AFRICAS_TALKING_USERNAME = Deno.env.get('AFRICAS_TALKING_USERNAME') || '';
const TWILIO_ACCOUNT_SID = Deno.env.get('TWILIO_ACCOUNT_SID') || '';
const TWILIO_AUTH_TOKEN = Deno.env.get('TWILIO_AUTH_TOKEN') || '';
const TWILIO_PHONE_NUMBER = Deno.env.get('TWILIO_PHONE_NUMBER') || '';
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') || '';
const OCC_PORTAL_URL = Deno.env.get('OCC_PORTAL_URL') || 'https://www.africarailways.com';

interface ApprovalPayload {
  type: 'INSERT' | 'UPDATE' | 'DELETE';
  table: string;
  record: {
    id: string;
    email: string;
    phone_number: string;
    full_name: string;
    role: string;
    status: string;
  };
  old_record?: {
    status: string;
  };
}

/**
 * Send SMS via Africa's Talking
 */
async function sendViaAfricasTalking(phoneNumber: string, message: string): Promise<boolean> {
  try {
    const response = await fetch('https://api.africastalking.com/version1/messaging', {
      method: 'POST',
      headers: {
        'apiKey': AFRICAS_TALKING_API_KEY,
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
      body: new URLSearchParams({
        username: AFRICAS_TALKING_USERNAME,
        to: phoneNumber,
        message: message,
        from: 'AFRICARAIL'
      })
    });

    const data = await response.json();
    
    if (data.SMSMessageData?.Recipients?.[0]?.status === 'Success') {
      console.log(`✅ SMS sent via Africa's Talking to ${phoneNumber}`);
      return true;
    }

    throw new Error(data.SMSMessageData?.Recipients?.[0]?.status || 'Unknown error');
  } catch (error) {
    console.error('Africa\'s Talking error:', error);
    return false;
  }
}

/**
 * Send SMS via Twilio (Fallback)
 */
async function sendViaTwilio(phoneNumber: string, message: string): Promise<boolean> {
  try {
    const auth = btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`);
    
    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          To: phoneNumber,
          From: TWILIO_PHONE_NUMBER,
          Body: message
        })
      }
    );

    const data = await response.json();

    if (response.ok && data.sid) {
      console.log(`✅ SMS sent via Twilio to ${phoneNumber}`);
      return true;
    }

    throw new Error(data.message || 'Unknown error');
  } catch (error) {
    console.error('Twilio error:', error);
    return false;
  }
}

/**
 * Send SMS with automatic fallback
 */
async function sendSMS(phoneNumber: string, message: string): Promise<boolean> {
  // Try Africa's Talking first
  if (AFRICAS_TALKING_API_KEY && AFRICAS_TALKING_USERNAME) {
    const success = await sendViaAfricasTalking(phoneNumber, message);
    if (success) return true;
    console.warn('Africa\'s Talking failed, trying Twilio...');
  }

  // Fallback to Twilio
  if (TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN) {
    return await sendViaTwilio(phoneNumber, message);
  }

  console.error('No SMS provider configured');
  return false;
}

/**
 * Send Email via Resend
 */
async function sendEmail(
  email: string,
  name: string,
  role: string,
  tempPassword?: string
): Promise<boolean> {
  try {
    if (!RESEND_API_KEY) {
      console.warn('RESEND_API_KEY not configured, skipping email');
      return false;
    }

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
    .button { display: inline-block; background: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
    .credentials { background: white; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #2563eb; }
    .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🚂 Africa Railways OCC</h1>
      <p>Operation Control Centre</p>
    </div>
    <div class="content">
      <h2>Welcome, ${name}!</h2>
      <p>Your account has been approved by the administrator.</p>
      
      <div class="credentials">
        <h3>Account Details</h3>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Role:</strong> ${role}</p>
        ${tempPassword ? `<p><strong>Temporary Password:</strong> ${tempPassword}</p>` : ''}
      </div>

      <p>You can now access the Operation Control Centre:</p>
      <a href="${OCC_PORTAL_URL}/occ" class="button">Access OCC Portal</a>

      <p><strong>Important:</strong></p>
      <ul>
        <li>Change your password on first login</li>
        <li>Enable Two-Factor Authentication</li>
        <li>Review your assigned stations</li>
      </ul>

      <p>For support, contact: <strong>admin@africarailways.com</strong></p>
    </div>
    <div class="footer">
      <p>© 2024 Africa Railways. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
    `;

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'Africa Railways <noreply@africarailways.com>',
        to: [email],
        subject: '🎉 Your Africa Railways OCC Account is Approved',
        html: htmlContent
      })
    });

    const data = await response.json();

    if (response.ok && data.id) {
      console.log(`✅ Email sent via Resend to ${email}`);
      return true;
    }

    throw new Error(data.message || 'Unknown error');
  } catch (error) {
    console.error('Resend error:', error);
    return false;
  }
}

/**
 * Generate approval message
 */
function generateApprovalMessage(name: string, role: string): string {
  return `🎉 Welcome to Africa Railways OCC!

Your account has been approved.

Name: ${name}
Role: ${role}

You can now access the Operation Control Centre at:
${OCC_PORTAL_URL}/occ

Login with your phone number to get started.

For support, contact: admin@africarailways.com`;
}

/**
 * Generate suspension message
 */
function generateSuspensionMessage(name: string): string {
  return `⚠️ Africa Railways OCC Account Update

Your account has been suspended.

If you believe this is an error, please contact:
admin@africarailways.com

Thank you.`;
}

/**
 * Main handler
 */
serve(async (req) => {
  try {
    // Parse webhook payload
    const payload: ApprovalPayload = await req.json();
    
    console.log('Received webhook:', payload);

    // Only process UPDATE events
    if (payload.type !== 'UPDATE') {
      return new Response(
        JSON.stringify({ message: 'Not an UPDATE event, skipping' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { record, old_record } = payload;

    // Check if status changed
    if (!old_record || old_record.status === record.status) {
      return new Response(
        JSON.stringify({ message: 'Status unchanged, skipping' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Handle approval (pending → approved)
    if (old_record.status === 'pending' && record.status === 'approved') {
      console.log(`📧📱 Sending approval notifications to ${record.email} / ${record.phone_number}`);
      
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );

      // Send SMS notification
      const smsMessage = generateApprovalMessage(
        record.full_name || 'Staff Member',
        record.role
      );
      
      const smsSuccess = await sendSMS(record.phone_number, smsMessage);

      // Send Email notification
      const emailSuccess = await sendEmail(
        record.email,
        record.full_name || 'Staff Member',
        record.role
      );

      // Log notification results
      await supabase.from('auth_logs').insert({
        user_id: record.id,
        phone_number: record.phone_number,
        event_type: 'approval_notification_sent',
        success: smsSuccess || emailSuccess,
        error_message: !smsSuccess && !emailSuccess ? 'Both SMS and Email failed' : null
      });

      if (smsSuccess || emailSuccess) {
        return new Response(
          JSON.stringify({ 
            success: true, 
            message: 'Approval notifications sent',
            email: record.email,
            phone: record.phone_number,
            sms_sent: smsSuccess,
            email_sent: emailSuccess
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      } else {
        throw new Error('Failed to send both SMS and Email notifications');
      }
    }

    // Handle suspension (approved → suspended)
    if (old_record.status === 'approved' && record.status === 'suspended') {
      console.log(`📱 Sending suspension notification to ${record.phone_number}`);
      
      const message = generateSuspensionMessage(record.full_name || 'Staff Member');
      
      const success = await sendSMS(record.phone_number, message);

      if (success) {
        return new Response(
          JSON.stringify({ 
            success: true, 
            message: 'Suspension notification sent',
            phone: record.phone_number
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }

    return new Response(
      JSON.stringify({ message: 'No notification needed for this status change' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error processing webhook:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
