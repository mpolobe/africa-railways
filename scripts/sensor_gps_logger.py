#!/usr/bin/env python3
"""
Africa Railways - Sentinel GPS Sensor Logger

Collects GPS data from train sensors and sends to the backend API.
Supports both direct API logging and Supabase integration.

Usage:
    python sensor_gps_logger.py --train-id SGR001 --interval 30
    python sensor_gps_logger.py --train-id TAZARA-001 --sentinel-id sentinel-42 --use-supabase

Environment Variables:
    BACKEND_URL - API endpoint (default: https://api.africarailways.com)
    SUPABASE_URL - Supabase project URL
    SUPABASE_KEY - Supabase anon key
"""

import argparse
import json
import logging
import os
import random
import sys
import time
from datetime import datetime
from typing import Optional, Dict, Any

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
logger = logging.getLogger(__name__)

# Default configuration
DEFAULT_BACKEND_URL = "https://api.africarailways.com"
DEFAULT_SUPABASE_URL = "https://llvprbmrnjvamjzavmhg.supabase.co"
DEFAULT_SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxsdnByYm1ybmp2YW1qemF2bWhnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU3NDQ1NTIsImV4cCI6MjA4MTMyMDU1Mn0.YvLr0yIuPvaBIjZ0_RZ10H6FzJ6eFbbaPOH6lM0RNtY"

# Sample routes for simulation
SAMPLE_ROUTES = {
    "TAZARA": {
        "start": {"lat": -6.8235, "lon": 39.2695, "name": "Dar es Salaam"},
        "end": {"lat": -14.4667, "lon": 28.6833, "name": "Kapiri Mposhi"},
        "waypoints": [
            {"lat": -7.7833, "lon": 36.6833, "name": "Kilosa"},
            {"lat": -8.9167, "lon": 35.7500, "name": "Mlimba"},
            {"lat": -8.9000, "lon": 33.4500, "name": "Mbeya"},
            {"lat": -9.3667, "lon": 32.7667, "name": "Tunduma"},
            {"lat": -10.6167, "lon": 31.1167, "name": "Kasama"},
        ]
    },
    "ZRL": {
        "start": {"lat": -17.8419, "lon": 25.8544, "name": "Livingstone"},
        "end": {"lat": -12.8167, "lon": 28.2167, "name": "Kitwe"},
        "waypoints": [
            {"lat": -16.8333, "lon": 26.8333, "name": "Choma"},
            {"lat": -15.4167, "lon": 28.2833, "name": "Lusaka"},
            {"lat": -14.4500, "lon": 28.4500, "name": "Kabwe"},
            {"lat": -12.9667, "lon": 28.6333, "name": "Ndola"},
        ]
    },
    "SGR_KENYA": {
        "start": {"lat": -1.3189, "lon": 36.9275, "name": "Nairobi"},
        "end": {"lat": -4.0435, "lon": 39.6682, "name": "Mombasa"},
        "waypoints": [
            {"lat": -1.4500, "lon": 36.9833, "name": "Athi River"},
            {"lat": -2.0833, "lon": 37.5167, "name": "Emali"},
            {"lat": -2.9833, "lon": 38.1667, "name": "Mtito Andei"},
            {"lat": -3.3833, "lon": 38.5667, "name": "Voi"},
        ]
    }
}


class GPSSimulator:
    """Simulates GPS coordinates along a route"""
    
    def __init__(self, route_name: str = "TAZARA"):
        self.route = SAMPLE_ROUTES.get(route_name, SAMPLE_ROUTES["TAZARA"])
        self.current_index = 0
        self.progress = 0.0  # 0.0 to 1.0 between waypoints
        self.direction = 1  # 1 = forward, -1 = backward
        
    def get_waypoints(self):
        """Get all waypoints including start and end"""
        return [self.route["start"]] + self.route["waypoints"] + [self.route["end"]]
    
    def get_current_position(self) -> Dict[str, float]:
        """Get current GPS position with some random noise"""
        waypoints = self.get_waypoints()
        
        if self.current_index >= len(waypoints) - 1:
            self.direction = -1
            self.current_index = len(waypoints) - 2
        elif self.current_index < 0:
            self.direction = 1
            self.current_index = 0
            
        current = waypoints[self.current_index]
        next_wp = waypoints[self.current_index + self.direction]
        
        # Interpolate between waypoints
        lat = current["lat"] + (next_wp["lat"] - current["lat"]) * self.progress
        lon = current["lon"] + (next_wp["lon"] - current["lon"]) * self.progress
        
        # Add GPS noise (±50m)
        lat += random.uniform(-0.0005, 0.0005)
        lon += random.uniform(-0.0005, 0.0005)
        
        # Simulate speed (40-80 km/h for trains)
        speed = random.uniform(40, 80)
        
        # Simulate heading based on direction
        import math
        heading = math.degrees(math.atan2(
            next_wp["lon"] - current["lon"],
            next_wp["lat"] - current["lat"]
        ))
        if heading < 0:
            heading += 360
            
        return {
            "lat": round(lat, 7),
            "lon": round(lon, 7),
            "altitude_m": random.uniform(500, 1500),
            "speed_kmh": round(speed, 1),
            "heading": round(heading, 1),
            "accuracy_m": random.uniform(5, 20)
        }
    
    def advance(self, step: float = 0.05):
        """Advance along the route"""
        self.progress += step
        if self.progress >= 1.0:
            self.progress = 0.0
            self.current_index += self.direction


class SensorLogger:
    """Logs GPS data to backend API or Supabase"""
    
    def __init__(
        self,
        train_id: str,
        sentinel_id: Optional[str] = None,
        backend_url: Optional[str] = None,
        use_supabase: bool = False,
        supabase_url: Optional[str] = None,
        supabase_key: Optional[str] = None
    ):
        self.train_id = train_id
        self.sentinel_id = sentinel_id
        self.backend_url = backend_url or os.getenv("BACKEND_URL", DEFAULT_BACKEND_URL)
        self.use_supabase = use_supabase
        self.supabase_url = supabase_url or os.getenv("SUPABASE_URL", DEFAULT_SUPABASE_URL)
        self.supabase_key = supabase_key or os.getenv("SUPABASE_KEY", DEFAULT_SUPABASE_KEY)
        
        # Try to import requests
        try:
            import requests
            self.requests = requests
        except ImportError:
            logger.error("requests library not installed. Run: pip install requests")
            sys.exit(1)
    
    def log_to_backend(self, gps_data: Dict[str, Any]) -> bool:
        """Send GPS data to backend API"""
        payload = {
            "train_id": self.train_id,
            "timestamp": datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ"),
            "lat": gps_data["lat"],
            "lon": gps_data["lon"],
            "altitude_m": gps_data.get("altitude_m"),
            "speed_kmh": gps_data.get("speed_kmh"),
            "heading": gps_data.get("heading"),
            "accuracy_m": gps_data.get("accuracy_m"),
        }
        
        if self.sentinel_id:
            payload["sentinel_id"] = self.sentinel_id
            
        try:
            url = f"{self.backend_url}/api/sensor/log"
            response = self.requests.post(url, json=payload, timeout=10)
            
            if response.status_code in (200, 201):
                result = response.json()
                logger.info(f"✓ Logged to backend: {result.get('id', 'ok')}")
                return True
            else:
                logger.warning(f"Backend error: {response.status_code} - {response.text}")
                return False
                
        except Exception as e:
            logger.error(f"Failed to log to backend: {e}")
            return False
    
    def log_to_supabase(self, gps_data: Dict[str, Any]) -> bool:
        """Send GPS data directly to Supabase"""
        payload = {
            "train_id": self.train_id,
            "sentinel_id": self.sentinel_id,
            "timestamp": datetime.utcnow().isoformat(),
            "lat": gps_data["lat"],
            "lon": gps_data["lon"],
            "altitude_m": gps_data.get("altitude_m"),
            "speed_kmh": gps_data.get("speed_kmh"),
            "heading": gps_data.get("heading"),
            "accuracy_m": gps_data.get("accuracy_m"),
            "processed": False
        }
        
        try:
            url = f"{self.supabase_url}/rest/v1/sensor_gps_logs"
            headers = {
                "apikey": self.supabase_key,
                "Authorization": f"Bearer {self.supabase_key}",
                "Content-Type": "application/json",
                "Prefer": "return=representation"
            }
            
            response = self.requests.post(url, json=payload, headers=headers, timeout=10)
            
            if response.status_code in (200, 201):
                result = response.json()
                log_id = result[0].get("id") if isinstance(result, list) else result.get("id")
                logger.info(f"✓ Logged to Supabase: {log_id}")
                return True
            else:
                logger.warning(f"Supabase error: {response.status_code} - {response.text}")
                return False
                
        except Exception as e:
            logger.error(f"Failed to log to Supabase: {e}")
            return False
    
    def log(self, gps_data: Dict[str, Any]) -> bool:
        """Log GPS data to configured destination"""
        if self.use_supabase:
            return self.log_to_supabase(gps_data)
        else:
            return self.log_to_backend(gps_data)


def main():
    parser = argparse.ArgumentParser(
        description="Africa Railways Sentinel GPS Sensor Logger",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Log GPS data every 30 seconds
  python sensor_gps_logger.py --train-id SGR001 --interval 30
  
  # Use Supabase directly
  python sensor_gps_logger.py --train-id TAZARA-001 --use-supabase
  
  # Simulate a specific route
  python sensor_gps_logger.py --train-id ZRL-EXPRESS --route ZRL
  
  # With sentinel ID for tracking
  python sensor_gps_logger.py --train-id SGR001 --sentinel-id sentinel-42
        """
    )
    
    parser.add_argument(
        "--train-id",
        required=True,
        help="Unique identifier for the train"
    )
    parser.add_argument(
        "--sentinel-id",
        help="Sentinel worker ID (optional)"
    )
    parser.add_argument(
        "--interval",
        type=int,
        default=30,
        help="Logging interval in seconds (default: 30)"
    )
    parser.add_argument(
        "--route",
        choices=["TAZARA", "ZRL", "SGR_KENYA"],
        default="TAZARA",
        help="Route to simulate (default: TAZARA)"
    )
    parser.add_argument(
        "--backend-url",
        help=f"Backend API URL (default: {DEFAULT_BACKEND_URL})"
    )
    parser.add_argument(
        "--use-supabase",
        action="store_true",
        help="Log directly to Supabase instead of backend API"
    )
    parser.add_argument(
        "--count",
        type=int,
        default=0,
        help="Number of logs to send (0 = infinite)"
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Print GPS data without sending"
    )
    
    args = parser.parse_args()
    
    # Initialize components
    simulator = GPSSimulator(args.route)
    logger_instance = SensorLogger(
        train_id=args.train_id,
        sentinel_id=args.sentinel_id,
        backend_url=args.backend_url,
        use_supabase=args.use_supabase
    )
    
    logger.info(f"🚂 Starting GPS logger for train: {args.train_id}")
    logger.info(f"📍 Route: {args.route}")
    logger.info(f"⏱️  Interval: {args.interval}s")
    if args.use_supabase:
        logger.info(f"💾 Logging to: Supabase")
    else:
        logger.info(f"💾 Logging to: {logger_instance.backend_url}")
    
    count = 0
    try:
        while True:
            # Get current GPS position
            gps_data = simulator.get_current_position()
            
            if args.dry_run:
                logger.info(f"[DRY RUN] GPS: lat={gps_data['lat']}, lon={gps_data['lon']}, speed={gps_data['speed_kmh']}km/h")
            else:
                # Log the data
                success = logger_instance.log(gps_data)
                if not success:
                    logger.warning("Failed to log GPS data, will retry next interval")
            
            # Advance simulation
            simulator.advance()
            
            count += 1
            if args.count > 0 and count >= args.count:
                logger.info(f"Completed {count} logs")
                break
            
            # Wait for next interval
            time.sleep(args.interval)
            
    except KeyboardInterrupt:
        logger.info("\n🛑 Stopping GPS logger")
        sys.exit(0)


if __name__ == "__main__":
    main()
