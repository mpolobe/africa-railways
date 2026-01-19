/// AFC Token - Primary payment currency for Africa Railways
/// Used for ticket purchases, freight payments, and cross-border settlements
module africoin::africoin {
    use sui::coin::{Self, Coin, TreasuryCap};
    use sui::url;

    /// The AFC token type
    public struct AFRICOIN has drop {}

    /// Capability for minting AFC tokens (held by authorized relayers)
    public struct MintCap has key, store {
        id: UID,
    }

    /// Treasury stats for transparency
    public struct TreasuryStats has key {
        id: UID,
        total_minted: u64,
        total_burned: u64,
    }

    /// Error codes
    const EInsufficientBalance: u64 = 0;
    const EZeroAmount: u64 = 1;

    /// Token decimals (6 for micro-AFC, matching SUI standard)
    const DECIMALS: u8 = 6;

    /// Initialize the AFC token
    fun init(witness: AFRICOIN, ctx: &mut TxContext) {
        let (treasury_cap, metadata) = coin::create_currency(
            witness,
            DECIMALS,
            b"AFC",
            b"Africoin",
            b"Primary payment token for Africa Railways - ticket purchases, freight, and cross-border settlements",
            option::some(url::new_unsafe_from_bytes(b"https://africa-railways.vercel.app/assets/afc-logo.png")),
            ctx
        );

        // Create mint capability for authorized operations
        let mint_cap = MintCap {
            id: object::new(ctx),
        };

        // Create treasury stats tracker
        let stats = TreasuryStats {
            id: object::new(ctx),
            total_minted: 0,
            total_burned: 0,
        };

        // Freeze metadata so it cannot be changed
        transfer::public_freeze_object(metadata);
        
        // Share treasury cap for controlled minting
        transfer::public_share_object(treasury_cap);
        
        // Transfer mint cap to deployer
        transfer::transfer(mint_cap, tx_context::sender(ctx));
        
        // Share stats for public viewing
        transfer::share_object(stats);
    }

    /// Mint AFC tokens (requires MintCap)
    public entry fun mint(
        treasury_cap: &mut TreasuryCap<AFRICOIN>,
        stats: &mut TreasuryStats,
        amount: u64,
        recipient: address,
        ctx: &mut TxContext
    ) {
        assert!(amount > 0, EZeroAmount);
        
        let minted_coin = coin::mint(treasury_cap, amount, ctx);
        stats.total_minted = stats.total_minted + amount;
        
        transfer::public_transfer(minted_coin, recipient);
    }

    /// Burn AFC tokens
    public entry fun burn(
        treasury_cap: &mut TreasuryCap<AFRICOIN>,
        stats: &mut TreasuryStats,
        coin_to_burn: Coin<AFRICOIN>,
    ) {
        let amount = coin::value(&coin_to_burn);
        stats.total_burned = stats.total_burned + amount;
        
        coin::burn(treasury_cap, coin_to_burn);
    }

    /// Transfer AFC tokens
    public entry fun transfer_afc(
        coin: Coin<AFRICOIN>,
        recipient: address,
    ) {
        transfer::public_transfer(coin, recipient);
    }

    /// Split and transfer a specific amount
    public entry fun pay(
        coin: &mut Coin<AFRICOIN>,
        amount: u64,
        recipient: address,
        ctx: &mut TxContext
    ) {
        assert!(coin::value(coin) >= amount, EInsufficientBalance);
        assert!(amount > 0, EZeroAmount);
        
        let payment = coin::split(coin, amount, ctx);
        transfer::public_transfer(payment, recipient);
    }

    /// Join multiple AFC coins into one
    public entry fun join(
        coin: &mut Coin<AFRICOIN>,
        other: Coin<AFRICOIN>,
    ) {
        coin::join(coin, other);
    }

    /// Get treasury statistics
    public fun get_stats(stats: &TreasuryStats): (u64, u64) {
        (stats.total_minted, stats.total_burned)
    }

    /// Get circulating supply
    public fun circulating_supply(stats: &TreasuryStats): u64 {
        stats.total_minted - stats.total_burned
    }

    #[test_only]
    public fun init_for_testing(ctx: &mut TxContext) {
        init(AFRICOIN {}, ctx);
    }
}
