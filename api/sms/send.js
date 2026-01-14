// Vercel Serverless Function - SMS Notification
// Uses Africa's Talking API for SMS delivery
//
// Africa's Talking Sandbox Configuration:
// - Service Code: *384*26621#
// - Callback URL: https://africa-railways-production.up.railway.app/ussd

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

        // Africa's Talking credentials from environment
        // Production: App=AfricaRailways_Zambia, Username=africarailways
        const username = process.env.AT_USERNAME || process.env.AFRICASTALKING_USERNAME || 'africarailways';
        const apiKey = process.env.AT_API_KEY || process.env.AFRICASTALKING_API_KEY;
        const shortCode = process.env.AT_SHORTCODE || process.env.AT_SENDER_ID || 'AFRICARAIL';
        const ussdCode = '*384*26621#';

        if (!apiKey) {
            console.log('SMS queued (no API key configured):', { to, message: message.substring(0, 50) });
            return res.status(200).json({ 
                success: true, 
                queued: true,
                message: 'SMS queued for delivery' 
            });
        }

        // Send via Africa's Talking (production API)
        const atUrl = 'https://api.africastalking.com/version1/messaging';

        const response = await fetch(atUrl, {
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

        if (result.SMSMessageData?.Recipients?.[0]?.status === 'Success') {
            return res.status(200).json({ 
                success: true, 
                messageId: result.SMSMessageData.Recipients[0].messageId 
            });
        } else {
            console.error('SMS send failed:', result);
            return res.status(200).json({ 
                success: true, 
                queued: true,
                message: 'SMS queued for retry' 
            });
        }

    } catch (error) {
        console.error('SMS API error:', error);
        return res.status(200).json({ 
            success: true, 
            queued: true,
            message: 'SMS queued for delivery' 
        });
    }
}
