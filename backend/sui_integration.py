#!/usr/bin/env python3
"""
ARAIL Sui Blockchain Integration
Handles $SENT investment, AFC minting, and ticket NFT creation
"""

import os
import logging
from typing import Tuple, Optional, Dict
from datetime import datetime

try:
    from pysui import SuiConfig, SyncClient
    from pysui.sui.sui_txn import SyncTransaction
    from pysui.sui.sui_types import ObjectID, SuiString, SuiU64
    from pysui.sui.sui_crypto import keypair_from_keystring
    SUI_AVAILABLE = True
except ImportError:
    SUI_AVAILABLE = False
    print("⚠️  Warning: pysui not installed. Run: pip install pysui")

logger = logging.getLogger(__name__)

# Configuration from environment
SUI_RPC_URL = os.environ.get('SUI_RPC_URL', 'https://fullnode.mainnet.sui.io:443')
SUI_PRIVATE_KEY = os.environ.get('SUI_PRIVATE_KEY', '')
PACKAGE_ID = os.environ.get('PACKAGE_ID', '')
TREASURY_ID = os.environ.get('TREASURY_ID', '')
AFC_PACKAGE_ID = os.environ.get('AFC_PACKAGE_ID', '')
TICKET_PACKAGE_ID = os.environ.get('TICKET_PACKAGE_ID', '')

# Constants
MIST_PER_SUI = 1_000_000_000
MIN_INVESTMENT_SUI = 100
TOTAL_RAISE_SUI = 350000
EQUITY_OFFERED = 10  # 10%

class SuiIntegration:
    """Handles all Sui blockchain interactions"""
    
    def __init__(self):
        if not SUI_AVAILABLE:
            logger.warning("Sui integration disabled - pysui not installed")
            self.client = None
            self.keypair = None
            return
        
        try:
            # Initialize Sui client
            config = SuiConfig.default_config()
            if SUI_RPC_URL:
                config.rpc_url = SUI_RPC_URL
            
            self.client = SyncClient(config)
            
            # Load keypair from private key
            if SUI_PRIVATE_KEY:
                self.keypair = keypair_from_keystring(SUI_PRIVATE_KEY)
                logger.info(f"✅ Sui client initialized: {self.keypair.public_key.address}")
            else:
                logger.warning("⚠️  SUI_PRIVATE_KEY not set")
                self.keypair = None
                
        except Exception as e:
            logger.error(f"❌ Failed to initialize Sui client: {str(e)}")
            self.client = None
            self.keypair = None
    
    def is_available(self) -> bool:
        """Check if Sui integration is available"""
        return self.client is not None and self.keypair is not None
    
    def invest_sent(
        self, 
        phone_number: str, 
        sui_amount: int,
        user_wallet_address: Optional[str] = None
    ) -> Tuple[bool, Optional[str], Optional[str]]:
        """
        Invest in $SENT Pre-Seed round
        
        Args:
            phone_number: Investor's phone number
            sui_amount: Amount in SUI (not MIST)
            user_wallet_address: Optional user wallet (if None, creates one)
        
        Returns:
            (success, tx_digest, error_message)
        """
        if not self.is_available():
            return False, None, "Sui integration not available"
        
        try:
            # Validate amount
            if sui_amount < MIN_INVESTMENT_SUI:
                return False, None, f"Minimum investment is {MIN_INVESTMENT_SUI} SUI"
            
            # Convert SUI to MIST
            amount_mist = sui_amount * MIST_PER_SUI
            
            # Get or create user wallet
            if not user_wallet_address:
                user_wallet_address = self._get_or_create_wallet(phone_number)
            
            logger.info(f"💰 Processing investment: {sui_amount} SUI for {phone_number}")
            
            # Create transaction
            txn = SyncTransaction(client=self.client, initial_sender=self.keypair)
            
            # Split coins for payment
            split_coin = txn.split_coin(
                coin=txn.gas,
                amounts=[amount_mist]
            )
            
            # Call investment contract
            txn.move_call(
                target=f"{PACKAGE_ID}::investment::invest",
                arguments=[
                    ObjectID(TREASURY_ID),  # Treasury object
                    split_coin,              # Payment coin
                    ObjectID("0x6"),        # Clock object (system)
                ],
                type_arguments=[]
            )
            
            # Sign and execute
            result = txn.execute(
                gas_budget=10_000_000  # 0.01 SUI gas budget
            )
            
            if result.is_ok():
                tx_digest = result.digest
                logger.info(f"✅ Investment successful: {tx_digest}")
                
                # Extract certificate NFT ID from effects
                certificate_id = self._extract_certificate_id(result)
                
                # Store mapping in database
                self._store_investment_record(
                    phone_number=phone_number,
                    wallet_address=user_wallet_address,
                    sui_amount=sui_amount,
                    tx_digest=tx_digest,
                    certificate_id=certificate_id
                )
                
                return True, tx_digest, None
            else:
                error_msg = result.error if hasattr(result, 'error') else "Transaction failed"
                logger.error(f"❌ Investment failed: {error_msg}")
                return False, None, error_msg
                
        except Exception as e:
            logger.error(f"❌ Investment error: {str(e)}")
            return False, None, str(e)
    
    def check_sent_balance(
        self, 
        phone_number: str
    ) -> Tuple[bool, Optional[Dict], Optional[str]]:
        """
        Check $SENT balance and vesting status
        
        Args:
            phone_number: User's phone number
        
        Returns:
            (success, balance_data, error_message)
        """
        if not self.is_available():
            return False, None, "Sui integration not available"
        
        try:
            # Get user's wallet address
            wallet_address = self._get_wallet_address(phone_number)
            if not wallet_address:
                return False, None, "Wallet not found"
            
            # Query user's objects (looking for InvestmentCertificate)
            objects = self.client.get_objects_owned_by_address(wallet_address)
            
            certificates = []
            total_equity_tokens = 0
            total_claimed = 0
            
            for obj in objects.data:
                # Check if object is InvestmentCertificate
                if f"{PACKAGE_ID}::investment::InvestmentCertificate" in obj.object_type:
                    cert_data = self._get_certificate_details(obj.object_id)
                    if cert_data:
                        certificates.append(cert_data)
                        total_equity_tokens += cert_data['equity_tokens']
                        total_claimed += cert_data['total_claimed']
            
            # Calculate vesting progress
            now = datetime.now().timestamp() * 1000  # Convert to milliseconds
            claimable = 0
            
            for cert in certificates:
                vested = self._calculate_vested_amount(cert, now)
                claimable += max(0, vested - cert['total_claimed'])
            
            balance_data = {
                'total_equity_tokens': total_equity_tokens,
                'total_claimed': total_claimed,
                'claimable': claimable,
                'certificates': certificates,
                'equity_percentage': (total_equity_tokens / (TOTAL_RAISE_SUI * MIST_PER_SUI)) * EQUITY_OFFERED
            }
            
            return True, balance_data, None
            
        except Exception as e:
            logger.error(f"❌ Balance check error: {str(e)}")
            return False, None, str(e)
    
    def claim_vested_tokens(
        self,
        phone_number: str,
        certificate_id: str
    ) -> Tuple[bool, Optional[str], Optional[str]]:
        """
        Claim vested $SENT tokens
        
        Args:
            phone_number: User's phone number
            certificate_id: Certificate NFT object ID
        
        Returns:
            (success, tx_digest, error_message)
        """
        if not self.is_available():
            return False, None, "Sui integration not available"
        
        try:
            logger.info(f"🎁 Claiming vested tokens for {phone_number}")
            
            # Create transaction
            txn = SyncTransaction(client=self.client, initial_sender=self.keypair)
            
            # Call claim_tokens function
            txn.move_call(
                target=f"{PACKAGE_ID}::investment::claim_tokens",
                arguments=[
                    ObjectID(certificate_id),  # Certificate object
                    ObjectID("0x6"),          # Clock object
                ],
                type_arguments=[]
            )
            
            # Execute
            result = txn.execute(gas_budget=10_000_000)
            
            if result.is_ok():
                tx_digest = result.digest
                logger.info(f"✅ Tokens claimed: {tx_digest}")
                return True, tx_digest, None
            else:
                error_msg = result.error if hasattr(result, 'error') else "Claim failed"
                logger.error(f"❌ Claim failed: {error_msg}")
                return False, None, error_msg
                
        except Exception as e:
            logger.error(f"❌ Claim error: {str(e)}")
            return False, None, str(e)
    
    def mint_afc(
        self,
        phone_number: str,
        zmw_amount: float
    ) -> Tuple[bool, Optional[str], Optional[str]]:
        """
        Mint AFC stablecoin (1 AFC = 1 ZMW)
        
        Args:
            phone_number: User's phone number
            zmw_amount: Amount in ZMW
        
        Returns:
            (success, tx_digest, error_message)
        """
        if not self.is_available():
            return False, None, "Sui integration not available"
        
        try:
            # Get user wallet
            wallet_address = self._get_or_create_wallet(phone_number)
            
            # Convert to MIST (AFC has 9 decimals like SUI)
            afc_amount = int(zmw_amount * MIST_PER_SUI)
            
            logger.info(f"💵 Minting {zmw_amount} AFC for {phone_number}")
            
            # Create transaction
            txn = SyncTransaction(client=self.client, initial_sender=self.keypair)
            
            # Call AFC mint function
            txn.move_call(
                target=f"{AFC_PACKAGE_ID}::africoin::mint",
                arguments=[
                    ObjectID("AFC_TREASURY_CAP_ID"),  # Treasury cap
                    ObjectID("AFC_RESERVE_ID"),       # Reserve object
                    SuiU64(afc_amount),              # Amount to mint
                ],
                type_arguments=[]
            )
            
            # Execute
            result = txn.execute(gas_budget=10_000_000)
            
            if result.is_ok():
                tx_digest = result.digest
                logger.info(f"✅ AFC minted: {tx_digest}")
                return True, tx_digest, None
            else:
                error_msg = result.error if hasattr(result, 'error') else "Mint failed"
                return False, None, error_msg
                
        except Exception as e:
            logger.error(f"❌ AFC mint error: {str(e)}")
            return False, None, str(e)
    
    def mint_ticket_nft(
        self,
        phone_number: str,
        route: str,
        train_id: str,
        seat_number: str,
        price: float
    ) -> Tuple[bool, Optional[str], Optional[str]]:
        """
        Mint train ticket NFT
        
        Args:
            phone_number: Passenger's phone number
            route: Route (e.g., "Lusaka → Dar es Salaam")
            train_id: Train identifier
            seat_number: Seat number
            price: Ticket price in ZMW
        
        Returns:
            (success, ticket_id, error_message)
        """
        if not self.is_available():
            return False, None, "Sui integration not available"
        
        try:
            # Get user wallet
            wallet_address = self._get_or_create_wallet(phone_number)
            
            logger.info(f"🎫 Minting ticket NFT for {phone_number}: {route}")
            
            # Create transaction
            txn = SyncTransaction(client=self.client, initial_sender=self.keypair)
            
            # Call ticket mint function
            txn.move_call(
                target=f"{TICKET_PACKAGE_ID}::ticket_nft::mint_ticket",
                arguments=[
                    SuiString(wallet_address),
                    SuiString(route),
                    SuiString(train_id),
                    SuiString(seat_number),
                    SuiU64(int(price * MIST_PER_SUI)),
                ],
                type_arguments=[]
            )
            
            # Execute
            result = txn.execute(gas_budget=10_000_000)
            
            if result.is_ok():
                tx_digest = result.digest
                ticket_id = self._extract_ticket_id(result)
                logger.info(f"✅ Ticket minted: {ticket_id}")
                return True, ticket_id, None
            else:
                error_msg = result.error if hasattr(result, 'error') else "Mint failed"
                return False, None, error_msg
                
        except Exception as e:
            logger.error(f"❌ Ticket mint error: {str(e)}")
            return False, None, str(e)
    
    # ========== Helper Methods ==========
    
    def _get_or_create_wallet(self, phone_number: str) -> str:
        """Get existing wallet or create new one for phone number"""
        # In production, query database for existing wallet
        # For now, derive deterministic address from phone number
        # TODO: Implement proper wallet management
        
        # Placeholder: return a mock address
        return f"0x{phone_number.replace('+', '').replace(' ', '')[:40]}"
    
    def _get_wallet_address(self, phone_number: str) -> Optional[str]:
        """Get wallet address for phone number"""
        # Query database
        # TODO: Implement database query
        return self._get_or_create_wallet(phone_number)
    
    def _get_certificate_details(self, certificate_id: str) -> Optional[Dict]:
        """Get InvestmentCertificate details from blockchain"""
        try:
            obj = self.client.get_object(certificate_id)
            if obj.is_ok():
                # Parse certificate fields
                fields = obj.data.content.fields
                return {
                    'id': certificate_id,
                    'investor': fields.get('investor'),
                    'sui_invested': int(fields.get('sui_invested', 0)),
                    'equity_tokens': int(fields.get('equity_tokens', 0)),
                    'vesting_start': int(fields.get('vesting_start', 0)),
                    'vesting_end': int(fields.get('vesting_end', 0)),
                    'total_claimed': int(fields.get('total_claimed', 0)),
                    'certificate_number': int(fields.get('certificate_number', 0))
                }
        except Exception as e:
            logger.error(f"Error getting certificate details: {str(e)}")
        return None
    
    def _calculate_vested_amount(self, cert: Dict, now: int) -> int:
        """Calculate vested amount using linear vesting"""
        vesting_start = cert['vesting_start']
        vesting_end = cert['vesting_end']
        total_tokens = cert['equity_tokens']
        
        if now >= vesting_end:
            return total_tokens
        if now <= vesting_start:
            return 0
        
        elapsed = now - vesting_start
        total_time = vesting_end - vesting_start
        
        return int((total_tokens * elapsed) / total_time)
    
    def _extract_certificate_id(self, result) -> Optional[str]:
        """Extract certificate NFT ID from transaction result"""
        try:
            for change in result.effects.created:
                if "InvestmentCertificate" in change.object_type:
                    return change.object_id
        except Exception as e:
            logger.error(f"Error extracting certificate ID: {str(e)}")
        return None
    
    def _extract_ticket_id(self, result) -> Optional[str]:
        """Extract ticket NFT ID from transaction result"""
        try:
            for change in result.effects.created:
                if "TicketNFT" in change.object_type:
                    return change.object_id
        except Exception as e:
            logger.error(f"Error extracting ticket ID: {str(e)}")
        return None
    
    def _store_investment_record(
        self,
        phone_number: str,
        wallet_address: str,
        sui_amount: int,
        tx_digest: str,
        certificate_id: Optional[str]
    ):
        """Store investment record in database"""
        # TODO: Implement database storage
        logger.info(f"📝 Storing investment record: {phone_number} -> {sui_amount} SUI")
        pass

# Global instance
sui = SuiIntegration()

# Convenience functions
def invest_sent(phone_number: str, sui_amount: int) -> Tuple[bool, Optional[str], Optional[str]]:
    """Invest in $SENT"""
    return sui.invest_sent(phone_number, sui_amount)

def check_sent_balance(phone_number: str) -> Tuple[bool, Optional[Dict], Optional[str]]:
    """Check $SENT balance"""
    return sui.check_sent_balance(phone_number)

def claim_vested_tokens(phone_number: str, certificate_id: str) -> Tuple[bool, Optional[str], Optional[str]]:
    """Claim vested tokens"""
    return sui.claim_vested_tokens(phone_number, certificate_id)

def mint_afc(phone_number: str, zmw_amount: float) -> Tuple[bool, Optional[str], Optional[str]]:
    """Mint AFC stablecoin"""
    return sui.mint_afc(phone_number, zmw_amount)

def mint_ticket_nft(phone_number: str, route: str, train_id: str, seat_number: str, price: float) -> Tuple[bool, Optional[str], Optional[str]]:
    """Mint ticket NFT"""
    return sui.mint_ticket_nft(phone_number, route, train_id, seat_number, price)
