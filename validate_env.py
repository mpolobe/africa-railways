#!/usr/bin/env python3
"""
Environment Variable Sanity Check for Africa Railways Institutional Terminal

This script validates that all required environment variables are present
before the application starts. This prevents runtime failures and ensures
institutional audit compliance.

Exit codes:
  0 - All required variables present
  1 - One or more required variables missing
"""

import os
import sys
from typing import List, Tuple

# Required environment variables for production deployment
REQUIRED_VARS = [
    # Core API Keys
    ("RAILWAYS_API_KEY", "Railways API authentication"),
    ("AFRICOIN_API_KEY", "Africoin API authentication"),
    
    # OTP/SMS Providers
    ("AT_API_KEY", "Africa's Talking API key for OTP"),
    ("AT_USERNAME", "Africa's Talking username"),
    ("TWILIO_ACCOUNT_SID", "Twilio account SID for fallback OTP"),
    ("TWILIO_AUTH_TOKEN", "Twilio authentication token"),
    
    # Blockchain
    ("SUI_RPC_URL", "Sui blockchain RPC endpoint"),
    ("SUI_ADMIN_ADDRESS", "Sui admin wallet address"),
    
    # Database
    ("DATABASE_URL", "PostgreSQL connection string"),
]

# Optional but recommended variables
OPTIONAL_VARS = [
    ("EXPO_TOKEN", "Expo build service token"),
    ("BROWSERSTACK_ACCESS_KEY", "BrowserStack testing access key"),
    ("DIGITS_SECRET", "Team access secret"),
]


def validate_environment() -> Tuple[bool, List[str], List[str]]:
    """
    Validate that all required environment variables are present.
    
    Returns:
        Tuple of (success, missing_required, missing_optional)
    """
    missing_required = []
    missing_optional = []
    
    # Check required variables
    for var_name, description in REQUIRED_VARS:
        value = os.getenv(var_name)
        if not value or value.strip() == "":
            missing_required.append(f"  ❌ {var_name}: {description}")
    
    # Check optional variables
    for var_name, description in OPTIONAL_VARS:
        value = os.getenv(var_name)
        if not value or value.strip() == "":
            missing_optional.append(f"  ⚠️  {var_name}: {description}")
    
    success = len(missing_required) == 0
    return success, missing_required, missing_optional


def main():
    """Main validation function."""
    print("=" * 70)
    print("Africa Railways - Environment Variable Validation")
    print("=" * 70)
    print()
    
    success, missing_required, missing_optional = validate_environment()
    
    if success:
        print("✅ All required environment variables are present")
        print()
        
        if missing_optional:
            print("⚠️  Optional variables missing (non-critical):")
            for msg in missing_optional:
                print(msg)
            print()
        
        print("🚀 Application is ready to start")
        print("=" * 70)
        return 0
    else:
        print("❌ VALIDATION FAILED: Missing required environment variables")
        print()
        print("Missing required variables:")
        for msg in missing_required:
            print(msg)
        print()
        
        if missing_optional:
            print("Missing optional variables:")
            for msg in missing_optional:
                print(msg)
            print()
        
        print("=" * 70)
        print("ACTION REQUIRED:")
        print("1. Go to Railway Dashboard → Your Service → Variables")
        print("2. Add the missing environment variables listed above")
        print("3. Redeploy the service")
        print("=" * 70)
        return 1


if __name__ == "__main__":
    sys.exit(main())
