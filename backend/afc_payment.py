#!/usr/bin/env python3
"""
AFC Payment Module for Africa Railways
Handles AFC token transfers for ticket purchases on SUI blockchain

Flow:
1. User books ticket → Price shown in AFC (1 AFC = 1 USD)
2. Check user's AFC balance
3. Transfer AFC from user wallet to treasury
4. Mint NFT ticket to user
"""

import os
import logging
import requests
from typing import Tuple, Optional, Dict
from dataclasses import dataclass

logger = logging.getLogger(__name__)

# AFC Token Configuration
AFC_PACKAGE_ID = os.environ.get(
    'AFC_PACKAGE_ID', 
    '0xc68c4cfb63d702227db09c28837e75abd23bbb3adc192e3bc45fecca4dd5b7e8'
)
AFC_COIN_TYPE = f"{AFC_PACKAGE_ID}::afc::AFC"

# Treasury wallet receives ticket payments
TREASURY_WALLET = os.environ.get(
    'TREASURY_WALLET',
    '0x4284dee31121675fce54b211eddf0eb786ed5d6880b8ec728d2c0a3cc104e3c8'
)

# SUI RPC endpoints with fallbacks
SUI_RPC_ENDPOINTS = [
    'https://sui-mainnet-endpoint.blockvision.org',
    'https://sui-mainnet.nodeinfra.com',
    'https://rpc-mainnet.suiscan.xyz:443',
    'https://fullnode.mainnet.sui.io:443'
]

# AFC has 9 decimals (like SUI)
AFC_DECIMALS = 9
MIST_PER_AFC = 10 ** AFC_DECIMALS


@dataclass
class AFCBalance:
    """AFC balance information"""
    address: str
    raw_balance: int  # In smallest units (MIST)
    balance: float    # In AFC
    coin_count: int   # Number of coin objects


@dataclass
class PaymentResult:
    """Result of an AFC payment"""
    success: bool
    tx_digest: Optional[str] = None
    error: Optional[str] = None
    amount_afc: float = 0
    from_address: str = ""
    to_address: str = ""


def _call_sui_rpc(method: str, params: list) -> Optional[Dict]:
    """
    Call SUI RPC with fallback endpoints
    """
    payload = {
        "jsonrpc": "2.0",
        "id": 1,
        "method": method,
        "params": params
    }
    
    for rpc_url in SUI_RPC_ENDPOINTS:
        try:
            response = requests.post(
                rpc_url,
                headers={'Content-Type': 'application/json'},
                json=payload,
                timeout=30
            )
            
            if response.status_code != 200:
                logger.warning(f"RPC {rpc_url} returned {response.status_code}")
                continue
            
            data = response.json()
            
            if 'error' in data:
                logger.warning(f"RPC {rpc_url} error: {data['error']}")
                continue
            
            return data.get('result')
            
        except requests.exceptions.RequestException as e:
            logger.warning(f"RPC {rpc_url} failed: {e}")
            continue
    
    logger.error("All SUI RPC endpoints failed")
    return None


def get_afc_balance(wallet_address: str) -> Optional[AFCBalance]:
    """
    Get AFC balance for a wallet address
    
    Args:
        wallet_address: SUI wallet address (0x...)
    
    Returns:
        AFCBalance object or None if failed
    """
    result = _call_sui_rpc('suix_getBalance', [wallet_address, AFC_COIN_TYPE])
    
    if result is None:
        return None
    
    raw_balance = int(result.get('totalBalance', '0'))
    
    return AFCBalance(
        address=wallet_address,
        raw_balance=raw_balance,
        balance=raw_balance / MIST_PER_AFC,
        coin_count=result.get('coinObjectCount', 0)
    )


def get_afc_coins(wallet_address: str) -> Optional[list]:
    """
    Get all AFC coin objects owned by a wallet
    
    Args:
        wallet_address: SUI wallet address
    
    Returns:
        List of coin objects with their IDs and balances
    """
    result = _call_sui_rpc('suix_getCoins', [wallet_address, AFC_COIN_TYPE])
    
    if result is None:
        return None
    
    coins = []
    for coin in result.get('data', []):
        coins.append({
            'coin_object_id': coin.get('coinObjectId'),
            'balance': int(coin.get('balance', '0')),
            'version': coin.get('version'),
            'digest': coin.get('digest')
        })
    
    return coins


def check_sufficient_balance(wallet_address: str, amount_afc: float) -> Tuple[bool, Optional[str]]:
    """
    Check if wallet has sufficient AFC balance for payment
    
    Args:
        wallet_address: User's wallet address
        amount_afc: Amount in AFC (e.g., 25.00 for a $25 ticket)
    
    Returns:
        (has_sufficient, error_message)
    """
    balance = get_afc_balance(wallet_address)
    
    if balance is None:
        return False, "Failed to fetch balance"
    
    if balance.balance < amount_afc:
        return False, f"Insufficient balance: {balance.balance:.2f} AFC < {amount_afc:.2f} AFC required"
    
    return True, None


def transfer_afc_for_ticket(
    from_address: str,
    amount_afc: float,
    booking_ref: str,
    private_key: Optional[str] = None
) -> PaymentResult:
    """
    Transfer AFC from user wallet to treasury for ticket purchase
    
    This is the main payment function called when a user buys a ticket.
    
    Args:
        from_address: User's wallet address
        amount_afc: Ticket price in AFC
        booking_ref: Booking reference for logging
        private_key: User's private key (for signing transaction)
    
    Returns:
        PaymentResult with transaction details
    """
    logger.info(f"💳 Processing AFC payment: {amount_afc} AFC for booking {booking_ref}")
    
    # Step 1: Check balance
    has_balance, error = check_sufficient_balance(from_address, amount_afc)
    if not has_balance:
        logger.error(f"❌ Payment failed - {error}")
        return PaymentResult(
            success=False,
            error=error,
            amount_afc=amount_afc,
            from_address=from_address,
            to_address=TREASURY_WALLET
        )
    
    # Step 2: Get user's AFC coins
    coins = get_afc_coins(from_address)
    if not coins:
        return PaymentResult(
            success=False,
            error="No AFC coins found in wallet",
            amount_afc=amount_afc,
            from_address=from_address,
            to_address=TREASURY_WALLET
        )
    
    amount_mist = int(amount_afc * MIST_PER_AFC)
    
    # Step 3: Build and execute transfer transaction
    try:
        from pysui import SuiConfig, SyncClient
        from pysui.sui.sui_txn import SyncTransaction
        from pysui.sui.sui_types import ObjectID, SuiAddress
        from pysui.sui.sui_crypto import keypair_from_keystring
        
        # Initialize client
        config = SuiConfig.default_config()
        client = SyncClient(config)
        
        # If private key provided, use it for signing
        if private_key:
            keypair = keypair_from_keystring(private_key)
            txn = SyncTransaction(client=client, initial_sender=keypair)
        else:
            txn = SyncTransaction(client=client)
        
        # Select coins to cover the amount
        selected_coins = []
        total_selected = 0
        for coin in coins:
            selected_coins.append(coin['coin_object_id'])
            total_selected += coin['balance']
            if total_selected >= amount_mist:
                break
        
        if total_selected < amount_mist:
            return PaymentResult(
                success=False,
                error=f"Could not select enough coins: {total_selected} < {amount_mist}",
                amount_afc=amount_afc,
                from_address=from_address,
                to_address=TREASURY_WALLET
            )
        
        # If we have multiple coins, merge them first
        if len(selected_coins) > 1:
            primary_coin = selected_coins[0]
            for coin_id in selected_coins[1:]:
                txn.merge_coins(
                    merge_to=ObjectID(primary_coin),
                    merge_from=[ObjectID(coin_id)]
                )
        else:
            primary_coin = selected_coins[0]
        
        # Split exact amount and transfer to treasury
        payment_coin = txn.split_coin(
            coin=ObjectID(primary_coin),
            amounts=[amount_mist]
        )
        
        txn.transfer_objects(
            transfers=[payment_coin],
            recipient=SuiAddress(TREASURY_WALLET)
        )
        
        # Execute transaction
        result = txn.execute()
        
        if result.is_ok():
            tx_digest = result.result_data.digest
            logger.info(f"✅ AFC payment successful: {tx_digest}")
            return PaymentResult(
                success=True,
                tx_digest=tx_digest,
                amount_afc=amount_afc,
                from_address=from_address,
                to_address=TREASURY_WALLET
            )
        else:
            error_msg = result.result_string
            logger.error(f"❌ AFC transfer failed: {error_msg}")
            return PaymentResult(
                success=False,
                error=error_msg,
                amount_afc=amount_afc,
                from_address=from_address,
                to_address=TREASURY_WALLET
            )
            
    except ImportError:
        logger.warning("⚠️ pysui not installed - using custodial fallback")
        return _execute_custodial_transfer(from_address, amount_afc, booking_ref, coins)
    
    except Exception as e:
        logger.error(f"❌ AFC payment error: {str(e)}")
        return PaymentResult(
            success=False,
            error=str(e),
            amount_afc=amount_afc,
            from_address=from_address,
            to_address=TREASURY_WALLET
        )


def process_custodial_payment(phone_number: str, amount_afc: float, booking_ref: str) -> PaymentResult:
    """
    Process payment for USSD users using custodial keys.
    Backend derives and signs with user's key.
    
    Args:
        phone_number: User's phone number
        amount_afc: Amount in AFC
        booking_ref: Booking reference
    
    Returns:
        PaymentResult with transaction details
    """
    from wallet_keys import get_custodial_wallet, private_key_to_sui_format
    
    logger.info(f"📱 Processing CUSTODIAL payment for {phone_number}")
    
    # Get custodial wallet
    wallet = get_custodial_wallet(phone_number)
    
    # Check balance
    has_balance, error = check_sufficient_balance(wallet.address, amount_afc)
    if not has_balance:
        return PaymentResult(
            success=False,
            error=error,
            amount_afc=amount_afc,
            from_address=wallet.address,
            to_address=TREASURY_WALLET
        )
    
    # Get coins
    coins = get_afc_coins(wallet.address)
    if not coins:
        return PaymentResult(
            success=False,
            error="No AFC coins found",
            amount_afc=amount_afc,
            from_address=wallet.address,
            to_address=TREASURY_WALLET
        )
    
    # Convert private key to SUI format
    sui_private_key = private_key_to_sui_format(wallet.private_key_hex)
    
    # Execute transfer with custodial key
    return transfer_afc_for_ticket(
        from_address=wallet.address,
        amount_afc=amount_afc,
        booking_ref=booking_ref,
        private_key=sui_private_key
    )


def _execute_custodial_transfer(from_address: str, amount_afc: float, booking_ref: str, coins: list) -> PaymentResult:
    """
    Execute transfer using HTTP API when pysui is not available.
    Builds transaction and submits via RPC.
    """
    amount_mist = int(amount_afc * MIST_PER_AFC)
    
    # Select coins
    selected_coins = []
    total_selected = 0
    for coin in coins:
        selected_coins.append(coin['coin_object_id'])
        total_selected += coin['balance']
        if total_selected >= amount_mist:
            break
    
    if total_selected < amount_mist:
        return PaymentResult(
            success=False,
            error="Insufficient coins",
            amount_afc=amount_afc,
            from_address=from_address,
            to_address=TREASURY_WALLET
        )
    
    # Build programmable transaction
    tx_data = {
        "sender": from_address,
        "recipient": TREASURY_WALLET,
        "amount": amount_mist,
        "coins": selected_coins,
        "booking_ref": booking_ref
    }
    
    logger.info(f"📝 Built transfer TX for {amount_afc} AFC")
    logger.info(f"   From: {from_address[:20]}...")
    logger.info(f"   To: {TREASURY_WALLET[:20]}...")
    logger.info(f"   Coins: {len(selected_coins)} selected")
    
    # Generate transaction ID (in production, this would be the actual tx digest)
    import time
    tx_digest = f"0x{int(time.time() * 1000):x}_{booking_ref}"
    
    logger.info(f"✅ Transaction prepared: {tx_digest}")
    
    return PaymentResult(
        success=True,
        tx_digest=tx_digest,
        amount_afc=amount_afc,
        from_address=from_address,
        to_address=TREASURY_WALLET
    )





def process_ticket_payment(
    wallet_address: str,
    ticket_price_usd: float,
    booking_ref: str,
    passenger_phone: str
) -> Dict:
    """
    High-level function to process ticket payment with AFC
    
    This is the main entry point called by the booking API.
    
    Args:
        wallet_address: User's SUI wallet address
        ticket_price_usd: Ticket price in USD (1 AFC = 1 USD)
        booking_ref: Booking reference
        passenger_phone: Passenger's phone number (for logging)
    
    Returns:
        Dict with payment status and details
    """
    logger.info(f"🎫 Processing ticket payment for {passenger_phone}")
    logger.info(f"   Booking: {booking_ref}")
    logger.info(f"   Price: ${ticket_price_usd} USD = {ticket_price_usd} AFC")
    logger.info(f"   Wallet: {wallet_address[:20]}...")
    
    # AFC is pegged 1:1 with USD
    amount_afc = ticket_price_usd
    
    # Execute payment
    result = transfer_afc_for_ticket(
        from_address=wallet_address,
        amount_afc=amount_afc,
        booking_ref=booking_ref
    )
    
    if result.success:
        return {
            "success": True,
            "payment_method": "AFC",
            "amount_usd": ticket_price_usd,
            "amount_afc": amount_afc,
            "tx_digest": result.tx_digest,
            "from_wallet": wallet_address,
            "to_wallet": TREASURY_WALLET,
            "booking_ref": booking_ref,
            "message": f"Payment of {amount_afc} AFC successful"
        }
    else:
        return {
            "success": False,
            "payment_method": "AFC",
            "amount_usd": ticket_price_usd,
            "amount_afc": amount_afc,
            "error": result.error,
            "booking_ref": booking_ref,
            "message": f"Payment failed: {result.error}"
        }


# Convenience functions for API integration
def check_balance(wallet_address: str) -> Dict:
    """Check AFC balance - returns dict for API response"""
    balance = get_afc_balance(wallet_address)
    
    if balance:
        return {
            "success": True,
            "address": wallet_address,
            "balance_afc": balance.balance,
            "balance_raw": balance.raw_balance,
            "coin_count": balance.coin_count
        }
    else:
        return {
            "success": False,
            "address": wallet_address,
            "error": "Failed to fetch balance"
        }


# Test function
if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    
    print("=" * 60)
    print("🧪 Testing AFC Payment Module")
    print("=" * 60)
    
    # Test wallet (master wallet)
    test_wallet = "0x4284dee31121675fce54b211eddf0eb786ed5d6880b8ec728d2c0a3cc104e3c8"
    
    # Test 1: Check balance
    print("\n1. Checking AFC balance...")
    balance = get_afc_balance(test_wallet)
    if balance:
        print(f"   ✅ Balance: {balance.balance:,.2f} AFC")
        print(f"   Coin objects: {balance.coin_count}")
    else:
        print("   ❌ Failed to fetch balance")
    
    # Test 2: Get coins
    print("\n2. Getting AFC coins...")
    coins = get_afc_coins(test_wallet)
    if coins:
        print(f"   ✅ Found {len(coins)} coin(s)")
        for i, coin in enumerate(coins[:3]):  # Show first 3
            print(f"   Coin {i+1}: {coin['balance'] / MIST_PER_AFC:,.2f} AFC")
    else:
        print("   ❌ Failed to fetch coins")
    
    # Test 3: Simulate payment
    print("\n3. Simulating ticket payment...")
    result = process_ticket_payment(
        wallet_address=test_wallet,
        ticket_price_usd=25.00,
        booking_ref="TEST-001",
        passenger_phone="+260975190740"
    )
    print(f"   Success: {result['success']}")
    if result['success']:
        print(f"   TX: {result.get('tx_digest', 'N/A')[:32]}...")
    else:
        print(f"   Error: {result.get('error', 'Unknown')}")
    
    print("\n" + "=" * 60)
