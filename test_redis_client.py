#!/usr/bin/env python3
"""
Unit tests for ARAIL Redis client
Tests Redis operations with fallback handling
"""

import unittest
import os
import time
from redis_client import RedisClient


class TestRedisClient(unittest.TestCase):
    """Test Redis client with fallback"""
    
    def setUp(self):
        """Set up test client"""
        # Use a test Redis URL or fallback
        self.client = RedisClient(redis_url=None, use_fallback=True)
    
    def tearDown(self):
        """Clean up after tests"""
        if self.client:
            self.client.close()
    
    def test_set_and_get(self):
        """Test basic SET and GET operations"""
        key = "test_key_" + str(time.time())
        value = "test_value"
        
        # Set value
        success = self.client.set(key, value)
        self.assertTrue(success)
        
        # Get value
        retrieved = self.client.get(key)
        self.assertEqual(retrieved, value)
        
        # Clean up
        self.client.delete(key)
    
    def test_set_with_expiration(self):
        """Test SET with expiration"""
        key = "test_expire_" + str(time.time())
        value = "expire_value"
        
        # Set with 2 second expiration
        success = self.client.set(key, value, expire=2)
        self.assertTrue(success)
        
        # Value should exist immediately
        self.assertTrue(self.client.exists(key))
        
        # Wait for expiration (only test if using fallback, as real Redis timing is precise)
        if not self.client.is_connected():
            time.sleep(3)
            # Value should be expired
            self.assertFalse(self.client.exists(key))
    
    def test_set_and_get_dict(self):
        """Test SET and GET with dictionary"""
        key = "test_dict_" + str(time.time())
        value = {"phone": "+260975190740", "amount": 100, "status": "pending"}
        
        # Set dict
        success = self.client.set(key, value)
        self.assertTrue(success)
        
        # Get dict
        retrieved = self.client.get(key)
        self.assertEqual(retrieved, value)
        
        # Clean up
        self.client.delete(key)
    
    def test_set_and_get_list(self):
        """Test SET and GET with list"""
        key = "test_list_" + str(time.time())
        value = [1, 2, 3, 4, 5]
        
        # Set list
        success = self.client.set(key, value)
        self.assertTrue(success)
        
        # Get list
        retrieved = self.client.get(key)
        self.assertEqual(retrieved, value)
        
        # Clean up
        self.client.delete(key)
    
    def test_delete(self):
        """Test DELETE operation"""
        key = "test_delete_" + str(time.time())
        value = "delete_me"
        
        # Set value
        self.client.set(key, value)
        self.assertTrue(self.client.exists(key))
        
        # Delete
        success = self.client.delete(key)
        self.assertTrue(success)
        
        # Should not exist
        self.assertFalse(self.client.exists(key))
    
    def test_exists(self):
        """Test EXISTS operation"""
        key = "test_exists_" + str(time.time())
        
        # Should not exist initially
        self.assertFalse(self.client.exists(key))
        
        # Set value
        self.client.set(key, "value")
        
        # Should exist now
        self.assertTrue(self.client.exists(key))
        
        # Clean up
        self.client.delete(key)
    
    def test_get_nonexistent_key(self):
        """Test GET on non-existent key"""
        key = "nonexistent_" + str(time.time())
        value = self.client.get(key)
        self.assertIsNone(value)
    
    def test_fallback_storage(self):
        """Test that fallback storage works when Redis unavailable"""
        # Create client with no Redis URL (forces fallback)
        fallback_client = RedisClient(redis_url=None, use_fallback=True)
        
        # Should use fallback
        self.assertFalse(fallback_client.is_connected())
        
        # But operations should still work
        key = "fallback_test_" + str(time.time())
        value = "fallback_value"
        
        success = fallback_client.set(key, value)
        self.assertTrue(success)
        
        retrieved = fallback_client.get(key)
        self.assertEqual(retrieved, value)
        
        # Clean up
        fallback_client.delete(key)
        fallback_client.close()
    
    def test_session_data(self):
        """Test storing and retrieving session data"""
        session_id = "session_" + str(time.time())
        session_data = {
            'phone': '+260975190740',
            'flow': 'investment',
            'sui_amount': 500,
            'timestamp': '2024-01-01T12:00:00'
        }
        
        # Store session
        success = self.client.set(f"session:{session_id}", session_data, expire=1800)
        self.assertTrue(success)
        
        # Retrieve session
        retrieved = self.client.get(f"session:{session_id}")
        self.assertEqual(retrieved, session_data)
        
        # Clean up
        self.client.delete(f"session:{session_id}")
    
    def test_multiple_keys(self):
        """Test working with multiple keys"""
        keys = [f"test_multi_{i}_{time.time()}" for i in range(5)]
        values = [f"value_{i}" for i in range(5)]
        
        # Set multiple keys
        for key, value in zip(keys, values):
            self.client.set(key, value)
        
        # Verify all exist
        for key in keys:
            self.assertTrue(self.client.exists(key))
        
        # Verify values
        for key, expected_value in zip(keys, values):
            retrieved = self.client.get(key)
            self.assertEqual(retrieved, expected_value)
        
        # Clean up
        for key in keys:
            self.client.delete(key)


class TestRedisClientErrorHandling(unittest.TestCase):
    """Test Redis client error handling"""
    
    def test_invalid_redis_url(self):
        """Test handling of invalid Redis URL"""
        # Should not crash, should use fallback
        client = RedisClient(redis_url="redis://invalid:9999", use_fallback=True)
        self.assertFalse(client.is_connected())
        
        # But should still work with fallback
        key = "test_" + str(time.time())
        success = client.set(key, "value")
        self.assertTrue(success)
        
        value = client.get(key)
        self.assertEqual(value, "value")
        
        client.close()
    
    def test_no_fallback_on_error(self):
        """Test behavior when fallback is disabled"""
        client = RedisClient(redis_url="redis://invalid:9999", use_fallback=False)
        self.assertFalse(client.is_connected())
        
        # Operations should fail gracefully
        key = "test_" + str(time.time())
        success = client.set(key, "value")
        # May return False or handle differently based on implementation
        
        client.close()


if __name__ == '__main__':
    # Run tests
    unittest.main()
