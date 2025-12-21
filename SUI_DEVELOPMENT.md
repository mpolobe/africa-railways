# Sui Blockchain Development Guide

This guide covers Sui blockchain development for the Africa Railways project.

## Quick Start

### 1. Verify Sui Installation
```bash
sui --version
```

If not installed, run:
```bash
make sui-install
```

### 2. Start Local Sui Network
```bash
make sui-start
```

This starts:
- **Sui RPC Node** on port 9000
- **Sui Faucet** on port 9123

### 3. Configure Sui Client
```bash
sui client
```

Follow the prompts to:
- Create a new wallet
- Connect to local network (http://localhost:9000)
- Set active environment to `localnet`

## Sui CLI Commands

### Wallet Management
```bash
# Show active address
sui client active-address

# List all addresses
sui client addresses

# Show gas objects (SUI tokens)
sui client gas

# Get tokens from faucet (local network only)
curl --location --request POST 'http://localhost:9123/gas' \
  --header 'Content-Type: application/json' \
  --data-raw '{
    "FixedAmountRequest": {
      "recipient": "YOUR_ADDRESS_HERE"
    }
  }'
```

### Environment Management
```bash
# List environments
sui client envs

# Switch environment
sui client switch --env localnet

# Add new environment
sui client new-env --alias mainnet --rpc https://fullnode.mainnet.sui.io:443
```

### Move Contract Development
```bash
# Build contracts
cd contracts
sui move build

# Test contracts
sui move test

# Publish to local network
sui client publish --gas-budget 100000000

# Publish to testnet
sui client publish --gas-budget 100000000 --env testnet
```

## Project Structure

```
contracts/
├── sources/
│   └── ticket.move          # Railway ticketing contract
└── spine_token/
    └── sources/
        └── afrc.move         # AFRC token contract
```

## AFRC Token Contract

The Africoin (AFRC) token is implemented as a Sui Coin:

```move
module spine_token::afrc {
    use sui::coin::{Self, TreasuryCap};
    
    struct AFRC has drop {}
    
    fun init(witness: AFRC, ctx: &mut TxContext) {
        let (treasury, metadata) = coin::create_currency(
            witness, 
            6,                              // decimals
            b"AFRC",                        // symbol
            b"Africoin",                    // name
            b"Digital Spine Utility Token", // description
            std::option::none(),            // icon URL
            ctx
        );
        transfer::public_freeze_object(metadata);
        transfer::public_share_object(treasury);
    }
}
```

### Key Features:
- **6 decimals** precision
- **Shared treasury** for minting
- **Frozen metadata** (immutable)
- **Sui Move** native implementation

## Railway Ticketing Contract

The ticketing system handles cross-border railway payments:

```move
module africoin::railway_ticketing {
    struct RailNetwork has key {
        id: UID,
        authorities: Table<vector<u8>, address>
    }
    
    public entry fun purchase_ticket(
        network: &RailNetwork,
        payment: Coin<AFRICOIN>,
        countries: vector<vector<u8>>,
        distances: vector<u64>,
        ctx: &mut TxContext
    ) {
        // Automatically calculates and splits revenue
        // pro-rata based on track kilometers
    }
}
```

### Features:
- **Multi-country routing** support
- **Automatic revenue splitting** by distance
- **Immutable ticket records** on-chain
- **Integration with AFRC token**

## Development Workflow

### 1. Write Move Code
Edit files in `contracts/sources/`:
```bash
cd contracts/sources
nano my_contract.move
```

### 2. Build and Test
```bash
# Build
make sui-build

# Run tests
make sui-test

# Or manually:
cd contracts
sui move build
sui move test
```

### 3. Deploy to Local Network
```bash
# Start local network (if not running)
make sui-start

# In another terminal, publish
make sui-publish
```

### 4. Interact with Contract
```bash
# Call a function
sui client call \
  --package PACKAGE_ID \
  --module MODULE_NAME \
  --function FUNCTION_NAME \
  --args ARG1 ARG2 \
  --gas-budget 10000000
```

## Testing Strategies

### Unit Tests
Write tests in Move:
```move
#[test]
fun test_ticket_purchase() {
    // Test logic here
}

#[test_only]
use sui::test_scenario;
```

### Integration Tests
Use TypeScript SDK:
```typescript
import { SuiClient } from '@mysten/sui.js/client';

const client = new SuiClient({ 
  url: 'http://localhost:9000' 
});

// Test contract interactions
```

## Common Issues

### Port Already in Use
```bash
# Kill process on port 9000
lsof -ti:9000 | xargs kill -9

# Kill process on port 9123
lsof -ti:9123 | xargs kill -9
```

### Sui Network Not Starting
```bash
# Force regenerate genesis
sui start --with-faucet --force-regenesis

# Or clean and restart
rm -rf ~/.sui/sui_config
sui start --with-faucet
```

### Out of Gas
```bash
# Request more from faucet
curl --location --request POST 'http://localhost:9123/gas' \
  --header 'Content-Type: application/json' \
  --data-raw '{
    "FixedAmountRequest": {
      "recipient": "'$(sui client active-address)'"
    }
  }'
```

### Build Errors
```bash
# Clean build
cd contracts
rm -rf build/
sui move build

# Check dependencies
cat Move.toml
```

## Sui Networks

### Local Network (Development)
- **RPC:** http://localhost:9000
- **Faucet:** http://localhost:9123
- **Use for:** Local testing, fast iteration

### Testnet
- **RPC:** https://fullnode.testnet.sui.io:443
- **Faucet:** https://faucet.testnet.sui.io/
- **Use for:** Integration testing, demos

### Mainnet
- **RPC:** https://fullnode.mainnet.sui.io:443
- **Faucet:** None (real SUI required)
- **Use for:** Production deployment

## Best Practices

### 1. Gas Management
- Always set appropriate `--gas-budget`
- Monitor gas usage in tests
- Optimize contract logic for efficiency

### 2. Security
- Use `assert!` for validation
- Implement proper access controls
- Test edge cases thoroughly
- Audit before mainnet deployment

### 3. Testing
- Write comprehensive unit tests
- Test on local network first
- Deploy to testnet before mainnet
- Monitor contract behavior

### 4. Version Control
- Commit Move.toml with dependencies
- Tag releases for deployed contracts
- Document contract addresses
- Keep deployment logs

## Resources

### Official Documentation
- [Sui Documentation](https://docs.sui.io/)
- [Move Language Book](https://move-language.github.io/move/)
- [Sui Move by Example](https://examples.sui.io/)

### Tools
- [Sui Explorer](https://suiexplorer.com/)
- [Sui TypeScript SDK](https://github.com/MystenLabs/sui/tree/main/sdk/typescript)
- [Sui Wallet](https://chrome.google.com/webstore/detail/sui-wallet)

### Community
- [Sui Discord](https://discord.gg/sui)
- [Sui Forum](https://forums.sui.io/)
- [GitHub Discussions](https://github.com/MystenLabs/sui/discussions)

## Makefile Commands Reference

```bash
make sui-install    # Install Sui CLI
make sui-start      # Start local network
make sui-client     # Open Sui client console
make sui-build      # Build Move contracts
make sui-test       # Test Move contracts
make sui-publish    # Publish contracts
```

## Next Steps

1. **Explore existing contracts** in `contracts/` directory
2. **Start local network** with `make sui-start`
3. **Build contracts** with `make sui-build`
4. **Run tests** with `make sui-test`
5. **Deploy locally** with `make sui-publish`
6. **Read Sui docs** at https://docs.sui.io/

---

For questions or issues, refer to [GITPOD_SETUP.md](GITPOD_SETUP.md) or open an issue on GitHub.
