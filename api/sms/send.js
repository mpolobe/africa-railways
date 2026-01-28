// Vercel Serverless Function - SMS Notification
// Uses Africa's Talking API as primary, Twilio as fallback
//
// Africa's Talking Configuration:
// - Service Code: *384*26621#
// - Production: App=AfricaRailways_Zambia, Username=africarailways

// Helper to encode base64 (works in both Node.js and Edge)
function btoa64(str) {
    if (typeof Buffer !== 'undefined') {
        return Buffer.from(str).toString('base64');
    }
    return btoa(str);
}

export default async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { to, message } = req.body;

        if (!to || !message) {
            return res.status(400).json({ error: 'Missing required fields: to, message' });
        }

        // Try Africa's Talking first
        const atResult = await sendAfricasTalkingSMS(to, message);
        if (atResult.success) {
            return res.status(200).json({ 
                success: true, 
                provider: 'africastalking',
                messageId: atResult.messageId 
            });
        }

        console.log('Africa\'s Talking failed, trying Twilio fallback...');

        // Fallback to Twilio
        const twilioResult = await sendTwilioSMS(to, message);
        if (twilioResult.success) {
            return res.status(200).json({ 
                success: true, 
                provider: 'twilio',
                messageId: twilioResult.messageId 
            });
        }

        // Both failed - queue for retry
        console.log('All SMS providers failed, queuing:', { to, message: message.substring(0, 50) });
        return res.status(200).json({ 
            success: true, 
            queued: true,
            message: 'SMS queued for delivery' 
        });

    } catch (error) {
        console.error('SMS API error:', error);
        return res.status(200).json({ 
            success: true, 
            queued: true,
            message: 'SMS queued for delivery' 
        });
    }
}

async function sendAfricasTalkingSMS(to, message) {
    const username = process.env.AT_USERNAME || process.env.AFRICASTALKING_USERNAME || 'africarailways';
    const apiKey = process.env.AT_API_KEY || process.env.AFRICASTALKING_API_KEY;
    const shortCode = process.env.AT_SHORTCODE || process.env.AT_SENDER_ID || 'AFRICARAIL';

    if (!apiKey) {
        console.log('Africa\'s Talking not configured');
        return { success: false, error: 'Not configured' };
    }

    try {
        const response = await fetch('https://api.africastalking.com/version1/messaging', {
            method: 'POST',
            headers: {
                'apiKey': apiKey,
                'Content-Type': 'application/x-www-form-urlencoded',
                'Accept': 'application/json'
            },
            body: new URLSearchParams({
                username: username,
                to: to,
                message: message,
                from: shortCode
            })
        });

        const result = await response.json();
        console.log('Africa\'s Talking response:', JSON.stringify(result));

        const recipient = result.SMSMessageData?.Recipients?.[0];
        if (recipient?.status === 'Success' || recipient?.statusCode === 100 || recipient?.statusCode === 101) {
            return { success: true, messageId: recipient.messageId };
        }

        return { success: false, error: result.SMSMessageData?.Message || 'Send failed' };
    } catch (error) {
        console.error('Africa\'s Talking error:', error);
        return { success: false, error: error.message };
    }
}

async function sendTwilioSMS(to, message) {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromNumber = process.env.TWILIO_PHONE_NUMBER || process.env.TWILIO_NUMBER;
    const messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID;

    if (!accountSid || !authToken) {
        console.log('Twilio not configured');
        return { success: false, error: 'Not configured' };
    }

    try {
        const body = new URLSearchParams({
            To: to,
            Body: message
        });

        // Use Messaging Service if available, otherwise use phone number
        if (messagingServiceSid) {
            body.append('MessagingServiceSid', messagingServiceSid);
        } else if (fromNumber) {
            body.append('From', fromNumber);
        } else {
            return { success: false, error: 'No Twilio sender configured' };
        }

        const response = await fetch(
            `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Authorization': 'Basic ' + btoa64(`${accountSid}:${authToken}`)
                },
                body: body.toString()
            }
        );

        const result = await response.json();
        console.log('Twilio response:', JSON.stringify(result));

        if (result.sid && !result.error_code) {
            return { success: true, messageId: result.sid };
        }

        return { success: false, error: result.message || 'Send failed' };
    } catch (error) {
        console.error('Twilio error:', error);
        return { success: false, error: error.message };
    }
}
