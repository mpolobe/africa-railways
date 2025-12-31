/**
 * Real-Time SUI Event Listener for ARAIL Fundraising
 * Monitors InvestEvent and updates the investor portal in real-time
 */

import { SuiClient, getFullnodeUrl } from '@mysten/sui.js/client';
import { EventId } from '@mysten/sui.js/client';

// Configuration
const NETWORK = process.env.SUI_NETWORK || 'testnet';
const PACKAGE_ID = process.env.PACKAGE_ID || '0xYOUR_PACKAGE_ID';
const FUND_OBJECT_ID = process.env.FUND_OBJECT_ID || '0xYOUR_FUND_OBJECT_ID';

// Initialize Sui client
const client = new SuiClient({ url: getFullnodeUrl(NETWORK) });

// Event types
const EVENT_TYPES = {
    INVEST: `${PACKAGE_ID}::fundraising_v2::InvestEvent`,
    MILESTONE_VERIFIED: `${PACKAGE_ID}::fundraising_v2::MilestoneVerifiedEvent`,
    FUNDS_RELEASED: `${PACKAGE_ID}::fundraising_v2::FundsReleasedEvent`,
};

// State management
let fundState = {
    target: 350000000000000, // 350,000 SUI in MIST
    raised: 0,
    investorCount: 0,
    lastUpdate: Date.now(),
};

/**
 * Query current fund state
 */
async function queryFundState() {
    try {
        const fundObject = await client.getObject({
            id: FUND_OBJECT_ID,
            options: { showContent: true },
        });

        if (fundObject.data?.content?.fields) {
            const fields = fundObject.data.content.fields;
            fundState = {
                target: parseInt(fields.target),
                raised: parseInt(fields.raised),
                investorCount: parseInt(fields.investor_count),
                lastUpdate: Date.now(),
            };
            
            console.log('📊 Fund State Updated:', {
                raised: `${(fundState.raised / 1_000_000_000).toFixed(2)} SUI`,
                target: `${(fundState.target / 1_000_000_000).toFixed(2)} SUI`,
                progress: `${((fundState.raised / fundState.target) * 100).toFixed(2)}%`,
                investors: fundState.investorCount,
            });
        }
    } catch (error) {
        console.error('❌ Error querying fund state:', error.message);
    }
}

/**
 * Handle InvestEvent
 */
function handleInvestEvent(event) {
    const { investor, amount, total_raised, investor_count, timestamp } = event.parsedJson;
    
    console.log('💰 New Investment!', {
        investor: investor.substring(0, 10) + '...',
        amount: `${(parseInt(amount) / 1_000_000_000).toFixed(2)} SUI`,
        totalRaised: `${(parseInt(total_raised) / 1_000_000_000).toFixed(2)} SUI`,
        investorCount: investor_count,
        timestamp,
    });

    // Update local state
    fundState.raised = parseInt(total_raised);
    fundState.investorCount = parseInt(investor_count);
    fundState.lastUpdate = Date.now();

    // Broadcast to connected clients (WebSocket, SSE, etc.)
    broadcastUpdate({
        type: 'INVESTMENT',
        data: {
            investor,
            amount: parseInt(amount),
            totalRaised: parseInt(total_raised),
            investorCount: parseInt(investor_count),
            progress: (parseInt(total_raised) / fundState.target) * 100,
        },
    });
}

/**
 * Handle MilestoneVerifiedEvent
 */
function handleMilestoneVerified(event) {
    const { milestone_id, milestone_name, verified_at } = event.parsedJson;
    
    console.log('✅ Milestone Verified!', {
        id: milestone_id,
        name: Buffer.from(milestone_name).toString('utf-8'),
        verifiedAt: verified_at,
    });

    broadcastUpdate({
        type: 'MILESTONE_VERIFIED',
        data: {
            milestoneId: milestone_id,
            milestoneName: Buffer.from(milestone_name).toString('utf-8'),
            verifiedAt: verified_at,
        },
    });
}

/**
 * Handle FundsReleasedEvent
 */
function handleFundsReleased(event) {
    const { milestone_id, amount, recipient, timestamp } = event.parsedJson;
    
    console.log('💸 Funds Released!', {
        milestoneId: milestone_id,
        amount: `${(parseInt(amount) / 1_000_000_000).toFixed(2)} SUI`,
        recipient: recipient.substring(0, 10) + '...',
        timestamp,
    });

    broadcastUpdate({
        type: 'FUNDS_RELEASED',
        data: {
            milestoneId: milestone_id,
            amount: parseInt(amount),
            recipient,
            timestamp,
        },
    });
}

/**
 * Broadcast updates to connected clients
 */
function broadcastUpdate(update) {
    // This would integrate with your WebSocket/SSE server
    // For now, we'll just log and could write to a file or Redis
    console.log('📡 Broadcasting update:', update);
    
    // Example: Write to a JSON file that the frontend can poll
    const fs = require('fs');
    const updateFile = './public/fund-updates.json';
    
    try {
        fs.writeFileSync(updateFile, JSON.stringify({
            ...fundState,
            lastEvent: update,
            timestamp: Date.now(),
        }, null, 2));
    } catch (error) {
        console.error('Error writing update file:', error.message);
    }
}

/**
 * Subscribe to events
 */
async function subscribeToEvents() {
    console.log('🎧 Starting event listener...');
    console.log(`Network: ${NETWORK}`);
    console.log(`Package: ${PACKAGE_ID}`);
    console.log(`Fund: ${FUND_OBJECT_ID}`);
    console.log('');

    // Initial state query
    await queryFundState();

    // Subscribe to InvestEvent
    const investUnsubscribe = await client.subscribeEvent({
        filter: { MoveEventType: EVENT_TYPES.INVEST },
        onMessage: (event) => {
            handleInvestEvent(event);
        },
    });

    // Subscribe to MilestoneVerifiedEvent
    const milestoneUnsubscribe = await client.subscribeEvent({
        filter: { MoveEventType: EVENT_TYPES.MILESTONE_VERIFIED },
        onMessage: (event) => {
            handleMilestoneVerified(event);
        },
    });

    // Subscribe to FundsReleasedEvent
    const fundsUnsubscribe = await client.subscribeEvent({
        filter: { MoveEventType: EVENT_TYPES.FUNDS_RELEASED },
        onMessage: (event) => {
            handleFundsReleased(event);
        },
    });

    console.log('✅ Event listeners active');
    console.log('Listening for investments, milestone updates, and fund releases...');
    console.log('');

    // Periodic state refresh (every 30 seconds)
    setInterval(async () => {
        await queryFundState();
    }, 30000);

    // Handle graceful shutdown
    process.on('SIGINT', () => {
        console.log('\n🛑 Shutting down event listener...');
        investUnsubscribe();
        milestoneUnsubscribe();
        fundsUnsubscribe();
        process.exit(0);
    });
}

/**
 * Query historical events
 */
async function queryHistoricalEvents(limit = 50) {
    console.log('📜 Querying historical events...');
    
    try {
        const events = await client.queryEvents({
            query: { MoveEventType: EVENT_TYPES.INVEST },
            limit,
            order: 'descending',
        });

        console.log(`Found ${events.data.length} historical investments:`);
        events.data.forEach((event, index) => {
            const { investor, amount, total_raised } = event.parsedJson;
            console.log(`${index + 1}. ${investor.substring(0, 10)}... invested ${(parseInt(amount) / 1_000_000_000).toFixed(2)} SUI`);
        });
    } catch (error) {
        console.error('Error querying historical events:', error.message);
    }
}

/**
 * Main execution
 */
async function main() {
    console.log('🚂 ARAIL Fundraising Event Listener');
    console.log('===================================');
    console.log('');

    // Query historical events first
    await queryHistoricalEvents(10);
    console.log('');

    // Start real-time subscription
    await subscribeToEvents();
}

// Run the listener
main().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
});

export { queryFundState, subscribeToEvents, fundState };
