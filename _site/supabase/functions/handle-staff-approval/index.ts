// supabase/functions/handle-staff-approval/index.ts
import { Resend } from "npm:resend";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const AT_USERNAME = Deno.env.get("AT_USERNAME");
const AT_API_KEY = Deno.env.get("AT_API_KEY");
const AT_SENDER_ID = Deno.env.get("AT_SENDER_ID") || "SENTINEL";

Deno.serve(async (req) => {
  const { staff_email, staff_phone, status, staff_name } = await req.json();

  if (status === 'approved') {
    try {
      // 1. Send Approval Email via Resend
      const emailResult = await resend.emails.send({
        from: "OCC System <admin@africarailways.com>",
        to: [staff_email],
        subject: "Access Approved: Sentinel OCC",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #2563eb; color: white; padding: 20px; text-align: center;">
              <h1>🚂 Africa Railways OCC</h1>
            </div>
            <div style="padding: 30px; background: #f9fafb;">
              <h2>Welcome, ${staff_name || 'Staff Member'}!</h2>
              <p><strong>Your staff account has been approved by the Administrator.</strong></p>
              <p>You can now log in to the Operation Control Centre portal.</p>
              <div style="margin: 30px 0;">
                <a href="https://www.africarailways.com/occ" 
                   style="background: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block;">
                  Access OCC Portal
                </a>
              </div>
              <p><strong>Next Steps:</strong></p>
              <ul>
                <li>Log in with your phone number</li>
                <li>Complete your profile</li>
                <li>Review your assigned stations</li>
              </ul>
              <p>For support, contact: <strong>admin@africarailways.com</strong></p>
            </div>
            <div style="background: #e5e7eb; padding: 20px; text-align: center; font-size: 12px; color: #6b7280;">
              © 2024 Africa Railways. All rights reserved.
            </div>
          </div>
        `
      });

      console.log("✅ Email sent:", emailResult);

      // 2. Send Approval SMS via Africa's Talking
      const smsData = new URLSearchParams();
      smsData.append("username", AT_USERNAME!);
      smsData.append("to", staff_phone); // Ensure this is in E.164 format (+260...)
      smsData.append("message", `Sentinel Rail: Your OCC access has been approved by the Administrator. You may now log in at www.africarailways.com/occ`);
      smsData.append("from", AT_SENDER_ID);

      const smsResponse = await fetch("https://api.africastalking.com/version1/messaging", {
        method: "POST",
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/x-www-form-urlencoded",
          "apiKey": AT_API_KEY!
        },
        body: smsData
      });

      const smsResult = await smsResponse.json();
      console.log("📱 SMS Status:", smsResult);

      return new Response(
        JSON.stringify({ 
          success: true,
          email_sent: true,
          sms_sent: smsResult.SMSMessageData?.Recipients?.[0]?.status === 'Success',
          message: "Approval notifications sent successfully"
        }), 
        { headers: { "Content-Type": "application/json" } }
      );

    } catch (error) {
      console.error("❌ Error sending notifications:", error);
      
      return new Response(
        JSON.stringify({ 
          success: false,
          error: error.message
        }), 
        { 
          status: 500,
          headers: { "Content-Type": "application/json" } 
        }
      );
    }
  }

  return new Response(
    JSON.stringify({ 
      success: true,
      message: "No action required for this status"
    }), 
    { headers: { "Content-Type": "application/json" } }
  );
});
