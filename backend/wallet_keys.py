#!/usr/bin/env python3
"""
Custodial Wallet Key Management for USSD Users
Derives deterministic keypairs from phone numbers for USSD ticket purchases.

Security Model:
- Keys are derived deterministically from phone + master secret
- Master secret stored securely in environment variable
- Same phone always generates same wallet address
- Compatible with web PhoneWallet class (js/zklogin.js)

WARNING: This is a custodial approach. The backend holds user keys.
For web users, prefer zkLogin where users control their own keys.
"""

import os
import hashlib
import hmac
import logging
from typing import Tuple, Optional
from dataclasses import dataclass

logger = logging.getLogger(__name__)

# Master secret for key derivation - MUST be set in production
# This should be a 32+ byte random secret stored securely
MASTER_SECRET = os.environ.get('WALLET_MASTER_SECRET', 'africa-railways-dev-secret-change-in-production')

# Salt for address derivation (must match js/zklogin.js PhoneWallet)
ADDRESS_SALT = 'africa-railways-phone-wallet-v1'

# Salt for private key derivation (different from address salt for security)
PRIVKEY_SALT = 'africa-railways-custodial-privkey-v1'


@dataclass
class CustodialWallet:
    """Represents a custodial wallet derived from phone number"""
    phone_number: str
    normalized_digits: str
    address: str
    private_key_hex: str  # 32 bytes as hex (64 chars)
    

def normalize_phone(phone_number: str) -> str:
    """
    Normalize phone number to 10 digits
    Must match the JavaScript implementation in PhoneWallet.generateWallet()
    """
    # Remove spaces, dashes, parentheses
    cleaned = ''.join(c for c in phone_number if c.isdigit() or c == '+')
    # Get last 10 digits, pad if needed
    digits = cleaned.replace('+', '')[-10:].zfill(10)
    return digits


def derive_address(phone_number: str) -> str:
    """
    Derive SUI wallet address from phone number.
    MUST match the JavaScript PhoneWallet.generateWallet() algorithm exactly.
    
    This ensures the same phone number generates the same address
    whether accessed via USSD, web, or mobile app.
    """
    digits = normalize_phone(phone_number)
    
    # Create deterministic seed (matches JS implementation)
    input_str = digits + ADDRESS_SALT
    
    # SHA-256 hash
    hash_bytes = hashlib.sha256(input_str.encode()).digest()
    
    # Convert to hex address (0x + 64 hex chars)
    address = '0x' + hash_bytes.hex()
    
    return address


def derive_private_key(phone_number: str) -> str:
    """
    Derive private key from phone number using HMAC with master secret.
    
    This is separate from address derivation for security:
    - Address can be computed by anyone with the phone number
    - Private key requires the master secret (backend only)
    """
    digits = normalize_phone(phone_number)
    
    # Use HMAC-SHA256 with master secret for key derivation
    # This ensures only the backend with the secret can derive keys
    key_input = f"{digits}:{PRIVKEY_SALT}"
    
    private_key_bytes = hmac.new(
        MASTER_SECRET.encode(),
        key_input.encode(),
        hashlib.sha256
    ).digest()
    
    return private_key_bytes.hex()


def get_custodial_wallet(phone_number: str) -> CustodialWallet:
    """
    Get or create a custodial wallet for a phone number.
    
    Args:
        phone_number: User's phone number (any format)
    
    Returns:
        CustodialWallet with address and private key
    """
    digits = normalize_phone(phone_number)
    address = derive_address(phone_number)
    private_key = derive_private_key(phone_number)
    
    logger.info(f"🔐 Derived custodial wallet for {phone_number[:6]}***")
    logger.debug(f"   Address: {address[:16]}...")
    
    return CustodialWallet(
        phone_number=phone_number,
        normalized_digits=digits,
        address=address,
        private_key_hex=private_key
    )


def verify_address_matches(phone_number: str, expected_address: str) -> bool:
    """
    Verify that a phone number derives to the expected address.
    Used to validate that a user owns a wallet.
    """
    derived = derive_address(phone_number)
    return derived.lower() == expected_address.lower()


# SUI-specific key conversion
def private_key_to_sui_format(private_key_hex: str) -> str:
    """
    Convert raw private key to SUI keypair format.
    SUI uses Ed25519 keys with a specific encoding.
    
    Returns base64-encoded keypair string for use with pysui.
    """
    import base64
    
    # SUI Ed25519 flag byte
    ED25519_FLAG = 0x00
    
    # Convert hex to bytes
    key_bytes = bytes.fromhex(private_key_hex)
    
    # Prepend flag byte
    sui_key = bytes([ED25519_FLAG]) + key_bytes
    
    # Base64 encode
    return base64.b64encode(sui_key).decode()


# Test function
if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    
    print("=" * 60)
    print("🔐 Testing Custodial Wallet Key Derivation")
    print("=" * 60)
    
    # Test with the master wallet phone number
    test_phone = "+260975190740"
    
    print(f"\nPhone: {test_phone}")
    print(f"Normalized: {normalize_phone(test_phone)}")
    
    # Derive wallet
    wallet = get_custodial_wallet(test_phone)
    
    print(f"\nDerived Wallet:")
    print(f"  Address: {wallet.address}")
    print(f"  Private Key: {wallet.private_key_hex[:16]}...{wallet.private_key_hex[-8:]}")
    
    # Verify consistency
    wallet2 = get_custodial_wallet(test_phone)
    assert wallet.address == wallet2.address, "Address derivation not deterministic!"
    assert wallet.private_key_hex == wallet2.private_key_hex, "Key derivation not deterministic!"
    print(f"\n✅ Derivation is deterministic")
    
    # Test different formats of same number
    formats = [
        "+260975190740",
        "260975190740",
        "0975190740",
        "975190740",
        "+260 975 190 740",
        "0975-190-740"
    ]
    
    print(f"\n📱 Testing phone number format normalization:")
    addresses = set()
    for fmt in formats:
        addr = derive_address(fmt)
        addresses.add(addr)
        print(f"  {fmt:20} → {addr[:20]}...")
    
    if len(addresses) == 1:
        print(f"\n✅ All formats derive to same address")
    else:
        print(f"\n❌ WARNING: Different formats gave different addresses!")
    
    print("\n" + "=" * 60)
