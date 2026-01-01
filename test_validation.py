#!/usr/bin/env python3
"""
Unit tests for ARAIL validation module
Tests phone number, wallet address, and amount validation
"""

import unittest
from validation import (
    validate_phone_number,
    validate_sui_address,
    validate_sui_amount,
    validate_session_id,
    sanitize_user_input
)


class TestPhoneNumberValidation(unittest.TestCase):
    """Test phone number validation"""
    
    def test_valid_zambian_number(self):
        """Test valid Zambian phone number"""
        is_valid, error = validate_phone_number("+260975190740")
        self.assertTrue(is_valid)
        self.assertIsNone(error)
    
    def test_valid_kenyan_number(self):
        """Test valid Kenyan phone number"""
        is_valid, error = validate_phone_number("+254712345678")
        self.assertTrue(is_valid)
        self.assertIsNone(error)
    
    def test_valid_tanzanian_number(self):
        """Test valid Tanzanian phone number"""
        is_valid, error = validate_phone_number("+255789123456")
        self.assertTrue(is_valid)
        self.assertIsNone(error)
    
    def test_invalid_no_plus(self):
        """Test invalid number without + prefix"""
        is_valid, error = validate_phone_number("260975190740")
        self.assertFalse(is_valid)
        self.assertIsNotNone(error)
    
    def test_invalid_too_short(self):
        """Test invalid number that's too short"""
        is_valid, error = validate_phone_number("+123")
        self.assertFalse(is_valid)
        self.assertIsNotNone(error)
    
    def test_invalid_too_long(self):
        """Test invalid number that's too long"""
        is_valid, error = validate_phone_number("+12345678901234567")
        self.assertFalse(is_valid)
        self.assertIsNotNone(error)
    
    def test_invalid_letters(self):
        """Test invalid number with letters"""
        is_valid, error = validate_phone_number("+260ABC123456")
        self.assertFalse(is_valid)
        self.assertIsNotNone(error)
    
    def test_empty_number(self):
        """Test empty phone number"""
        is_valid, error = validate_phone_number("")
        self.assertFalse(is_valid)
        self.assertIsNotNone(error)
    
    def test_none_number(self):
        """Test None phone number"""
        is_valid, error = validate_phone_number(None)
        self.assertFalse(is_valid)
        self.assertIsNotNone(error)


class TestSuiAddressValidation(unittest.TestCase):
    """Test Sui wallet address validation"""
    
    def test_valid_address(self):
        """Test valid Sui address"""
        address = "0x" + "a" * 64
        is_valid, error = validate_sui_address(address)
        self.assertTrue(is_valid)
        self.assertIsNone(error)
    
    def test_valid_address_mixed_case(self):
        """Test valid Sui address with mixed case"""
        address = "0x" + "AbCdEf0123456789" * 4
        is_valid, error = validate_sui_address(address)
        self.assertTrue(is_valid)
        self.assertIsNone(error)
    
    def test_invalid_no_0x_prefix(self):
        """Test invalid address without 0x prefix"""
        address = "a" * 64
        is_valid, error = validate_sui_address(address)
        self.assertFalse(is_valid)
        self.assertIsNotNone(error)
    
    def test_invalid_too_short(self):
        """Test invalid address that's too short"""
        address = "0x123"
        is_valid, error = validate_sui_address(address)
        self.assertFalse(is_valid)
        self.assertIsNotNone(error)
    
    def test_invalid_too_long(self):
        """Test invalid address that's too long"""
        address = "0x" + "a" * 65
        is_valid, error = validate_sui_address(address)
        self.assertFalse(is_valid)
        self.assertIsNotNone(error)
    
    def test_invalid_non_hex_characters(self):
        """Test invalid address with non-hex characters"""
        address = "0x" + "GGGG" + "a" * 60
        is_valid, error = validate_sui_address(address)
        self.assertFalse(is_valid)
        self.assertIsNotNone(error)
    
    def test_empty_address(self):
        """Test empty address"""
        is_valid, error = validate_sui_address("")
        self.assertFalse(is_valid)
        self.assertIsNotNone(error)


class TestSuiAmountValidation(unittest.TestCase):
    """Test SUI amount validation"""
    
    def test_valid_minimum_amount(self):
        """Test valid minimum amount (100 SUI)"""
        is_valid, error = validate_sui_amount(100)
        self.assertTrue(is_valid)
        self.assertIsNone(error)
    
    def test_valid_standard_amounts(self):
        """Test valid standard investment amounts"""
        for amount in [100, 500, 1000, 5000]:
            is_valid, error = validate_sui_amount(amount)
            self.assertTrue(is_valid, f"Amount {amount} should be valid")
            self.assertIsNone(error)
    
    def test_valid_float_amount(self):
        """Test valid float amount"""
        is_valid, error = validate_sui_amount(150.5)
        self.assertTrue(is_valid)
        self.assertIsNone(error)
    
    def test_valid_string_amount(self):
        """Test valid string amount"""
        is_valid, error = validate_sui_amount("500")
        self.assertTrue(is_valid)
        self.assertIsNone(error)
    
    def test_invalid_below_minimum(self):
        """Test invalid amount below minimum"""
        is_valid, error = validate_sui_amount(50)
        self.assertFalse(is_valid)
        self.assertIsNotNone(error)
    
    def test_invalid_zero(self):
        """Test invalid zero amount"""
        is_valid, error = validate_sui_amount(0)
        self.assertFalse(is_valid)
        self.assertIsNotNone(error)
    
    def test_invalid_negative(self):
        """Test invalid negative amount"""
        is_valid, error = validate_sui_amount(-100)
        self.assertFalse(is_valid)
        self.assertIsNotNone(error)
    
    def test_invalid_above_maximum(self):
        """Test invalid amount above maximum"""
        is_valid, error = validate_sui_amount(2_000_000)
        self.assertFalse(is_valid)
        self.assertIsNotNone(error)
    
    def test_invalid_string_format(self):
        """Test invalid string format"""
        is_valid, error = validate_sui_amount("not_a_number")
        self.assertFalse(is_valid)
        self.assertIsNotNone(error)


class TestSessionIdValidation(unittest.TestCase):
    """Test session ID validation"""
    
    def test_valid_session_id(self):
        """Test valid session ID"""
        is_valid, error = validate_session_id("AT_Session_12345")
        self.assertTrue(is_valid)
        self.assertIsNone(error)
    
    def test_valid_session_with_special_chars(self):
        """Test valid session ID with allowed special characters"""
        is_valid, error = validate_session_id("session-id_123.456")
        self.assertTrue(is_valid)
        self.assertIsNone(error)
    
    def test_invalid_too_short(self):
        """Test invalid session ID that's too short"""
        is_valid, error = validate_session_id("abc")
        self.assertFalse(is_valid)
        self.assertIsNotNone(error)
    
    def test_invalid_too_long(self):
        """Test invalid session ID that's too long"""
        is_valid, error = validate_session_id("x" * 129)
        self.assertFalse(is_valid)
        self.assertIsNotNone(error)
    
    def test_invalid_special_characters(self):
        """Test invalid session ID with disallowed special characters"""
        is_valid, error = validate_session_id("session@id#123")
        self.assertFalse(is_valid)
        self.assertIsNotNone(error)
    
    def test_empty_session_id(self):
        """Test empty session ID"""
        is_valid, error = validate_session_id("")
        self.assertFalse(is_valid)
        self.assertIsNotNone(error)


class TestInputSanitization(unittest.TestCase):
    """Test input sanitization"""
    
    def test_sanitize_normal_ussd(self):
        """Test sanitizing normal USSD input"""
        result = sanitize_user_input("1*2*3")
        self.assertEqual(result, "1*2*3")
    
    def test_sanitize_removes_letters(self):
        """Test that letters are removed"""
        result = sanitize_user_input("1abc*2def")
        self.assertEqual(result, "1*2")
    
    def test_sanitize_removes_special_chars(self):
        """Test that special characters are removed"""
        result = sanitize_user_input("1@#$*2!&")
        self.assertEqual(result, "1*2")
    
    def test_sanitize_trims_whitespace(self):
        """Test that whitespace is trimmed"""
        result = sanitize_user_input("  1*2*3  ")
        self.assertEqual(result, "1*2*3")
    
    def test_sanitize_limits_length(self):
        """Test that input is limited to max length"""
        long_input = "1" * 200
        result = sanitize_user_input(long_input, max_length=50)
        self.assertEqual(len(result), 50)
    
    def test_sanitize_empty_input(self):
        """Test sanitizing empty input"""
        result = sanitize_user_input("")
        self.assertEqual(result, "")
    
    def test_sanitize_none_input(self):
        """Test sanitizing None input"""
        result = sanitize_user_input(None)
        self.assertEqual(result, "")


if __name__ == '__main__':
    unittest.main()
