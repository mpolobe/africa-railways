module arail::fundraising {
    use sui::object::{Self, UID, ID};
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};
    use sui::coin::{Self, Coin};
    use sui::balance::{Self, Balance};
    use sui::sui::SUI;
    use sui::event;

    /// Error codes
    const EAmountTooLow: u64 = 0;
    const EGoalReached: u64 = 1;
    const ENotOwner: u64 = 2;

    /// The main Fundraising object
    public struct Fund has key {
        id: UID,
        owner: address,
        target: u64,      // Goal in SUI (in MIST: 1 SUI = 1_000_000_000 MIST)
        raised: Balance<SUI>,
        investor_count: u64,
        active: bool,
    }

    /// The Investor's Receipt (Equity NFT)
    public struct Receipt has key, store {
        id: UID,
        fund_id: ID,
        investor: address,
        amount: u64,
        equity_percentage: u64, // Basis points (10000 = 100%)
        timestamp: u64,
    }

    /// Event emitted on every successful investment
    public struct InvestEvent has copy, drop {
        investor: address,
        amount: u64,
        total_raised: u64,
        investor_count: u64,
    }

    /// Event emitted when fund is withdrawn
    public struct WithdrawEvent has copy, drop {
        amount: u64,
        recipient: address,
    }

    /// Initialize the fund (Run once on deployment)
    fun init(ctx: &mut TxContext) {
        let fund = Fund {
            id: object::new(ctx),
            owner: tx_context::sender(ctx),
            target: 350000000000000, // 350,000 SUI in MIST (350000 * 1_000_000_000)
            raised: balance::zero(),
            investor_count: 0,
            active: true,
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
        // (amount / target) * 10% * 10000 basis points
        let equity_bp = ((amount * 1000) / fund.target); // 10% of total for all investors
        
        let paid_balance = coin::into_balance(payment);
        balance::join(&mut fund.raised, paid_balance);
        
        fund.investor_count = fund.investor_count + 1;
        
        let total_raised = balance::value(&fund.raised);

        // Issue the Equity Receipt NFT to the investor
        let receipt = Receipt {
            id: object::new(ctx),
            fund_id,
            investor: investor_address,
            amount,
            equity_percentage: equity_bp,
            timestamp: tx_context::epoch(ctx),
        };
        
        event::emit(InvestEvent {
            investor: investor_address,
            amount,
            total_raised,
            investor_count: fund.investor_count,
        });

        transfer::transfer(receipt, investor_address);
        
        // Auto-close if goal reached
        if (total_raised >= fund.target) {
            fund.active = false;
        };
    }

    /// Owner can withdraw funds
    public entry fun withdraw(
        fund: &mut Fund,
        amount: u64,
        ctx: &mut TxContext
    ) {
        assert!(tx_context::sender(ctx) == fund.owner, ENotOwner);
        
        let withdrawn = coin::take(&mut fund.raised, amount, ctx);
        let recipient = tx_context::sender(ctx);
        
        event::emit(WithdrawEvent {
            amount,
            recipient,
        });
        
        transfer::public_transfer(withdrawn, recipient);
    }

    /// View function to get fund details
    public fun get_fund_details(fund: &Fund): (u64, u64, u64, bool) {
        (
            fund.target,
            balance::value(&fund.raised),
            fund.investor_count,
            fund.active
        )
    }

    /// View function to get receipt details
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
