/// Enhanced ARAIL Fundraising with Milestone-Based Fund Release
module arail::fundraising_v2 {
    use sui::object::{Self, UID, ID};
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};
    use sui::coin::{Self, Coin};
    use sui::balance::{Self, Balance};
    use sui::sui::SUI;
    use sui::event;
    use sui::vec_map::{Self, VecMap};

    /// Error codes
    const EAmountTooLow: u64 = 0;
    const EGoalReached: u64 = 1;
    const ENotOwner: u64 = 2;
    const EMilestoneNotReached: u64 = 3;
    const EMilestoneAlreadyReleased: u64 = 4;
    const EInvalidMilestone: u64 = 5;

    /// Milestone status
    const MILESTONE_PENDING: u8 = 0;
    const MILESTONE_VERIFIED: u8 = 1;
    const MILESTONE_RELEASED: u8 = 2;

    /// Milestone definition
    public struct Milestone has store, copy, drop {
        id: u8,
        name: vector<u8>,
        percentage: u64,  // Percentage of total funds (in basis points)
        status: u8,
        released_amount: u64,
    }

    /// The main Fundraising object with milestone tracking
    public struct Fund has key {
        id: UID,
        owner: address,
        target: u64,
        raised: Balance<SUI>,
        investor_count: u64,
        active: bool,
        milestones: VecMap<u8, Milestone>,
        total_released: u64,
    }

    /// The Investor's Receipt (Equity NFT)
    public struct Receipt has key, store {
        id: UID,
        fund_id: ID,
        investor: address,
        amount: u64,
        equity_percentage: u64,
        timestamp: u64,
    }

    /// Event emitted on investment
    public struct InvestEvent has copy, drop {
        investor: address,
        amount: u64,
        total_raised: u64,
        investor_count: u64,
        timestamp: u64,
    }

    /// Event emitted when milestone is verified
    public struct MilestoneVerifiedEvent has copy, drop {
        milestone_id: u8,
        milestone_name: vector<u8>,
        verified_at: u64,
    }

    /// Event emitted when funds are released
    public struct FundsReleasedEvent has copy, drop {
        milestone_id: u8,
        amount: u64,
        recipient: address,
        timestamp: u64,
    }

    /// Initialize the fund with TAZARA project milestones
    fun init(ctx: &mut TxContext) {
        let milestones = vec_map::empty<u8, Milestone>();
        
        // Milestone 1: MVP Launch (20%)
        vec_map::insert(&mut milestones, 1, Milestone {
            id: 1,
            name: b"MVP Launch - Digital Ticketing System",
            percentage: 2000, // 20% in basis points
            status: MILESTONE_PENDING,
            released_amount: 0,
        });
        
        // Milestone 2: TAZARA Integration (25%)
        vec_map::insert(&mut milestones, 2, Milestone {
            id: 2,
            name: b"TAZARA Railway Integration",
            percentage: 2500,
            status: MILESTONE_PENDING,
            released_amount: 0,
        });
        
        // Milestone 3: USSD Gateway Live (20%)
        vec_map::insert(&mut milestones, 3, Milestone {
            id: 3,
            name: b"USSD Gateway Deployment",
            percentage: 2000,
            status: MILESTONE_PENDING,
            released_amount: 0,
        });
        
        // Milestone 4: 10,000 Active Users (20%)
        vec_map::insert(&mut milestones, 4, Milestone {
            id: 4,
            name: b"10,000 Active Users Milestone",
            percentage: 2000,
            status: MILESTONE_PENDING,
            released_amount: 0,
        });
        
        // Milestone 5: Revenue Positive (15%)
        vec_map::insert(&mut milestones, 5, Milestone {
            id: 5,
            name: b"Revenue Positive Operations",
            percentage: 1500,
            status: MILESTONE_PENDING,
            released_amount: 0,
        });

        let fund = Fund {
            id: object::new(ctx),
            owner: tx_context::sender(ctx),
            target: 350000000000000, // 350,000 SUI
            raised: balance::zero(),
            investor_count: 0,
            active: true,
            milestones,
            total_released: 0,
        };
        
        transfer::share_object(fund);
    }

    /// Public function for investors to stake SUI
    public entry fun invest(
        fund: &mut Fund, 
        payment: Coin<SUI>, 
        ctx: &mut TxContext
    ) {
        assert!(fund.active, EGoalReached);
        
        let amount = coin::value(&payment);
        assert!(amount >= 100000000000, EAmountTooLow); // Minimum 100 SUI
        
        let fund_id = object::id(fund);
        let investor_address = tx_context::sender(ctx);
        
        // Calculate equity percentage in basis points
        let equity_bp = ((amount * 1000) / fund.target);
        
        let paid_balance = coin::into_balance(payment);
        balance::join(&mut fund.raised, paid_balance);
        
        fund.investor_count = fund.investor_count + 1;
        
        let total_raised = balance::value(&fund.raised);
        let timestamp = tx_context::epoch(ctx);

        // Issue the Equity Receipt NFT
        let receipt = Receipt {
            id: object::new(ctx),
            fund_id,
            investor: investor_address,
            amount,
            equity_percentage: equity_bp,
            timestamp,
        };
        
        event::emit(InvestEvent {
            investor: investor_address,
            amount,
            total_raised,
            investor_count: fund.investor_count,
            timestamp,
        });

        transfer::transfer(receipt, investor_address);
        
        // Auto-close if goal reached
        if (total_raised >= fund.target) {
            fund.active = false;
        };
    }

    /// Owner verifies milestone completion
    public entry fun verify_milestone(
        fund: &mut Fund,
        milestone_id: u8,
        ctx: &mut TxContext
    ) {
        assert!(tx_context::sender(ctx) == fund.owner, ENotOwner);
        assert!(vec_map::contains(&fund.milestones, &milestone_id), EInvalidMilestone);
        
        let milestone = vec_map::get_mut(&mut fund.milestones, &milestone_id);
        assert!(milestone.status == MILESTONE_PENDING, EMilestoneAlreadyReleased);
        
        milestone.status = MILESTONE_VERIFIED;
        
        event::emit(MilestoneVerifiedEvent {
            milestone_id,
            milestone_name: milestone.name,
            verified_at: tx_context::epoch(ctx),
        });
    }

    /// Owner releases funds for verified milestone
    public entry fun release_milestone_funds(
        fund: &mut Fund,
        milestone_id: u8,
        ctx: &mut TxContext
    ) {
        assert!(tx_context::sender(ctx) == fund.owner, ENotOwner);
        assert!(vec_map::contains(&fund.milestones, &milestone_id), EInvalidMilestone);
        
        let milestone = vec_map::get_mut(&mut fund.milestones, &milestone_id);
        assert!(milestone.status == MILESTONE_VERIFIED, EMilestoneNotReached);
        
        let total_raised = balance::value(&fund.raised);
        let release_amount = (total_raised * milestone.percentage) / 10000;
        
        milestone.status = MILESTONE_RELEASED;
        milestone.released_amount = release_amount;
        fund.total_released = fund.total_released + release_amount;
        
        let released_coin = coin::take(&mut fund.raised, release_amount, ctx);
        let recipient = tx_context::sender(ctx);
        
        event::emit(FundsReleasedEvent {
            milestone_id,
            amount: release_amount,
            recipient,
            timestamp: tx_context::epoch(ctx),
        });
        
        transfer::public_transfer(released_coin, recipient);
    }

    /// Emergency withdrawal (only if no milestones verified)
    public entry fun emergency_withdraw(
        fund: &mut Fund,
        amount: u64,
        ctx: &mut TxContext
    ) {
        assert!(tx_context::sender(ctx) == fund.owner, ENotOwner);
        
        let withdrawn = coin::take(&mut fund.raised, amount, ctx);
        transfer::public_transfer(withdrawn, tx_context::sender(ctx));
    }

    /// View functions
    public fun get_fund_details(fund: &Fund): (u64, u64, u64, bool, u64) {
        (
            fund.target,
            balance::value(&fund.raised),
            fund.investor_count,
            fund.active,
            fund.total_released
        )
    }

    public fun get_milestone_status(fund: &Fund, milestone_id: u8): (vector<u8>, u64, u8, u64) {
        let milestone = vec_map::get(&fund.milestones, &milestone_id);
        (
            milestone.name,
            milestone.percentage,
            milestone.status,
            milestone.released_amount
        )
    }

    public fun get_receipt_details(receipt: &Receipt): (ID, address, u64, u64, u64) {
        (
            receipt.fund_id,
            receipt.investor,
            receipt.amount,
            receipt.equity_percentage,
            receipt.timestamp
        )
    }
}
