#!/usr/bin/env python3
"""
ARAIL SMS Notification System
Sends investor success confirmations via Africa's Talking SMS API

This creates a closed-loop system:
USSD Input → Blockchain Transaction → SMS Confirmation → Physical Device
"""

import os
import logging
import socket
import africastalking
from validation_utils import validate_phone_number

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize Africa's Talking
# CRITICAL: Set these in Railway.app Environment Variables
AT_USERNAME = os.getenv("AT_USERNAME", "sandbox")  # Your Africa's Talking username
AT_API_KEY = os.getenv("AT_API_KEY", "")           # Your API key
AT_SENDER_ID = os.getenv("AT_SENDER_ID", "ARAIL")  # Sender ID (approved by AT)

# Initialize SDK
try:
    africastalking.initialize(AT_USERNAME, AT_API_KEY)
    sms = africastalking.SMS
    SMS_AVAILABLE = True
    logger.info("✅ Africa's Talking SMS initialized")
except Exception as e:
    SMS_AVAILABLE = False
    logger.warning(f"⚠️  SMS not available: {e}")


def send_investment_success_sms(phone_number: str, amount: int, tx_digest: str) -> bool:
    """
    Sends investment confirmation SMS with Sui Explorer link
    
    This is the FINAL STEP in the investment flow:
    1. User dials *384*26621#
    2. Selects investment amount
    3. Confirms investment
    4. Blockchain transaction executes
    5. → THIS FUNCTION: SMS confirmation sent
    
    Args:
        phone_number: Investor's phone (e.g., "+260975190740")
        amount: Investment amount in SUI (e.g., 100, 500, 1000)
        tx_digest: Sui transaction digest (e.g., "0x123abc...")
    
    Returns:
        bool: True if SMS sent successfully, False otherwise
    
    Example:
        success = send_investment_success_sms("+260975190740", 100, "0x123abc...")
    """
    if not SMS_AVAILABLE:
        logger.warning(f"SMS not available, skipping notification for {phone_number}")
        return False
    
    # Validate phone number
    is_valid, error_msg = validate_phone_number(phone_number)
    if not is_valid:
        logger.error(f"Invalid phone number: {phone_number} - {error_msg}")
        return False
    
    try:
        # Set socket timeout to prevent hanging
        socket.setdefaulttimeout(15)
        
        # Calculate equity percentage
        equity_percent = (amount / 350000) * 10
        
        # Shortened explorer link (use URL shortener in production)
        # For now, truncate TX digest for character optimization
        short_tx = tx_digest[:10] if len(tx_digest) > 10 else tx_digest
        
        # Craft message - OPTIMIZED to stay under 160 chars (single SMS)
        # Character budget: 160 chars max for single SMS segment
        message = (
            f"✅ ARAIL Investment Confirmed!\n"
            f"{amount} SUI → {equity_percent:.4f}% equity\n"
            f"Certificate NFT minted\n"
            f"TX: {short_tx}...\n\n"
            f"View: suivision.xyz/txblock/{short_tx}\n"
            f"Welcome aboard! 🚂💎"
        )
        
        logger.info(f"📱 Sending SMS to {phone_number}")
        logger.info(f"   Message length: {len(message)} chars")
        
        # Send SMS (recipients must be in a list)
        response = sms.send(
            message=message,
            recipients=[phone_number],
            sender_id=AT_SENDER_ID
        )
        
        logger.info(f"✅ SMS sent to {phone_number}")
        logger.info(f"   Response: {response}")
        
        return True
        
    except socket.timeout:
        logger.error(f"❌ SMS timeout for {phone_number}: Connection timed out")
        return False
    except Exception as e:
        logger.error(f"❌ SMS error for {phone_number}: {str(e)}")
        return False
    finally:
        # Reset socket timeout to default
        socket.setdefaulttimeout(None)


def send_vesting_reminder_sms(phone_number: str, claimable_tokens: int, wallet_data: dict = None) -> bool:
    """
    Sends wallet balance details via SMS
    
    Can be used for:
    1. Monthly vesting reminders (automated)
    2. On-demand wallet balance queries (USSD 3*1*2)
    
    Args:
        phone_number: Investor's phone
        claimable_tokens: Number of tokens ready to claim
        wallet_data: Optional full wallet data for detailed SMS
    
    Returns:
        bool: True if SMS sent successfully
    """
    if not SMS_AVAILABLE:
        return False
    
    try:
        if wallet_data:
            # Detailed wallet balance (requested via USSD 3*1*2)
            # Optimized to stay under 160 chars for single SMS segment
            message = (
                f"$SENT Balance:\n"
                f"Total: {wallet_data['equity_tokens']:,}\n"
                f"Vested: {wallet_data['vested_tokens']:,} ({wallet_data['vesting_progress']:.1f}%)\n"
                f"Locked: {wallet_data['locked_tokens']:,}\n"
                f"Claimable: {claimable_tokens:,}\n\n"
                f"Dial *384*26621#→3→1 to claim"
            )
        else:
            # Simple vesting reminder (automated monthly)
            message = (
                f"🎁 ARAIL Vesting Update\n\n"
                f"You have {claimable_tokens:,} $SENT tokens ready to claim!\n\n"
                f"Dial *384*26621# → 3 → 1 to claim\n"
                f"Or visit: africarailways.com/vesting"
            )
        
        logger.info(f"📱 Sending wallet SMS to {phone_number} ({len(message)} chars)")
        
        response = sms.send(message, [phone_number], sender_id=AT_SENDER_ID)
        logger.info(f"✅ Wallet SMS sent to {phone_number}")
        return True
        
    except Exception as e:
        logger.error(f"❌ Wallet SMS error: {str(e)}")
        return False


def send_milestone_update_sms(phone_number: str, milestone_name: str, milestone_number: int) -> bool:
    """
    Sends SMS when a project milestone is reached
    
    Args:
        phone_number: Investor's phone
        milestone_name: Name of milestone (e.g., "MVP Launch")
        milestone_number: Milestone number (1-5)
    
    Returns:
        bool: True if SMS sent successfully
    """
    if not SMS_AVAILABLE:
        return False
    
    try:
        message = (
            f"🎯 ARAIL Milestone {milestone_number} Achieved!\n\n"
            f"{milestone_name}\n\n"
            f"Your investment is making progress.\n"
            f"Check updates: africarailways.com/investor"
        )
        
        response = sms.send(message, [phone_number], sender_id=AT_SENDER_ID)
        logger.info(f"✅ Milestone update sent to {phone_number}")
        return True
        
    except Exception as e:
        logger.error(f"❌ Milestone update error: {str(e)}")
        return False


def send_ticket_confirmation_sms(phone_number: str, route: str, train_time: str, ticket_id: str) -> bool:
    """
    Sends train ticket booking confirmation
    
    Args:
        phone_number: Passenger's phone
        route: Route (e.g., "Lusaka → Dar es Salaam")
        train_time: Departure time (e.g., "06:00")
        ticket_id: Ticket NFT ID
    
    Returns:
        bool: True if SMS sent successfully
    """
    if not SMS_AVAILABLE:
        return False
    
    try:
        message = (
            f"🎫 ARAIL Ticket Confirmed\n\n"
            f"Route: {route}\n"
            f"Departure: {train_time}\n"
            f"Ticket: {ticket_id[:10]}...\n\n"
            f"Show this SMS at the station.\n"
            f"Safe travels! 🚂"
        )
        
        response = sms.send(message, [phone_number], sender_id=AT_SENDER_ID)
        logger.info(f"✅ Ticket confirmation sent to {phone_number}")
        return True
        
    except Exception as e:
        logger.error(f"❌ Ticket confirmation error: {str(e)}")
        return False


def send_bulk_announcement(phone_numbers: list, announcement: str) -> dict:
    """
    Send bulk SMS to multiple investors
    
    Args:
        phone_numbers: List of phone numbers
        announcement: Message to send
    
    Returns:
        dict: Results with success/failure counts
    """
    if not SMS_AVAILABLE:
        return {'success': 0, 'failed': len(phone_numbers)}
    
    try:
        logger.info(f"📢 Sending bulk SMS to {len(phone_numbers)} recipients")
        
        response = sms.send(announcement, phone_numbers, sender_id=AT_SENDER_ID)
        
        # Parse response
        success_count = len([r for r in response['SMSMessageData']['Recipients'] 
                           if r['status'] == 'Success'])
        failed_count = len(phone_numbers) - success_count
        
        logger.info(f"✅ Bulk SMS: {success_count} sent, {failed_count} failed")
        
        return {
            'success': success_count,
            'failed': failed_count,
            'response': response
        }
        
    except Exception as e:
        logger.error(f"❌ Bulk SMS error: {str(e)}")
        return {'success': 0, 'failed': len(phone_numbers), 'error': str(e)}


# ========== Testing Functions ==========

def test_sms():
    """
    Test SMS functionality
    Run this to verify Africa's Talking integration
    """
    print("🧪 Testing ARAIL SMS Notifications")
    print("=" * 60)
    
    test_phone = "+260975190740"  # Replace with your test number
    test_amount = 100
    test_tx = "0x123abc456def789ghi"
    
    print(f"Phone: {test_phone}")
    print(f"Amount: {test_amount} SUI")
    print(f"TX: {test_tx}")
    print()
    
    print("Sending investment success SMS...")
    success = send_investment_success_sms(test_phone, test_amount, test_tx)
    
    if success:
        print("✅ SMS sent successfully!")
        print()
        print("Check your phone for the message.")
        print("It should contain:")
        print("- Investment amount")
        print("- Equity percentage")
        print("- Sui Explorer link")
    else:
        print("❌ SMS failed!")
        print()
        print("Troubleshooting:")
        print("1. Check AT_USERNAME is set")
        print("2. Check AT_API_KEY is set")
        print("3. Verify phone number format (+260...)")
        print("4. Check Africa's Talking account balance")
        print("5. Verify sender ID is approved")


if __name__ == "__main__":
    """
    Run this script directly to test SMS functionality
    
    Usage:
        python3 notifications.py
    
    Before running:
        1. Set AT_USERNAME environment variable
        2. Set AT_API_KEY environment variable
        3. Update test_phone with your number
        4. Ensure Africa's Talking account has credit
    """
    test_sms()
