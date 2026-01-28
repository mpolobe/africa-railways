// Check Mobile Money Payment Status
// Used for polling payment status from the frontend

export default async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { transactionId } = req.query;

        if (!transactionId) {
            return res.status(400).json({
                success: false,
                error: 'Missing transactionId parameter'
            });
        }

        // Check global callback store
        global.paymentCallbacks = global.paymentCallbacks || new Map();
        const paymentStatus = global.paymentCallbacks.get(transactionId);

        if (paymentStatus) {
            return res.status(200).json({
                success: true,
                found: true,
                ...paymentStatus
            });
        }

        // Not found yet - still pending
        return res.status(200).json({
            success: true,
            found: false,
            status: 'PendingConfirmation',
            message: 'Waiting for payment confirmation'
        });

    } catch (error) {
        console.error('Payment status check error:', error);
        return res.status(500).json({
            success: false,
            error: error.message
        });
    }
}
