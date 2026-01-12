# Airtable Stations Table Schema

This document provides the recommended schema for a proper Stations table in Airtable to support the cascading dropdown feature (Country → City → Station).

## Current State

The existing `Rail_Stations` table has:
- 5,299 stations
- All marked as "Africa Region" (no specific country)
- No city field
- Has lat/long coordinates

## Recommended Schema Update

### Option A: Update Existing Rail_Stations Table

Add these fields to your existing `Rail_Stations` table:

| Field Name | Field Type | Description |
|------------|------------|-------------|
| `City` | Single line text | City where station is located |
| `Country_Proper` | Single select | Actual country name |
| `Station_Type` | Single select | Terminal, Station, Junction, Depot, Freight |
| `Facilities` | Multiple select | Parking, WiFi, Restaurant, ATM, etc. |
| `Platform_Count` | Number | Number of platforms |
| `Is_Major_Hub` | Checkbox | Major interchange station |

**Country Options for Single Select:**
```
Algeria, Angola, Botswana, Cameroon, DR Congo, Egypt, Ethiopia, Ghana, 
Ivory Coast, Kenya, Libya, Mali, Morocco, Mozambique, Namibia, Nigeria, 
Senegal, South Africa, Sudan, Tanzania, Tunisia, Uganda, Zambia, Zimbabwe
```

**Station Type Options:**
```
Terminal, Station, Junction, Depot, Freight, Stop, Halt
```

### Option B: Create New Stations Table (Recommended)

Create a new `Stations` table with this schema:

| Field Name | Field Type | Options/Formula | Required |
|------------|------------|-----------------|----------|
| `Station_ID` | Autonumber | Prefix: STN- | Auto |
| `Name` | Single line text | - | Yes |
| `Country` | Single select | See list below | Yes |
| `City` | Single line text | - | Yes |
| `Type` | Single select | Terminal, Station, Junction, Depot, Freight, Stop | Yes |
| `Status` | Single select | Active, Inactive, Under Construction, Closed | Yes |
| `Latitude` | Number (decimal) | Precision: 6 | No |
| `Longitude` | Number (decimal) | Precision: 6 | No |
| `Corridor` | Single line text | Rail line/corridor name | No |
| `Facilities` | Multiple select | See list below | No |
| `Platform_Count` | Number | Integer | No |
| `Is_Major_Hub` | Checkbox | - | No |
| `Address` | Long text | Full address | No |
| `Operating_Hours` | Single line text | e.g., "06:00-22:00" | No |
| `Contact_Phone` | Phone number | - | No |
| `Photo` | Attachment | Station photo | No |
| `Rail_Line` | Link to another record | Link to Rail_Lines table | No |
| `Connected_Stations` | Link to another record | Self-link for connections | No |
| `Last_Updated` | Last modified time | - | Auto |

**Country Options (54 African Nations):**
```
Algeria, Angola, Benin, Botswana, Burkina Faso, Burundi, Cameroon, 
Cape Verde, Central African Republic, Chad, Comoros, DR Congo, 
Republic of Congo, Djibouti, Egypt, Equatorial Guinea, Eritrea, 
Eswatini, Ethiopia, Gabon, Gambia, Ghana, Guinea, Guinea-Bissau, 
Ivory Coast, Kenya, Lesotho, Liberia, Libya, Madagascar, Malawi, 
Mali, Mauritania, Mauritius, Morocco, Mozambique, Namibia, Niger, 
Nigeria, Rwanda, São Tomé and Príncipe, Senegal, Seychelles, 
Sierra Leone, Somalia, South Africa, South Sudan, Sudan, Tanzania, 
Togo, Tunisia, Uganda, Zambia, Zimbabwe
```

**Facilities Options:**
```
Parking, WiFi, Restaurant, Café, ATM, Ticket Office, Waiting Room,
Restrooms, Luggage Storage, Wheelchair Access, Information Desk,
Currency Exchange, Hotel Nearby, Bus Connection, Taxi Stand
```

## Data Migration Script

To populate Country and City from coordinates, run:

```bash
cd scripts/data-integration
node sync-stations.js
```

This uses reverse geocoding approximation based on lat/long coordinates.

## API Integration

Once the table is properly structured, the sync script will:

1. Fetch all stations from Airtable
2. Organize by Country → City → Station
3. Generate `data/stations.json` for the booking form
4. Support 5000+ stations with cascading dropdowns

## Sync Command

```bash
# From project root
npm run airtable:sync:stations

# Or directly
cd scripts/data-integration
node sync-stations.js
```

## Booking Form Integration

The `book-tickets.html` page uses cascading dropdowns:

1. **Select Country** - Shows all countries with stations
2. **Select City** - Shows cities in selected country
3. **Select Station** - Shows stations in selected city

This prevents a single dropdown with 5000+ options.

## Recommended Workflow

1. **Update Airtable Schema** - Add Country and City fields
2. **Bulk Update Data** - Use Airtable's bulk edit or import
3. **Run Sync** - `node sync-stations.js`
4. **Verify** - Check `data/stations.json` output
5. **Test** - Visit `/book-tickets.html` and test dropdowns

## Sample Data Format

```json
{
  "countries": [
    {
      "id": "kenya",
      "name": "Kenya",
      "cities": [
        {
          "id": "kenya-nairobi",
          "name": "Nairobi",
          "stations": [
            {
              "id": "KE-NBI-001",
              "name": "Nairobi Terminus",
              "type": "Terminal",
              "coordinates": { "lat": -1.2921, "lng": 36.8219 }
            }
          ]
        }
      ]
    }
  ],
  "metadata": {
    "totalCountries": 24,
    "totalCities": 4810,
    "totalStations": 5299,
    "lastUpdated": "2026-01-12T19:15:00.000Z"
  }
}
```
