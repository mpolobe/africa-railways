# Stations API Documentation

REST API for accessing African railway station data.

## Base URL

```
/api/stations
```

## Endpoints

### Get All Station Data

```
GET /api/stations
```

Returns the complete hierarchical station dataset.

**Response:**
```json
{
  "countries": [...],
  "metadata": {
    "totalCountries": 31,
    "totalCities": 6240,
    "totalStations": 7258,
    "lastUpdated": "2026-01-12T20:59:00.000Z",
    "sources": ["Airtable", "OpenStreetMap", "Google Places"]
  }
}
```

---

### Get Metadata

```
GET /api/stations/metadata
```

Returns dataset statistics only.

**Response:**
```json
{
  "totalCountries": 31,
  "totalCities": 6240,
  "totalStations": 7258,
  "lastUpdated": "2026-01-12T20:59:00.000Z",
  "sources": ["Airtable", "OpenStreetMap", "Google Places"]
}
```

---

### List Countries

```
GET /api/stations/countries
```

Returns all countries with station counts.

**Response:**
```json
[
  {
    "id": "kenya",
    "name": "Kenya",
    "cityCount": 45,
    "stationCount": 156
  },
  ...
]
```

---

### List Cities in Country

```
GET /api/stations/cities?country={countryId}
```

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| country | string | Yes | Country ID or name |

**Example:**
```
GET /api/stations/cities?country=kenya
```

**Response:**
```json
{
  "country": "Kenya",
  "cities": [
    {
      "id": "kenya-nairobi",
      "name": "Nairobi",
      "stationCount": 20
    },
    ...
  ]
}
```

---

### List Stations

```
GET /api/stations/list?country={countryId}&city={cityId}
```

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| country | string | No | Filter by country ID or name |
| city | string | No | Filter by city ID or name |

**Example:**
```
GET /api/stations/list?country=kenya&city=nairobi
```

**Response:**
```json
{
  "count": 20,
  "stations": [
    {
      "id": "KE-NBI-001",
      "name": "Nairobi Terminus",
      "city": "Nairobi",
      "country": "Kenya",
      "type": "Terminal",
      "coordinates": {
        "lat": -1.2921,
        "lng": 36.8219
      }
    },
    ...
  ]
}
```

---

### Search Stations

```
GET /api/stations/search?q={query}&limit={limit}
```

Full-text search across station names, cities, and countries.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| q | string | Yes | Search query (min 2 characters) |
| limit | integer | No | Max results (default: 20, max: 100) |

**Example:**
```
GET /api/stations/search?q=nairobi&limit=10
```

**Response:**
```json
{
  "query": "nairobi",
  "count": 10,
  "results": [
    {
      "id": "KE-NBI-001",
      "name": "Nairobi Terminus",
      "city": "Nairobi",
      "country": "Kenya",
      "type": "Terminal",
      "coordinates": {
        "lat": -1.2921,
        "lng": 36.8219
      }
    },
    ...
  ]
}
```

---

### Get Station by ID

```
GET /api/stations/station?id={stationId}
```

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| id | string | Yes | Station ID |

**Example:**
```
GET /api/stations/station?id=KE-NBI-001
```

**Response:**
```json
{
  "id": "KE-NBI-001",
  "name": "Nairobi Terminus",
  "city": "Nairobi",
  "country": "Kenya",
  "type": "Terminal",
  "coordinates": {
    "lat": -1.2921,
    "lng": 36.8219
  }
}
```

**Error (404):**
```json
{
  "error": "Station not found"
}
```

---

### Find Nearby Stations

```
GET /api/stations/nearby?lat={lat}&lng={lng}&radius={radius}
```

Find stations within a radius of a location.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| lat | float | Yes | Latitude |
| lng | float | Yes | Longitude |
| radius | float | No | Radius in km (default: 50, max: 500) |

**Example:**
```
GET /api/stations/nearby?lat=-1.2921&lng=36.8219&radius=25
```

**Response:**
```json
{
  "lat": -1.2921,
  "lng": 36.8219,
  "radius": 25,
  "count": 15,
  "stations": [
    {
      "id": "KE-NBI-001",
      "name": "Nairobi Terminus",
      "city": "Nairobi",
      "country": "Kenya",
      "type": "Terminal",
      "coordinates": {
        "lat": -1.2921,
        "lng": 36.8219
      },
      "distance": 0.5
    },
    ...
  ]
}
```

Results are sorted by distance (nearest first), limited to 50 stations.

---

## Caching

Station data is cached in memory with a 5-minute TTL. The cache is automatically refreshed when:
- First request after server start
- Cache TTL expires

---

## Data Sources

| Source | Stations | Description |
|--------|----------|-------------|
| Airtable | 5,299 | Rail Asset Tracker database |
| OpenStreetMap | 1,625 | Overpass API railway nodes |
| Google Places | 334 | Places API train_station type |

**Total: 7,258 stations across 31 countries**

---

## Error Responses

| Status | Description |
|--------|-------------|
| 400 | Bad Request - Missing or invalid parameters |
| 404 | Not Found - Resource doesn't exist |
| 500 | Internal Server Error - Failed to load data |

**Error format:**
```json
{
  "error": "Error message"
}
```

---

## Usage Examples

### JavaScript (Frontend)

```javascript
// Search stations
const response = await fetch('/api/stations/search?q=cairo&limit=10');
const data = await response.json();
console.log(data.results);

// Get cities in Egypt
const cities = await fetch('/api/stations/cities?country=egypt');
const cityData = await cities.json();
console.log(cityData.cities);

// Find nearby stations
const nearby = await fetch('/api/stations/nearby?lat=30.0444&lng=31.2357&radius=20');
const nearbyData = await nearby.json();
console.log(nearbyData.stations);
```

### cURL

```bash
# Get metadata
curl http://localhost:8080/api/stations/metadata

# Search
curl "http://localhost:8080/api/stations/search?q=johannesburg&limit=5"

# List by country
curl "http://localhost:8080/api/stations/list?country=south-africa"
```
