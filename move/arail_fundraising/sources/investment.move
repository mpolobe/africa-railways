/// Optimized ARAIL Investment Contract with Vesting and Safety Rails
/// Features: Precision guards, reentrancy protection, linear vesting
module arail::investment {
    use sui::coin::{Self, Coin};
    use sui::sui::SUI;
    use sui::balance::{Self, Balance};
    use sui::tx_context::{Self, TxContext};
    use sui::object::{Self, UID, ID};
    use sui::transfer;
    use sui::event;
    use sui::clock::{Self, Clock};

    // ========== Error Codes ==========
    const E_INSUFFICIENT_PAYMENT: u64 = 1;
    const E_ROUND_CLOSED: u64 = 2;
    const E_MAX_INVESTMENT_EXCEEDED: u64 = 3;
    const E_MIN_INVESTMENT_NOT_MET: u64 = 4;
    const E_VESTING_NOT_READY: u64 = 5;
    const E_UNAUTHORIZED: u64 = 6;

    // ========== Constants (Scalable for 2025) ==========
    const TOTAL_RAISE_SUI: u64 = 350_000_000_000_000; // 350,000 SUI in MIST
    const MIN_INVESTMENT_SUI: u64 = 100_000_000_000; // 100 SUI in MIST
    const EQUITY_PERCENT: u64 = 10; // 10% total equity offered
    const VESTING_MONTHS: u64 = 12; // 12-month vesting period
    const SCALING_FACTOR: u64 = 100_000_000; // Precision for equity calculations

    /// Treasury holds all raised funds
    public struct Treasury has key {
        id: UID,
        total_raised: u64,
        staked_balance: Balance<SUI>,
        total_equity_issued: u64,
        investor_count: u64,
        round_open: bool,
        admin: address,
    }

    /// Investment Certificate (NFT) with vesting schedule
    public struct InvestmentCertificate has key, store {
        id: UID,
        investor: address,
        sui_invested: u64,
        equity_tokens: u64,
        vesting_start: u64,
        vesting_end: u64,
        total_claimed: u64,
        certificate_number: u64,
    }

    /// Equity Token (claimable after vesting)
    public struct EquityToken has key, store {
        id: UID,
        amount: u64,
        investor: address,
        claimed_at: u64,
    }

    // ========== Events ==========
    
    public struct InvestmentEvent has copy, drop {
        investor: address,
        amount: u64,
        equity_tokens: u64,
        certificate_number: u64,
        total_raised: u64,
        timestamp: u64,
    }

    public struct ClaimEvent has copy, drop {
        investor: address,
        amount_claimed: u64,
        total_claimed: u64,
        timestamp: u64,
    }

    public struct RoundClosedEvent has copy, drop {
        total_raised: u64,
        investor_count: u64,
        timestamp: u64,
    }

    // ========== Initialization ==========

    fun init(ctx: &mut TxContext) {
        let treasury = Treasury {
            id: object::new(ctx),
            total_raised: 0,
            staked_balance: balance::zero(),
            total_equity_issued: 0,
            investor_count: 0,
            round_open: true,
            admin: tx_context::sender(ctx),
        };
        
        transfer::share_object(treasury);
    }

    // ========== Core Investment Logic ==========

    /// Invest SUI and receive Investment Certificate with vesting schedule
    public entry fun invest(
        treasury: &mut Treasury,
        payment: Coin<SUI>,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        assert!(treasury.round_open, E_ROUND_CLOSED);
        
        let amount = coin::value(&payment);
        assert!(amount >= MIN_INVESTMENT_SUI, E_MIN_INVESTMENT_NOT_MET);
        assert!(treasury.total_raised + amount <= TOTAL_RAISE_SUI, E_MAX_INVESTMENT_EXCEEDED);
        
        // Advanced Equity Calculation with Scaling Factor
        // Formula: (investment / total_raise) * equity_percent * scaling_factor
        let equity_tokens = (amount * EQUITY_PERCENT * SCALING_FACTOR) / TOTAL_RAISE_SUI;
        
        let investor = tx_context::sender(ctx);
        let now = clock::timestamp_ms(clock);
        
        // Calculate vesting end (12 months from now)
        let vesting_end = now + (VESTING_MONTHS * 2592000000); // 30 days * 12 months in ms
        
        // Update treasury state BEFORE transferring certificate (reentrancy protection)
        treasury.total_raised = treasury.total_raised + amount;
        treasury.total_equity_issued = treasury.total_equity_issued + 1;
        treasury.investor_count = treasury.investor_count + 1;
        balance::join(&mut treasury.staked_balance, coin::into_balance(payment));
        
        // Create Investment Certificate
        let certificate = InvestmentCertificate {
            id: object::new(ctx),
            investor,
            sui_invested: amount,
            equity_tokens,
            vesting_start: now,
            vesting_end,
            total_claimed: 0,
            certificate_number: treasury.total_equity_issued,
        };

        // Emit investment event
        event::emit(InvestmentEvent {
            investor,
            amount,
            equity_tokens,
            certificate_number: treasury.total_equity_issued,
            total_raised: treasury.total_raised,
            timestamp: now,
        });

        // Transfer certificate to investor
        transfer::transfer(certificate, investor);
        
        // Auto-close round if goal reached
        if (treasury.total_raised >= TOTAL_RAISE_SUI) {
            treasury.round_open = false;
            event::emit(RoundClosedEvent {
                total_raised: treasury.total_raised,
                investor_count: treasury.investor_count,
                timestamp: now,
            });
        };
    }

    /// Claim vested equity tokens
    public entry fun claim_tokens(
        certificate: &mut InvestmentCertificate,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        let now = clock::timestamp_ms(clock);
        let vested_total = calculate_vested_amount(certificate, now);
        let claimable = vested_total - certificate.total_claimed;
        
        assert!(claimable > 0, E_VESTING_NOT_READY);
        
        // Update claimed amount BEFORE creating token (reentrancy protection)
        certificate.total_claimed = certificate.total_claimed + claimable;
        
        // Create Equity Token
        let tokens = EquityToken {
            id: object::new(ctx),
            amount: claimable,
            investor: certificate.investor,
            claimed_at: now,
        };
        
        // Emit claim event
        event::emit(ClaimEvent {
            investor: certificate.investor,
            amount_claimed: claimable,
            total_claimed: certificate.total_claimed,
            timestamp: now,
        });
        
        // Transfer tokens to investor
        transfer::transfer(tokens, certificate.investor);
    }

    // ========== Admin Functions ==========

    /// Admin can close the round early
    public entry fun close_round(
        treasury: &mut Treasury,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        assert!(tx_context::sender(ctx) == treasury.admin, E_UNAUTHORIZED);
        assert!(treasury.round_open, E_ROUND_CLOSED);
        
        treasury.round_open = false;
        
        event::emit(RoundClosedEvent {
            total_raised: treasury.total_raised,
            investor_count: treasury.investor_count,
            timestamp: clock::timestamp_ms(clock),
        });
    }

    /// Admin can withdraw raised funds
    public entry fun withdraw_funds(
        treasury: &mut Treasury,
        amount: u64,
        ctx: &mut TxContext
    ) {
        assert!(tx_context::sender(ctx) == treasury.admin, E_UNAUTHORIZED);
        
        let withdrawn = coin::take(&mut treasury.staked_balance, amount, ctx);
        transfer::public_transfer(withdrawn, treasury.admin);
    }

    // ========== Helper Functions ==========

    /// Calculate vested amount using linear vesting
    fun calculate_vested_amount(cert: &InvestmentCertificate, now: u64): u64 {
        // If vesting period complete, return all tokens
        if (now >= cert.vesting_end) {
            return cert.equity_tokens
        };
        
        // If before vesting start, return 0
        if (now <= cert.vesting_start) {
            return 0
        };
        
        // Linear vesting calculation
        let elapsed = now - cert.vesting_start;
        let total_time = cert.vesting_end - cert.vesting_start;
        (cert.equity_tokens * elapsed) / total_time
    }

    // ========== View Functions ==========

    /// Get treasury details
    public fun get_treasury_details(treasury: &Treasury): (u64, u64, u64, u64, bool) {
        (
            treasury.total_raised,
            balance::value(&treasury.staked_balance),
            treasury.total_equity_issued,
            treasury.investor_count,
            treasury.round_open
        )
    }

    /// Get certificate details
    public fun get_certificate_details(cert: &InvestmentCertificate): (address, u64, u64, u64, u64, u64, u64) {
        (
            cert.investor,
            cert.sui_invested,
            cert.equity_tokens,
            cert.vesting_start,
            cert.vesting_end,
            cert.total_claimed,
            cert.certificate_number
        )
    }

    /// Calculate claimable amount for a certificate
    public fun get_claimable_amount(cert: &InvestmentCertificate, clock: &Clock): u64 {
        let now = clock::timestamp_ms(clock);
        let vested_total = calculate_vested_amount(cert, now);
        vested_total - cert.total_claimed
    }

    /// Get vesting progress percentage (in basis points)
    public fun get_vesting_progress(cert: &InvestmentCertificate, clock: &Clock): u64 {
        let now = clock::timestamp_ms(clock);
        
        if (now >= cert.vesting_end) {
            return 10000 // 100% in basis points
        };
        
        if (now <= cert.vesting_start) {
            return 0
        };
        
        let elapsed = now - cert.vesting_start;
        let total_time = cert.vesting_end - cert.vesting_start;
        (elapsed * 10000) / total_time
    }
}
