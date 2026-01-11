#!/usr/bin/env python3
"""
System Integrity Check - Token Separation Validation
Ensures correct token usage across the Africa Railways ecosystem
"""

# CORE SYSTEM CONSTANTS
TICKET_PAYMENT_TOKEN = "AFC"    # Required for fare settlement
REWARD_TOKEN = "AFRC"           # Issued post-travel
EQUITY_TOKEN = "SENT"           # Governance/Signaling

def validate_transaction_logic(payment_input, is_ticket_purchase=True):
    """
    Ensures the correct token is used for ticketing vs. rewards.
    
    Args:
        payment_input (str): Token being used for payment
        is_ticket_purchase (bool): Whether this is a ticket purchase transaction
        
    Returns:
        str: Validation result message
    """
    if is_ticket_purchase and payment_input != TICKET_PAYMENT_TOKEN:
        return f"❌ ERROR: Tickets must be paid with ${TICKET_PAYMENT_TOKEN}. ${REWARD_TOKEN} is for rewards only."
    elif not is_ticket_purchase and payment_input == REWARD_TOKEN:
        return f"✅ SUCCESS: Issuing ${REWARD_TOKEN} loyalty points."
    elif is_ticket_purchase and payment_input == TICKET_PAYMENT_TOKEN:
        return f"✅ SUCCESS: Transaction validated with ${TICKET_PAYMENT_TOKEN}."
    return "✅ SUCCESS: Transaction validated."

def validate_worker_rewards(signaling_data=True, safety_milestone=False):
    """
    Validates worker reward distribution logic.
    
    Args:
        signaling_data (bool): Whether worker submitted signaling data
        safety_milestone (bool): Whether worker reached safety milestone
        
    Returns:
        dict: Reward distribution details
    """
    rewards = {}
    
    if signaling_data:
        rewards[EQUITY_TOKEN] = {
            "amount": 2.00,
            "reason": "Verified track occupancy data"
        }
    
    if safety_milestone:
        rewards[REWARD_TOKEN] = {
            "amount": 5.00,
            "reason": "Safety milestone achieved"
        }
    
    return rewards

def validate_upgrade_logic(payment_token, is_upgrade=True):
    """
    Validates cabin upgrade payment logic.
    
    Args:
        payment_token (str): Token being used for upgrade
        is_upgrade (bool): Whether this is an upgrade transaction
        
    Returns:
        str: Validation result message
    """
    if is_upgrade and payment_token == REWARD_TOKEN:
        return f"✅ SUCCESS: Cabin upgrade paid with ${REWARD_TOKEN} rewards."
    elif is_upgrade and payment_token == TICKET_PAYMENT_TOKEN:
        return f"⚠️ WARNING: Upgrades can use ${REWARD_TOKEN}. ${TICKET_PAYMENT_TOKEN} accepted but not optimal."
    else:
        return f"❌ ERROR: Invalid upgrade payment token."

def generate_ticket_ui_logic():
    """
    Generates UI logic for ticket checkout interface.
    """
    print(f"--- UI UPDATE: TICKET CHECKOUT ---")
    print(f"Primary Button: 'Pay with ${TICKET_PAYMENT_TOKEN}'")
    print(f"Secondary Text: 'You will earn 50 ${REWARD_TOKEN} for this trip.'")
    print(f"Status: ${EQUITY_TOKEN} governance layer monitoring transaction fee-capture.")
    print()

def run_comprehensive_tests():
    """
    Run comprehensive system integrity tests.
    """
    print("=" * 60)
    print("AFRICA RAILWAYS - SYSTEM INTEGRITY CHECK")
    print("=" * 60)
    print()
    
    # Test 1: Ticket Purchase Validation
    print("TEST 1: Ticket Purchase Validation")
    print("-" * 60)
    print(f"Attempt to pay with {REWARD_TOKEN}:")
    print(validate_transaction_logic(REWARD_TOKEN, is_ticket_purchase=True))
    print()
    print(f"Attempt to pay with {TICKET_PAYMENT_TOKEN}:")
    print(validate_transaction_logic(TICKET_PAYMENT_TOKEN, is_ticket_purchase=True))
    print()
    
    # Test 2: Reward Distribution
    print("TEST 2: Reward Distribution")
    print("-" * 60)
    print(f"Issue {REWARD_TOKEN} rewards:")
    print(validate_transaction_logic(REWARD_TOKEN, is_ticket_purchase=False))
    print()
    
    # Test 3: Worker Rewards
    print("TEST 3: Worker Rewards")
    print("-" * 60)
    rewards = validate_worker_rewards(signaling_data=True, safety_milestone=True)
    for token, details in rewards.items():
        print(f"${token}: {details['amount']} - {details['reason']}")
    print()
    
    # Test 4: Upgrade Logic
    print("TEST 4: Cabin Upgrade Logic")
    print("-" * 60)
    print(f"Upgrade with {REWARD_TOKEN}:")
    print(validate_upgrade_logic(REWARD_TOKEN, is_upgrade=True))
    print()
    print(f"Upgrade with {TICKET_PAYMENT_TOKEN}:")
    print(validate_upgrade_logic(TICKET_PAYMENT_TOKEN, is_upgrade=True))
    print()
    
    # Test 5: UI Logic
    print("TEST 5: UI Logic Generation")
    print("-" * 60)
    generate_ticket_ui_logic()
    
    # Summary
    print("=" * 60)
    print("SYSTEM INTEGRITY CHECK COMPLETE")
    print("=" * 60)
    print()
    print("Token Usage Summary:")
    print(f"  • ${TICKET_PAYMENT_TOKEN} (Africoin): Ticket payments, freight settlement")
    print(f"  • ${REWARD_TOKEN} (Africa Rail Credits): Loyalty rewards, upgrades, lounges")
    print(f"  • ${EQUITY_TOKEN} (Sentinel): Governance, signaling data rewards")
    print()

if __name__ == "__main__":
    # Run comprehensive tests
    run_comprehensive_tests()
    
    # Additional validation for blog logic
    print("--- ADDITIONAL VALIDATION FOR BLOG LOGIC ---")
    print()
    print("Scenario 1: User tries to book ticket with AFRC")
    print(validate_transaction_logic("AFRC", is_ticket_purchase=True))
    print()
    print("Scenario 2: User books ticket with AFC")
    print(validate_transaction_logic("AFC", is_ticket_purchase=True))
    print()
    print("Scenario 3: System issues AFRC rewards after travel")
    print(validate_transaction_logic("AFRC", is_ticket_purchase=False))
    print()
