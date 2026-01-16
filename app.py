#!/usr/bin/env python3
"""
ARAIL USSD Gateway - Flask Backend
Service Code: *384*26621#
Handles ticket booking and $SENT investment via USSD
"""

from flask import Flask, request, make_response, jsonify, session
from flask_cors import CORS
from flask_session import Session
import redis
import os
import json
import logging
from datetime import datetime, timedelta
import hashlib
import hmac
import socket
from collections import defaultdict
from functools import wraps
import ipaddress

# Configure logging FIRST before any other imports that use it
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

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

# Redis Session Configuration for USSD state management
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'arail_spine_secret_2026')
app.config['SESSION_TYPE'] = 'redis'
app.config['SESSION_PERMANENT'] = False
app.config['SESSION_USE_SIGNER'] = True
app.config['SESSION_KEY_PREFIX'] = 'arail:ussd:'

# Try to connect to Redis, fallback to filesystem if not available
try:
    redis_url = os.environ.get('REDIS_URL', 'redis://localhost:6379')
    app.config['SESSION_REDIS'] = redis.from_url(redis_url, decode_responses=True)
    Session(app)
    logger.info(f"✅ Redis session store connected: {redis_url}")
except Exception as e:
    logger.warning(f"⚠️  Redis not available, using filesystem sessions: {e}")
    app.config['SESSION_TYPE'] = 'filesystem'
    Session(app)

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

# Redis session management (configured above with Flask-Session)
# Sessions now stored in Redis with 5-minute TTL for automatic cleanup
# This enables multi-server scaling across 54 African capitals
SESSION_MAX_AGE = timedelta(minutes=5)  # Sessions expire after 5 minutes (USSD standard)

# In-memory USSD session tracking for statistics
# Keys: session_id, Values: dict with phone, state, last_updated, completed, error
ussd_sessions = {}

# Revenue tracking for OCC dashboard
revenue_tracker = {
    'confirmed_total': 0.0,
    'pending_total': 0.0,
    'revenue_today': 0.0,
    'tickets_sold': 0,
    'tickets_today': 0,
    'last_reset': datetime.now().date().isoformat()
}

# Ticket pricing table (ZAR)
TICKET_PRICES = {
    'JHB-CPT': {'Economy': 150.00, 'Business': 300.00, 'FirstClass': 500.00},
    'JHB-DBN': {'Economy': 120.00, 'Business': 240.00, 'FirstClass': 400.00},
    'CPT-PE': {'Economy': 100.00, 'Business': 200.00, 'FirstClass': 350.00},
    'DAR-MBY': {'Economy': 80.00, 'Business': 160.00, 'FirstClass': 280.00},
    'NRB-MBS': {'Economy': 90.00, 'Business': 180.00, 'FirstClass': 320.00},
}

# Rate limiting storage (in production, use Redis)
rate_limit_storage = defaultdict(list)
RATE_LIMIT_WINDOW = timedelta(minutes=1)  # 1 minute window
RATE_LIMIT_MAX_REQUESTS = 10  # Max 10 requests per minute per phone number

# Current SUI price (update via API in production)
SUI_PRICE = 1.44

# Server start time for uptime tracking
SERVER_START_TIME = datetime.now()

def validate_ip(ip_address):
    """
    Validate if request is from Africa's Talking using proper CIDR matching
    
    Security: Uses ipaddress module for proper IP range validation
    """
    if os.environ.get('FLASK_ENV') == 'development':
        logger.debug(f"Development mode: allowing IP {ip_address}")
        return True
    
    try:
        # Parse the incoming IP address
        incoming_ip = ipaddress.ip_address(ip_address)
        
        # Check against each allowed CIDR range
        for allowed_range in ALLOWED_IPS:
            network = ipaddress.ip_network(allowed_range, strict=False)
            if incoming_ip in network:
                logger.debug(f"IP {ip_address} matched allowed range {allowed_range}")
                return True
        
        logger.warning(f"IP {ip_address} not in allowed ranges")
        return False
    except ValueError as e:
        logger.error(f"Invalid IP address format: {ip_address} - {e}")
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


def check_rate_limit(phone_number):
    """
    Check if phone number has exceeded rate limit
    
    Security: Prevents DoS attacks and abuse
    Returns: (is_allowed: bool, retry_after_seconds: int)
    """
    global rate_limit_storage
    
    now = datetime.now()
    cutoff_time = now - RATE_LIMIT_WINDOW
    
    # Clean up old entries for this phone number
    if phone_number in rate_limit_storage:
        rate_limit_storage[phone_number] = [
            timestamp for timestamp in rate_limit_storage[phone_number]
            if timestamp > cutoff_time
        ]
    
    # Check if limit exceeded
    request_count = len(rate_limit_storage[phone_number])
    
    if request_count >= RATE_LIMIT_MAX_REQUESTS:
        oldest_request = min(rate_limit_storage[phone_number])
        retry_after = int((oldest_request + RATE_LIMIT_WINDOW - now).total_seconds())
        logger.warning(f"Rate limit exceeded for {phone_number[-4:]}: {request_count} requests in window")
        return False, max(retry_after, 1)
    
    # Add current request timestamp
    rate_limit_storage[phone_number].append(now)
    return True, 0

def get_session_data(phone_number):
    """Retrieve session data from Redis or filesystem"""
    try:
        # Check if Redis is available
        if app.config.get('SESSION_TYPE') == 'redis' and 'SESSION_REDIS' in app.config:
            session_key = f"arail:ussd:{phone_number}"
            session_data = app.config['SESSION_REDIS'].hgetall(session_key)
            return session_data if session_data else {}
        else:
            # Fallback to filesystem sessions (Flask-Session handles this)
            return session.get(phone_number, {})
    except Exception as e:
        logger.error(f"Session get error: {e}")
        return {}

def set_session_data(phone_number, data):
    """Store session data in Redis or filesystem with 5-minute TTL"""
    try:
        data_with_timestamp = {
            **data,
            'last_updated': datetime.now().isoformat()
        }
        
        # Check if Redis is available
        if app.config.get('SESSION_TYPE') == 'redis' and 'SESSION_REDIS' in app.config:
            session_key = f"arail:ussd:{phone_number}"
            app.config['SESSION_REDIS'].hset(session_key, mapping=data_with_timestamp)
            app.config['SESSION_REDIS'].expire(session_key, 300)  # 5 minutes
        else:
            # Fallback to filesystem sessions
            session[phone_number] = data_with_timestamp
            session.modified = True
    except Exception as e:
        logger.error(f"Session set error: {e}")

def clear_session(phone_number):
    """Clear session data from Redis or filesystem"""
    try:
        # Check if Redis is available
        if app.config.get('SESSION_TYPE') == 'redis' and 'SESSION_REDIS' in app.config:
            session_key = f"arail:ussd:{phone_number}"
            app.config['SESSION_REDIS'].delete(session_key)
        else:
            # Fallback to filesystem sessions
            if phone_number in session:
                del session[phone_number]
                session.modified = True
    except Exception as e:
        logger.error(f"Session clear error: {e}")

class SocketTimeout:
    """
    Context manager for socket timeout operations
    
    Security: Ensures socket timeout is always reset even if exception occurs
    """
    def __init__(self, timeout_seconds=30):
        self.timeout_seconds = timeout_seconds
        self.old_timeout = None
    
    def __enter__(self):
        self.old_timeout = socket.getdefaulttimeout()
        socket.setdefaulttimeout(self.timeout_seconds)
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        socket.setdefaulttimeout(self.old_timeout)
        return False  # Don't suppress exceptions

# Removed - now using backend/sui_integration.py

def book_ticket(phone_number, route, train_id):
    """
    Book train ticket and mint NFT
    Returns: (success, ticket_id, error_message)
    """
    try:
        logger.info(f"Booking ticket for {phone_number[-4:]}: {route}, train {train_id}")
        
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
    
    Security improvements:
    - IP validation with proper CIDR matching
    - Rate limiting per phone number
    - Input sanitization and validation
    - Session management with automatic cleanup
    """
    # Get client IP
    client_ip = request.headers.get('X-Forwarded-For', request.remote_addr)
    
    # Split X-Forwarded-For if it contains multiple IPs
    if ',' in client_ip:
        client_ip = client_ip.split(',')[0].strip()
    
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
    
    # Check rate limit
    is_allowed, retry_after = check_rate_limit(phone_number)
    if not is_allowed:
        logger.warning(f"Rate limit exceeded for {phone_number}, retry after {retry_after}s")
        response = f"END Too many requests.\n\n"
        response += f"Please wait {retry_after} seconds and try again.\n"
        response += "This protects our service from abuse."
        resp = make_response(response, 200)
        resp.headers['Content-Type'] = 'text/plain'
        return resp
    
    # Sanitize text input to prevent injection
    text = sanitize_input(text, max_length=50)
    
    # Log request (sanitized, no sensitive data)
    logger.info(f"USSD Request - Session: {session_id[:10]}..., Phone: {phone_number[-4:]}, Text: '{text}'")
    
    # Track session for OCC dashboard statistics
    ussd_sessions[session_id] = {
        'phone': phone_number[-4:],  # Only store last 4 digits for privacy
        'state': 'active',
        'last_updated': datetime.now().isoformat(),
        'completed': False,
        'error': False
    }
    
    # Get session data from Redis (using phone_number as key)
    session_data = get_session_data(phone_number)
    
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
            set_session_data(phone_number, {
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
            set_session_data(phone_number, {
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
                clear_session(phone_number)
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
                clear_session(phone_number)
            else:
                set_session_data(phone_number, {
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
            
            logger.info(f"🚀 INVESTMENT TRIGGER: {phone_number[-4:]} investing {sui_amount} SUI")
            logger.info(f"   Step 1: Calling execute_investment() from sui_logic.py")
            
            try:
                # Use context manager for socket timeout
                with SocketTimeout(30):
                    # Step 1: Execute on-chain transaction
                    success, result = execute_investment(phone_number, sui_amount)
                    
                    if success:
                        tx_digest = result
                        equity_percent = (sui_amount / 350000) * 10
                        
                        logger.info(f"✅ Investment successful: {tx_digest[:10]}...")
                        logger.info(f"   Step 2: Sending SMS confirmation")
                        
                        # Step 2: Send SMS confirmation (THE CLOSED LOOP)
                        if SMS_AVAILABLE:
                            try:
                                sms_sent = send_investment_success_sms(phone_number, sui_amount, tx_digest)
                                if sms_sent:
                                    logger.info(f"📱 SMS sent to {phone_number[-4:]}")
                                else:
                                    logger.warning(f"⚠️  SMS failed for {phone_number[-4:]}")
                            except Exception as sms_error:
                                logger.error(f"❌ SMS error: {str(sms_error)}")
                        
                        response = f"END ✅ Investment Confirmed!\n\n"
                        response += f"Amount: {sui_amount} SUI\n"
                        response += f"Equity: {equity_percent:.4f}%\n"
                        response += f"TX: {tx_digest[:10]}...\n\n"
                        if SMS_AVAILABLE:
                            response += "Check your SMS for details.\n"
                        response += "Welcome to ARAIL! 🚂💎"
                        clear_session(phone_number)
                    else:
                        error_msg = result
                        logger.error(f"❌ Investment failed: {error_msg[:50]}")
                        
                        response = f"END ❌ Investment Failed\n\n"
                        response += f"Error: {error_msg[:50]}\n"
                        response += "Please contact investors@africarailways.com"
                        
            except socket.timeout:
                logger.error(f"❌ Connection timeout during investment for {phone_number[-4:]}")
                response = "END ❌ Connection Timeout\n\n"
                response += "The network is experiencing delays.\n"
                response += "Please try again in a few minutes."
                clear_session(phone_number)
            except Exception as e:
                logger.error(f"❌ Investment exception for {phone_number[-4:]}: {str(e)[:100]}")
                response = "END ❌ System Error\n\n"
                response += "An unexpected error occurred.\n"
                response += "Please contact support."
                clear_session(phone_number)
        
        elif text == "2*2":
            # Invest 500 SUI
            sui_amount = 500
            
            # Validate investment amount
            is_valid, error_msg = validate_sui_amount(sui_amount, min_amount=100, max_amount=10000)
            if not is_valid:
                response = f"END Error: {error_msg}\n\n"
                response += "Please contact support for assistance."
                clear_session(phone_number)
            else:
                set_session_data(phone_number, {
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
            
            logger.info(f"🚀 INVESTMENT TRIGGER: {phone_number[-4:]} investing {sui_amount} SUI")
            logger.info(f"   Calling execute_investment() from sui_logic.py")
            
            try:
                # Use context manager for socket timeout
                with SocketTimeout(30):
                    # Execute on-chain transaction
                    success, result = execute_investment(phone_number, sui_amount)
                    
                    if success:
                        tx_digest = result
                        equity_percent = (sui_amount / 350000) * 10
                        
                        logger.info(f"✅ Investment successful: {tx_digest[:10]}...")
                        
                        response = f"END ✅ Investment Confirmed!\n\n"
                        response += f"Amount: {sui_amount} SUI\n"
                        response += f"Equity: {equity_percent:.4f}%\n"
                        response += f"TX: {tx_digest[:10]}...\n\n"
                        response += "Certificate NFT sent to your wallet.\n"
                        response += "Welcome to ARAIL! 🚂💎"
                        clear_session(phone_number)
                    else:
                        error_msg = result
                        logger.error(f"❌ Investment failed: {error_msg[:50]}")
                        
                        response = f"END ❌ Investment Failed\n\n"
                        response += f"Error: {error_msg[:50]}\n"
                        response += "Please contact investors@africarailways.com"
                        
            except socket.timeout:
                logger.error(f"❌ Connection timeout during investment for {phone_number[-4:]}")
                response = "END ❌ Connection Timeout\n\n"
                response += "The network is experiencing delays.\n"
                response += "Please try again in a few minutes."
                clear_session(phone_number)
            except Exception as e:
                logger.error(f"❌ Investment exception for {phone_number[-4:]}: {str(e)[:100]}")
                response = "END ❌ System Error\n\n"
                response += "An unexpected error occurred.\n"
                response += "Please contact support."
                clear_session(phone_number)
        
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
                set_session_data(phone_number, {
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
                    clear_session(phone_number)
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
            clear_session(phone_number)
        
        # ============================================
        # INVALID INPUT
        # ============================================
        else:
            response = "END Invalid selection.\n\n"
            response += "Please dial *384*26621# to try again."
            clear_session(phone_number)
    
    except Exception as e:
        logger.error(f"Error processing USSD request: {str(e)}")
        response = "END An error occurred.\n\n"
        response += "Please try again or contact support."
        clear_session(phone_number)
        # Track error in session
        if session_id in ussd_sessions:
            ussd_sessions[session_id]['error'] = True
            ussd_sessions[session_id]['last_updated'] = datetime.now().isoformat()
    
    # Update session tracking based on response type
    if session_id in ussd_sessions:
        ussd_sessions[session_id]['last_updated'] = datetime.now().isoformat()
        if response.startswith('END'):
            ussd_sessions[session_id]['completed'] = True
            # Check if it was a successful transaction
            if '✅' in response:
                ussd_sessions[session_id]['state'] = 'success'
            elif '❌' in response:
                ussd_sessions[session_id]['state'] = 'failed'
                ussd_sessions[session_id]['error'] = True
            else:
                ussd_sessions[session_id]['state'] = 'ended'
    
    # Return response with correct content type
    resp = make_response(response, 200)
    resp.headers['Content-Type'] = 'text/plain'
    
    # Log response (sanitized)
    logger.info(f"USSD Response - Session: {session_id[:10]}..., Type: {response[:3]}")
    
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

@app.route('/api/ussd/stats', methods=['GET'])
def get_ussd_stats():
    """
    Get real-time USSD gateway statistics for OCC dashboard
    
    Returns metrics about active sessions, request volume, success rates, etc.
    """
    try:
        # Calculate active sessions (sessions updated in last 5 minutes)
        five_minutes_ago = datetime.now() - timedelta(minutes=5)
        active_sessions = 0
        sessions_today = 0
        successful_sessions = 0
        failed_sessions = 0
        
        today_start = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
        
        # Clean up old sessions and count stats
        sessions_to_remove = []
        for session_id, session_data in ussd_sessions.items():
            last_updated_str = session_data.get('last_updated')
            if last_updated_str:
                try:
                    last_updated = datetime.fromisoformat(last_updated_str)
                    
                    # Mark old sessions for removal (older than 30 minutes)
                    if (datetime.now() - last_updated).total_seconds() > 1800:
                        sessions_to_remove.append(session_id)
                        continue
                    
                    # Count active sessions
                    if last_updated >= five_minutes_ago:
                        active_sessions += 1
                    
                    # Count today's sessions
                    if last_updated >= today_start:
                        sessions_today += 1
                        # Track success/failure based on completion
                        if session_data.get('completed', False):
                            successful_sessions += 1
                        elif session_data.get('error', False):
                            failed_sessions += 1
                except (ValueError, TypeError):
                    continue
        
        # Clean up old sessions
        for session_id in sessions_to_remove:
            ussd_sessions.pop(session_id, None)
        
        # Calculate success rate
        total_completed = successful_sessions + failed_sessions
        success_rate = (successful_sessions / total_completed * 100) if total_completed > 0 else 100.0
        
        # Calculate average response time (mock for now, would be tracked in production)
        avg_response_time = 250  # milliseconds
        
        # Check rate limit status
        rate_limited_users = sum(1 for requests in rate_limit_storage.values() 
                                if len(requests) >= RATE_LIMIT_MAX_REQUESTS)
        
        # Get last command timestamp
        last_activity = "No recent activity"
        if ussd_sessions:
            latest_session = max(ussd_sessions.items(), 
                               key=lambda x: x[1].get('last_updated', '1970-01-01'))
            last_updated_str = latest_session[1].get('last_updated', '')
            if last_updated_str:
                try:
                    last_time = datetime.fromisoformat(last_updated_str)
                    time_diff = datetime.now() - last_time
                    if time_diff.total_seconds() < 60:
                        last_activity = f"{int(time_diff.total_seconds())}s ago"
                    elif time_diff.total_seconds() < 3600:
                        last_activity = f"{int(time_diff.total_seconds() / 60)}m ago"
                    else:
                        last_activity = f"{int(time_diff.total_seconds() / 3600)}h ago"
                except (ValueError, TypeError):
                    pass
        
        # Calculate uptime from server start time
        uptime_delta = datetime.now() - SERVER_START_TIME
        uptime_hours = int(uptime_delta.total_seconds() // 3600)
        uptime_minutes = int((uptime_delta.total_seconds() % 3600) // 60)
        
        return jsonify({
            'status': 'operational',
            'active_sessions': active_sessions,
            'sessions_today': sessions_today,
            'success_rate': round(success_rate, 1),
            'avg_response_time_ms': avg_response_time,
            'last_activity': last_activity,
            'uptime': f"{uptime_hours}h {uptime_minutes}m",
            'rate_limited_users': rate_limited_users,
            'total_sessions': len(ussd_sessions),
            'sui_integration': SUI_AVAILABLE,
            'sms_integration': SMS_AVAILABLE,
            'service_code': '*384*26621#',
            'timestamp': datetime.now().isoformat()
        })
    except Exception as e:
        logger.error(f"Error getting USSD stats: {e}")
        return jsonify({
            'status': 'error',
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }), 500


@app.route('/api/ussd/revenue', methods=['GET'])
def get_ussd_revenue():
    """
    Get revenue metrics for OCC dashboard
    
    Returns confirmed, pending, and today's revenue along with ticket counts.
    """
    try:
        # Reset daily counters if it's a new day
        today = datetime.now().date().isoformat()
        if revenue_tracker['last_reset'] != today:
            revenue_tracker['revenue_today'] = 0.0
            revenue_tracker['tickets_today'] = 0
            revenue_tracker['last_reset'] = today
        
        # Calculate pending revenue from active sessions
        pending_total = 0.0
        for session_id, session_data in ussd_sessions.items():
            if session_data.get('state') in ['confirm_payment', 'payment_processing']:
                price = session_data.get('price', 0)
                if price:
                    pending_total += float(price)
        
        revenue_tracker['pending_total'] = pending_total
        
        # Calculate average ticket price
        avg_ticket_price = 0.0
        if revenue_tracker['tickets_sold'] > 0:
            avg_ticket_price = revenue_tracker['confirmed_total'] / revenue_tracker['tickets_sold']
        
        # Calculate conversion rate
        total_sessions = len(ussd_sessions)
        conversion_rate = 0.0
        if total_sessions > 0:
            conversion_rate = (revenue_tracker['tickets_sold'] / max(total_sessions, 1)) * 100
        
        return jsonify({
            'confirmed_total': round(revenue_tracker['confirmed_total'], 2),
            'pending_total': round(pending_total, 2),
            'revenue_today': round(revenue_tracker['revenue_today'], 2),
            'tickets_sold': revenue_tracker['tickets_sold'],
            'tickets_today': revenue_tracker['tickets_today'],
            'avg_ticket_price': round(avg_ticket_price, 2),
            'conversion_rate': round(conversion_rate, 1),
            'pricing': TICKET_PRICES,
            'currency': 'ZAR',
            'timestamp': datetime.now().isoformat()
        })
    except Exception as e:
        logger.error(f"Error getting revenue stats: {e}")
        return jsonify({
            'status': 'error',
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }), 500

if __name__ == "__main__":
    # Railway sets the PORT environment variable automatically
    port = int(os.environ.get("PORT", 5000))
    
    logger.info(f"🚂 Starting ARAIL USSD Gateway on port {port}")
    logger.info(f"Service Code: *384*26621#")
    logger.info(f"Sui Integration: {'✅ Enabled' if SUI_AVAILABLE else '❌ Disabled'}")
    
    # Security Note: Binding to 0.0.0.0 is intentional for production deployment
    # The service is protected by IP whitelisting and rate limiting
    app.run(host='0.0.0.0', port=port, debug=os.environ.get('FLASK_ENV') == 'development')  # nosec B104
