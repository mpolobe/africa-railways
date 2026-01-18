// Vercel Serverless Function - Sentinel Booking Notification
// Receives booking notifications and stores them for the Sentinel dashboard

export default async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method === 'POST') {
        try {
            const {
                type,
                operator,
                user,
                route,
                amount,
                currency,
                bookingRef,
                message
            } = req.body;

            // Validate required fields
            if (!bookingRef || !route) {
                return res.status(400).json({ 
                    error: 'Missing required fields',
                    required: ['bookingRef', 'route']
                });
            }

            const booking = {
                id: bookingRef,
                type: type || 'booking',
                operator: operator || 'ZRL',
                user: user || 'Customer',
                route,
                amount,
                currency: currency || 'ZMW',
                message: message || `New booking: ${route}`,
                status: 'confirmed',
                timestamp: new Date().toISOString()
            };

            // In production, store in database (Supabase)
            // For now, log and return success
            console.log('New booking notification received:', booking);

            // Could also trigger real-time notifications via WebSocket/Pusher here

            return res.status(200).json({
                success: true,
                booking,
                message: 'Booking notification received'
            });

        } catch (error) {
            console.error('Sentinel booking error:', error);
            return res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }

    if (req.method === 'GET') {
        // Return recent bookings (would query database in production)
        return res.status(200).json({
            success: true,
            bookings: [],
            message: 'No bookings in memory (use database in production)'
        });
    }

    return res.status(405).json({ error: 'Method not allowed' });
}
