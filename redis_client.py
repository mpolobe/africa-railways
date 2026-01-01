#!/usr/bin/env python3
"""
ARAIL Redis Client Module
Provides robust Redis operations with error handling and retry logic
"""

import os
import logging
import json
from typing import Any, Optional
from datetime import datetime, timedelta
import redis
from redis.exceptions import (
    ConnectionError,
    TimeoutError,
    RedisError,
    BusyLoadingError,
    ResponseError
)

logger = logging.getLogger(__name__)


class RedisClient:
    """
    Robust Redis client with automatic retry and error handling
    
    Features:
    - Automatic connection retry
    - Connection pooling
    - Graceful error handling
    - Fallback to in-memory storage when Redis unavailable
    """
    
    def __init__(self, redis_url: Optional[str] = None, use_fallback: bool = True):
        """
        Initialize Redis client
        
        Args:
            redis_url: Redis connection URL (defaults to REDIS_URL env var)
            use_fallback: If True, uses in-memory dict when Redis unavailable
        """
        self.redis_url = redis_url or os.getenv('REDIS_URL')
        self.use_fallback = use_fallback
        self.fallback_storage = {}  # In-memory fallback
        self.client = None
        self.connected = False
        
        # Connection settings
        self.max_retries = 3
        self.retry_delay = 1  # seconds
        self.socket_timeout = 5
        self.socket_connect_timeout = 5
        
        # Initialize connection
        self._connect()
    
    def _connect(self):
        """
        Establish Redis connection with retry logic
        """
        if not self.redis_url:
            logger.warning("⚠️  REDIS_URL not configured. Using in-memory fallback.")
            self.connected = False
            return
        
        for attempt in range(self.max_retries):
            try:
                logger.info(f"Attempting Redis connection (attempt {attempt + 1}/{self.max_retries})...")
                
                # Create connection pool with timeouts
                pool = redis.ConnectionPool.from_url(
                    self.redis_url,
                    socket_timeout=self.socket_timeout,
                    socket_connect_timeout=self.socket_connect_timeout,
                    max_connections=10,
                    decode_responses=True
                )
                
                # Create client
                self.client = redis.Redis(connection_pool=pool)
                
                # Test connection
                self.client.ping()
                
                self.connected = True
                logger.info("✅ Redis connected successfully")
                return
                
            except (ConnectionError, TimeoutError) as e:
                logger.warning(f"❌ Redis connection failed (attempt {attempt + 1}): {str(e)}")
                if attempt < self.max_retries - 1:
                    import time
                    time.sleep(self.retry_delay)
                else:
                    logger.error("❌ Redis connection failed after all retries")
                    self.connected = False
                    if self.use_fallback:
                        logger.info("Using in-memory fallback storage")
            
            except Exception as e:
                logger.error(f"❌ Unexpected Redis connection error: {str(e)}")
                self.connected = False
                break
    
    def is_connected(self) -> bool:
        """
        Check if Redis is connected
        
        Returns:
            bool: True if Redis is connected, False otherwise
        """
        if not self.client:
            return False
        
        try:
            self.client.ping()
            return True
        except (ConnectionError, TimeoutError, RedisError):
            return False
    
    def set(self, key: str, value: Any, expire: Optional[int] = None) -> bool:
        """
        Set a key-value pair in Redis with error handling
        
        Args:
            key: Redis key
            value: Value to store (will be JSON serialized if dict/list)
            expire: Optional expiration time in seconds
        
        Returns:
            bool: True if successful, False otherwise
        """
        try:
            # Serialize complex objects
            if isinstance(value, (dict, list)):
                value = json.dumps(value)
            
            if self.connected and self.client:
                self.client.set(key, value, ex=expire)
                logger.debug(f"Redis SET: {key}")
                return True
            else:
                # Fallback to in-memory storage
                self.fallback_storage[key] = {
                    'value': value,
                    'expire_at': datetime.now() + timedelta(seconds=expire) if expire else None
                }
                logger.debug(f"Fallback SET: {key}")
                return True
                
        except (ConnectionError, TimeoutError) as e:
            logger.error(f"Redis connection error on SET {key}: {str(e)}")
            # Try fallback
            if self.use_fallback:
                self.fallback_storage[key] = {
                    'value': value,
                    'expire_at': datetime.now() + timedelta(seconds=expire) if expire else None
                }
                return True
            return False
            
        except ResponseError as e:
            logger.error(f"Redis response error on SET {key}: {str(e)}")
            return False
            
        except Exception as e:
            logger.error(f"Unexpected error on SET {key}: {str(e)}")
            return False
    
    def get(self, key: str) -> Optional[Any]:
        """
        Get a value from Redis with error handling
        
        Args:
            key: Redis key
        
        Returns:
            The value if found, None otherwise
        """
        try:
            if self.connected and self.client:
                value = self.client.get(key)
                logger.debug(f"Redis GET: {key}")
                
                # Try to deserialize JSON
                if value and isinstance(value, str):
                    try:
                        return json.loads(value)
                    except json.JSONDecodeError:
                        return value
                return value
            else:
                # Fallback to in-memory storage
                if key in self.fallback_storage:
                    item = self.fallback_storage[key]
                    
                    # Check expiration
                    if item['expire_at'] and datetime.now() > item['expire_at']:
                        del self.fallback_storage[key]
                        return None
                    
                    logger.debug(f"Fallback GET: {key}")
                    value = item['value']
                    
                    # Try to deserialize JSON
                    if isinstance(value, str):
                        try:
                            return json.loads(value)
                        except json.JSONDecodeError:
                            return value
                    return value
                return None
                
        except (ConnectionError, TimeoutError) as e:
            logger.error(f"Redis connection error on GET {key}: {str(e)}")
            # Try fallback
            if self.use_fallback and key in self.fallback_storage:
                item = self.fallback_storage[key]
                if not item['expire_at'] or datetime.now() <= item['expire_at']:
                    return item['value']
            return None
            
        except Exception as e:
            logger.error(f"Unexpected error on GET {key}: {str(e)}")
            return None
    
    def delete(self, key: str) -> bool:
        """
        Delete a key from Redis
        
        Args:
            key: Redis key to delete
        
        Returns:
            bool: True if successful, False otherwise
        """
        try:
            if self.connected and self.client:
                self.client.delete(key)
                logger.debug(f"Redis DELETE: {key}")
                return True
            else:
                # Fallback
                if key in self.fallback_storage:
                    del self.fallback_storage[key]
                    logger.debug(f"Fallback DELETE: {key}")
                return True
                
        except (ConnectionError, TimeoutError) as e:
            logger.error(f"Redis connection error on DELETE {key}: {str(e)}")
            if self.use_fallback and key in self.fallback_storage:
                del self.fallback_storage[key]
            return False
            
        except Exception as e:
            logger.error(f"Unexpected error on DELETE {key}: {str(e)}")
            return False
    
    def exists(self, key: str) -> bool:
        """
        Check if a key exists
        
        Args:
            key: Redis key
        
        Returns:
            bool: True if key exists, False otherwise
        """
        try:
            if self.connected and self.client:
                return bool(self.client.exists(key))
            else:
                # Fallback
                if key in self.fallback_storage:
                    item = self.fallback_storage[key]
                    if item['expire_at'] and datetime.now() > item['expire_at']:
                        del self.fallback_storage[key]
                        return False
                    return True
                return False
                
        except Exception as e:
            logger.error(f"Error checking key existence {key}: {str(e)}")
            return key in self.fallback_storage if self.use_fallback else False
    
    def expire(self, key: str, seconds: int) -> bool:
        """
        Set expiration time for a key
        
        Args:
            key: Redis key
            seconds: Expiration time in seconds
        
        Returns:
            bool: True if successful, False otherwise
        """
        try:
            if self.connected and self.client:
                return bool(self.client.expire(key, seconds))
            else:
                # Fallback
                if key in self.fallback_storage:
                    self.fallback_storage[key]['expire_at'] = datetime.now() + timedelta(seconds=seconds)
                    return True
                return False
                
        except Exception as e:
            logger.error(f"Error setting expiration for {key}: {str(e)}")
            return False
    
    def close(self):
        """
        Close Redis connection gracefully
        """
        try:
            if self.client:
                self.client.close()
                logger.info("Redis connection closed")
        except Exception as e:
            logger.error(f"Error closing Redis connection: {str(e)}")


# Global Redis client instance
_redis_client: Optional[RedisClient] = None


def get_redis_client() -> RedisClient:
    """
    Get global Redis client instance (singleton pattern)
    
    Returns:
        RedisClient: Configured Redis client
    """
    global _redis_client
    
    if _redis_client is None:
        _redis_client = RedisClient()
    
    return _redis_client


if __name__ == "__main__":
    """
    Test Redis client functionality
    
    Usage:
        python3 redis_client.py
    """
    print("🧪 Testing ARAIL Redis Client")
    print("=" * 60)
    
    # Initialize client
    client = RedisClient()
    
    print(f"\nConnection status: {'✅ Connected' if client.is_connected() else '⚠️  Using fallback'}")
    
    # Test SET operation
    print("\n1. Testing SET operation:")
    success = client.set("test_key", "test_value", expire=60)
    print(f"  {'✅' if success else '❌'} SET test_key = test_value")
    
    # Test GET operation
    print("\n2. Testing GET operation:")
    value = client.get("test_key")
    print(f"  {'✅' if value == 'test_value' else '❌'} GET test_key = {value}")
    
    # Test complex object
    print("\n3. Testing complex object:")
    test_data = {"phone": "+260975190740", "amount": 100, "timestamp": "2024-01-01"}
    success = client.set("test_session", test_data, expire=300)
    print(f"  {'✅' if success else '❌'} SET test_session = {test_data}")
    
    retrieved = client.get("test_session")
    print(f"  {'✅' if retrieved == test_data else '❌'} GET test_session = {retrieved}")
    
    # Test DELETE operation
    print("\n4. Testing DELETE operation:")
    success = client.delete("test_key")
    print(f"  {'✅' if success else '❌'} DELETE test_key")
    
    value = client.get("test_key")
    print(f"  {'✅' if value is None else '❌'} GET test_key = {value} (should be None)")
    
    # Close connection
    client.close()
    
    print("\n" + "=" * 60)
    print("✅ Redis client tests complete")
