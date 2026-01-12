# Operators API

API for accessing African railway operator data and generating API keys.

## Base URL

```
https://api.africarailways.com/api/operators
```

## Endpoints

### List All Operators

```
GET /api/operators
```

**Query Parameters:**
- `region` (optional): Filter by region (e.g., "East Africa")
- `country` (optional): Filter by country (e.g., "Kenya")

**Response:**
```json
{
  "metadata": {
    "totalOperators": 45,
    "lastUpdated": "2026-01-12T21:30:00.000Z",
    "regions": ["North Africa", "East Africa", "West Africa", "Central Africa", "Southern Africa (SADC)"]
  },
  "operators": [
    {
      "id": "enr",
      "name": "Egyptian National Railways",
      "shortName": "ENR",
      "country": "Egypt",
      "region": "North Africa",
      "type": "national",
      "services": ["passenger", "freight"],
      "website": "https://enr.gov.eg",
      "currency": "EGP",
      "trackGauge": "1435mm (Standard)",
      "networkLength": 5195,
      "established": 1854,
      "status": "active"
    }
  ]
}
```

### Get Operator by ID

```
GET /api/operators/operator?id={operatorId}
```

**Parameters:**
- `id`: Operator ID or short name (e.g., "enr" or "ENR")

### Search Operators

```
GET /api/operators/search?q={query}
```

**Parameters:**
- `q`: Search query (searches name, short name, and country)

### Get Regions

```
GET /api/operators/regions
```

Returns list of available regions.

### Get Countries

```
GET /api/operators/countries
```

Returns countries with operator counts.

### Get Metadata

```
GET /api/operators/metadata
```

Returns dataset metadata.

## API Key Management

### Generate API Key

```
POST /api/operators/apikey/generate
```

**Request Body:**
```json
{
  "operatorId": "trc",
  "name": "John Doe",
  "email": "john@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "apiKey": "afr_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6",
  "operator": "Tanzania Railways Corporation",
  "message": "Store this key securely. It will not be shown again."
}
```

### Validate API Key

```
GET /api/operators/apikey/validate
```

**Headers:**
```
X-API-Key: afr_your_api_key_here
```

**Response:**
```json
{
  "valid": true,
  "operatorId": "trc",
  "name": "John Doe",
  "requestCount": 42
}
```

## Authentication

Include your API key in requests:

```bash
curl -H "X-API-Key: afr_your_key" https://api.africarailways.com/api/operators
```

## Available Operators

| Region | Count | Examples |
|--------|-------|----------|
| North Africa | 6 | ENR (Egypt), ONCF (Morocco), SNTF (Algeria) |
| East Africa | 9 | KRC, SGR Kenya, TRC, TAZARA, ERC |
| West Africa | 11 | NRC (Nigeria), GRC (Ghana), Sitarail |
| Central Africa | 5 | SNCC (DRC), Camrail, SETRAG |
| Southern Africa | 14 | Transnet, PRASA, Gautrain, ZRL |

## Rate Limits

- 1000 requests per hour per API key
- 100 requests per minute burst limit

## Error Codes

| Code | Description |
|------|-------------|
| 400 | Bad request - missing parameters |
| 401 | Unauthorized - invalid API key |
| 404 | Operator not found |
| 429 | Rate limit exceeded |
| 500 | Server error |
