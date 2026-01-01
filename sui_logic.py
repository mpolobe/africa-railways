#!/usr/bin/env python3
"""
ARAIL Sui Blockchain Logic - The Engine
Bridges Africa's Talking USSD (*384*26621#) to Sui Blockchain

This script executes on-chain transactions when investors confirm via USSD.
Uses pysui - the most robust Python SDK for Sui.
"""

import os
import logging
import socket
from pysui import SuiConfig, SyncClient
from pysui.sui.sui_txn import SyncTransaction
from validation_utils import validate_wallet_address, validate_phone_number

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# CONFIGURATION: Load your wallet & package details
# CRITICAL: Ensure these are set in Railway.app Environment Variables
# Security: Use Railway's Key Management for sensitive values
PACKAGE_ID = os.environ.get('PACKAGE_ID', '0xYOUR_DEPLOYED_PACKAGE_ID')
TREASURY_ID = os.environ.get('TREASURY_ID', '0xYOUR_SHARED_TREASURY_OBJECT_ID')
SYSTEM_CLOCK = "0x6"  # Sui System Clock object (immutable)

# Validate configuration on startup
if PACKAGE_ID and PACKAGE_ID != '0xYOUR_DEPLOYED_PACKAGE_ID':
    is_valid, error_msg = validate_wallet_address(PACKAGE_ID)
    if not is_valid:
        logger.warning(f"⚠️  PACKAGE_ID validation failed: {error_msg}")

if TREASURY_ID and TREASURY_ID != '0xYOUR_SHARED_TREASURY_OBJECT_ID':
    is_valid, error_msg = validate_wallet_address(TREASURY_ID)
    if not is_valid:
        logger.warning(f"⚠️  TREASURY_ID validation failed: {error_msg}")

# Constants
MIST_PER_SUI = 1_000_000_000


def execute_investment(phone_number: str, sui_amount: int):
    """
    Execute $SENT investment on Sui blockchain
    
    This is called when a user confirms investment via USSD:
    User dials *384*26621# → Selects "2. Invest in $SENT" → Chooses amount → Confirms
    → This function executes → Transaction on Sui → Certificate NFT minted
    
    Args:
        phone_number: Investor's phone number (e.g., "+260975190740")
        sui_amount: Amount in SUI (e.g., 100, 500, 1000)
    
    Returns:
        (success: bool, tx_digest: str or error_message: str)
    
    Example:
        success, result = execute_investment("+260975190740", 100)
        if success:
            print(f"Investment successful! TX: {result}")
        else:
            print(f"Investment failed: {result}")
    """
    # Validate phone number
    is_valid, error_msg = validate_phone_number(phone_number)
    if not is_valid:
        logger.error(f"Invalid phone number: {phone_number} - {error_msg}")
        return False, f"Invalid phone number: {error_msg}"
    
    try:
        logger.info(f"🚀 Executing investment: {sui_amount} SUI for {phone_number}")
        
        # Set socket timeout to prevent hanging connections
        socket.setdefaulttimeout(30)
        
        # 1. Initialize Client (Uses active address in config)
        # The config automatically loads the keypair from ~/.sui/sui_config/client.yaml
        # Or you can set SUI_PRIVATE_KEY environment variable
        cfg = SuiConfig.default_config() 
        client = SyncClient(cfg)
        txer = SyncTransaction(client=client)

        # 2. Split Gas Coin to get the investment amount (in MIST)
        # 1 SUI = 1,000,000,000 MIST
        mist_amount = int(sui_amount * MIST_PER_SUI)
        investment_coin = txer.split_coin(coin=txer.gas, amounts=[mist_amount])

        # 3. Call the Move 'invest' function
        # This calls: investment.move::invest(treasury, payment, clock)
        # Note: We use the system clock object (0x6) for the timestamp
        txer.move_call(
            target=f"{PACKAGE_ID}::investment::invest",
            arguments=[
                TREASURY_ID,      # Shared Treasury object
                investment_coin,  # Payment coin (split from gas)
                SYSTEM_CLOCK      # Sui System Clock (0x6) - provides timestamp
            ]
        )

        # 4. Execute & Sign
        # This signs the transaction with the wallet's private key and submits to Sui
        result = txer.execute()
        
        if result.is_ok():
            tx_digest = result.result_data.digest
            logger.info(f"✅ Investment successful for {phone_number}: {tx_digest}")
            logger.info(f"   View on Explorer: https://suiexplorer.com/txblock/{tx_digest}?network=mainnet")
            
            # The investor now has an InvestmentCertificate NFT in their wallet
            # They can view it via USSD (*384*26621# → 3. Check My Wallet)
            # Or on Sui Explorer
            
            return True, tx_digest
        else:
            error_msg = result.result_string
            logger.error(f"❌ Investment failed for {phone_number}: {error_msg}")
            return False, error_msg

    except socket.timeout:
        error_msg = "Connection timeout - network delays"
        logger.error(f"❌ Investment timeout for {phone_number}: {error_msg}")
        return False, error_msg
    except Exception as e:
        error_msg = str(e)
        logger.error(f"❌ Investment exception for {phone_number}: {error_msg}")
        return False, error_msg
    finally:
        # Reset socket timeout to default
        socket.setdefaulttimeout(None)


def check_investment_status(phone_number: str):
    """
    Check if a phone number has any investments
    
    This queries the blockchain for InvestmentCertificate NFTs
    associated with the user's wallet.
    
    Args:
        phone_number: Investor's phone number
    
    Returns:
        (success: bool, data: dict or error_message: str)
        
    Data dict structure:
        {
            'has_investment': bool,
            'total_invested': int,        # Total SUI invested
            'equity_tokens': int,         # Total $SENT tokens allocated
            'vested_tokens': int,         # Tokens vested so far
            'locked_tokens': int,         # Tokens still locked
            'vesting_progress': float,    # % of vesting complete
            'claimable_tokens': int,      # Tokens ready to claim
            'days_until_fully_vested': int,
            'certificate_id': str         # NFT object ID for claiming
        }
    """
    try:
        logger.info(f"🔍 Checking investment status for {phone_number}")
        
        # In production, you would:
        # 1. Query database for wallet address associated with phone number
        # 2. Query Sui blockchain for InvestmentCertificate objects owned by that address
        # 3. Parse certificate data (sui_invested, equity_tokens, vesting_start, etc.)
        # 4. Calculate vesting progress based on current time vs vesting_start
        
        # Example production query:
        # cfg = SuiConfig.default_config()
        # client = SyncClient(cfg)
        # wallet_address = get_wallet_for_phone(phone_number)  # From your DB
        # objects = client.get_objects_owned_by_address(wallet_address)
        # certificates = [obj for obj in objects if obj.type.contains("InvestmentCertificate")]
        
        # For now, return mock data with realistic vesting calculation
        # Simulating: 500 SUI invested 1 month ago (8.33% vested in 12-month linear vesting)
        total_tokens = 142857
        vesting_progress = 8.33  # 1 month / 12 months
        vested_tokens = int(total_tokens * vesting_progress / 100)
        locked_tokens = total_tokens - vested_tokens
        
        return True, {
            'has_investment': True,
            'total_invested': 500,  # SUI
            'equity_tokens': total_tokens,
            'vested_tokens': vested_tokens,
            'locked_tokens': locked_tokens,
            'vesting_progress': vesting_progress,
            'claimable_tokens': vested_tokens,  # Assuming none claimed yet
            'days_until_fully_vested': 330,  # 11 months remaining
            'certificate_id': '0xMOCK_CERTIFICATE_ID_12345'
        }
        
    except Exception as e:
        logger.error(f"❌ Status check failed for {phone_number}: {str(e)}")
        return False, str(e)


def claim_vested_tokens(phone_number: str, certificate_id: str):
    """
    Claim vested tokens from an InvestmentCertificate
    
    This is called when a user wants to claim their vested tokens via USSD.
    
    Args:
        phone_number: Investor's phone number
        certificate_id: Certificate NFT object ID
    
    Returns:
        (success: bool, tx_digest: str or error_message: str)
    """
    try:
        logger.info(f"🎁 Claiming vested tokens for {phone_number}")
        
        # 1. Initialize Client
        cfg = SuiConfig.default_config()
        client = SyncClient(cfg)
        txer = SyncTransaction(client=client)
        
        # 2. Call claim_tokens function
        txer.move_call(
            target=f"{PACKAGE_ID}::investment::claim_tokens",
            arguments=[
                certificate_id,  # InvestmentCertificate object
                SYSTEM_CLOCK     # Sui System Clock (0x6)
            ]
        )
        
        # 3. Execute
        result = txer.execute()
        
        if result.is_ok():
            tx_digest = result.result_data.digest
            logger.info(f"✅ Tokens claimed for {phone_number}: {tx_digest}")
            return True, tx_digest
        else:
            error_msg = result.result_string
            logger.error(f"❌ Claim failed for {phone_number}: {error_msg}")
            return False, error_msg
            
    except Exception as e:
        logger.error(f"❌ Claim exception for {phone_number}: {str(e)}")
        return False, str(e)


# ========== Testing Functions ==========

def test_investment():
    """
    Test the investment flow
    Run this to verify your setup before going live
    """
    print("🧪 Testing ARAIL Investment Flow")
    print("=" * 60)
    
    # Test data
    test_phone = "+260975190740"
    test_amount = 100  # SUI
    
    print(f"Phone: {test_phone}")
    print(f"Amount: {test_amount} SUI")
    print(f"Package: {PACKAGE_ID}")
    print(f"Treasury: {TREASURY_ID}")
    print()
    
    # Execute investment
    print("Executing investment...")
    success, result = execute_investment(test_phone, test_amount)
    
    if success:
        print(f"✅ SUCCESS!")
        print(f"Transaction Digest: {result}")
        print(f"View on Explorer: https://suiexplorer.com/txblock/{result}?network=mainnet")
        print()
        print("Next steps:")
        print("1. Check Sui Explorer to verify transaction")
        print("2. Look for InvestmentCertificate NFT creation")
        print("3. Verify equity calculation is correct")
    else:
        print(f"❌ FAILED!")
        print(f"Error: {result}")
        print()
        print("Troubleshooting:")
        print("1. Check PACKAGE_ID is correct")
        print("2. Check TREASURY_ID is correct")
        print("3. Verify wallet has enough SUI for gas + investment")
        print("4. Check smart contract is deployed to mainnet")


if __name__ == "__main__":
    """
    Run this script directly to test the investment flow
    
    Usage:
        python3 sui_logic.py
    
    Before running:
        1. Deploy smart contracts to Sui mainnet
        2. Set PACKAGE_ID environment variable
        3. Set TREASURY_ID environment variable
        4. Ensure wallet has SUI for gas + investment
    """
    test_investment()
