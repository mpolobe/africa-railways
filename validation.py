#!/usr/bin/env python3
"""
ARAIL Input Validation Module
Validates phone numbers and wallet addresses before processing
"""

import re
import logging

logger = logging.getLogger(__name__)


def validate_phone_number(phone_number: str) -> tuple[bool, str]:
    """
    Validate phone number format (E.164 standard)
    
    E.164 format: +[country code][subscriber number]
    - Must start with '+'
    - Followed by 1-3 digit country code
    - Followed by up to 15 digits total
    
    Args:
        phone_number: Phone number string to validate
    
    Returns:
        tuple: (is_valid: bool, error_message: str or None)
    
    Examples:
        validate_phone_number("+260975190740")  # Valid Zambian number
        validate_phone_number("+254712345678")  # Valid Kenyan number
        validate_phone_number("0712345678")     # Invalid (missing +)
    """
    if not phone_number:
        return False, "Phone number is required"
    
    if not isinstance(phone_number, str):
        return False, "Phone number must be a string"
    
    # Remove any whitespace
    phone_number = phone_number.strip()
    
    # E.164 format validation
    # Pattern: +[country code 1-3 digits][subscriber number]
    # Total length: 8-15 digits (excluding +)
    pattern = r'^\+[1-9]\d{1,14}$'
    
    if not re.match(pattern, phone_number):
        return False, "Invalid phone format. Use E.164 format: +[country code][number] (e.g., +260975190740)"
    
    # Additional validation: check length is reasonable
    if len(phone_number) < 8:
        return False, "Phone number too short (minimum 8 characters including +)"
    
    if len(phone_number) > 16:
        return False, "Phone number too long (maximum 16 characters including +)"
    
    logger.debug(f"Phone number validation passed: {phone_number}")
    return True, None


def validate_sui_address(address: str) -> tuple[bool, str]:
    """
    Validate Sui blockchain wallet address format
    
    Sui address format:
    - Starts with '0x'
    - Followed by exactly 64 hexadecimal characters
    - Case insensitive
    
    Args:
        address: Wallet address string to validate
    
    Returns:
        tuple: (is_valid: bool, error_message: str or None)
    
    Examples:
        validate_sui_address("0x1234...") # Valid if 64 hex chars after 0x
        validate_sui_address("1234...")   # Invalid (missing 0x)
        validate_sui_address("0xGGGG...") # Invalid (non-hex characters)
    """
    if not address:
        return False, "Wallet address is required"
    
    if not isinstance(address, str):
        return False, "Wallet address must be a string"
    
    # Remove any whitespace
    address = address.strip()
    
    # Check if starts with 0x
    if not address.startswith('0x'):
        return False, "Invalid Sui address format. Must start with '0x'"
    
    # Remove 0x prefix for hex validation
    hex_part = address[2:]
    
    # Check length (Sui addresses are 64 hex characters)
    if len(hex_part) != 64:
        return False, f"Invalid Sui address length. Expected 64 hex characters, got {len(hex_part)}"
    
    # Check if all characters are valid hexadecimal
    if not re.match(r'^[0-9a-fA-F]{64}$', hex_part):
        return False, "Invalid Sui address. Must contain only hexadecimal characters (0-9, a-f, A-F)"
    
    logger.debug(f"Sui address validation passed: {address[:10]}...")
    return True, None


def validate_session_id(session_id: str) -> tuple[bool, str]:
    """
    Validate session ID format
    
    Session IDs should be:
    - Non-empty strings
    - Reasonable length (4-128 characters)
    - Alphanumeric with allowed special characters (_-.)
    
    Args:
        session_id: Session identifier to validate
    
    Returns:
        tuple: (is_valid: bool, error_message: str or None)
    """
    if not session_id:
        return False, "Session ID is required"
    
    if not isinstance(session_id, str):
        return False, "Session ID must be a string"
    
    session_id = session_id.strip()
    
    if len(session_id) < 4:
        return False, "Session ID too short (minimum 4 characters)"
    
    if len(session_id) > 128:
        return False, "Session ID too long (maximum 128 characters)"
    
    # Allow alphanumeric, underscore, hyphen, and dot
    if not re.match(r'^[a-zA-Z0-9_\-\.]+$', session_id):
        return False, "Session ID contains invalid characters. Use alphanumeric, _, -, or ."
    
    return True, None


def validate_sui_amount(amount: int | float | str) -> tuple[bool, str]:
    """
    Validate SUI investment amount
    
    Requirements:
    - Must be a positive number
    - Must be at least 100 SUI (minimum investment)
    - Should be reasonable (not exceeding 1,000,000 SUI)
    
    Args:
        amount: SUI amount to validate
    
    Returns:
        tuple: (is_valid: bool, error_message: str or None)
    """
    try:
        # Convert to float if string
        if isinstance(amount, str):
            amount = float(amount)
        
        amount_float = float(amount)
        
        if amount_float <= 0:
            return False, "Investment amount must be positive"
        
        if amount_float < 100:
            return False, "Minimum investment is 100 SUI"
        
        if amount_float > 1_000_000:
            return False, "Maximum investment is 1,000,000 SUI"
        
        return True, None
        
    except (ValueError, TypeError):
        return False, "Invalid amount format. Must be a number"


def sanitize_user_input(user_input: str, max_length: int = 100) -> str:
    """
    Sanitize user input for USSD text input
    
    - Remove leading/trailing whitespace
    - Limit length
    - Remove potentially dangerous characters
    
    Args:
        user_input: Raw user input
        max_length: Maximum allowed length
    
    Returns:
        str: Sanitized input
    """
    if not user_input:
        return ""
    
    # Remove leading/trailing whitespace
    sanitized = str(user_input).strip()
    
    # Limit length
    sanitized = sanitized[:max_length]
    
    # For USSD, only allow digits and asterisk
    # This prevents injection attacks
    sanitized = re.sub(r'[^0-9\*]', '', sanitized)
    
    return sanitized


# Validation result class for better type safety
class ValidationResult:
    """Container for validation results"""
    
    def __init__(self, is_valid: bool, error_message: str = None):
        self.is_valid = is_valid
        self.error_message = error_message
    
    def __bool__(self):
        return self.is_valid
    
    def __str__(self):
        if self.is_valid:
            return "Valid"
        return f"Invalid: {self.error_message}"


if __name__ == "__main__":
    """
    Test validation functions
    
    Usage:
        python3 validation.py
    """
    print("🧪 Testing ARAIL Validation Module")
    print("=" * 60)
    
    # Test phone number validation
    print("\n1. Phone Number Validation:")
    test_phones = [
        "+260975190740",  # Valid Zambian
        "+254712345678",  # Valid Kenyan
        "+255789123456",  # Valid Tanzanian
        "0712345678",     # Invalid (no +)
        "+1234",          # Invalid (too short)
        "invalid",        # Invalid
    ]
    
    for phone in test_phones:
        is_valid, error = validate_phone_number(phone)
        status = "✅" if is_valid else "❌"
        print(f"  {status} {phone:20s} - {error or 'Valid'}")
    
    # Test Sui address validation
    print("\n2. Sui Address Validation:")
    test_addresses = [
        "0x" + "a" * 64,  # Valid
        "0x" + "1234567890abcdef" * 4,  # Valid
        "0x123",          # Invalid (too short)
        "1234567890",     # Invalid (no 0x)
        "0xGGGGGGGG",     # Invalid (non-hex)
    ]
    
    for address in test_addresses:
        is_valid, error = validate_sui_address(address)
        status = "✅" if is_valid else "❌"
        display_addr = address[:20] + "..." if len(address) > 20 else address
        print(f"  {status} {display_addr:25s} - {error or 'Valid'}")
    
    # Test SUI amount validation
    print("\n3. SUI Amount Validation:")
    test_amounts = [100, 500, 1000, 50, -100, 0, 1_000_000, 2_000_000]
    
    for amount in test_amounts:
        is_valid, error = validate_sui_amount(amount)
        status = "✅" if is_valid else "❌"
        print(f"  {status} {amount:15,} SUI - {error or 'Valid'}")
    
    print("\n" + "=" * 60)
    print("✅ Validation tests complete")
