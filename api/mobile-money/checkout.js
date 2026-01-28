// Africa's Talking Mobile Money Checkout API
// Supports MTN, Airtel, and Zamtel mobile money in Zambia
//
// Environment Variables Required:
// - AT_USERNAME: Africa's Talking username (e.g., 'africarailways')
// - AT_API_KEY: Africa's Talking API key
// - AT_PAYMENT_PRODUCT: Payment product name configured in AT dashboard

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
        const {
            phoneNumber,
            amount,
            currency = 'ZMW',
            metadata = {}
        } = req.body;

        // Validate required fields
        if (!phoneNumber || !amount) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: phoneNumber, amount'
            });
        }

        // Validate amount
        if (amount < 1) {
            return res.status(400).json({
                success: false,
                error: 'Amount must be at least 1 ZMW'
            });
        }

        // Africa's Talking credentials
        const username = process.env.AT_USERNAME || process.env.AFRICASTALKING_USERNAME || 'africarailways';
        const apiKey = process.env.AT_API_KEY || process.env.AFRICASTALKING_API_KEY;
        const productName = process.env.AT_PAYMENT_PRODUCT || 'AfricaRailways';

        if (!apiKey) {
            console.log('Africa\'s Talking not configured, simulating payment');
            // Return simulated success for demo
            const transactionId = 'SIM-' + Date.now().toString(36).toUpperCase();
            return res.status(200).json({
                success: true,
                simulated: true,
                transactionId,
                status: 'PendingConfirmation',
                message: 'Payment request sent (demo mode). Check your phone to confirm.',
                provider: 'africastalking-demo'
            });
        }

        // Normalize phone number to international format
        let normalizedPhone = phoneNumber.replace(/\s+/g, '').replace(/^0/, '+260');
        if (!normalizedPhone.startsWith('+')) {
            normalizedPhone = '+' + normalizedPhone;
        }

        // Determine provider from phone number prefix
        const provider = detectMobileMoneyProvider(normalizedPhone);

        // Generate unique transaction ID
        const transactionId = 'ZRL-' + Date.now().toString(36).toUpperCase() + 
                             Math.random().toString(36).substring(2, 6).toUpperCase();

        // Africa's Talking Mobile Checkout API
        const atUrl = 'https://payments.africastalking.com/mobile/checkout/request';

        const requestBody = {
            username: username,
            productName: productName,
            phoneNumber: normalizedPhone,
            currencyCode: currency,
            amount: parseFloat(amount).toFixed(2),
            metadata: {
                ...metadata,
                transactionId,
                railway: 'ZRL',
                source: 'web'
            }
        };

        console.log('Initiating mobile money checkout:', {
            phone: normalizedPhone.substring(0, 7) + '****',
            amount,
            currency,
            provider
        });

        const response = await fetch(atUrl, {
            method: 'POST',
            headers: {
                'apiKey': apiKey,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });

        // Check if response is OK and parse safely
        const responseText = await response.text();
        console.log('Africa\'s Talking raw response:', responseText);
        
        let result;
        try {
            result = JSON.parse(responseText);
        } catch (parseError) {
            console.error('Failed to parse Africa\'s Talking response:', responseText);
            return res.status(502).json({
                success: false,
                error: 'Payment gateway returned invalid response. Please try again.',
                details: responseText.substring(0, 100)
            });
        }
        
        console.log('Africa\'s Talking parsed response:', JSON.stringify(result));

        // Check response status
        if (result.status === 'PendingConfirmation') {
            return res.status(200).json({
                success: true,
                transactionId: result.transactionId || transactionId,
                status: result.status,
                description: result.description || 'Payment request sent. Please check your phone to confirm.',
                provider: provider,
                providerChannel: result.providerChannel
            });
        }

        // Handle different response statuses
        if (result.status === 'Success') {
            return res.status(200).json({
                success: true,
                transactionId: result.transactionId || transactionId,
                status: 'Success',
                description: 'Payment completed successfully',
                provider: provider
            });
        }

        // Payment failed or was rejected
        return res.status(400).json({
            success: false,
            error: result.description || result.errorMessage || 'Payment request failed',
            status: result.status,
            transactionId: transactionId
        });

    } catch (error) {
        console.error('Mobile money checkout error:', error);
        return res.status(500).json({
            success: false,
            error: error.message || 'Payment processing failed'
        });
    }
}

// Detect mobile money provider from Zambian phone number
function detectMobileMoneyProvider(phoneNumber) {
    const cleaned = phoneNumber.replace(/\D/g, '');
    
    // Zambian mobile prefixes
    // MTN: 76, 77, 78, 96, 97
    // Airtel: 75, 97 (some), 95
    // Zamtel: 50, 51, 52, 53, 54, 55
    
    if (cleaned.startsWith('260')) {
        const prefix = cleaned.substring(3, 5);
        
        if (['76', '77', '78', '96'].includes(prefix)) {
            return 'MTN';
        }
        if (['75', '95', '97'].includes(prefix)) {
            return 'Airtel';
        }
        if (['50', '51', '52', '53', '54', '55'].includes(prefix)) {
            return 'Zamtel';
        }
    }
    
    return 'Unknown';
}
