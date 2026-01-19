"""
Zambia Railways Limited (ZRL) Legacy Adapter

This adapter connects to ZRL's legacy SOAP-based booking and telemetry systems,
translating requests to/from the Africa Rails continental standard.

ZRL System Details:
- Booking System: SOAP/XML over HTTPS
- Telemetry: Proprietary binary protocol over TCP
- Authentication: API key + IP whitelist
"""

import logging
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any
from enum import Enum
import json

# In production, these would be actual SOAP/network libraries
# import zeep
# import socket

logger = logging.getLogger(__name__)


# ============================================================================
# Africa Rails Continental Standard Types
# ============================================================================

@dataclass
class TrainPosition:
    """Continental standard for train position data."""
    train_id: str
    operator_id: str
    gps_lat: float
    gps_lon: float
    speed_kmh: float
    heading_degrees: float
    altitude_m: Optional[float]
    timestamp: datetime
    route_id: str
    next_station_id: str
    eta_next_station: Optional[datetime]
    status: str  # "moving", "stopped", "delayed", "maintenance"
    delay_minutes: int = 0
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class Station:
    """Continental standard for station data."""
    station_id: str
    operator_id: str
    name: str
    code: str
    country: str
    gps_lat: float
    gps_lon: float
    timezone: str
    facilities: List[str] = field(default_factory=list)
    accessibility: bool = False


@dataclass
class Route:
    """Continental standard for route data."""
    route_id: str
    operator_id: str
    name: str
    origin_station_id: str
    destination_station_id: str
    station_ids: List[str]
    distance_km: float
    typical_duration_hours: float


@dataclass
class Schedule:
    """Continental standard for schedule data."""
    schedule_id: str
    route_id: str
    train_number: str
    train_name: str
    departure_time: datetime
    arrival_time: datetime
    status: str  # "scheduled", "delayed", "cancelled"
    delay_minutes: int = 0
    stops: List[Dict[str, Any]] = field(default_factory=list)


@dataclass
class Seat:
    """Continental standard for seat availability."""
    seat_class: str  # "first", "second", "third", "sleeper"
    available: int
    price: float
    currency: str


@dataclass
class BookingRequest:
    """Continental standard booking request."""
    route_id: str
    schedule_id: str
    passenger_name: str
    passenger_id: str
    passenger_phone: str
    seat_class: str
    seat_preference: Optional[str] = None
    payment_method: str = "mobile_money"
    payment_reference: Optional[str] = None


@dataclass
class Booking:
    """Continental standard booking confirmation."""
    booking_id: str
    operator_ref: str
    route_id: str
    schedule_id: str
    passenger_name: str
    seat_class: str
    seat_number: str
    coach: str
    price: float
    currency: str
    status: str  # "confirmed", "pending", "cancelled", "used"
    qr_code: Optional[str] = None
    nft_token_id: Optional[str] = None
    created_at: datetime = field(default_factory=datetime.utcnow)


class AlertSeverity(Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


@dataclass
class StandardAlert:
    """Continental standard alert/error format."""
    code: str
    severity: AlertSeverity
    message: str
    operator: str
    timestamp: datetime = field(default_factory=datetime.utcnow)
    details: Dict[str, Any] = field(default_factory=dict)


# ============================================================================
# ZRL Legacy System Types (Operator-Specific)
# ============================================================================

@dataclass
class ZRLTrainData:
    """Raw data format from ZRL legacy system."""
    engine_number: str
    loco_type: str
    latitude: float
    longitude: float
    speed: int  # ZRL uses integer km/h
    bearing: int  # ZRL uses integer degrees
    last_updated: str  # ZRL format: "YYYYMMDD HHMMSS"
    line_code: str
    next_stn: str
    status_code: int  # ZRL proprietary status codes
    fuel_level: int
    crew_id: str


@dataclass
class ZRLBookingResponse:
    """Raw booking response from ZRL system."""
    pnr: str  # ZRL's booking reference
    status: int  # 1=confirmed, 2=waitlist, 3=cancelled
    coach_no: str
    berth_no: str
    fare: int  # ZRL uses integer cents
    booking_date: str


# ============================================================================
# ZRL Adapter Implementation
# ============================================================================

class ZambiaRailwaysLegacyAdapter:
    """
    Adapter for Zambia Railways Limited legacy systems.
    
    Translates between ZRL's proprietary SOAP/binary protocols
    and the Africa Rails continental standard.
    """
    
    OPERATOR_ID = "ZRL"
    OPERATOR_NAME = "Zambia Railways Limited"
    COUNTRY = "Zambia"
    
    # ZRL status code mappings
    STATUS_CODES = {
        0: "stopped",
        1: "moving",
        2: "delayed",
        3: "maintenance",
        9: "unknown"
    }
    
    # ZRL line code to route ID mapping
    LINE_ROUTES = {
        "ML": "ZRL-MAIN",      # Main Line: Livingstone - Kitwe
        "CB": "ZRL-COPPERBELT", # Copperbelt Branch
        "KM": "ZRL-KAPIRI",     # Kapiri Mposhi connection to TAZARA
    }
    
    def __init__(self, wsdl_url: str, api_key: str, telemetry_host: str = None, telemetry_port: int = None):
        """
        Initialize ZRL adapter.
        
        Args:
            wsdl_url: URL to ZRL's SOAP WSDL
            api_key: Authentication key for ZRL API
            telemetry_host: Host for ZRL telemetry TCP connection
            telemetry_port: Port for ZRL telemetry TCP connection
        """
        self.wsdl_url = wsdl_url
        self.api_key = api_key
        self.telemetry_host = telemetry_host
        self.telemetry_port = telemetry_port
        
        # In production, initialize SOAP client
        # self.soap_client = zeep.Client(wsdl=wsdl_url)
        self.soap_client = None  # Mock for development
        
        # Cache for station data (rarely changes)
        self._stations_cache: Dict[str, Station] = {}
        self._routes_cache: Dict[str, Route] = {}
        self._cache_timestamp: Optional[datetime] = None
        
        # Initialize static data
        self._init_stations()
        self._init_routes()
        
        logger.info(f"ZRL Adapter initialized: {wsdl_url}")
    
    def _init_stations(self):
        """Initialize ZRL station data."""
        stations_data = [
            ("ZRL-LIV", "LIV", "Livingstone", -17.8419, 25.8544),
            ("ZRL-CHO", "CHO", "Choma", -16.8167, 26.9833),
            ("ZRL-KAL", "KAL", "Kalomo", -17.0333, 26.4833),
            ("ZRL-MAZ", "MAZ", "Mazabuka", -15.8500, 27.7500),
            ("ZRL-KAF", "KAF", "Kafue", -15.7667, 28.1833),
            ("ZRL-LUS", "LUS", "Lusaka", -15.4167, 28.2833),
            ("ZRL-KAB", "KAB", "Kabwe", -14.4500, 28.4500),
            ("ZRL-KPM", "KPM", "Kapiri Mposhi", -14.4500, 28.6667),
            ("ZRL-NDO", "NDO", "Ndola", -12.9667, 28.6333),
            ("ZRL-KIT", "KIT", "Kitwe", -12.8167, 28.2000),
            ("ZRL-CHI", "CHI", "Chingola", -12.5333, 27.8500),
        ]
        
        for sid, code, name, lat, lon in stations_data:
            self._stations_cache[sid] = Station(
                station_id=sid,
                operator_id=self.OPERATOR_ID,
                name=name,
                code=code,
                country=self.COUNTRY,
                gps_lat=lat,
                gps_lon=lon,
                timezone="Africa/Lusaka",
                facilities=["ticketing", "waiting_room"],
                accessibility=code in ["LUS", "KIT", "NDO"]  # Major stations
            )
    
    def _init_routes(self):
        """Initialize ZRL route data."""
        self._routes_cache["ZRL-MAIN"] = Route(
            route_id="ZRL-MAIN",
            operator_id=self.OPERATOR_ID,
            name="Zambia Railways Main Line",
            origin_station_id="ZRL-LIV",
            destination_station_id="ZRL-KIT",
            station_ids=["ZRL-LIV", "ZRL-CHO", "ZRL-KAL", "ZRL-MAZ", "ZRL-KAF", 
                        "ZRL-LUS", "ZRL-KAB", "ZRL-KPM", "ZRL-NDO", "ZRL-KIT"],
            distance_km=850,
            typical_duration_hours=18
        )
        
        self._routes_cache["ZRL-KAPIRI"] = Route(
            route_id="ZRL-KAPIRI",
            operator_id=self.OPERATOR_ID,
            name="Kapiri Mposhi Connection",
            origin_station_id="ZRL-LUS",
            destination_station_id="ZRL-KPM",
            station_ids=["ZRL-LUS", "ZRL-KAB", "ZRL-KPM"],
            distance_km=200,
            typical_duration_hours=4
        )
    
    # ========================================================================
    # Station & Route Methods
    # ========================================================================
    
    def get_stations(self) -> List[Station]:
        """Get all ZRL stations in continental standard format."""
        return list(self._stations_cache.values())
    
    def get_station(self, station_id: str) -> Optional[Station]:
        """Get a specific station."""
        return self._stations_cache.get(station_id)
    
    def get_routes(self) -> List[Route]:
        """Get all ZRL routes in continental standard format."""
        return list(self._routes_cache.values())
    
    def get_route(self, route_id: str) -> Optional[Route]:
        """Get a specific route."""
        return self._routes_cache.get(route_id)
    
    # ========================================================================
    # Real-Time Position Methods
    # ========================================================================
    
    def get_live_positions(self) -> List[TrainPosition]:
        """
        Fetch live train positions from ZRL system and convert to continental standard.
        
        In production, this calls ZRL's SOAP API:
            raw_data = self.soap_client.service.getTrainLocations(authKey=self.api_key)
        """
        try:
            # MOCK: In production, call ZRL SOAP service
            # raw_data = self.soap_client.service.getTrainLocations(authKey=self.api_key)
            raw_data = self._mock_zrl_positions()
            
            standard_positions = []
            for train in raw_data:
                std_position = self._convert_zrl_position(train)
                standard_positions.append(std_position)
            
            logger.info(f"Retrieved {len(standard_positions)} train positions from ZRL")
            return standard_positions
            
        except Exception as e:
            logger.error(f"ZRL adapter failed to get positions: {e}")
            raise StandardAlert(
                code="ADAPTER_FAILURE_ZRL_POS",
                severity=AlertSeverity.HIGH,
                message=f"Failed to retrieve train positions: {str(e)}",
                operator=self.OPERATOR_NAME,
                details={"error_type": type(e).__name__}
            )
    
    def _convert_zrl_position(self, zrl_data: ZRLTrainData) -> TrainPosition:
        """Convert ZRL proprietary format to continental standard."""
        
        # Parse ZRL timestamp format
        try:
            timestamp = datetime.strptime(zrl_data.last_updated, "%Y%m%d %H%M%S")
        except ValueError:
            timestamp = datetime.utcnow()
        
        # Map ZRL status code to standard status
        status = self.STATUS_CODES.get(zrl_data.status_code, "unknown")
        
        # Map ZRL line code to route ID
        route_id = self.LINE_ROUTES.get(zrl_data.line_code, f"ZRL-{zrl_data.line_code}")
        
        # Find next station from ZRL code
        next_station_id = f"ZRL-{zrl_data.next_stn}"
        
        # Calculate ETA based on speed and distance (simplified)
        eta = None
        if zrl_data.speed > 0 and next_station_id in self._stations_cache:
            next_station = self._stations_cache[next_station_id]
            distance = self._haversine_distance(
                zrl_data.latitude, zrl_data.longitude,
                next_station.gps_lat, next_station.gps_lon
            )
            hours_to_arrival = distance / zrl_data.speed
            eta = timestamp + timedelta(hours=hours_to_arrival)
        
        return TrainPosition(
            train_id=f"ZRL-{zrl_data.engine_number}",
            operator_id=self.OPERATOR_ID,
            gps_lat=zrl_data.latitude,
            gps_lon=zrl_data.longitude,
            speed_kmh=float(zrl_data.speed),
            heading_degrees=float(zrl_data.bearing),
            altitude_m=None,  # ZRL doesn't provide altitude
            timestamp=timestamp,
            route_id=route_id,
            next_station_id=next_station_id,
            eta_next_station=eta,
            status=status,
            delay_minutes=0,  # Would need schedule comparison
            metadata={
                "loco_type": zrl_data.loco_type,
                "fuel_level": zrl_data.fuel_level,
                "crew_id": zrl_data.crew_id,
                "raw_status_code": zrl_data.status_code
            }
        )
    
    def _mock_zrl_positions(self) -> List[ZRLTrainData]:
        """Mock ZRL data for development/testing."""
        return [
            ZRLTrainData(
                engine_number="DE10-042",
                loco_type="DE10",
                latitude=-15.4167,
                longitude=28.2833,
                speed=45,
                bearing=180,
                last_updated=datetime.utcnow().strftime("%Y%m%d %H%M%S"),
                line_code="ML",
                next_stn="KAB",
                status_code=1,
                fuel_level=75,
                crew_id="CREW-2024-001"
            ),
            ZRLTrainData(
                engine_number="DE10-038",
                loco_type="DE10",
                latitude=-12.9667,
                longitude=28.6333,
                speed=0,
                bearing=0,
                last_updated=datetime.utcnow().strftime("%Y%m%d %H%M%S"),
                line_code="ML",
                next_stn="KIT",
                status_code=0,
                fuel_level=90,
                crew_id="CREW-2024-002"
            ),
        ]
    
    # ========================================================================
    # Schedule Methods
    # ========================================================================
    
    def get_schedule(self, route_id: str, date: datetime) -> List[Schedule]:
        """Get schedules for a route on a given date."""
        try:
            # MOCK: In production, call ZRL SOAP service
            # raw_schedules = self.soap_client.service.getSchedules(
            #     authKey=self.api_key,
            #     lineCode=route_id.replace("ZRL-", ""),
            #     date=date.strftime("%Y%m%d")
            # )
            
            route = self._routes_cache.get(route_id)
            if not route:
                return []
            
            # Mock schedule data
            departure = datetime(date.year, date.month, date.day, 6, 0, 0)
            arrival = departure + timedelta(hours=route.typical_duration_hours)
            
            return [
                Schedule(
                    schedule_id=f"ZRL-SCH-{route_id}-{date.strftime('%Y%m%d')}-001",
                    route_id=route_id,
                    train_number="ZRL-001",
                    train_name=f"{route.name} Express",
                    departure_time=departure,
                    arrival_time=arrival,
                    status="scheduled",
                    delay_minutes=0
                )
            ]
            
        except Exception as e:
            logger.error(f"ZRL adapter failed to get schedule: {e}")
            raise StandardAlert(
                code="ADAPTER_FAILURE_ZRL_SCH",
                severity=AlertSeverity.MEDIUM,
                message=f"Failed to retrieve schedule: {str(e)}",
                operator=self.OPERATOR_NAME
            )
    
    # ========================================================================
    # Booking Methods
    # ========================================================================
    
    def check_availability(self, route_id: str, date: datetime) -> List[Seat]:
        """Check seat availability for a route on a given date."""
        try:
            # MOCK: In production, call ZRL SOAP service
            # raw_avail = self.soap_client.service.checkAvailability(
            #     authKey=self.api_key,
            #     lineCode=route_id.replace("ZRL-", ""),
            #     date=date.strftime("%Y%m%d")
            # )
            
            return [
                Seat(seat_class="first", available=12, price=85.00, currency="USD"),
                Seat(seat_class="second", available=48, price=45.00, currency="USD"),
                Seat(seat_class="third", available=120, price=20.00, currency="USD"),
                Seat(seat_class="sleeper", available=8, price=120.00, currency="USD"),
            ]
            
        except Exception as e:
            logger.error(f"ZRL adapter failed to check availability: {e}")
            raise StandardAlert(
                code="ADAPTER_FAILURE_ZRL_AVAIL",
                severity=AlertSeverity.MEDIUM,
                message=f"Failed to check availability: {str(e)}",
                operator=self.OPERATOR_NAME
            )
    
    def create_booking(self, request: BookingRequest) -> Booking:
        """Create a booking in ZRL system."""
        try:
            # MOCK: In production, call ZRL SOAP service
            # zrl_response = self.soap_client.service.createBooking(
            #     authKey=self.api_key,
            #     passengerName=request.passenger_name,
            #     passengerID=request.passenger_id,
            #     routeCode=request.route_id.replace("ZRL-", ""),
            #     scheduleID=request.schedule_id,
            #     classCode=self._map_class_to_zrl(request.seat_class),
            #     paymentRef=request.payment_reference
            # )
            
            # Mock response
            zrl_response = ZRLBookingResponse(
                pnr=f"ZRL{datetime.utcnow().strftime('%Y%m%d%H%M%S')}",
                status=1,
                coach_no="A",
                berth_no="12",
                fare=4500,  # cents
                booking_date=datetime.utcnow().strftime("%Y%m%d")
            )
            
            return self._convert_zrl_booking(request, zrl_response)
            
        except Exception as e:
            logger.error(f"ZRL adapter failed to create booking: {e}")
            raise StandardAlert(
                code="ADAPTER_FAILURE_ZRL_BOOK",
                severity=AlertSeverity.HIGH,
                message=f"Failed to create booking: {str(e)}",
                operator=self.OPERATOR_NAME
            )
    
    def _convert_zrl_booking(self, request: BookingRequest, zrl_response: ZRLBookingResponse) -> Booking:
        """Convert ZRL booking response to continental standard."""
        status_map = {1: "confirmed", 2: "pending", 3: "cancelled"}
        
        return Booking(
            booking_id=f"AFR-ZRL-{zrl_response.pnr}",
            operator_ref=zrl_response.pnr,
            route_id=request.route_id,
            schedule_id=request.schedule_id,
            passenger_name=request.passenger_name,
            seat_class=request.seat_class,
            seat_number=zrl_response.berth_no,
            coach=zrl_response.coach_no,
            price=zrl_response.fare / 100,  # Convert cents to dollars
            currency="USD",
            status=status_map.get(zrl_response.status, "unknown"),
            created_at=datetime.utcnow()
        )
    
    def cancel_booking(self, booking_id: str) -> bool:
        """Cancel a booking in ZRL system."""
        try:
            # Extract ZRL PNR from booking ID
            pnr = booking_id.replace("AFR-ZRL-", "")
            
            # MOCK: In production, call ZRL SOAP service
            # result = self.soap_client.service.cancelBooking(
            #     authKey=self.api_key,
            #     pnr=pnr
            # )
            
            logger.info(f"Cancelled ZRL booking: {pnr}")
            return True
            
        except Exception as e:
            logger.error(f"ZRL adapter failed to cancel booking: {e}")
            raise StandardAlert(
                code="ADAPTER_FAILURE_ZRL_CANCEL",
                severity=AlertSeverity.MEDIUM,
                message=f"Failed to cancel booking: {str(e)}",
                operator=self.OPERATOR_NAME
            )
    
    # ========================================================================
    # Utility Methods
    # ========================================================================
    
    @staticmethod
    def _haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        """Calculate distance between two points in km."""
        import math
        R = 6371  # Earth's radius in km
        
        dlat = math.radians(lat2 - lat1)
        dlon = math.radians(lon2 - lon1)
        
        a = (math.sin(dlat/2)**2 + 
             math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * 
             math.sin(dlon/2)**2)
        
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
        return R * c
    
    def health_check(self) -> bool:
        """Check connectivity to ZRL systems."""
        try:
            # MOCK: In production, ping ZRL endpoint
            # self.soap_client.service.ping(authKey=self.api_key)
            return True
        except Exception as e:
            logger.error(f"ZRL health check failed: {e}")
            return False


# ============================================================================
# Example Usage
# ============================================================================

if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    
    # Initialize adapter
    adapter = ZambiaRailwaysLegacyAdapter(
        wsdl_url="https://api.zrl.co.zm/soap/v1?wsdl",
        api_key="demo-api-key"
    )
    
    # Get stations
    stations = adapter.get_stations()
    print(f"\nZRL Stations ({len(stations)}):")
    for s in stations[:3]:
        print(f"  - {s.name} ({s.code}): {s.gps_lat}, {s.gps_lon}")
    
    # Get live positions
    positions = adapter.get_live_positions()
    print(f"\nLive Train Positions ({len(positions)}):")
    for p in positions:
        print(f"  - {p.train_id}: {p.gps_lat}, {p.gps_lon} @ {p.speed_kmh} km/h")
    
    # Check availability
    from datetime import date
    availability = adapter.check_availability("ZRL-MAIN", datetime.now())
    print(f"\nSeat Availability:")
    for seat in availability:
        print(f"  - {seat.seat_class}: {seat.available} seats @ ${seat.price}")
    
    # Create booking
    booking_request = BookingRequest(
        route_id="ZRL-MAIN",
        schedule_id="ZRL-SCH-ZRL-MAIN-20260119-001",
        passenger_name="John Doe",
        passenger_id="NRC-123456",
        passenger_phone="+260966123456",
        seat_class="second",
        payment_method="mobile_money",
        payment_reference="MTN-TXN-12345"
    )
    
    booking = adapter.create_booking(booking_request)
    print(f"\nBooking Created:")
    print(f"  - ID: {booking.booking_id}")
    print(f"  - Seat: Coach {booking.coach}, Seat {booking.seat_number}")
    print(f"  - Price: ${booking.price} {booking.currency}")
    print(f"  - Status: {booking.status}")
