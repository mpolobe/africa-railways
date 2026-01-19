/// Railway Ticketing System - NFT tickets purchased with AFC
/// Handles cross-border revenue splitting based on track kilometers
module africoin::railway_ticketing {
    use sui::coin::{Self, Coin};
    use sui::balance::{Self, Balance};
    use sui::table::{Self, Table};
    use sui::event;
    use africoin::africoin::AFRICOIN;

    /// Error codes
    const EInvalidRoute: u64 = 0;
    const EInsufficientPayment: u64 = 1;
    const EUnauthorizedOperator: u64 = 2;
    const ETicketExpired: u64 = 3;
    const ETicketAlreadyUsed: u64 = 4;
    const EMismatchedArrays: u64 = 5;

    /// Platform fee in basis points (2% = 200 bp)
    const PLATFORM_FEE_BP: u64 = 200;
    const BASIS_POINTS: u64 = 10000;

    /// The railway network configuration
    public struct RailNetwork has key {
        id: UID,
        /// Country code -> Railway authority wallet address
        authorities: Table<vector<u8>, address>,
        /// Platform treasury for fee collection
        treasury: Balance<AFRICOIN>,
        /// Price per kilometer in micro-AFC
        price_per_km: u64,
        /// Admin address
        admin: address,
    }

    /// NFT Ticket - proof of purchase and travel authorization
    public struct Ticket has key, store {
        id: UID,
        /// Passenger wallet address
        passenger: address,
        /// Origin station code
        origin: vector<u8>,
        /// Destination station code
        destination: vector<u8>,
        /// Countries traversed
        countries: vector<vector<u8>>,
        /// Total distance in km
        total_distance: u64,
        /// Amount paid in micro-AFC
        amount_paid: u64,
        /// Issue timestamp (epoch)
        issued_at: u64,
        /// Expiry timestamp (epoch)
        expires_at: u64,
        /// Whether ticket has been used
        used: bool,
    }

    /// Event emitted on ticket purchase
    public struct TicketPurchased has copy, drop {
        ticket_id: ID,
        passenger: address,
        origin: vector<u8>,
        destination: vector<u8>,
        amount: u64,
        countries: vector<vector<u8>>,
    }

    /// Event emitted on ticket validation
    public struct TicketValidated has copy, drop {
        ticket_id: ID,
        validator: address,
        station: vector<u8>,
    }

    /// Event emitted on revenue distribution
    public struct RevenueDistributed has copy, drop {
        country: vector<u8>,
        authority: address,
        amount: u64,
    }

    /// Initialize the rail network
    fun init(ctx: &mut TxContext) {
        let network = RailNetwork {
            id: object::new(ctx),
            authorities: table::new(ctx),
            treasury: balance::zero(),
            price_per_km: 1000, // 0.001 AFC per km (1000 micro-AFC)
            admin: tx_context::sender(ctx),
        };
        transfer::share_object(network);
    }

    /// Register a railway authority for a country
    public entry fun register_authority(
        network: &mut RailNetwork,
        country_code: vector<u8>,
        authority_address: address,
        ctx: &mut TxContext
    ) {
        assert!(tx_context::sender(ctx) == network.admin, EUnauthorizedOperator);
        
        if (table::contains(&network.authorities, country_code)) {
            table::remove(&mut network.authorities, country_code);
        };
        table::add(&mut network.authorities, country_code, authority_address);
    }

    /// Purchase a railway ticket
    /// Payment is split pro-rata based on kilometers in each country
    public entry fun purchase_ticket(
        network: &mut RailNetwork,
        payment: Coin<AFRICOIN>,
        origin: vector<u8>,
        destination: vector<u8>,
        countries: vector<vector<u8>>,
        distances: vector<u64>,
        validity_epochs: u64,
        ctx: &mut TxContext
    ) {
        let num_countries = vector::length(&countries);
        assert!(num_countries > 0, EInvalidRoute);
        assert!(num_countries == vector::length(&distances), EMismatchedArrays);

        // Calculate total distance and required payment
        let mut total_distance: u64 = 0;
        let mut i = 0;
        while (i < num_countries) {
            total_distance = total_distance + *vector::borrow(&distances, i);
            i = i + 1;
        };

        let required_amount = total_distance * network.price_per_km;
        let payment_amount = coin::value(&payment);
        assert!(payment_amount >= required_amount, EInsufficientPayment);

        // Calculate platform fee
        let platform_fee = (payment_amount * PLATFORM_FEE_BP) / BASIS_POINTS;
        let distributable = payment_amount - platform_fee;

        // Convert payment to balance for splitting
        let mut payment_balance = coin::into_balance(payment);

        // Take platform fee
        let fee_balance = balance::split(&mut payment_balance, platform_fee);
        balance::join(&mut network.treasury, fee_balance);

        // Distribute to railway authorities based on distance
        i = 0;
        while (i < num_countries) {
            let country = *vector::borrow(&countries, i);
            let distance = *vector::borrow(&distances, i);
            
            if (table::contains(&network.authorities, country)) {
                let authority = *table::borrow(&network.authorities, country);
                let share = (distributable * distance) / total_distance;
                
                if (share > 0 && balance::value(&payment_balance) >= share) {
                    let authority_balance = balance::split(&mut payment_balance, share);
                    let authority_coin = coin::from_balance(authority_balance, ctx);
                    transfer::public_transfer(authority_coin, authority);

                    event::emit(RevenueDistributed {
                        country,
                        authority,
                        amount: share,
                    });
                };
            };
            i = i + 1;
        };

        // Any remainder goes to treasury (rounding dust)
        if (balance::value(&payment_balance) > 0) {
            balance::join(&mut network.treasury, payment_balance);
        } else {
            balance::destroy_zero(payment_balance);
        };

        // Create NFT ticket
        let current_epoch = tx_context::epoch(ctx);
        let ticket_id = object::new(ctx);
        let ticket_id_copy = object::uid_to_inner(&ticket_id);

        let ticket = Ticket {
            id: ticket_id,
            passenger: tx_context::sender(ctx),
            origin,
            destination,
            countries,
            total_distance,
            amount_paid: payment_amount,
            issued_at: current_epoch,
            expires_at: current_epoch + validity_epochs,
            used: false,
        };

        event::emit(TicketPurchased {
            ticket_id: ticket_id_copy,
            passenger: tx_context::sender(ctx),
            origin: ticket.origin,
            destination: ticket.destination,
            amount: payment_amount,
            countries: ticket.countries,
        });

        transfer::transfer(ticket, tx_context::sender(ctx));
    }

    /// Validate a ticket at a station (mark as used)
    public entry fun validate_ticket(
        ticket: &mut Ticket,
        station: vector<u8>,
        ctx: &mut TxContext
    ) {
        let current_epoch = tx_context::epoch(ctx);
        assert!(current_epoch <= ticket.expires_at, ETicketExpired);
        assert!(!ticket.used, ETicketAlreadyUsed);

        ticket.used = true;

        event::emit(TicketValidated {
            ticket_id: object::uid_to_inner(&ticket.id),
            validator: tx_context::sender(ctx),
            station,
        });
    }

    /// Withdraw platform fees (admin only)
    public entry fun withdraw_fees(
        network: &mut RailNetwork,
        amount: u64,
        recipient: address,
        ctx: &mut TxContext
    ) {
        assert!(tx_context::sender(ctx) == network.admin, EUnauthorizedOperator);
        
        let withdrawn = balance::split(&mut network.treasury, amount);
        let coin = coin::from_balance(withdrawn, ctx);
        transfer::public_transfer(coin, recipient);
    }

    /// Update price per kilometer (admin only)
    public entry fun set_price_per_km(
        network: &mut RailNetwork,
        new_price: u64,
        ctx: &mut TxContext
    ) {
        assert!(tx_context::sender(ctx) == network.admin, EUnauthorizedOperator);
        network.price_per_km = new_price;
    }

    /// View functions
    public fun get_ticket_info(ticket: &Ticket): (address, vector<u8>, vector<u8>, u64, bool) {
        (ticket.passenger, ticket.origin, ticket.destination, ticket.amount_paid, ticket.used)
    }

    public fun get_treasury_balance(network: &RailNetwork): u64 {
        balance::value(&network.treasury)
    }

    public fun get_price_per_km(network: &RailNetwork): u64 {
        network.price_per_km
    }

    public fun is_ticket_valid(ticket: &Ticket, current_epoch: u64): bool {
        !ticket.used && current_epoch <= ticket.expires_at
    }

    #[test_only]
    public fun init_for_testing(ctx: &mut TxContext) {
        init(ctx);
    }
}
