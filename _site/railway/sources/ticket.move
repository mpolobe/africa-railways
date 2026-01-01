# 1. Create the Sui project structure
mkdir -p railway/sources

# 2. Create the Move.toml (Configuration file)
cat << 'EOF' > railway/Move.toml
[package]
name = "africa_railways"
version = "1.0.0"

[dependencies]
Sui = { git = "https://github.com/MystenLabs/sui.git", subdir = "crates/sui-framework/packages/sui-framework", rev = "framework/mainnet" }

[addresses]
africa_railways = "0x0"
EOF

# 3. Create the ticket.move contract
cat << 'EOF' > railway/sources/ticket.move
module africa_railways::ticket {
    use sui::object::{Self, UID};
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};
    use std::string::{String};

    /// Represents a digital train ticket as an NFT
    struct Ticket has key, store {
        id: UID,
        train_id: String,
        from: String,
        to: String,
        class: String,
        is_validated: bool,
    }

    /// A capability that allows staff to validate tickets
    struct StaffCap has key { id: UID }

    /// One-time setup to create the staff capability for the deployer
    fun init(ctx: &mut TxContext) {
        transfer::transfer(StaffCap {
            id: object::new(ctx)
        }, tx_context::sender(ctx));
    }

    /// Mints a new ticket and sends it to the passenger
    public entry fun mint_ticket(
        train_id: String,
        from: String,
        to: String,
        class: String,
        recipient: address,
        ctx: &mut TxContext
    ) {
        let ticket = Ticket {
            id: object::new(ctx),
            train_id,
            from,
            to,
            class,
            is_validated: false,
        };
        transfer::public_transfer(ticket, recipient);
    }

    /// Staff uses their StaffCap to mark a ticket as validated
    public entry fun validate_ticket(
        _cap: &StaffCap, 
        ticket: &mut Ticket
    ) {
        ticket.is_validated = true;
    }
}
EOF

