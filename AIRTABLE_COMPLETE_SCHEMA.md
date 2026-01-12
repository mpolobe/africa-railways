# Complete Airtable Base Structure - Africa Railways

## Overview

Airtable serves as the **Operational Control Plane** for Africa Railways, organized into 3 core strategic bases that enable AI-powered insights and automation.

---

## Base 1: Infrastructure & Assets

**Purpose:** Track physical railway infrastructure, rolling stock, and maintenance

### Table 1: Rail Lines

| Field Name | Type | Description | Example |
|------------|------|-------------|---------|
| Line ID | Single Line Text | Unique identifier | TAZARA-001 |
| Name | Single Line Text | Line name | Dar es Salaam - Kapiri Mposhi |
| Origin Station | Link to Stations | Starting station | Dar es Salaam Central |
| Destination Station | Link to Stations | Ending station | Kapiri Mposhi |
| Distance (km) | Number | Total line distance | 1,860 |
| Gauge | Single Select | Track gauge | Standard (1,435mm) |
| Status | Single Select | Operational status | Operational/Maintenance/Closed |
| Countries | Multiple Select | Countries served | Tanzania, Zambia |
| Capacity (trains/day) | Number | Maximum daily capacity | 12 |
| Current Utilization (%) | Percent | Current capacity usage | 65% |
| Last Inspection | Date | Last safety inspection | 2026-01-10 |
| Next Inspection | Date | Scheduled inspection | 2026-04-10 |
| Electrified | Checkbox | Electric power available | ☑ |
| Max Speed (km/h) | Number | Maximum allowed speed | 90 |
| Condition Score | Rating | 1-5 condition rating | ⭐⭐⭐⭐ |
| Notes | Long Text | Additional information | - |

**AI Use Cases:**
- Forecast capacity constraints based on utilization trends
- Predict maintenance needs based on inspection history
- Optimize train scheduling across multiple lines

---

### Table 2: Stations

| Field Name | Type | Description | Example |
|------------|------|-------------|---------|
| Station ID | Single Line Text | Unique identifier | STN-DAR-001 |
| Name | Single Line Text | Station name | Dar es Salaam Central |
| City | Single Line Text | City location | Dar es Salaam |
| Country | Single Select | Country | Tanzania |
| Coordinates | Single Line Text | GPS coordinates | -6.8160, 39.2803 |
| Type | Single Select | Station type | Terminus/Junction/Stop |
| Facilities | Multiple Select | Available facilities | Lounge, Parking, Restaurant, WiFi, ATM |
| Platform Count | Number | Number of platforms | 6 |
| Daily Capacity | Number | Passengers per day | 5,000 |
| Staff Count | Number | Number of staff | 45 |
| Status | Single Select | Operational status | Active/Maintenance/Closed |
| Connected Lines | Link to Rail Lines | Lines serving station | TAZARA-001, TAZARA-002 |
| Last Upgrade | Date | Last infrastructure upgrade | 2025-06-15 |
| Accessibility | Checkbox | Wheelchair accessible | ☑ |
| Parking Spaces | Number | Available parking | 200 |
| Security Level | Single Select | Security rating | High/Medium/Low |
| Operating Hours | Single Line Text | Daily operating hours | 05:00 - 23:00 |
| Contact Phone | Phone | Station contact | +255-22-xxx-xxxx |
| Manager | Single Line Text | Station manager name | John Mwamba |

**AI Use Cases:**
- Identify stations needing capacity expansion
- Optimize staff allocation based on passenger flow
- Recommend facility upgrades based on usage patterns

---

### Table 3: Trains / Wagons

| Field Name | Type | Description | Example |
|------------|------|-------------|---------|
| Train ID | Single Line Text | Unique identifier | TRN-001 |
| Type | Single Select | Train type | Passenger/Freight/Mixed |
| Model | Single Line Text | Train model | Bombardier Electrostar |
| Manufacturer | Single Line Text | Manufacturer name | Bombardier |
| Year | Number | Year of manufacture | 2018 |
| Capacity (passengers) | Number | Passenger capacity | 400 |
| Capacity (tons) | Number | Freight capacity | 0 |
| Current Status | Single Select | Operational status | In Service/Maintenance/Retired |
| Current Location | Link to Stations | Current station | Dar es Salaam Central |
| Assigned Line | Link to Rail Lines | Primary operating line | TAZARA-001 |
| Last Maintenance | Date | Last maintenance date | 2026-01-05 |
| Next Maintenance | Date | Scheduled maintenance | 2026-04-05 |
| Maintenance Hours | Number | Total maintenance hours | 240 |
| Distance Traveled (km) | Number | Total kilometers | 125,000 |
| Fuel Type | Single Select | Power source | Diesel/Electric/Hybrid |
| Condition Score | Rating | 1-5 condition rating | ⭐⭐⭐⭐ |
| Class Configuration | Single Line Text | Seat configuration | Economy: 300, Business: 80, First: 20 |
| WiFi Enabled | Checkbox | WiFi available | ☑ |
| GPS Tracker ID | Single Line Text | GPS device ID | GPS-TRN-001 |
| Insurance Expiry | Date | Insurance expiration | 2026-12-31 |
| Purchase Cost (USD) | Currency | Original purchase cost | $2,500,000 |
| Current Value (USD) | Currency | Current market value | $1,800,000 |

**AI Use Cases:**
- Predict maintenance needs based on distance and usage
- Optimize train allocation to routes
- Detect anomalies in fuel consumption or performance

---

### Table 4: Maintenance Logs

| Field Name | Type | Description | Example |
|------------|------|-------------|---------|
| Log ID | Auto Number | Unique log identifier | 1234 |
| Asset Type | Single Select | Type of asset | Train/Station/Track/Signal |
| Asset | Link to Trains/Stations | Related asset | TRN-001 |
| Date | Date | Maintenance date | 2026-01-05 |
| Type | Single Select | Maintenance type | Routine/Emergency/Preventive/Upgrade |
| AI Classification | Single Line Text | AI-generated category | Preventive |
| Description | Long Text | Maintenance details | Replaced brake pads, inspected wheels |
| Technician | Single Line Text | Technician name | Peter Kamau |
| Cost (USD) | Currency | Maintenance cost | $1,500 |
| Downtime (hours) | Number | Asset downtime | 8 |
| Parts Replaced | Multiple Select | Parts replaced | Brake Pads, Filters, Bearings |
| Status | Single Select | Completion status | Scheduled/In Progress/Completed |
| Priority | Single Select | Urgency level | Low/Medium/High/Critical |
| Photos | Attachments | Maintenance photos | [images] |
| AI Summary | Long Text | AI-generated summary | Routine brake maintenance completed |
| Processed At | Date/Time | AI processing timestamp | 2026-01-05 14:30 |
| Next Action | Single Line Text | Follow-up required | Inspect in 3 months |

**AI Use Cases:**
- Auto-classify maintenance types
- Predict future maintenance needs
- Identify patterns in recurring issues

---

### Table 5: Capacity Allocations

| Field Name | Type | Description | Example |
|------------|------|-------------|---------|
| Allocation ID | Auto Number | Unique identifier | 5678 |
| Line | Link to Rail Lines | Rail line | TAZARA-001 |
| Date | Date | Allocation date | 2026-01-12 |
| Train | Link to Trains | Assigned train | TRN-001 |
| Departure Time | Date/Time | Scheduled departure | 2026-01-12 08:00 |
| Arrival Time | Date/Time | Scheduled arrival | 2026-01-12 20:00 |
| Capacity Used (%) | Percent | Capacity utilization | 78% |
| Passenger Count | Number | Actual passengers | 312 |
| Freight (tons) | Number | Freight weight | 0 |
| Revenue (USD) | Currency | Trip revenue | $15,600 |
| Status | Single Select | Trip status | Scheduled/Active/Completed/Cancelled |
| Delay (minutes) | Number | Delay duration | 15 |
| Delay Reason | Single Line Text | Reason for delay | Track maintenance |
| Fuel Consumed (L) | Number | Fuel consumption | 450 |
| Distance (km) | Number | Trip distance | 1,860 |
| Revenue per km | Formula | Revenue efficiency | $8.39 |

**AI Use Cases:**
- Optimize capacity allocation across routes
- Predict demand patterns
- Identify underutilized routes

---

## Base 2: Passengers / Users

**Purpose:** "M-Pesa × Rail" layer - User management, wallets, and engagement

### Table 1: Users

| Field Name | Type | Description | Example |
|------------|------|-------------|---------|
| User ID | Single Line Text | Unique identifier | USR-001234 |
| Full Name | Single Line Text | User's full name | Jane Mwangi |
| Phone Number | Phone | Primary contact | +254-712-345-678 |
| Email | Email | Email address | jane@example.com |
| Country | Single Select | Country of residence | Kenya |
| City | Single Line Text | City | Nairobi |
| Date of Birth | Date | Birth date | 1990-05-15 |
| Gender | Single Select | Gender | Male/Female/Other |
| Registration Date | Date/Time | Account creation | 2025-12-01 10:30 |
| Registration Method | Single Select | How they signed up | USSD/Web/Mobile App/Agent |
| User Type | Single Select | User category | Commuter/Tourist/Business/Freight |
| Preferred Language | Single Select | Language preference | English/Swahili/French |
| KYC Status | Link to KYC Status | Verification status | Verified |
| Wallet | Link to Wallets | User's wallet | WLT-001234 |
| Total Trips | Number | Lifetime trips | 45 |
| Total Spent (USD) | Currency | Lifetime spending | $2,250 |
| Last Trip Date | Date | Most recent trip | 2026-01-10 |
| Loyalty Tier | Single Select | Loyalty level | Bronze/Silver/Gold/Platinum |
| AFRC Balance | Number | Loyalty rewards | 125 |
| Referral Code | Single Line Text | User's referral code | JANE2026 |
| Referred By | Link to Users | Who referred them | USR-000987 |
| Status | Single Select | Account status | Active/Suspended/Closed |
| Fraud Flags | Number | Fraud indicators | 0 |
| Notes | Long Text | Admin notes | - |

**AI Use Cases:**
- Segment users (urban vs rural, commuter vs long-haul)
- Detect fraud or abnormal usage patterns
- Personalize pricing and routing recommendations
- Predict churn and retention strategies

---

### Table 2: KYC Status

| Field Name | Type | Description | Example |
|------------|------|-------------|---------|
| KYC ID | Auto Number | Unique identifier | 1234 |
| User | Link to Users | Related user | USR-001234 |
| Status | Single Select | Verification status | Pending/Verified/Rejected/Expired |
| Level | Single Select | KYC level | Basic/Enhanced/Full |
| ID Type | Single Select | Document type | National ID/Passport/Driver's License |
| ID Number | Single Line Text | Document number | 12345678 |
| ID Expiry | Date | Document expiration | 2030-05-15 |
| ID Photo | Attachments | Document image | [image] |
| Selfie Photo | Attachments | User selfie | [image] |
| Address Proof | Attachments | Proof of address | [image] |
| Submitted Date | Date/Time | Submission timestamp | 2025-12-01 11:00 |
| Verified Date | Date/Time | Verification timestamp | 2025-12-01 14:30 |
| Verified By | Single Line Text | Verifier name | Admin User |
| Rejection Reason | Long Text | Why rejected | - |
| Risk Score | Number | Fraud risk score (0-100) | 15 |
| Next Review Date | Date | Re-verification date | 2027-12-01 |

**AI Use Cases:**
- Auto-verify documents using OCR
- Detect fraudulent documents
- Risk scoring for transactions

---

### Table 3: Wallets

| Field Name | Type | Description | Example |
|------------|------|-------------|---------|
| Wallet ID | Single Line Text | Unique identifier | WLT-001234 |
| User | Link to Users | Wallet owner | USR-001234 |
| Blockchain Address | Single Line Text | Sui wallet address | 0x1234...abcd |
| AFC Balance | Number | Africoin balance | 150.50 |
| AFRC Balance | Number | Loyalty rewards | 125 |
| Fiat Balance (USD) | Currency | USD balance | $50.00 |
| Local Currency | Single Select | Preferred currency | KES/TZS/ZMW/USD |
| Local Balance | Currency | Local currency balance | KES 5,000 |
| Status | Single Select | Wallet status | Active/Frozen/Closed |
| Created Date | Date/Time | Wallet creation | 2025-12-01 10:30 |
| Last Transaction | Date/Time | Most recent activity | 2026-01-10 15:45 |
| Total Deposits (USD) | Currency | Lifetime deposits | $2,500 |
| Total Withdrawals (USD) | Currency | Lifetime withdrawals | $250 |
| Total Spent (USD) | Currency | Lifetime spending | $2,250 |
| Transaction Count | Number | Total transactions | 67 |
| Daily Limit (USD) | Currency | Daily spending limit | $500 |
| Monthly Limit (USD) | Currency | Monthly spending limit | $5,000 |
| Verification Level | Single Select | Wallet tier | Basic/Verified/Premium |
| Linked Bank Account | Single Line Text | Bank account number | 1234567890 |
| Linked Mobile Money | Phone | M-Pesa/Airtel Money | +254-712-345-678 |

**AI Use Cases:**
- Detect unusual spending patterns
- Predict liquidity needs
- Optimize currency conversion rates
- Flag potential fraud

---

### Table 4: Ticket History

| Field Name | Type | Description | Example |
|------------|------|-------------|---------|
| Ticket ID | Single Line Text | Unique identifier | TKT-2026-001234 |
| User | Link to Users | Ticket owner | USR-001234 |
| Booking Date | Date/Time | When booked | 2026-01-10 14:30 |
| Travel Date | Date | Travel date | 2026-01-15 |
| Route | Link to Rail Lines | Travel route | TAZARA-001 |
| Origin | Link to Stations | Departure station | Dar es Salaam Central |
| Destination | Link to Stations | Arrival station | Kapiri Mposhi |
| Train | Link to Trains | Assigned train | TRN-001 |
| Class | Single Select | Ticket class | Economy/Business/First |
| Seat Number | Single Line Text | Assigned seat | A-12 |
| Passengers | Number | Number of passengers | 1 |
| Price (USD) | Currency | Ticket price | $50 |
| Payment Method | Single Select | How paid | AFC/USD/Local/Mobile Money |
| Payment Status | Single Select | Payment status | Paid/Pending/Refunded |
| Booking Source | Single Select | Where booked | Web/Mobile/USSD/Agent |
| Status | Single Select | Ticket status | Confirmed/Cancelled/Used/Expired |
| QR Code | Single Line Text | Ticket QR code | QR-TKT-001234 |
| NFT Token ID | Single Line Text | Blockchain token | NFT-001234 |
| Check-in Time | Date/Time | When checked in | 2026-01-15 07:45 |
| AFRC Earned | Number | Loyalty rewards earned | 5 |
| Refund Amount | Currency | Refund if cancelled | $0 |
| Refund Date | Date/Time | When refunded | - |
| Agent Commission | Currency | Agent earnings | $2.50 |

**AI Use Cases:**
- Predict booking patterns
- Optimize pricing strategies
- Identify popular routes and times
- Detect ticket fraud or reselling

---

### Table 5: USSD Sessions

| Field Name | Type | Description | Example |
|------------|------|-------------|---------|
| Session ID | Single Line Text | Unique identifier | USSD-2026-001234 |
| User | Link to Users | Session user | USR-001234 |
| Phone Number | Phone | User phone | +254-712-345-678 |
| Start Time | Date/Time | Session start | 2026-01-10 14:30:00 |
| End Time | Date/Time | Session end | 2026-01-10 14:32:15 |
| Duration (seconds) | Number | Session duration | 135 |
| Menu Path | Long Text | Navigation path | Main > Book Ticket > Select Route > Payment |
| Action Completed | Single Select | Final action | Booking/Balance/Info/None |
| Booking | Link to Ticket History | Related booking | TKT-2026-001234 |
| Provider | Single Select | SMS provider | Africa's Talking/Twilio |
| Cost (USD) | Currency | SMS cost | $0.05 |
| Status | Single Select | Session status | Completed/Abandoned/Error |
| Error Message | Long Text | Error details | - |
| Language | Single Select | Session language | English/Swahili |
| Device Type | Single Line Text | Phone model | Nokia 105 |
| Network | Single Select | Mobile network | Safaricom/Vodacom/Airtel |
| Location | Single Line Text | Approximate location | Nairobi, Kenya |

**AI Use Cases:**
- Analyze user behavior and drop-off points
- Optimize USSD menu structure
- Predict completion rates
- Identify UX improvements

---

## Base 3: Transactions & Payments

**Purpose:** Mission-critical financial tracking and reconciliation

### Table 1: Tickets

| Field Name | Type | Description | Example |
|------------|------|-------------|---------|
| Ticket ID | Single Line Text | Unique identifier | TKT-2026-001234 |
| User | Link to Users | Ticket owner | USR-001234 |
| Booking Date | Date/Time | When booked | 2026-01-10 14:30 |
| Travel Date | Date | Travel date | 2026-01-15 |
| Route | Link to Rail Lines | Travel route | TAZARA-001 |
| Origin | Link to Stations | Departure | Dar es Salaam Central |
| Destination | Link to Stations | Arrival | Kapiri Mposhi |
| Train | Link to Trains | Assigned train | TRN-001 |
| Class | Single Select | Ticket class | Economy/Business/First |
| Seat Number | Single Line Text | Seat assignment | A-12 |
| Base Price (USD) | Currency | Base ticket price | $45 |
| Taxes (USD) | Currency | Taxes and fees | $5 |
| Total Price (USD) | Currency | Total amount | $50 |
| Discount (USD) | Currency | Discount applied | $0 |
| Payment | Link to Payments | Payment record | PAY-001234 |
| Status | Single Select | Ticket status | Confirmed/Cancelled/Used/Expired |
| Cancellation Date | Date/Time | When cancelled | - |
| Cancellation Reason | Long Text | Why cancelled | - |
| Refund | Link to Refunds | Refund record | - |
| QR Code | Single Line Text | Ticket QR | QR-TKT-001234 |
| NFT Token ID | Single Line Text | Blockchain token | NFT-001234 |
| Blockchain TX | Single Line Text | Transaction hash | 0xabcd...1234 |
| Check-in Status | Single Select | Check-in status | Not Checked In/Checked In/Boarded |
| Check-in Time | Date/Time | Check-in timestamp | 2026-01-15 07:45 |
| Agent | Link to Users | Booking agent | USR-000987 |
| Agent Commission | Link to Agent Commissions | Commission record | COM-001234 |

**AI Use Cases:**
- Predict no-shows and optimize overbooking
- Detect fraudulent bookings
- Optimize pricing based on demand
- Identify revenue leakage

---

### Table 2: Payments

| Field Name | Type | Description | Example |
|------------|------|-------------|---------|
| Payment ID | Single Line Text | Unique identifier | PAY-001234 |
| User | Link to Users | Payer | USR-001234 |
| Ticket | Link to Tickets | Related ticket | TKT-2026-001234 |
| Amount (USD) | Currency | Payment amount | $50 |
| Currency | Single Select | Payment currency | USD/AFC/KES/TZS/ZMW |
| Amount (Local) | Currency | Local currency amount | KES 6,500 |
| Exchange Rate | Number | Conversion rate | 130 |
| Payment Method | Single Select | Method used | AFC/Mobile Money/Card/Cash/Bank Transfer |
| Payment Provider | Single Select | Provider | M-Pesa/Airtel Money/Vodacom/Stripe |
| Provider Transaction ID | Single Line Text | Provider reference | MPESA-ABC123 |
| Blockchain TX | Single Line Text | Blockchain hash | 0xabcd...1234 |
| Status | Single Select | Payment status | Pending/Completed/Failed/Refunded |
| Timestamp | Date/Time | Payment time | 2026-01-10 14:32 |
| Confirmation Code | Single Line Text | Confirmation number | CONF-001234 |
| Fees (USD) | Currency | Transaction fees | $0.50 |
| Net Amount (USD) | Currency | Amount after fees | $49.50 |
| Settlement Batch | Link to Settlement Batches | Batch number | BATCH-2026-01-10 |
| Settled | Checkbox | Settlement complete | ☑ |
| Settlement Date | Date | When settled | 2026-01-11 |
| Reconciled | Checkbox | Reconciliation complete | ☑ |
| Reconciliation Date | Date | When reconciled | 2026-01-12 |
| Fraud Score | Number | Fraud risk (0-100) | 5 |
| IP Address | Single Line Text | Payment IP | 197.156.x.x |
| Device ID | Single Line Text | Device identifier | DEV-001234 |

**AI Use Cases:**
- Detect payment fraud in real-time
- Predict payment failures
- Optimize settlement timing
- Reconcile transactions automatically

---

### Table 3: Refunds

| Field Name | Type | Description | Example |
|------------|------|-------------|---------|
| Refund ID | Single Line Text | Unique identifier | REF-001234 |
| User | Link to Users | Refund recipient | USR-001234 |
| Ticket | Link to Tickets | Original ticket | TKT-2026-001234 |
| Payment | Link to Payments | Original payment | PAY-001234 |
| Refund Amount (USD) | Currency | Refund amount | $45 |
| Refund Fee (USD) | Currency | Processing fee | $5 |
| Net Refund (USD) | Currency | Amount refunded | $40 |
| Reason | Single Select | Refund reason | Cancellation/Delay/Service Issue/Other |
| Reason Details | Long Text | Detailed explanation | Train cancelled due to maintenance |
| Request Date | Date/Time | When requested | 2026-01-12 10:00 |
| Approved Date | Date/Time | When approved | 2026-01-12 11:30 |
| Processed Date | Date/Time | When processed | 2026-01-12 14:00 |
| Status | Single Select | Refund status | Pending/Approved/Rejected/Processed |
| Approved By | Single Line Text | Approver name | Admin User |
| Rejection Reason | Long Text | Why rejected | - |
| Refund Method | Single Select | How refunded | Original Method/Wallet/Bank Transfer |
| Provider Transaction ID | Single Line Text | Provider reference | MPESA-REF-123 |
| Settlement Batch | Link to Settlement Batches | Batch number | BATCH-2026-01-12 |

**AI Use Cases:**
- Detect refund fraud patterns
- Predict refund rates by route/time
- Optimize refund policies
- Flag unusual refund requests

---

### Table 4: Agent Commissions

| Field Name | Type | Description | Example |
|------------|------|-------------|---------|
| Commission ID | Single Line Text | Unique identifier | COM-001234 |
| Agent | Link to Users | Agent user | USR-000987 |
| Ticket | Link to Tickets | Related ticket | TKT-2026-001234 |
| Payment | Link to Payments | Related payment | PAY-001234 |
| Ticket Amount (USD) | Currency | Ticket price | $50 |
| Commission Rate (%) | Percent | Commission percentage | 5% |
| Commission Amount (USD) | Currency | Commission earned | $2.50 |
| Date Earned | Date/Time | When earned | 2026-01-10 14:32 |
| Status | Single Select | Commission status | Pending/Approved/Paid |
| Settlement Batch | Link to Settlement Batches | Batch number | BATCH-2026-01-15 |
| Paid Date | Date | When paid | 2026-01-15 |
| Payment Method | Single Select | How paid | Mobile Money/Bank Transfer/Wallet |
| Payment Reference | Single Line Text | Payment proof | MPESA-PAY-456 |
| Agent Location | Single Line Text | Agent location | Nairobi, Kenya |
| Agent Type | Single Select | Agent category | Individual/Shop/Kiosk/Corporate |

**AI Use Cases:**
- Detect commission fraud
- Optimize commission structures
- Predict agent performance
- Identify top-performing agents

---

### Table 5: Settlement Batches

| Field Name | Type | Description | Example |
|------------|------|-------------|---------|
| Batch ID | Single Line Text | Unique identifier | BATCH-2026-01-10 |
| Date | Date | Settlement date | 2026-01-10 |
| Type | Single Select | Batch type | Daily/Weekly/Monthly |
| Total Payments (USD) | Currency | Total payments | $125,000 |
| Total Refunds (USD) | Currency | Total refunds | $2,500 |
| Total Commissions (USD) | Currency | Total commissions | $6,250 |
| Net Amount (USD) | Currency | Net settlement | $116,250 |
| Payment Count | Number | Number of payments | 2,500 |
| Refund Count | Number | Number of refunds | 50 |
| Commission Count | Number | Number of commissions | 2,500 |
| Status | Single Select | Batch status | Pending/Processing/Completed/Failed |
| Started At | Date/Time | Processing start | 2026-01-11 00:00 |
| Completed At | Date/Time | Processing complete | 2026-01-11 02:30 |
| Reconciled | Checkbox | Reconciliation complete | ☑ |
| Reconciliation Date | Date | When reconciled | 2026-01-12 |
| Discrepancies | Number | Number of issues | 0 |
| Discrepancy Amount (USD) | Currency | Total discrepancies | $0 |
| Bank Reference | Single Line Text | Bank confirmation | BANK-REF-123 |
| Notes | Long Text | Settlement notes | - |
| AI Summary | Long Text | AI-generated summary | All transactions reconciled successfully |

**AI Use Cases:**
- Auto-reconcile transactions
- Flag settlement anomalies
- Predict settlement timing
- Generate regulator-ready summaries

---

## Base 4: Operations & Incidents

**Purpose:** Railway "black box" - Track all operational issues and incidents

### Table 1: Delays

| Field Name | Type | Description | Example |
|------------|------|-------------|---------|
| Delay ID | Auto Number | Unique identifier | 1234 |
| Train | Link to Trains | Affected train | TRN-001 |
| Route | Link to Rail Lines | Affected route | TAZARA-001 |
| Scheduled Departure | Date/Time | Original departure | 2026-01-12 08:00 |
| Actual Departure | Date/Time | Actual departure | 2026-01-12 08:45 |
| Delay Duration (min) | Number | Delay in minutes | 45 |
| Delay Category | Single Select | Primary cause | Infrastructure/Weather/Mechanical/Operational/External |
| Delay Reason | Single Line Text | Specific reason | Track maintenance overrun |
| Affected Passengers | Number | Number of passengers | 312 |
| Compensation Issued | Currency | Total compensation | $1,560 |
| Status | Single Select | Resolution status | Active/Resolved/Escalated |
| Reported By | Single Line Text | Reporter name | Station Master |
| Reported At | Date/Time | Report timestamp | 2026-01-12 08:15 |
| Resolved At | Date/Time | Resolution timestamp | 2026-01-12 09:00 |
| Root Cause | Long Text | Detailed analysis | Scheduled maintenance took longer than expected |
| Preventive Actions | Long Text | Future prevention | Improve maintenance scheduling |
| AI Classification | Single Line Text | AI-generated category | Infrastructure - Maintenance |
| AI Severity Score | Number | AI risk score (0-100) | 35 |
| Related Incidents | Link to Incidents | Related records | INC-001234 |

**AI Use Cases:**
- Auto-classify delay causes
- Predict systemic delay patterns
- Recommend preventive actions
- Generate delay reports

---

### Table 2: Incidents

| Field Name | Type | Description | Example |
|------------|------|-------------|---------|
| Incident ID | Single Line Text | Unique identifier | INC-001234 |
| Type | Single Select | Incident type | Safety/Security/Technical/Service/Environmental |
| Severity | Single Select | Severity level | Low/Medium/High/Critical |
| Status | Single Select | Current status | Reported/Investigating/Resolved/Closed |
| Title | Single Line Text | Brief description | Signal failure at Junction 5 |
| Description | Long Text | Detailed description | Signal system failed causing train to stop |
| Location | Link to Stations | Incident location | Dar es Salaam Central |
| Train | Link to Trains | Affected train | TRN-001 |
| Route | Link to Rail Lines | Affected route | TAZARA-001 |
| Date/Time | Date/Time | Incident timestamp | 2026-01-12 08:30 |
| Reported By | Single Line Text | Reporter name | Train Driver |
| Reporter Contact | Phone | Reporter phone | +255-xxx-xxx-xxx |
| Affected Passengers | Number | Number affected | 312 |
| Injuries | Number | Number of injuries | 0 |
| Fatalities | Number | Number of fatalities | 0 |
| Property Damage (USD) | Currency | Estimated damage | $5,000 |
| Response Time (min) | Number | Time to respond | 15 |
| Resolution Time (min) | Number | Time to resolve | 120 |
| Root Cause | Long Text | Root cause analysis | Aging signal equipment |
| Corrective Actions | Long Text | Actions taken | Replaced signal controller |
| Preventive Actions | Long Text | Future prevention | Schedule signal system upgrade |
| Photos | Attachments | Incident photos | [images] |
| AI Summary | Long Text | AI-generated summary | Signal failure caused 2-hour delay |
| AI Classification | Single Line Text | AI category | Technical - Signal System |
| AI Severity Score | Number | AI risk score (0-100) | 65 |
| Related Delays | Link to Delays | Related delays | DEL-1234 |
| Related Reports | Link to Staff Reports | Staff reports | RPT-001234 |
| Processed At | Date/Time | AI processing time | 2026-01-12 09:00 |

**AI Use Cases:**
- Auto-classify incidents by type and severity
- Generate post-mortem reports
- Predict systemic failures
- Identify recurring issues

---

### Table 3: Service Disruptions

| Field Name | Type | Description | Example |
|------------|------|-------------|---------|
| Disruption ID | Auto Number | Unique identifier | 5678 |
| Type | Single Select | Disruption type | Planned/Unplanned |
| Category | Single Select | Category | Maintenance/Weather/Strike/Emergency/Other |
| Title | Single Line Text | Brief description | Track maintenance - Section A |
| Description | Long Text | Detailed description | Scheduled track replacement |
| Affected Routes | Link to Rail Lines | Affected routes | TAZARA-001 |
| Affected Stations | Link to Stations | Affected stations | Dar es Salaam, Morogoro |
| Start Date/Time | Date/Time | Disruption start | 2026-01-15 00:00 |
| End Date/Time | Date/Time | Disruption end | 2026-01-15 18:00 |
| Duration (hours) | Number | Total duration | 18 |
| Status | Single Select | Current status | Scheduled/Active/Completed/Cancelled |
| Affected Trains | Number | Number of trains | 6 |
| Affected Passengers | Number | Estimated passengers | 1,800 |
| Alternative Arrangements | Long Text | Alternatives provided | Bus service provided |
| Communication Sent | Checkbox | Notification sent | ☑ |
| Communication Date | Date/Time | When notified | 2026-01-10 10:00 |
| Communication Channels | Multiple Select | Channels used | SMS, Email, Website, Social Media |
| Compensation Required | Checkbox | Compensation needed | ☐ |
| Compensation Amount (USD) | Currency | Total compensation | $0 |
| Responsible Party | Single Line Text | Who is responsible | Maintenance Team |
| Cost (USD) | Currency | Disruption cost | $25,000 |
| AI Impact Score | Number | AI impact score (0-100) | 45 |
| AI Recommendations | Long Text | AI suggestions | Schedule during off-peak hours |

**AI Use Cases:**
- Predict impact of planned disruptions
- Optimize disruption scheduling
- Generate passenger communications
- Analyze disruption patterns

---

### Table 4: Staff Reports

| Field Name | Type | Description | Example |
|------------|------|-------------|---------|
| Report ID | Single Line Text | Unique identifier | RPT-001234 |
| Reporter | Link to Users | Staff member | USR-000987 |
| Reporter Role | Single Select | Staff role | Driver/Conductor/Station Master/Maintenance/Security |
| Report Type | Single Select | Report category | Safety/Maintenance/Service/Security/Other |
| Priority | Single Select | Urgency level | Low/Medium/High/Critical |
| Title | Single Line Text | Brief description | Brake system warning light |
| Description | Long Text | Detailed report | Warning light activated during journey |
| Location | Link to Stations | Report location | Morogoro Station |
| Train | Link to Trains | Related train | TRN-001 |
| Route | Link to Rail Lines | Related route | TAZARA-001 |
| Date/Time | Date/Time | Report timestamp | 2026-01-12 10:30 |
| Photos | Attachments | Evidence photos | [images] |
| Status | Single Select | Report status | Submitted/Under Review/Resolved/Closed |
| Reviewed By | Single Line Text | Reviewer name | Maintenance Manager |
| Reviewed At | Date/Time | Review timestamp | 2026-01-12 11:00 |
| Action Taken | Long Text | Actions performed | Brake system inspected and cleared |
| Follow-up Required | Checkbox | Needs follow-up | ☐ |
| Follow-up Date | Date | Scheduled follow-up | - |
| Related Incident | Link to Incidents | Related incident | INC-001234 |
| Related Maintenance | Link to Maintenance Logs | Related maintenance | LOG-5678 |
| AI Classification | Single Line Text | AI category | Maintenance - Brake System |
| AI Priority Score | Number | AI priority (0-100) | 55 |
| AI Summary | Long Text | AI-generated summary | Routine brake warning, resolved |
| Processed At | Date/Time | AI processing time | 2026-01-12 11:30 |

**AI Use Cases:**
- Auto-classify staff reports
- Prioritize reports by urgency
- Generate maintenance tickets
- Identify training needs

---

## Base 5: Partners & Government

**Purpose:** Africa-specific compliance and partnership management

### Table 1: Ministries

| Field Name | Type | Description | Example |
|------------|------|-------------|---------|
| Ministry ID | Single Line Text | Unique identifier | MIN-TZ-001 |
| Country | Single Select | Country | Tanzania |
| Ministry Name | Single Line Text | Official name | Ministry of Transport |
| Department | Single Line Text | Specific department | Railway Division |
| Contact Person | Single Line Text | Primary contact | Dr. John Mwamba |
| Title | Single Line Text | Contact title | Director of Railways |
| Email | Email | Contact email | director@transport.go.tz |
| Phone | Phone | Contact phone | +255-22-xxx-xxxx |
| Address | Long Text | Physical address | Dar es Salaam, Tanzania |
| Relationship Type | Single Select | Relationship | Regulator/Partner/Stakeholder |
| Status | Single Select | Relationship status | Active/Inactive |
| Last Contact | Date | Last communication | 2026-01-10 |
| Next Meeting | Date | Scheduled meeting | 2026-02-15 |
| Key Responsibilities | Long Text | Their role | Railway regulation and oversight |
| Our Obligations | Long Text | Our commitments | Monthly reporting, safety compliance |
| Related Agreements | Link to Concession Agreements | Agreements | AGR-TZ-001 |
| Related SLAs | Link to SLAs | Service agreements | SLA-TZ-001 |
| Related Documents | Link to Compliance Documents | Documents | DOC-001, DOC-002 |
| Notes | Long Text | Additional notes | - |

**AI Use Cases:**
- Track communication history
- Remind of upcoming obligations
- Generate meeting summaries
- Prepare compliance reports

---

### Table 2: Railway Authorities

| Field Name | Type | Description | Example |
|------------|------|-------------|---------|
| Authority ID | Single Line Text | Unique identifier | AUTH-TAZARA-001 |
| Name | Single Line Text | Authority name | TAZARA Authority |
| Type | Single Select | Authority type | National/Regional/International |
| Countries | Multiple Select | Countries covered | Tanzania, Zambia |
| Jurisdiction | Long Text | Area of authority | TAZARA railway line operations |
| Contact Person | Single Line Text | Primary contact | Mr. Peter Kamau |
| Title | Single Line Text | Contact title | Chief Executive Officer |
| Email | Email | Contact email | ceo@tazara.org |
| Phone | Phone | Contact phone | +255-22-xxx-xxxx |
| Website | URL | Official website | https://tazara.org |
| Address | Long Text | Physical address | Dar es Salaam, Tanzania |
| Established Date | Date | When established | 1970-01-01 |
| Relationship Type | Single Select | Relationship | Operator/Regulator/Partner |
| Status | Single Select | Relationship status | Active/Inactive |
| Last Audit | Date | Last audit date | 2025-12-15 |
| Next Audit | Date | Scheduled audit | 2026-06-15 |
| Compliance Rating | Rating | 1-5 rating | ⭐⭐⭐⭐⭐ |
| Related Agreements | Link to Concession Agreements | Agreements | AGR-TAZARA-001 |
| Related SLAs | Link to SLAs | Service agreements | SLA-TAZARA-001 |
| Related Documents | Link to Compliance Documents | Documents | DOC-003, DOC-004 |
| Key Requirements | Long Text | Their requirements | Safety standards, reporting |
| Our Obligations | Long Text | Our commitments | Quarterly reports, inspections |
| Notes | Long Text | Additional notes | - |

**AI Use Cases:**
- Track compliance requirements
- Generate audit reports
- Monitor relationship health
- Prepare regulatory submissions

---

### Table 3: Concession Agreements

| Field Name | Type | Description | Example |
|------------|------|-------------|---------|
| Agreement ID | Single Line Text | Unique identifier | AGR-TZ-001 |
| Title | Single Line Text | Agreement name | TAZARA Operations Concession |
| Type | Single Select | Agreement type | Concession/Partnership/License/MOU |
| Parties | Multiple Select | Involved parties | Ministry, TAZARA, Africoin |
| Country | Single Select | Primary country | Tanzania |
| Start Date | Date | Agreement start | 2025-01-01 |
| End Date | Date | Agreement end | 2030-12-31 |
| Duration (years) | Number | Total duration | 6 |
| Renewal Option | Checkbox | Can be renewed | ☑ |
| Renewal Terms | Long Text | Renewal conditions | 2-year extension option |
| Status | Single Select | Current status | Active/Expired/Terminated/Under Review |
| Value (USD) | Currency | Agreement value | $50,000,000 |
| Payment Terms | Long Text | Payment schedule | Annual fee of $8.3M |
| Our Obligations | Long Text | Our commitments | Operate and maintain railway |
| Their Obligations | Long Text | Their commitments | Provide infrastructure access |
| Performance Metrics | Long Text | KPIs | 95% on-time performance |
| Penalties | Long Text | Penalty clauses | $10K per day for non-compliance |
| Termination Clauses | Long Text | Exit conditions | 6-month notice required |
| Related Ministry | Link to Ministries | Government entity | MIN-TZ-001 |
| Related Authority | Link to Railway Authorities | Railway authority | AUTH-TAZARA-001 |
| Related SLAs | Link to SLAs | Service agreements | SLA-TZ-001 |
| Related Documents | Link to Compliance Documents | Documents | DOC-005, DOC-006 |
| Document File | Attachments | Agreement PDF | [agreement.pdf] |
| Last Review | Date | Last review date | 2025-12-01 |
| Next Review | Date | Scheduled review | 2026-06-01 |
| AI Summary | Long Text | AI-generated summary | 6-year concession for TAZARA operations |
| Key Dates | Long Text | Important dates | Renewal: 2029-01-01 |
| Notes | Long Text | Additional notes | - |

**AI Use Cases:**
- Summarize contract terms
- Track obligations and deadlines
- Alert on upcoming renewals
- Generate compliance reports

---

### Table 4: SLAs (Service Level Agreements)

| Field Name | Type | Description | Example |
|------------|------|-------------|---------|
| SLA ID | Single Line Text | Unique identifier | SLA-TZ-001 |
| Title | Single Line Text | SLA name | TAZARA Service Standards |
| Type | Single Select | SLA type | Operational/Technical/Financial |
| Related Agreement | Link to Concession Agreements | Parent agreement | AGR-TZ-001 |
| Related Authority | Link to Railway Authorities | Authority | AUTH-TAZARA-001 |
| Start Date | Date | SLA start | 2025-01-01 |
| End Date | Date | SLA end | 2030-12-31 |
| Status | Single Select | Current status | Active/Expired/Under Review |
| On-Time Performance Target | Percent | OTP target | 95% |
| Current OTP | Percent | Current performance | 92% |
| Capacity Utilization Target | Percent | Capacity target | 80% |
| Current Capacity | Percent | Current utilization | 65% |
| Safety Incidents Target | Number | Max incidents/year | 5 |
| Current Incidents | Number | YTD incidents | 2 |
| Customer Satisfaction Target | Percent | Satisfaction target | 85% |
| Current Satisfaction | Percent | Current rating | 88% |
| Response Time Target (min) | Number | Max response time | 30 |
| Current Response Time (min) | Number | Average response | 25 |
| Penalties | Long Text | Penalty structure | $10K per percentage point below target |
| Bonuses | Long Text | Bonus structure | $5K per percentage point above target |
| Reporting Frequency | Single Select | Report schedule | Monthly/Quarterly/Annual |
| Last Report | Date | Last report date | 2025-12-31 |
| Next Report | Date | Next report due | 2026-01-31 |
| Compliance Status | Single Select | Current compliance | Compliant/At Risk/Non-Compliant |
| Related Documents | Link to Compliance Documents | Documents | DOC-007, DOC-008 |
| Document File | Attachments | SLA PDF | [sla.pdf] |
| AI Performance Summary | Long Text | AI-generated summary | Meeting 4 of 5 targets |
| AI Recommendations | Long Text | AI suggestions | Focus on OTP improvement |
| Notes | Long Text | Additional notes | - |

**AI Use Cases:**
- Monitor SLA compliance
- Predict performance trends
- Generate performance reports
- Recommend improvements

---

### Table 5: Compliance Documents

| Field Name | Type | Description | Example |
|------------|------|-------------|---------|
| Document ID | Single Line Text | Unique identifier | DOC-001234 |
| Title | Single Line Text | Document name | Q4 2025 Safety Report |
| Type | Single Select | Document type | Report/Certificate/License/Permit/Audit |
| Category | Single Select | Category | Safety/Financial/Operational/Legal |
| Related Ministry | Link to Ministries | Government entity | MIN-TZ-001 |
| Related Authority | Link to Railway Authorities | Authority | AUTH-TAZARA-001 |
| Related Agreement | Link to Concession Agreements | Agreement | AGR-TZ-001 |
| Related SLA | Link to SLAs | SLA | SLA-TZ-001 |
| Issue Date | Date | When issued | 2026-01-10 |
| Expiry Date | Date | When expires | 2026-12-31 |
| Status | Single Select | Document status | Valid/Expired/Pending/Rejected |
| Submitted By | Single Line Text | Submitter name | Compliance Officer |
| Submitted Date | Date/Time | Submission timestamp | 2026-01-10 14:00 |
| Approved By | Single Line Text | Approver name | Ministry Official |
| Approved Date | Date/Time | Approval timestamp | 2026-01-15 10:00 |
| Rejection Reason | Long Text | Why rejected | - |
| Document File | Attachments | Document PDF | [report.pdf] |
| File Size (MB) | Number | File size | 2.5 |
| Version | Single Line Text | Document version | v1.0 |
| Previous Version | Link to Compliance Documents | Previous doc | DOC-001233 |
| Next Review | Date | Scheduled review | 2026-04-10 |
| Compliance Status | Single Select | Compliance state | Compliant/At Risk/Non-Compliant |
| AI Summary | Long Text | AI-generated summary | Safety metrics within acceptable range |
| AI Extracted Data | Long Text | AI-extracted info | Key metrics and findings |
| Tags | Multiple Select | Document tags | Safety, Q4, 2025 |
| Notes | Long Text | Additional notes | - |

**AI Use Cases:**
- Auto-extract key information
- Summarize lengthy documents
- Track expiration dates
- Generate compliance reports

---

## Implementation Priority

### Phase 1: Foundation (Week 1)
1. ✅ Infrastructure & Assets Base
2. ✅ Basic sync scripts
3. ✅ AI Assistant integration

### Phase 2: User Layer (Week 2)
1. Passengers / Users Base
2. KYC and wallet sync
3. USSD session tracking

### Phase 3: Financial Layer (Week 3)
1. Transactions & Payments Base
2. Settlement automation
3. Fraud detection

### Phase 4: AI Enhancement (Week 4)
1. Advanced analytics
2. Predictive models
3. Automated reporting

---

## AI Capabilities by Base

### Infrastructure & Assets
- ✅ Capacity forecasting
- ✅ Maintenance prediction
- ✅ Route optimization
- ✅ Asset utilization analysis

### Passengers / Users
- ✅ User segmentation
- ✅ Fraud detection
- ✅ Personalized recommendations
- ✅ Churn prediction

### Transactions & Payments
- ✅ Transaction reconciliation
- ✅ Anomaly detection
- ✅ Revenue forecasting
- ✅ Regulatory reporting

---

## Next Steps

1. **Create Airtable Bases**
   - Follow table structures above
   - Set up relationships between tables
   - Configure views for different use cases

2. **Deploy Sync Scripts**
   - Use provided sync scripts
   - Schedule regular syncs
   - Monitor sync health

3. **Enable AI Features**
   - Configure OpenAI API
   - Set up Custom GPT
   - Test AI queries

4. **Monitor & Optimize**
   - Review AI insights
   - Adjust based on patterns
   - Expand use cases

---

**Last Updated:** 2026-01-12  
**Version:** 2.0.0  
**Status:** Production Ready
