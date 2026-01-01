#!/usr/bin/env python3
"""
ARAIL Validation Utilities
Provides validation functions for phone numbers, wallet addresses, and other inputs
"""

import re
import logging

logger = logging.getLogger(__name__)


def validate_phone_number(phone_number: str) -> tuple[bool, str]:
    """
    Validate phone number format for African countries
    
    Accepts formats:
    - International: +260975190740, +254712345678, +255712345678
    - Local with country code: 260975190740
    - Must be 10-15 digits (including country code)
    
    Args:
        phone_number: Phone number to validate
    
    Returns:
        (is_valid: bool, error_message: str)
        
    Examples:
        >>> validate_phone_number("+260975190740")
        (True, "")
        
        >>> validate_phone_number("123")
        (False, "Phone number must be between 10-15 digits")
        
        >>> validate_phone_number("invalid")
        (False, "Phone number must contain only digits, +, or -")
    """
    if not phone_number:
        return False, "Phone number is required"
    
    # Remove spaces and hyphens for validation
    cleaned = phone_number.replace(" ", "").replace("-", "")
    
    # Check if it contains only valid characters
    if not re.match(r'^\+?\d+$', cleaned):
        return False, "Phone number must contain only digits, +, or -"
    
    # Remove + for length check
    digits_only = cleaned.lstrip('+')
    
    # Check length (country code + number should be 10-15 digits)
    if len(digits_only) < 10 or len(digits_only) > 15:
        return False, "Phone number must be between 10-15 digits"
    
    # Check if it starts with a valid country code (African countries)
    # Common African country codes: +254 (Kenya), +255 (Tanzania), +260 (Zambia), etc.
    valid_country_codes = ['254', '255', '256', '257', '260', '261', '263', '265', '267', '268', '27']
    
    # If starts with +, check country code
    if cleaned.startswith('+'):
        has_valid_code = any(digits_only.startswith(code) for code in valid_country_codes)
        if not has_valid_code:
            logger.warning(f"Phone number {phone_number} has non-African country code")
            # Don't fail validation, just log warning
    
    logger.info(f"✅ Phone number validated: {phone_number}")
    return True, ""


def validate_wallet_address(address: str) -> tuple[bool, str]:
    """
    Validate Sui wallet address format
    
    Sui addresses:
    - Start with '0x'
    - Followed by 64 hexadecimal characters (32 bytes)
    - Example: 0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef
    
    Args:
        address: Wallet address to validate
    
    Returns:
        (is_valid: bool, error_message: str)
        
    Examples:
        >>> validate_wallet_address("0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef")
        (True, "")
        
        >>> validate_wallet_address("0x123")
        (False, "Sui address must be 66 characters (0x + 64 hex chars)")
        
        >>> validate_wallet_address("invalid")
        (False, "Sui address must start with 0x")
    """
    if not address:
        return False, "Wallet address is required"
    
    # Check if starts with 0x
    if not address.startswith('0x'):
        return False, "Sui address must start with 0x"
    
    # Check length (0x + 64 hex characters = 66 total)
    if len(address) != 66:
        return False, "Sui address must be 66 characters (0x + 64 hex chars)"
    
    # Check if remaining characters are valid hexadecimal
    hex_part = address[2:]
    if not re.match(r'^[0-9a-fA-F]+$', hex_part):
        return False, "Sui address must contain only hexadecimal characters after 0x"
    
    logger.info(f"✅ Wallet address validated: {address[:10]}...{address[-8:]}")
    return True, ""


def validate_sui_amount(amount: int, min_amount: int = 1, max_amount: int = 1000000) -> tuple[bool, str]:
    """
    Validate SUI investment amount
    
    Args:
        amount: Amount in SUI to validate
        min_amount: Minimum allowed amount (default: 1 SUI)
        max_amount: Maximum allowed amount (default: 1,000,000 SUI)
    
    Returns:
        (is_valid: bool, error_message: str)
        
    Examples:
        >>> validate_sui_amount(100)
        (True, "")
        
        >>> validate_sui_amount(0)
        (False, "Investment amount must be at least 1 SUI")
        
        >>> validate_sui_amount(2000000)
        (False, "Investment amount cannot exceed 1000000 SUI")
    """
    if not isinstance(amount, (int, float)):
        return False, "Investment amount must be a number"
    
    if amount < min_amount:
        return False, f"Investment amount must be at least {min_amount} SUI"
    
    if amount > max_amount:
        return False, f"Investment amount cannot exceed {max_amount} SUI"
    
    logger.info(f"✅ Investment amount validated: {amount} SUI")
    return True, ""


def sanitize_input(input_string: str, max_length: int = 100) -> str:
    """
    Sanitize user input to prevent injection attacks
    
    Args:
        input_string: String to sanitize
        max_length: Maximum allowed length
    
    Returns:
        Sanitized string
    """
    if not input_string:
        return ""
    
    # Remove potentially dangerous characters
    # Keep only alphanumeric, spaces, and basic punctuation
    # For USSD: also keep * for menu navigation
    sanitized = re.sub(r'[^\w\s\+\-\.\*]', '', input_string)
    
    # Truncate to max length
    sanitized = sanitized[:max_length]
    
    return sanitized.strip()


if __name__ == "__main__":
    """
    Test validation functions
    """
    print("🧪 Testing Validation Utilities")
    print("=" * 60)
    
    # Test phone number validation
    print("\n1. Phone Number Validation:")
    test_phones = [
        "+260975190740",
        "260975190740",
        "+254712345678",
        "123",
        "invalid",
        ""
    ]
    
    for phone in test_phones:
        is_valid, error = validate_phone_number(phone)
        status = "✅" if is_valid else "❌"
        print(f"{status} {phone or '(empty)'}: {error if error else 'Valid'}")
    
    # Test wallet address validation
    print("\n2. Wallet Address Validation:")
    test_addresses = [
        "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
        "0x123",
        "invalid",
        "",
        "1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"
    ]
    
    for addr in test_addresses:
        is_valid, error = validate_wallet_address(addr)
        status = "✅" if is_valid else "❌"
        print(f"{status} {addr[:20] if addr else '(empty)'}: {error if error else 'Valid'}")
    
    # Test amount validation
    print("\n3. SUI Amount Validation:")
    test_amounts = [100, 500, 1000, 0, -10, 2000000, "invalid"]
    
    for amount in test_amounts:
        is_valid, error = validate_sui_amount(amount)
        status = "✅" if is_valid else "❌"
        print(f"{status} {amount}: {error if error else 'Valid'}")
