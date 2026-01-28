// Africa's Talking Mobile Money Payment Callback/Webhook
// Receives payment status updates from Africa's Talking
//
// Configure this URL in Africa's Talking dashboard:
// https://your-domain.com/api/mobile-money/callback

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
        // Africa's Talking sends payment notifications in this format
        const {
            transactionId,
            category,
            provider,
            providerRefId,
            providerChannel,
            clientAccount,
            productName,
            sourceType,
            source,
            destinationType,
            destination,
            value,
            transactionFee,
            providerFee,
            status,
            description,
            requestMetadata,
            transactionDate
        } = req.body;

        console.log('Mobile money callback received:', {
            transactionId,
            status,
            value,
            provider,
            source: source?.substring(0, 7) + '****'
        });

        // Store payment status update
        const paymentUpdate = {
            transactionId,
            status,
            provider,
            providerRefId,
            amount: value,
            fee: transactionFee,
            phone: source,
            metadata: requestMetadata,
            timestamp: transactionDate || new Date().toISOString()
        };

        // In production, update database
        // await updatePaymentStatus(transactionId, paymentUpdate);

        // Store in global for polling (temporary solution)
        global.paymentCallbacks = global.paymentCallbacks || new Map();
        global.paymentCallbacks.set(transactionId, paymentUpdate);

        // If payment successful, trigger SMS confirmation
        if (status === 'Success' && requestMetadata?.bookingRef) {
            await sendPaymentConfirmationSMS(source, requestMetadata);
        }

        // Respond to Africa's Talking
        return res.status(200).json({
            success: true,
            message: 'Callback received'
        });

    } catch (error) {
        console.error('Payment callback error:', error);
        return res.status(500).json({
            success: false,
            error: error.message
        });
    }
}

// Send SMS confirmation after successful payment
async function sendPaymentConfirmationSMS(phoneNumber, metadata) {
    try {
        const message = `Africa Railways - Payment Confirmed!\n\nRef: ${metadata.bookingRef || 'N/A'}\nRoute: ${metadata.from || ''} → ${metadata.to || ''}\nAmount: K ${metadata.amount || '0'}\n\nThank you for traveling with Zambia Railways!`;

        // Use existing SMS API
        const baseUrl = process.env.VERCEL_URL 
            ? `https://${process.env.VERCEL_URL}` 
            : 'http://localhost:3000';

        await fetch(`${baseUrl}/api/sms/send`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                to: phoneNumber,
                message: message
            })
        });

        console.log('Payment confirmation SMS sent to:', phoneNumber.substring(0, 7) + '****');
    } catch (error) {
        console.error('Failed to send confirmation SMS:', error);
    }
}
