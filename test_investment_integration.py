#!/usr/bin/env python3
"""
ARAIL Investment Flow Integration Tests
Tests the complete investment workflow including security features
"""

import pytest
import json
from datetime import datetime, timedelta
from unittest.mock import patch, MagicMock
from app import (
    app, 
    validate_ip, 
    check_rate_limit, 
    cleanup_old_sessions,
    sessions,
    rate_limit_storage,
    SocketTimeout
)

# Test fixtures
@pytest.fixture
def client():
    """Create test client"""
    import os
    os.environ['FLASK_ENV'] = 'development'  # Disable IP validation for tests
    app.config['TESTING'] = True
    with app.test_client() as client:
        yield client

@pytest.fixture(autouse=True)
def reset_storage():
    """Reset storage between tests"""
    sessions.clear()
    rate_limit_storage.clear()
    yield
    sessions.clear()
    rate_limit_storage.clear()

# Security Tests
class TestSecurity:
    """Test security features"""
    
    def test_ip_validation_allowed(self):
        """Test IP validation for allowed IPs"""
        # Test valid IPs from Africa's Talking
        assert validate_ip('52.48.80.10') is True
        assert validate_ip('54.76.100.200') is True
        assert validate_ip('3.8.50.100') is True
        assert validate_ip('18.202.150.100') is True
    
    def test_ip_validation_denied(self):
        """Test IP validation denies unauthorized IPs"""
        assert validate_ip('1.2.3.4') is False
        assert validate_ip('192.168.1.1') is False
        assert validate_ip('10.0.0.1') is False
    
    def test_ip_validation_invalid_format(self):
        """Test IP validation handles invalid formats"""
        assert validate_ip('not-an-ip') is False
        assert validate_ip('') is False
        assert validate_ip('999.999.999.999') is False
    
    def test_rate_limiting_allows_normal_traffic(self):
        """Test rate limiting allows normal traffic"""
        phone = '+260975190740'
        
        # First 10 requests should succeed
        for i in range(10):
            allowed, retry_after = check_rate_limit(phone)
            assert allowed is True
            assert retry_after == 0
    
    def test_rate_limiting_blocks_excessive_requests(self):
        """Test rate limiting blocks excessive requests"""
        phone = '+260975190740'
        
        # Exceed rate limit
        for i in range(10):
            check_rate_limit(phone)
        
        # 11th request should be blocked
        allowed, retry_after = check_rate_limit(phone)
        assert allowed is False
        assert retry_after > 0
    
    def test_rate_limiting_per_phone(self):
        """Test rate limiting is per phone number"""
        phone1 = '+260975190740'
        phone2 = '+254712345678'
        
        # Exhaust limit for phone1
        for i in range(10):
            check_rate_limit(phone1)
        
        # phone1 should be blocked
        allowed, _ = check_rate_limit(phone1)
        assert allowed is False
        
        # phone2 should still be allowed
        allowed, _ = check_rate_limit(phone2)
        assert allowed is True
    
    def test_session_cleanup(self):
        """Test session cleanup removes old sessions"""
        import app as app_module
        
        # Create some sessions with old timestamps
        now = datetime.now()
        old_time = (now - timedelta(hours=2)).isoformat()
        recent_time = now.isoformat()
        
        app_module.sessions['old_session'] = {
            'data': 'test',
            'last_updated': old_time
        }
        app_module.sessions['recent_session'] = {
            'data': 'test',
            'last_updated': recent_time
        }
        
        # Force cleanup
        app_module.session_last_cleanup = now - timedelta(minutes=15)
        cleanup_old_sessions()
        
        # Old session should be removed
        assert 'old_session' not in app_module.sessions
        # Recent session should remain
        assert 'recent_session' in app_module.sessions
    
    def test_socket_timeout_context_manager(self):
        """Test socket timeout context manager"""
        import socket
        
        original_timeout = socket.getdefaulttimeout()
        
        with SocketTimeout(15):
            assert socket.getdefaulttimeout() == 15
        
        # Should be restored
        assert socket.getdefaulttimeout() == original_timeout
    
    def test_socket_timeout_exception_handling(self):
        """Test socket timeout is restored even with exception"""
        import socket
        
        original_timeout = socket.getdefaulttimeout()
        
        try:
            with SocketTimeout(15):
                raise ValueError("Test exception")
        except ValueError:
            pass
        
        # Should still be restored
        assert socket.getdefaulttimeout() == original_timeout


# Integration Tests
class TestInvestmentFlow:
    """Test complete investment workflow"""
    
    def test_health_check(self, client):
        """Test health check endpoint"""
        response = client.get('/health')
        assert response.status_code == 200
        
        data = json.loads(response.data)
        assert data['status'] == 'healthy'
        assert 'timestamp' in data
        assert 'sui_integration' in data
    
    def test_ussd_initial_menu(self, client):
        """Test USSD initial menu"""
        response = client.post('/ussd', data={
            'sessionId': 'test_session_1',
            'serviceCode': '*384*26621#',
            'phoneNumber': '+260975190740',
            'text': '',
            'networkCode': '63902'
        })
        
        assert response.status_code == 200
        assert b'CON Welcome to ARAIL' in response.data
        assert b'Book Train Ticket' in response.data
        assert b'Invest in $SENT Pre-Seed' in response.data
    
    def test_investment_menu(self, client):
        """Test investment menu"""
        response = client.post('/ussd', data={
            'sessionId': 'test_session_2',
            'serviceCode': '*384*26621#',
            'phoneNumber': '+260975190740',
            'text': '2',
            'networkCode': '63902'
        })
        
        assert response.status_code == 200
        assert b'CON' in response.data
        assert b'ARAIL Pre-Seed Round' in response.data
        assert b'Invest 100 SUI' in response.data
        assert b'Invest 500 SUI' in response.data
    
    def test_investment_100_sui_summary(self, client):
        """Test 100 SUI investment summary"""
        # First, navigate to investment menu to set session data
        session_id = 'test_session_3'
        
        # Select investment option first
        client.post('/ussd', data={
            'sessionId': session_id,
            'serviceCode': '*384*26621#',
            'phoneNumber': '+260975190740',
            'text': '2',
            'networkCode': '63902'
        })
        
        # Then select 100 SUI option
        response = client.post('/ussd', data={
            'sessionId': session_id,
            'serviceCode': '*384*26621#',
            'phoneNumber': '+260975190740',
            'text': '2*1',
            'networkCode': '63902'
        })
        
        assert response.status_code == 200
        assert b'CON Investment Summary' in response.data
        assert b'100 SUI' in response.data
        assert b'Confirm Investment' in response.data
    
    @patch('app.execute_investment')
    def test_investment_confirmation_success(self, mock_execute, client):
        """Test successful investment confirmation"""
        # Mock successful investment
        mock_execute.return_value = (True, '0xMOCKTXDIGEST123456789')
        
        session_id = 'test_session_4'
        
        # Navigate through the flow
        client.post('/ussd', data={
            'sessionId': session_id,
            'serviceCode': '*384*26621#',
            'phoneNumber': '+260975190740',
            'text': '2',
            'networkCode': '63902'
        })
        
        client.post('/ussd', data={
            'sessionId': session_id,
            'serviceCode': '*384*26621#',
            'phoneNumber': '+260975190740',
            'text': '2*1',
            'networkCode': '63902'
        })
        
        # Confirm investment
        response = client.post('/ussd', data={
            'sessionId': session_id,
            'serviceCode': '*384*26621#',
            'phoneNumber': '+260975190740',
            'text': '2*1*1',
            'networkCode': '63902'
        })
        
        assert response.status_code == 200
        assert b'END' in response.data
        assert b'Investment Confirmed' in response.data
        assert b'100 SUI' in response.data
    
    @patch('app.execute_investment')
    def test_investment_confirmation_failure(self, mock_execute, client):
        """Test failed investment confirmation"""
        # Mock failed investment
        mock_execute.return_value = (False, 'Insufficient balance')
        
        session_id = 'test_session_5'
        
        # Navigate through the flow
        client.post('/ussd', data={
            'sessionId': session_id,
            'serviceCode': '*384*26621#',
            'phoneNumber': '+260975190740',
            'text': '2',
            'networkCode': '63902'
        })
        
        client.post('/ussd', data={
            'sessionId': session_id,
            'serviceCode': '*384*26621#',
            'phoneNumber': '+260975190740',
            'text': '2*1',
            'networkCode': '63902'
        })
        
        # Confirm investment (should fail)
        response = client.post('/ussd', data={
            'sessionId': session_id,
            'serviceCode': '*384*26621#',
            'phoneNumber': '+260975190740',
            'text': '2*1*1',
            'networkCode': '63902'
        })
        
        assert response.status_code == 200
        assert b'END' in response.data
        assert b'Investment Failed' in response.data
    
    @patch('app.execute_investment')
    def test_investment_timeout_handling(self, mock_execute, client):
        """Test investment timeout handling"""
        import socket
        
        # Mock timeout
        mock_execute.side_effect = socket.timeout()
        
        session_id = 'test_session_6'
        
        # Navigate through the flow
        client.post('/ussd', data={
            'sessionId': session_id,
            'serviceCode': '*384*26621#',
            'phoneNumber': '+260975190740',
            'text': '2',
            'networkCode': '63902'
        })
        
        client.post('/ussd', data={
            'sessionId': session_id,
            'serviceCode': '*384*26621#',
            'phoneNumber': '+260975190740',
            'text': '2*1',
            'networkCode': '63902'
        })
        
        # Confirm investment (should timeout)
        response = client.post('/ussd', data={
            'sessionId': session_id,
            'serviceCode': '*384*26621#',
            'phoneNumber': '+260975190740',
            'text': '2*1*1',
            'networkCode': '63902'
        })
        
        assert response.status_code == 200
        assert b'END' in response.data
        assert b'Connection Timeout' in response.data
    
    def test_invalid_phone_number(self, client):
        """Test invalid phone number handling"""
        response = client.post('/ussd', data={
            'sessionId': 'test_session_7',
            'serviceCode': '*384*26621#',
            'phoneNumber': '123',
            'text': '',
            'networkCode': '63902'
        })
        
        assert response.status_code == 200
        assert b'END Error' in response.data
    
    def test_rate_limit_exceeded(self, client):
        """Test rate limiting in USSD endpoint"""
        phone = '+260975190740'
        
        # Make 10 successful requests
        for i in range(10):
            response = client.post('/ussd', data={
                'sessionId': f'test_session_rate_{i}',
                'serviceCode': '*384*26621#',
                'phoneNumber': phone,
                'text': '',
                'networkCode': '63902'
            })
            assert response.status_code == 200
        
        # 11th request should be rate limited
        response = client.post('/ussd', data={
            'sessionId': 'test_session_rate_11',
            'serviceCode': '*384*26621#',
            'phoneNumber': phone,
            'text': '',
            'networkCode': '63902'
        })
        
        assert response.status_code == 200
        assert b'Too many requests' in response.data
    
    def test_input_sanitization(self, client):
        """Test input sanitization"""
        # Send malicious input
        response = client.post('/ussd', data={
            'sessionId': 'test_session_8',
            'serviceCode': '*384*26621#',
            'phoneNumber': '+260975190740',
            'text': '1<script>alert("xss")</script>',
            'networkCode': '63902'
        })
        
        # Should not contain the script tag
        assert b'<script>' not in response.data
        assert response.status_code == 200


# Wallet Tests
class TestWalletFlow:
    """Test wallet check functionality"""
    
    @patch('app.check_investment_status')
    def test_wallet_check_with_investment(self, mock_check, client):
        """Test wallet check for user with investment"""
        # Mock wallet data
        mock_check.return_value = (True, {
            'has_investment': True,
            'equity_tokens': 142857,
            'vested_tokens': 50000,
            'locked_tokens': 92857,
            'vesting_progress': 35.0,
            'claimable_tokens': 5000,
            'days_until_fully_vested': 195,
            'certificate_id': '0xCERT123'
        })
        
        session_id = 'test_session_wallet_1'
        
        # Navigate to wallet menu
        client.post('/ussd', data={
            'sessionId': session_id,
            'serviceCode': '*384*26621#',
            'phoneNumber': '+260975190740',
            'text': '3',
            'networkCode': '63902'
        })
        
        # Check SENT balance
        response = client.post('/ussd', data={
            'sessionId': session_id,
            'serviceCode': '*384*26621#',
            'phoneNumber': '+260975190740',
            'text': '3*1',
            'networkCode': '63902'
        })
        
        assert response.status_code == 200
        assert b'Your $SENT Balance' in response.data
        assert b'142,857 tokens' in response.data
    
    @patch('app.check_investment_status')
    def test_wallet_check_no_investment(self, mock_check, client):
        """Test wallet check for user without investment"""
        # Mock no investment
        mock_check.return_value = (True, {'has_investment': False})
        
        session_id = 'test_session_wallet_2'
        
        # Navigate to wallet menu
        client.post('/ussd', data={
            'sessionId': session_id,
            'serviceCode': '*384*26621#',
            'phoneNumber': '+260975190740',
            'text': '3',
            'networkCode': '63902'
        })
        
        # Check SENT balance
        response = client.post('/ussd', data={
            'sessionId': session_id,
            'serviceCode': '*384*26621#',
            'phoneNumber': '+260975190740',
            'text': '3*1',
            'networkCode': '63902'
        })
        
        assert response.status_code == 200
        assert b'No investments found' in response.data


if __name__ == '__main__':
    pytest.main([__file__, '-v', '--tb=short'])
