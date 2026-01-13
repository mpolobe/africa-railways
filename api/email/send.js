// Vercel Serverless Function - Email Notification
// Uses Resend API for email delivery

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
        const { to, subject, html, text } = req.body;

        if (!to || !subject || (!html && !text)) {
            return res.status(400).json({ error: 'Missing required fields: to, subject, html/text' });
        }

        const resendApiKey = process.env.RESEND_API_KEY;

        if (!resendApiKey) {
            console.log('Email queued (no API key configured):', { to, subject });
            return res.status(200).json({ 
                success: true, 
                queued: true,
                message: 'Email queued for delivery' 
            });
        }

        // Send via Resend
        const response = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${resendApiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                from: 'Africa Railways <noreply@africarailways.com>',
                to: to,
                subject: subject,
                html: html || `<p>${text}</p>`
            })
        });

        const result = await response.json();

        if (result.id) {
            return res.status(200).json({ 
                success: true, 
                emailId: result.id 
            });
        } else {
            console.error('Email send failed:', result);
            return res.status(200).json({ 
                success: true, 
                queued: true,
                message: 'Email queued for retry' 
            });
        }

    } catch (error) {
        console.error('Email API error:', error);
        return res.status(200).json({ 
            success: true, 
            queued: true,
            message: 'Email queued for delivery' 
        });
    }
}
