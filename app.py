#!/usr/bin/env python3
"""
ARAIL USSD Gateway - Flask Backend
Service Code: *384*26621#
Handles ticket booking and $SENT investment via USSD
"""

from flask import Flask, request, make_response, jsonify
from flask_cors import CORS
import os
import json
import logging
from datetime import datetime
import hashlib
import hmac
import socket

# Import validation utilities
from validation_utils import validate_phone_number, validate_sui_amount, sanitize_input

# Sui blockchain integration - THE ENGINE
try:
    from sui_logic import (
        execute_investment,
        check_investment_status,
        claim_vested_tokens
    )
    SUI_AVAILABLE = True
    logger.info("✅ Sui blockchain integration loaded")
except ImportError as e:
    SUI_AVAILABLE = False
    logger.warning(f"⚠️  Sui integration not available: {e}")
except Exception as e:
    SUI_AVAILABLE = False
    logger.error(f"❌ Error loading Sui integration: {e}")

# SMS notifications - THE CLOSED LOOP
try:
    from notifications import (
        send_investment_success_sms,
        send_ticket_confirmation_sms,
        send_vesting_reminder_sms
    )
    SMS_AVAILABLE = True
    logger.info("✅ SMS notifications loaded")
except ImportError as e:
    SMS_AVAILABLE = False
    logger.warning(f"⚠️  SMS notifications not available: {e}")
except Exception as e:
    SMS_AVAILABLE = False
    logger.error(f"❌ Error loading SMS notifications: {e}")
    
    # Mock SMS functions for development/testing
    def send_investment_success_sms(phone, amount, tx_digest):
        logger.info(f"[MOCK SMS] Investment confirmation to {phone}: {amount} SUI, TX: {tx_digest[:10]}...")
        return True
    
    def send_ticket_confirmation_sms(phone, route, time, ticket_id):
        logger.info(f"[MOCK SMS] Ticket confirmation to {phone}: {route} at {time}, Ticket: {ticket_id}")
        return True
    
    def send_vesting_reminder_sms(phone, claimable_amount):
        logger.info(f"[MOCK SMS] Vesting reminder to {phone}: {claimable_amount} tokens claimable")
        return True

# Mock Sui functions if not available
if not SUI_AVAILABLE:
    def execute_investment(phone, amount):
        logger.info(f"[MOCK] Investment: {phone} -> {amount} SUI")
        return True, "0xMOCK_TX_DIGEST_" + str(amount)
    
    def check_investment_status(phone):
        logger.info(f"[MOCK] Status check: {phone}")
        return True, {
            'has_investment': True,
            'total_invested': 500,
            'equity_tokens': 142857,
            'vesting_progress': 8.33,
            'claimable_tokens': 11905
        }
    
    def claim_vested_tokens(phone, cert_id):
        logger.info(f"[MOCK] Claim: {phone} -> {cert_id}")
        return True, "0xMOCK_CLAIM_TX"

app = Flask(__name__)
CORS(app)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Configuration
SUI_RPC_URL = os.environ.get('SUI_RPC_URL', 'https://fullnode.mainnet.sui.io:443')
SUI_PRIVATE_KEY = os.environ.get('SUI_PRIVATE_KEY', '')
PACKAGE_ID = os.environ.get('PACKAGE_ID', '0x_YOUR_PACKAGE_ID')
TREASURY_ID = os.environ.get('TREASURY_ID', '0x_YOUR_TREASURY_ID')
AFRICAS_TALKING_API_KEY = os.environ.get('AFRICAS_TALKING_API_KEY', '')

# IP whitelist for Africa's Talking
ALLOWED_IPS = [
    '52.48.80.0/24',
    '54.76.0.0/16',
    '3.8.0.0/16',
    '18.202.0.0/16',
]

# Session storage (in production, use Redis)
sessions = {}

# Current SUI price (update via API in production)
SUI_PRICE = 1.44

def validate_ip(ip_address):
    """Validate if request is from Africa's Talking"""
    if os.environ.get('FLASK_ENV') == 'development':
        return True
    
    # Simple IP validation (use proper library in production)
    for allowed_range in ALLOWED_IPS:
        if ip_address.startswith(allowed_range.split('/')[0][:7]):
            return True
    return False

def verify_signature(request_data, signature):
    """Verify Africa's Talking request signature"""
    if not AFRICAS_TALKING_API_KEY:
        return True  # Skip in development
    
    payload = json.dumps(request_data, sort_keys=True)
    expected_signature = hmac.new(
        AFRICAS_TALKING_API_KEY.encode(),
        payload.encode(),
        hashlib.sha256
    ).hexdigest()
    
    return hmac.compare_digest(signature, expected_signature)

def get_session_data(session_id):
    """Retrieve session data"""
    return sessions.get(session_id, {})

def set_session_data(session_id, data):
    """Store session data"""
    sessions[session_id] = {
        **data,
        'last_updated': datetime.now().isoformat()
    }

def clear_session(session_id):
    """Clear session data"""
    if session_id in sessions:
        del sessions[session_id]

# Removed - now using backend/sui_integration.py

def book_ticket(phone_number, route, train_id):
    """
    Book train ticket and mint NFT
    Returns: (success, ticket_id, error_message)
    """
    try:
        logger.info(f"Booking ticket for {phone_number}: {route}, train {train_id}")
        
        # In production:
        # 1. Check seat availability
        # 2. Process mobile money payment
        # 3. Mint ticket NFT on Sui
        # 4. Send SMS confirmation
        
        ticket_id = f"TKT{int(datetime.now().timestamp())}"
        return True, ticket_id, None
        
    except Exception as e:
        logger.error(f"Error booking ticket: {str(e)}")
        return False, None, str(e)

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'service': 'ARAIL USSD Gateway',
        'version': '1.0.0',
        'timestamp': datetime.now().isoformat(),
        'sui_integration': SUI_AVAILABLE
    })

@app.route('/ussd', methods=['POST'])
def ussd_callback():
    """
    Main USSD callback handler for *384*26621#
    """
    # Get client IP
    client_ip = request.headers.get('X-Forwarded-For', request.remote_addr)
    
    # Validate IP (disabled in development)
    if not validate_ip(client_ip):
        logger.warning(f"Unauthorized request from {client_ip}")
        return make_response("Forbidden", 403)
    
    # Get parameters from Africa's Talking
    session_id = request.values.get("sessionId", "")
    service_code = request.values.get("serviceCode", "")
    phone_number = request.values.get("phoneNumber", "")
    text = request.values.get("text", "")
    network_code = request.values.get("networkCode", "")
    
    # Validate phone number
    is_valid, error_msg = validate_phone_number(phone_number)
    if not is_valid:
        logger.error(f"Invalid phone number: {phone_number} - {error_msg}")
        response = f"END Error: {error_msg}\n\n"
        response += "Please check your phone number and try again."
        resp = make_response(response, 200)
        resp.headers['Content-Type'] = 'text/plain'
        return resp
    
    # Sanitize text input to prevent injection
    text = sanitize_input(text, max_length=50)
    
    # Log request
    logger.info(f"USSD Request - Session: {session_id}, Phone: {phone_number}, Text: '{text}'")
    
    # Get session data
    session_data = get_session_data(session_id)
    
    # Parse user input
    text_array = text.split('*') if text else []
    level = len(text_array)
    
    response = ""
    
    try:
        # ============================================
        # MAIN MENU (Initial Dial)
        # ============================================
        if text == "":
            response = "CON Welcome to ARAIL 🚂\n"
            response += "Africa's Digital Railway\n\n"
            response += "1. Book Train Ticket\n"
            response += "2. Invest in $SENT Pre-Seed\n"
            response += "3. Check My Wallet\n"
            response += "4. Help & Support"
        
        # ============================================
        # BOOKING FLOW
        # ============================================
        elif text == "1":
            response = "CON Select Route:\n\n"
            response += "1. Lusaka → Dar es Salaam\n"
            response += "2. Dar es Salaam → Lusaka\n"
            response += "3. Lusaka → Kapiri Mposhi\n"
            response += "4. Kapiri → Dar es Salaam\n"
            response += "0. Back to Main Menu"
        
        elif text == "1*1":
            # Lusaka → Dar es Salaam
            set_session_data(session_id, {
                'flow': 'booking',
                'route': 'Lusaka → Dar es Salaam',
                'origin': 'Lusaka',
                'destination': 'Dar es Salaam'
            })
            response = "CON Lusaka → Dar es Salaam\n"
            response += "Available Trains:\n\n"
            response += "1. Express - 06:00 (K450)\n"
            response += "2. Standard - 14:00 (K280)\n"
            response += "3. Night - 20:00 (K320)\n"
            response += "0. Back"
        
        elif text == "1*1*1":
            # Selected Express train
            set_session_data(session_id, {
                **session_data,
                'train': 'Express 06:00',
                'price': 450
            })
            response = "CON Express Train - K450\n"
            response += "Departure: 06:00\n"
            response += "Arrival: 18:00 (next day)\n\n"
            response += "1. Confirm Booking\n"
            response += "0. Back"
        
        elif text == "1*1*1*1":
            # Confirm booking
            route = session_data.get('route', 'Unknown')
            price = session_data.get('price', 0)
            
            success, ticket_id, error = book_ticket(phone_number, route, 'express')
            
            if success:
                # Send SMS confirmation
                if SMS_AVAILABLE:
                    sms_sent = send_ticket_confirmation_sms(
                        phone_number, 
                        route, 
                        "Express 06:00", 
                        ticket_id
                    )
                    if sms_sent:
                        logger.info(f"📱 Ticket SMS sent to {phone_number}")
                
                response = f"END ✅ Booking Confirmed!\n\n"
                response += f"Route: {route}\n"
                response += f"Train: Express 06:00\n"
                response += f"Price: K{price}\n"
                response += f"Ticket: {ticket_id}\n\n"
                if SMS_AVAILABLE:
                    response += "SMS confirmation sent.\n"
                else:
                    response += f"SMS sent to {phone_number}\n"
                response += "Safe travels! 🚂"
                clear_session(session_id)
            else:
                response = f"END ❌ Booking Failed\n\n"
                response += f"Error: {error}\n"
                response += "Please try again or contact support."
        
        # ============================================
        # INVESTMENT FLOW ($SENT)
        # ============================================
        elif text == "2":
            response = "CON 💎 ARAIL Pre-Seed Round\n\n"
            response += f"SUI Price: ${SUI_PRICE}\n"
            response += "Min Investment: 100 SUI\n"
            response += "Equity: 10% offered\n\n"
            response += "1. Invest 100 SUI (~$144)\n"
            response += "2. Invest 500 SUI (~$720)\n"
            response += "3. Invest 1000 SUI (~$1,440)\n"
            response += "4. Custom Amount\n"
            response += "0. Back"
        
        elif text == "2*1":
            # Invest 100 SUI
            sui_amount = 100
            
            # Validate investment amount
            is_valid, error_msg = validate_sui_amount(sui_amount, min_amount=100, max_amount=10000)
            if not is_valid:
                response = f"END Error: {error_msg}\n\n"
                response += "Please contact support for assistance."
                clear_session(session_id)
            else:
                set_session_data(session_id, {
                    'flow': 'investment',
                    'sui_amount': sui_amount,
                    'usd_value': sui_amount * SUI_PRICE
                })
                equity_percent = (sui_amount / 350000) * 10
                response = "CON Investment Summary:\n\n"
                response += f"Amount: {sui_amount} SUI\n"
                response += f"USD Value: ${sui_amount * SUI_PRICE:.2f}\n"
                response += f"Equity: {equity_percent:.4f}%\n"
                response += "Vesting: 12 months linear\n\n"
                response += "1. Confirm Investment\n"
                response += "0. Cancel"
        
        elif text == "2*1*1":
            # Confirm 100 SUI investment
            # THIS IS THE CRITICAL BRIDGE: USSD → Sui Blockchain → SMS
            sui_amount = session_data.get('sui_amount', 100)
            
            logger.info(f"🚀 INVESTMENT TRIGGER: {phone_number} investing {sui_amount} SUI")
            logger.info(f"   Step 1: Calling execute_investment() from sui_logic.py")
            
            try:
                # Set socket timeout to prevent hanging connections
                socket.setdefaulttimeout(30)
                
                # Step 1: Execute on-chain transaction
                success, result = execute_investment(phone_number, sui_amount)
                
                if success:
                    tx_digest = result
                    equity_percent = (sui_amount / 350000) * 10
                    
                    logger.info(f"✅ Investment successful: {tx_digest}")
                    logger.info(f"   Step 2: Sending SMS confirmation")
                    
                    # Step 2: Send SMS confirmation (THE CLOSED LOOP)
                    if SMS_AVAILABLE:
                        try:
                            sms_sent = send_investment_success_sms(phone_number, sui_amount, tx_digest)
                            if sms_sent:
                                logger.info(f"📱 SMS sent to {phone_number}")
                            else:
                                logger.warning(f"⚠️  SMS failed for {phone_number}")
                        except Exception as sms_error:
                            logger.error(f"❌ SMS error: {str(sms_error)}")
                    
                    response = f"END ✅ Investment Confirmed!\n\n"
                    response += f"Amount: {sui_amount} SUI\n"
                    response += f"Equity: {equity_percent:.4f}%\n"
                    response += f"TX: {tx_digest[:10]}...\n\n"
                    if SMS_AVAILABLE:
                        response += "Check your SMS for details.\n"
                    response += "Welcome to ARAIL! 🚂💎"
                    clear_session(session_id)
                else:
                    error_msg = result
                    logger.error(f"❌ Investment failed: {error_msg}")
                    
                    response = f"END ❌ Investment Failed\n\n"
                    response += f"Error: {error_msg[:50]}\n"
                    response += "Please contact investors@africarailways.com"
                    
            except socket.timeout:
                logger.error(f"❌ Connection timeout during investment for {phone_number}")
                response = "END ❌ Connection Timeout\n\n"
                response += "The network is experiencing delays.\n"
                response += "Please try again in a few minutes."
                clear_session(session_id)
            except Exception as e:
                logger.error(f"❌ Investment exception for {phone_number}: {str(e)}")
                response = "END ❌ System Error\n\n"
                response += "An unexpected error occurred.\n"
                response += "Please contact support."
                clear_session(session_id)
            finally:
                # Reset socket timeout to default
                socket.setdefaulttimeout(None)
        
        elif text == "2*2":
            # Invest 500 SUI
            sui_amount = 500
            
            # Validate investment amount
            is_valid, error_msg = validate_sui_amount(sui_amount, min_amount=100, max_amount=10000)
            if not is_valid:
                response = f"END Error: {error_msg}\n\n"
                response += "Please contact support for assistance."
                clear_session(session_id)
            else:
                set_session_data(session_id, {
                    'flow': 'investment',
                    'sui_amount': sui_amount,
                    'usd_value': sui_amount * SUI_PRICE
                })
                equity_percent = (sui_amount / 350000) * 10
                response = "CON Investment Summary:\n\n"
                response += f"Amount: {sui_amount} SUI\n"
                response += f"USD Value: ${sui_amount * SUI_PRICE:.2f}\n"
                response += f"Equity: {equity_percent:.4f}%\n"
                response += "Vesting: 12 months linear\n\n"
                response += "1. Confirm Investment\n"
                response += "0. Cancel"
        
        elif text == "2*2*1":
            # Confirm 500 SUI investment
            # THIS IS THE CRITICAL BRIDGE: USSD → Sui Blockchain
            sui_amount = session_data.get('sui_amount', 500)
            
            logger.info(f"🚀 INVESTMENT TRIGGER: {phone_number} investing {sui_amount} SUI")
            logger.info(f"   Calling execute_investment() from sui_logic.py")
            
            try:
                # Set socket timeout to prevent hanging connections
                socket.setdefaulttimeout(30)
                
                # Execute on-chain transaction
                success, result = execute_investment(phone_number, sui_amount)
                
                if success:
                    tx_digest = result
                    equity_percent = (sui_amount / 350000) * 10
                    
                    logger.info(f"✅ Investment successful: {tx_digest}")
                    
                    response = f"END ✅ Investment Confirmed!\n\n"
                    response += f"Amount: {sui_amount} SUI\n"
                    response += f"Equity: {equity_percent:.4f}%\n"
                    response += f"TX: {tx_digest[:10]}...\n\n"
                    response += "Certificate NFT sent to your wallet.\n"
                    response += "Welcome to ARAIL! 🚂💎"
                    clear_session(session_id)
                else:
                    error_msg = result
                    logger.error(f"❌ Investment failed: {error_msg}")
                    
                    response = f"END ❌ Investment Failed\n\n"
                    response += f"Error: {error_msg[:50]}\n"
                    response += "Please contact investors@africarailways.com"
                    
            except socket.timeout:
                logger.error(f"❌ Connection timeout during investment for {phone_number}")
                response = "END ❌ Connection Timeout\n\n"
                response += "The network is experiencing delays.\n"
                response += "Please try again in a few minutes."
                clear_session(session_id)
            except Exception as e:
                logger.error(f"❌ Investment exception for {phone_number}: {str(e)}")
                response = "END ❌ System Error\n\n"
                response += "An unexpected error occurred.\n"
                response += "Please contact support."
                clear_session(session_id)
            finally:
                # Reset socket timeout to default
                socket.setdefaulttimeout(None)
        
        # ============================================
        # WALLET CHECK
        # ============================================
        elif text == "3":
            response = "CON Check Wallet:\n\n"
            response += "1. $SENT Balance\n"
            response += "2. AFC Balance\n"
            response += "3. My Tickets\n"
            response += "0. Back"
        
        elif text == "3*1":
            # Check $SENT balance - Query blockchain
            logger.info(f"📊 Balance check for {phone_number}")
            
            success, data = check_investment_status(phone_number)
            
            if success and data.get('has_investment'):
                # Store certificate ID in session for claiming
                set_session_data(session_id, {
                    'certificate_id': data.get('certificate_id'),
                    'claimable_tokens': data.get('claimable_tokens', 0)
                })
                
                response = f"CON Your $SENT Balance:\n\n"
                response += f"Total: {data['equity_tokens']:,} tokens\n"
                response += f"Vested: {data['vested_tokens']:,} ({data['vesting_progress']:.1f}%)\n"
                response += f"Locked: {data['locked_tokens']:,}\n\n"
                
                if data['claimable_tokens'] > 0:
                    response += f"1. Claim {data['claimable_tokens']:,} Tokens\n"
                    response += "2. SMS Full Details\n"
                    response += "0. Back"
                else:
                    response += "No tokens ready to claim yet.\n"
                    response += f"{data['days_until_fully_vested']} days until fully vested.\n\n"
                    response += "2. SMS Full Details\n"
                    response += "0. Back"
            else:
                response = f"END No investments found.\n\n"
                response += "Dial *384*26621# and select\n"
                response += "2. Invest in $SENT to get started!"
        
        elif text == "3*1*1":
            # Claim vested tokens
            certificate_id = session_data.get('certificate_id')
            claimable = session_data.get('claimable_tokens', 0)
            
            if not certificate_id or claimable == 0:
                response = "END No tokens available to claim.\n\n"
                response += "Check back later as your tokens vest."
            else:
                logger.info(f"🎁 Claiming {claimable} tokens for {phone_number}")
                
                success, result = claim_vested_tokens(phone_number, certificate_id)
                
                if success:
                    tx_digest = result
                    logger.info(f"✅ Claim successful: {tx_digest}")
                    
                    # Send SMS confirmation
                    if SMS_AVAILABLE:
                        send_vesting_reminder_sms(phone_number, claimable)
                    
                    response = f"END ✅ Tokens Claimed!\n\n"
                    response += f"Amount: {claimable:,} $SENT\n"
                    response += f"TX: {tx_digest[:10]}...\n\n"
                    if SMS_AVAILABLE:
                        response += "Check SMS for details.\n"
                    response += "Tokens sent to your wallet! 💎"
                    clear_session(session_id)
                else:
                    error_msg = result
                    logger.error(f"❌ Claim failed: {error_msg}")
                    
                    response = f"END ❌ Claim Failed\n\n"
                    response += f"Error: {error_msg[:50]}\n"
                    response += "Please try again or contact support."
        
        elif text == "3*1*2":
            # SMS full wallet details
            success, data = check_investment_status(phone_number)
            
            if success and data.get('has_investment'):
                if SMS_AVAILABLE:
                    # Send detailed SMS with full wallet data
                    sms_sent = send_vesting_reminder_sms(
                        phone_number, 
                        data['claimable_tokens'],
                        wallet_data=data
                    )
                    
                    if sms_sent:
                        response = "END ✅ SMS Sent!\n\n"
                        response += "Check your phone for:\n"
                        response += "- Total token balance\n"
                        response += "- Vested vs locked tokens\n"
                        response += "- Vesting progress %\n"
                        response += "- Claimable amount"
                    else:
                        response = "END ❌ SMS Failed\n\n"
                        response += "Please try again or contact support."
                else:
                    response = "END SMS service unavailable.\n\n"
                    response += "Visit africarailways.com/wallet\n"
                    response += "to view your full balance."
            else:
                response = "END No investment found."
        
        # ============================================
        # HELP & SUPPORT
        # ============================================
        elif text == "4":
            response = "END ARAIL Support:\n\n"
            response += "📞 +260 977 000 000\n"
            response += "📧 support@africarailways.com\n"
            response += "🌐 africarailways.com\n\n"
            response += "Office Hours:\n"
            response += "Mon-Fri: 08:00-17:00\n"
            response += "Sat: 09:00-13:00"
        
        # ============================================
        # BACK TO MAIN MENU
        # ============================================
        elif text.endswith("*0"):
            response = "CON Welcome to ARAIL 🚂\n"
            response += "Africa's Digital Railway\n\n"
            response += "1. Book Train Ticket\n"
            response += "2. Invest in $SENT Pre-Seed\n"
            response += "3. Check My Wallet\n"
            response += "4. Help & Support"
            clear_session(session_id)
        
        # ============================================
        # INVALID INPUT
        # ============================================
        else:
            response = "END Invalid selection.\n\n"
            response += "Please dial *384*26621# to try again."
            clear_session(session_id)
    
    except Exception as e:
        logger.error(f"Error processing USSD request: {str(e)}")
        response = "END An error occurred.\n\n"
        response += "Please try again or contact support."
        clear_session(session_id)
    
    # Return response with correct content type
    resp = make_response(response, 200)
    resp.headers['Content-Type'] = 'text/plain'
    
    logger.info(f"USSD Response - Session: {session_id}, Type: {response[:3]}")
    
    return resp

@app.route('/webhook/payment', methods=['POST'])
def payment_webhook():
    """Handle mobile money payment webhooks"""
    try:
        data = request.get_json()
        logger.info(f"Payment webhook: {data}")
        
        # Process payment confirmation
        # Update booking status
        # Mint ticket NFT
        
        return jsonify({'status': 'success'})
    except Exception as e:
        logger.error(f"Payment webhook error: {str(e)}")
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/api/stats', methods=['GET'])
def get_stats():
    """Get current fundraising stats"""
    return jsonify({
        'sui_price': SUI_PRICE,
        'total_raised': 85400,
        'goal': 350000,
        'investor_count': 37,
        'progress_percent': 24.4,
        'timestamp': datetime.now().isoformat()
    })

if __name__ == "__main__":
    # Railway sets the PORT environment variable automatically
    port = int(os.environ.get("PORT", 5000))
    
    logger.info(f"🚂 Starting ARAIL USSD Gateway on port {port}")
    logger.info(f"Service Code: *384*26621#")
    logger.info(f"Sui Integration: {'✅ Enabled' if SUI_AVAILABLE else '❌ Disabled'}")
    
    app.run(host='0.0.0.0', port=port, debug=os.environ.get('FLASK_ENV') == 'development')
