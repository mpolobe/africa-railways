#!/usr/bin/env python3
"""
Africa Railways - Community GTFS Contribution Client

Allows community members to submit GTFS data contributions:
- Stop location verification
- Arrival/departure time reports
- Route verification
- Service exception reports

Usage:
    python community_contribution.py report-arrival --stop-id LSK --time "14:30"
    python community_contribution.py verify-stop --stop-id DSM --lat -6.8235 --lon 39.2695
    python community_contribution.py report-exception --service-id tazara-tue --date 2026-02-01 --type removed
"""

import argparse
import json
import os
import sys
from datetime import datetime
from typing import Optional

# Configuration
DEFAULT_BACKEND_URL = "https://api.africarailways.com"
DEFAULT_SUPABASE_URL = "https://llvprbmrnjvamjzavmhg.supabase.co"
DEFAULT_SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxsdnByYm1ybmp2YW1qemF2bWhnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU3NDQ1NTIsImV4cCI6MjA4MTMyMDU1Mn0.YvLr0yIuPvaBIjZ0_RZ10H6FzJ6eFbbaPOH6lM0RNtY"


class CommunityContributor:
    """Client for submitting community GTFS contributions"""
    
    def __init__(
        self,
        user_id: Optional[str] = None,
        backend_url: Optional[str] = None,
        use_supabase: bool = False
    ):
        self.user_id = user_id or os.getenv("USER_ID", "anonymous")
        self.backend_url = backend_url or os.getenv("BACKEND_URL", DEFAULT_BACKEND_URL)
        self.supabase_url = os.getenv("SUPABASE_URL", DEFAULT_SUPABASE_URL)
        self.supabase_key = os.getenv("SUPABASE_KEY", DEFAULT_SUPABASE_KEY)
        self.use_supabase = use_supabase
        
        try:
            import requests
            self.requests = requests
        except ImportError:
            print("Error: requests library not installed. Run: pip install requests")
            sys.exit(1)
    
    def submit_contribution(
        self,
        contribution_type: str,
        entity_type: str,
        entity_id: str,
        data: dict,
        lat: Optional[float] = None,
        lon: Optional[float] = None
    ) -> dict:
        """Submit a contribution to the backend or Supabase"""
        
        payload = {
            "user_id": self.user_id,
            "contribution_type": contribution_type,
            "entity_type": entity_type,
            "entity_id": entity_id,
            "data": data,
            "lat": lat,
            "lon": lon,
            "status": "pending"
        }
        
        if self.use_supabase:
            return self._submit_to_supabase(payload)
        else:
            return self._submit_to_backend(payload)
    
    def _submit_to_backend(self, payload: dict) -> dict:
        """Submit to backend API"""
        try:
            url = f"{self.backend_url}/api/gtfs/contribution"
            response = self.requests.post(url, json=payload, timeout=10)
            
            if response.status_code in (200, 201):
                return response.json()
            else:
                return {"error": f"Backend error: {response.status_code}", "details": response.text}
                
        except Exception as e:
            return {"error": str(e)}
    
    def _submit_to_supabase(self, payload: dict) -> dict:
        """Submit directly to Supabase"""
        try:
            url = f"{self.supabase_url}/rest/v1/community_contributions"
            headers = {
                "apikey": self.supabase_key,
                "Authorization": f"Bearer {self.supabase_key}",
                "Content-Type": "application/json",
                "Prefer": "return=representation"
            }
            
            # Convert data dict to JSON string for JSONB column
            payload["data"] = json.dumps(payload["data"])
            
            response = self.requests.post(url, json=payload, headers=headers, timeout=10)
            
            if response.status_code in (200, 201):
                result = response.json()
                return {
                    "success": True,
                    "id": result[0].get("id") if isinstance(result, list) else result.get("id"),
                    "reward_afrc": 0.5
                }
            else:
                return {"error": f"Supabase error: {response.status_code}", "details": response.text}
                
        except Exception as e:
            return {"error": str(e)}
    
    def report_arrival(self, stop_id: str, time: str, trip_id: Optional[str] = None) -> dict:
        """Report an arrival time at a stop"""
        return self.submit_contribution(
            contribution_type="arrival_time",
            entity_type="stop",
            entity_id=stop_id,
            data={
                "arrival_time": time,
                "trip_id": trip_id,
                "reported_at": datetime.utcnow().isoformat()
            }
        )
    
    def report_departure(self, stop_id: str, time: str, trip_id: Optional[str] = None) -> dict:
        """Report a departure time from a stop"""
        return self.submit_contribution(
            contribution_type="departure_time",
            entity_type="stop",
            entity_id=stop_id,
            data={
                "departure_time": time,
                "trip_id": trip_id,
                "reported_at": datetime.utcnow().isoformat()
            }
        )
    
    def verify_stop_location(self, stop_id: str, lat: float, lon: float, accuracy_m: Optional[float] = None) -> dict:
        """Verify or update a stop's GPS location"""
        return self.submit_contribution(
            contribution_type="stop_location",
            entity_type="stop",
            entity_id=stop_id,
            data={
                "verified_lat": lat,
                "verified_lon": lon,
                "accuracy_m": accuracy_m,
                "verified_at": datetime.utcnow().isoformat()
            },
            lat=lat,
            lon=lon
        )
    
    def verify_route(self, route_id: str, confirmed: bool, notes: Optional[str] = None) -> dict:
        """Verify a route exists and is operational"""
        return self.submit_contribution(
            contribution_type="route_verification",
            entity_type="route",
            entity_id=route_id,
            data={
                "confirmed": confirmed,
                "notes": notes,
                "verified_at": datetime.utcnow().isoformat()
            }
        )
    
    def report_service_exception(
        self,
        service_id: str,
        date: str,
        exception_type: str,  # "added" or "removed"
        reason: Optional[str] = None
    ) -> dict:
        """Report a service exception (added or removed service on a date)"""
        return self.submit_contribution(
            contribution_type="service_exception",
            entity_type="calendar",
            entity_id=service_id,
            data={
                "date": date,
                "exception_type": 1 if exception_type == "added" else 2,
                "reason": reason,
                "reported_at": datetime.utcnow().isoformat()
            }
        )


def main():
    parser = argparse.ArgumentParser(
        description="Africa Railways Community GTFS Contribution Client",
        formatter_class=argparse.RawDescriptionHelpFormatter
    )
    
    parser.add_argument("--user-id", help="Your user ID")
    parser.add_argument("--use-supabase", action="store_true", help="Submit directly to Supabase")
    
    subparsers = parser.add_subparsers(dest="command", help="Contribution type")
    
    # Report arrival
    arrival_parser = subparsers.add_parser("report-arrival", help="Report train arrival time")
    arrival_parser.add_argument("--stop-id", required=True, help="Stop ID (e.g., LSK)")
    arrival_parser.add_argument("--time", required=True, help="Arrival time (HH:MM)")
    arrival_parser.add_argument("--trip-id", help="Trip ID if known")
    
    # Report departure
    departure_parser = subparsers.add_parser("report-departure", help="Report train departure time")
    departure_parser.add_argument("--stop-id", required=True, help="Stop ID")
    departure_parser.add_argument("--time", required=True, help="Departure time (HH:MM)")
    departure_parser.add_argument("--trip-id", help="Trip ID if known")
    
    # Verify stop location
    stop_parser = subparsers.add_parser("verify-stop", help="Verify stop GPS location")
    stop_parser.add_argument("--stop-id", required=True, help="Stop ID")
    stop_parser.add_argument("--lat", type=float, required=True, help="Latitude")
    stop_parser.add_argument("--lon", type=float, required=True, help="Longitude")
    stop_parser.add_argument("--accuracy", type=float, help="GPS accuracy in meters")
    
    # Verify route
    route_parser = subparsers.add_parser("verify-route", help="Verify route is operational")
    route_parser.add_argument("--route-id", required=True, help="Route ID")
    route_parser.add_argument("--confirmed", type=bool, default=True, help="Route confirmed operational")
    route_parser.add_argument("--notes", help="Additional notes")
    
    # Report service exception
    exception_parser = subparsers.add_parser("report-exception", help="Report service exception")
    exception_parser.add_argument("--service-id", required=True, help="Service ID")
    exception_parser.add_argument("--date", required=True, help="Date (YYYY-MM-DD)")
    exception_parser.add_argument("--type", choices=["added", "removed"], required=True, help="Exception type")
    exception_parser.add_argument("--reason", help="Reason for exception")
    
    args = parser.parse_args()
    
    if not args.command:
        parser.print_help()
        sys.exit(1)
    
    contributor = CommunityContributor(
        user_id=args.user_id,
        use_supabase=args.use_supabase
    )
    
    result = None
    
    if args.command == "report-arrival":
        result = contributor.report_arrival(args.stop_id, args.time, args.trip_id)
    elif args.command == "report-departure":
        result = contributor.report_departure(args.stop_id, args.time, args.trip_id)
    elif args.command == "verify-stop":
        result = contributor.verify_stop_location(args.stop_id, args.lat, args.lon, args.accuracy)
    elif args.command == "verify-route":
        result = contributor.verify_route(args.route_id, args.confirmed, args.notes)
    elif args.command == "report-exception":
        result = contributor.report_service_exception(args.service_id, args.date, args.type, args.reason)
    
    if result:
        print(json.dumps(result, indent=2))
        if result.get("success"):
            print(f"\n✅ Contribution submitted! Reward: {result.get('reward_afrc', 0)} AFRC")
        elif result.get("error"):
            print(f"\n❌ Error: {result.get('error')}")
            sys.exit(1)


if __name__ == "__main__":
    main()
