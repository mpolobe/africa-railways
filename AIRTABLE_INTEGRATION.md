# Airtable Integration - Operational Control Plane

## Overview

Airtable serves as the **Operational Control Plane** for Africa Railways, providing structured data storage, analytics, and AI-powered insights through ChatGPT integration.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Backend Systems                           │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │ Ticketing│  │ Schedules│  │   USSD   │  │Blockchain│   │
│  │   API    │  │   API    │  │ Gateway  │  │  Events  │   │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘   │
└───────┼─────────────┼─────────────┼─────────────┼──────────┘
        │             │             │             │
        └─────────────┴─────────────┴─────────────┘
                      │
              ┌───────▼────────┐
              │  Sync Scripts  │
              │  (Node.js/Go)  │
              └───────┬────────┘
                      │
        ┌─────────────┴─────────────┐
        │                           │
┌───────▼────────┐         ┌────────▼────────┐
│   Airtable     │         │    ChatGPT      │
│  Operational   │◄────────┤   Analytics     │
│  Control Plane │         │   & Insights    │
└────────────────┘         └─────────────────┘
```

## 1. Core Strategic Bases

### A. Infrastructure & Assets Base

**Purpose**: Track physical railway infrastructure, rolling stock, and maintenance

**Tables**:

#### 1. Rail Lines
| Field | Type | Description |
|-------|------|-------------|
| Line ID | Single Line Text | Unique identifier (e.g., TAZARA-001) |
| Name | Single Line Text | Line name (e.g., Dar es Salaam - Kapiri Mposhi) |
| Origin Station | Link to Stations | Starting station |
| Destination Station | Link to Stations | Ending station |
| Distance (km) | Number | Total line distance |
| Gauge | Single Select | Track gauge (Standard/Narrow/Broad) |
| Status | Single Select | Operational/Under Maintenance/Closed |
| Countries | Multiple Select | Countries served |
| Capacity (trains/day) | Number | Maximum daily train capacity |
| Last Inspection | Date | Last safety inspection date |
| Next Inspection | Date | Scheduled inspection date |
| Notes | Long Text | Additional information |

#### 2. Stations
| Field | Type | Description |
|-------|------|-------------|
| Station ID | Single Line Text | Unique identifier |
| Name | Single Line Text | Station name |
| City | Single Line Text | City location |
| Country | Single Select | Country |
| Coordinates | Single Line Text | GPS coordinates (lat,lng) |
| Type | Single Select | Terminus/Junction/Stop |
| Facilities | Multiple Select | Lounge/Parking/Restaurant/WiFi |
| Platform Count | Number | Number of platforms |
| Daily Capacity | Number | Passengers per day |
| Staff Count | Number | Number of staff |
| Status | Single Select | Active/Maintenance/Closed |
| Connected Lines | Link to Rail Lines | Lines serving this station |
| Last Upgrade | Date | Last infrastructure upgrade |

#### 3. Trains / Rolling Stock
| Field | Type | Description |
|-------|------|-------------|
| Train ID | Single Line Text | Unique identifier |
| Type | Single Select | Passenger/Freight/Mixed |
| Model | Single Line Text | Train model/manufacturer |
| Year | Number | Year of manufacture |
| Capacity (passengers) | Number | Passenger capacity |
| Capacity (tons) | Number | Freight capacity |
| Current Status | Single Select | In Service/Maintenance/Retired |
| Current Location | Link to Stations | Current station |
| Assigned Line | Link to Rail Lines | Primary operating line |
| Last Maintenance | Date | Last maintenance date |
| Next Maintenance | Date | Scheduled maintenance |
| Maintenance Hours | Number | Total maintenance hours |
| Distance Traveled (km) | Number | Total kilometers traveled |
| Fuel Type | Single Select | Diesel/Electric/Hybrid |
| Condition Score | Rating | 1-5 condition rating |

#### 4. Maintenance Logs
| Field | Type | Description |
|-------|------|-------------|
| Log ID | Auto Number | Unique log identifier |
| Asset Type | Single Select | Train/Station/Track |
| Asset | Link to Trains/Stations | Related asset |
| Date | Date | Maintenance date |
| Type | Single Select | Routine/Emergency/Upgrade |
| Description | Long Text | Maintenance details |
| Technician | Single Line Text | Technician name |
| Cost (USD) | Currency | Maintenance cost |
| Downtime (hours) | Number | Asset downtime |
| Parts Replaced | Multiple Select | Parts replaced |
| Status | Single Select | Scheduled/In Progress/Completed |
| Priority | Single Select | Low/Medium/High/Critical |
| Photos | Attachments | Maintenance photos |

#### 5. Capacity Allocations
| Field | Type | Description |
|-------|------|-------------|
| Allocation ID | Auto Number | Unique identifier |
| Line | Link to Rail Lines | Rail line |
| Date | Date | Allocation date |
| Train | Link to Trains | Assigned train |
| Departure Time | Single Line Text | Scheduled departure |
| Arrival Time | Single Line Text | Scheduled arrival |
| Capacity Used (%) | Percent | Capacity utilization |
| Passenger Count | Number | Actual passengers |
| Freight (tons) | Number | Freight weight |
| Revenue (USD) | Currency | Trip revenue |
| Status | Single Select | Scheduled/Active/Completed/Cancelled |

### B. Operations & Ticketing Base

**Purpose**: Track real-time operations, bookings, and passenger data

**Tables**:

#### 1. Schedules
| Field | Type | Description |
|-------|------|-------------|
| Schedule ID | Auto Number | Unique identifier |
| Train | Link to Trains | Train assignment |
| Route | Link to Rail Lines | Operating route |
| Departure Station | Link to Stations | Origin |
| Arrival Station | Link to Stations | Destination |
| Departure Time | Date/Time | Scheduled departure |
| Arrival Time | Date/Time | Scheduled arrival |
| Days of Operation | Multiple Select | Mon/Tue/Wed/Thu/Fri/Sat/Sun |
| Status | Single Select | Active/Suspended/Cancelled |
| Ticket Price (Economy) | Currency | Economy class price |
| Ticket Price (Business) | Currency | Business class price |
| Ticket Price (First) | Currency | First class price |

#### 2. Bookings
| Field | Type | Description |
|-------|------|-------------|
| Booking ID | Single Line Text | Unique booking reference |
| Schedule | Link to Schedules | Related schedule |
| Passenger Name | Single Line Text | Passenger name |
| Passenger Phone | Phone | Contact number |
| Passenger Email | Email | Email address |
| Wallet Address | Single Line Text | Blockchain wallet |
| Class | Single Select | Economy/Business/First |
| Seat Number | Single Line Text | Assigned seat |
| Booking Date | Date/Time | When booked |
| Travel Date | Date | Travel date |
| Payment Method | Single Select | AFC/USD/Local Currency |
| Amount Paid | Currency | Total amount |
| Status | Single Select | Confirmed/Pending/Cancelled/Completed |
| AFRC Rewards | Number | Loyalty rewards earned |
| Booking Source | Single Select | Web/Mobile/USSD/Agent |

#### 3. USSD Sessions
| Field | Type | Description |
|-------|------|-------------|
| Session ID | Single Line Text | Unique session ID |
| Phone Number | Phone | User phone number |
| Start Time | Date/Time | Session start |
| End Time | Date/Time | Session end |
| Duration (seconds) | Number | Session duration |
| Menu Path | Long Text | Navigation path |
| Action Completed | Single Select | Booking/Balance/Info/None |
| Booking | Link to Bookings | Related booking |
| Provider | Single Select | Africa's Talking/Twilio |
| Cost (USD) | Currency | SMS cost |
| Status | Single Select | Completed/Abandoned/Error |

#### 4. Transactions
| Field | Type | Description |
|-------|------|-------------|
| Transaction ID | Single Line Text | Blockchain transaction hash |
| Type | Single Select | Ticket Purchase/Top-up/Reward |
| Wallet Address | Single Line Text | User wallet |
| Amount (AFC) | Number | AFC amount |
| Amount (USD) | Currency | USD equivalent |
| Booking | Link to Bookings | Related booking |
| Timestamp | Date/Time | Transaction time |
| Blockchain | Single Select | Sui/Polygon |
| Status | Single Select | Pending/Confirmed/Failed |
| Gas Fee | Number | Transaction fee |

### C. Sentinel & Safety Base

**Purpose**: Track safety reports, incidents, and Sentinel network activity

**Tables**:

#### 1. Safety Reports
| Field | Type | Description |
|-------|------|-------------|
| Report ID | Auto Number | Unique identifier |
| Reporter | Single Line Text | Sentinel worker name |
| Reporter Wallet | Single Line Text | Wallet address |
| Location | Link to Stations | Report location |
| Report Type | Single Select | Track Damage/Signal Issue/Obstruction/Other |
| Severity | Single Select | Low/Medium/High/Critical |
| Description | Long Text | Incident details |
| Photos | Attachments | Evidence photos |
| Timestamp | Date/Time | Report time |
| Status | Single Select | Reported/Investigating/Resolved/Closed |
| AFRC Reward | Number | Reward amount |
| Response Time (hours) | Number | Time to resolution |
| Assigned To | Single Line Text | Maintenance team |

#### 2. Incidents
| Field | Type | Description |
|-------|------|-------------|
| Incident ID | Auto Number | Unique identifier |
| Type | Single Select | Delay/Accident/Breakdown/Security |
| Train | Link to Trains | Affected train |
| Location | Link to Stations | Incident location |
| Date/Time | Date/Time | Incident time |
| Description | Long Text | Incident details |
| Passengers Affected | Number | Number of passengers |
| Delay (minutes) | Number | Delay duration |
| Cost Impact (USD) | Currency | Financial impact |
| Root Cause | Long Text | Analysis |
| Status | Single Select | Active/Resolved/Under Investigation |
| Related Reports | Link to Safety Reports | Related safety reports |

### D. Financial & Analytics Base

**Purpose**: Track revenue, costs, and performance metrics

**Tables**:

#### 1. Revenue Tracking
| Field | Type | Description |
|-------|------|-------------|
| Date | Date | Revenue date |
| Line | Link to Rail Lines | Rail line |
| Ticket Revenue (USD) | Currency | Ticket sales |
| Freight Revenue (USD) | Currency | Freight income |
| Other Revenue (USD) | Currency | Other income |
| Total Revenue (USD) | Formula | Sum of all revenue |
| Bookings Count | Number | Number of bookings |
| Passengers | Number | Total passengers |
| Average Ticket Price | Formula | Revenue / Bookings |

#### 2. Operating Costs
| Field | Type | Description |
|-------|------|-------------|
| Date | Date | Cost date |
| Category | Single Select | Fuel/Maintenance/Staff/Infrastructure |
| Line | Link to Rail Lines | Related line |
| Amount (USD) | Currency | Cost amount |
| Description | Long Text | Cost details |
| Vendor | Single Line Text | Supplier name |

#### 3. Performance Metrics
| Field | Type | Description |
|-------|------|-------------|
| Date | Date | Metric date |
| Line | Link to Rail Lines | Rail line |
| On-Time Performance (%) | Percent | Punctuality rate |
| Capacity Utilization (%) | Percent | Seat utilization |
| Customer Satisfaction | Rating | 1-5 rating |
| Incidents Count | Number | Number of incidents |
| Maintenance Hours | Number | Total maintenance |
| Revenue per km | Formula | Revenue / Distance |

## 2. ChatGPT Integration Capabilities

With this Airtable structure, ChatGPT can:

### A. Predictive Analytics
- **Capacity Forecasting**: Predict peak travel times and capacity constraints
- **Maintenance Prediction**: Identify trains/tracks needing maintenance based on usage patterns
- **Revenue Forecasting**: Project revenue based on historical trends

### B. Operational Optimization
- **Route Optimization**: Suggest optimal train schedules and routes
- **Resource Allocation**: Recommend train assignments based on demand
- **Cost Reduction**: Identify cost-saving opportunities

### C. Safety & Risk Management
- **Risk Detection**: Flag high-risk areas based on safety reports
- **Incident Pattern Analysis**: Identify recurring issues
- **Preventive Maintenance**: Recommend proactive maintenance schedules

### D. Customer Insights
- **Demand Analysis**: Understand booking patterns and preferences
- **Pricing Optimization**: Suggest dynamic pricing strategies
- **Service Improvements**: Identify areas for customer experience enhancement

## 3. Implementation Steps

### Step 1: Create Airtable Bases
1. Sign up for Airtable (Team plan recommended)
2. Create the four core bases listed above
3. Set up tables with the specified fields
4. Configure views for different use cases

### Step 2: Set Up API Access
1. Generate Airtable API key
2. Get Base IDs for each base
3. Store credentials in `.env` file

### Step 3: Deploy Sync Scripts
1. Install dependencies: `npm install airtable node-fetch`
2. Configure sync jobs (see `scripts/airtable-sync/`)
3. Set up cron jobs or scheduled tasks
4. Monitor sync logs

### Step 4: Connect ChatGPT
1. Use Airtable's API to query data
2. Feed data to ChatGPT for analysis
3. Implement insights back into operations

## 4. Security & Best Practices

### Data Security
- Use environment variables for API keys
- Implement rate limiting on sync jobs
- Enable Airtable's audit logs
- Restrict base access by role

### Performance
- Batch API requests (max 10 records per request)
- Implement exponential backoff for retries
- Cache frequently accessed data
- Use Airtable's webhook feature for real-time updates

### Data Quality
- Validate data before syncing
- Implement error handling and logging
- Set up data quality checks
- Regular data audits

## 5. Next Steps

1. **Phase 1**: Set up Infrastructure & Assets Base
2. **Phase 2**: Implement Operations & Ticketing sync
3. **Phase 3**: Deploy Sentinel & Safety tracking
4. **Phase 4**: Build Financial & Analytics dashboards
5. **Phase 5**: Integrate ChatGPT for AI-powered insights

## Support

For questions or issues:
- Review sync script documentation in `scripts/airtable-sync/README.md`
- Check Airtable API docs: https://airtable.com/developers/web/api/introduction
- Contact the development team
