# African Railway Operators - API Integration Research

**Date:** January 2026  
**Purpose:** Identify railway operators with APIs for integration into Africa Railways central booking hub

---

## Executive Summary

Most African railway operators do not have public APIs. Integration will require:
1. **Direct partnerships** with operators for API access
2. **Web scraping** for operators with only HTML websites
3. **Manual data feeds** via email/FTP for legacy systems

---

## Operators by Region

### East Africa

#### TAZARA (Tanzania-Zambia Railway Authority)
- **Website:** https://www.tazarasite.com/
- **Countries:** Tanzania, Zambia
- **Route:** Dar es Salaam ↔ Kapiri Mposhi (1,860 km)
- **API Status:** ❌ No public API
- **Integration Method:** Web scraping (schedules, fares available on website)
- **Contact:** info@tazarasite.com, +255 739 998 855
- **Notes:** Cross-border service resuming Feb 2026. Key partner for Africa Railways.

#### Kenya Railways Corporation (KRC)
- **Website:** https://krc.co.ke/ (blocked)
- **Countries:** Kenya
- **Routes:** Nairobi-Mombasa SGR (472 km), Nairobi Commuter
- **API Status:** ❌ No public API (website blocks automated access)
- **Integration Method:** Partnership required
- **Notes:** Modern SGR system likely has internal APIs

#### Tanzania Railways Corporation (TRC)
- **Website:** https://trc.go.tz/
- **Countries:** Tanzania
- **Routes:** Dar es Salaam-Mwanza, Dar es Salaam-Kigoma
- **API Status:** ❌ No public API
- **Integration Method:** Web scraping or partnership

#### Uganda Railways Corporation
- **Countries:** Uganda
- **Status:** Limited passenger services
- **API Status:** ❌ No public API

#### Ethiopia-Djibouti Railway
- **Countries:** Ethiopia, Djibouti
- **Route:** Addis Ababa-Djibouti (756 km)
- **API Status:** ❌ No public API
- **Notes:** Chinese-built modern railway

---

### Southern Africa

#### Gautrain (South Africa)
- **Website:** https://www.gautrain.co.za/
- **Countries:** South Africa
- **Routes:** Johannesburg-Pretoria, OR Tambo Airport
- **API Status:** ⚠️ Possible internal API (trip planner functionality)
- **Integration Method:** Partnership required
- **Features:** Real-time schedules, fare calculator, card management
- **Notes:** Most modern system in Africa, likely has APIs for partners

#### PRASA/Metrorail (South Africa)
- **Website:** https://www.prasa.com/
- **Countries:** South Africa
- **Routes:** Extensive commuter network
- **API Status:** ❌ No public API
- **Integration Method:** Partnership required

#### Transnet Freight Rail (South Africa)
- **Website:** https://www.transnet.net/
- **Countries:** South Africa
- **Focus:** Freight (limited passenger relevance)

#### Zambia Railways Limited (ZRL)
- **Countries:** Zambia
- **Routes:** Livingstone-Kitwe, connects to TAZARA
- **API Status:** ❌ No public API
- **Integration Method:** Partnership required

#### Botswana Railways
- **Countries:** Botswana
- **Routes:** Limited passenger services
- **API Status:** ❌ No public API

---

### North Africa

#### SNCFT (Tunisia)
- **Website:** https://www.sncft.com.tn/
- **Countries:** Tunisia
- **Routes:** Extensive network (Tunis, Sousse, Sfax, etc.)
- **API Status:** ❌ No public API
- **Integration Method:** Web scraping (schedule search available)
- **Features:** Online schedule lookup by station
- **Notes:** Good candidate for scraping - has structured schedule data

#### ONCF (Morocco)
- **Website:** https://www.oncf.ma/
- **Countries:** Morocco
- **Routes:** Al Boraq high-speed, extensive network
- **API Status:** ⚠️ Possible API (online booking system)
- **Integration Method:** Partnership required
- **Notes:** Most advanced North African railway, has online booking

#### Egyptian National Railways (ENR)
- **Website:** https://enr.gov.eg/
- **Countries:** Egypt
- **Routes:** Cairo-Alexandria, extensive network
- **API Status:** ❌ No public API
- **Integration Method:** Partnership required

#### SNTF (Algeria)
- **Countries:** Algeria
- **Routes:** Extensive network
- **API Status:** ❌ No public API

---

### West Africa

#### Nigerian Railway Corporation (NRC)
- **Countries:** Nigeria
- **Routes:** Lagos-Ibadan, Abuja-Kaduna
- **API Status:** ❌ No public API
- **Notes:** Modernizing with Chinese investment

#### Ghana Railway Company
- **Countries:** Ghana
- **Status:** Under rehabilitation
- **API Status:** ❌ No public API

#### Sitarail (Côte d'Ivoire/Burkina Faso)
- **Countries:** Côte d'Ivoire, Burkina Faso
- **Route:** Abidjan-Ouagadougou
- **API Status:** ❌ No public API

---

### Central Africa

#### SNCC (DRC)
- **Countries:** Democratic Republic of Congo
- **Routes:** Extensive but limited operations
- **API Status:** ❌ No public API

#### Camrail (Cameroon)
- **Countries:** Cameroon
- **Routes:** Douala-Yaoundé, Yaoundé-Ngaoundéré
- **API Status:** ❌ No public API

---

## Integration Priority Matrix

| Priority | Operator | Region | Reason |
|----------|----------|--------|--------|
| 1 | TAZARA | East | Core partner, cross-border |
| 2 | Gautrain | South | Modern system, likely has APIs |
| 3 | SNCFT | North | Structured data available |
| 4 | Kenya Railways | East | Major market, SGR |
| 5 | ONCF | North | Online booking exists |
| 6 | Nigerian Railway | West | Large market |

---

## Recommended Integration Approaches

### Tier 1: Direct API Partnership
Target operators with modern systems that likely have internal APIs:
- Gautrain (South Africa)
- Kenya Railways SGR
- ONCF (Morocco)
- Ethiopian Railways

**Action:** Contact business development teams for API access agreements.

### Tier 2: Web Scraping
Operators with structured website data:
- TAZARA (schedules, fares)
- SNCFT Tunisia (schedules)
- TRC Tanzania

**Action:** Implement scrapers using existing `scripts/data-integration/scraper.js`

### Tier 3: Manual Data Feeds
Operators with limited digital presence:
- ZRL Zambia
- Botswana Railways
- SNCC DRC

**Action:** Establish email/FTP data exchange agreements.

---

## Technical Implementation

### Scraping Architecture
```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  TAZARA Website │     │  SNCFT Website  │     │  Other Sources  │
└────────┬────────┘     └────────┬────────┘     └────────┬────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Africa Railways Scraper                       │
│                  (scripts/data-integration/)                     │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Airtable Database                           │
│              (Schedules, Stations, Fares)                        │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Africa Railways API                            │
│                  (backend/operators_api.go)                      │
└─────────────────────────────────────────────────────────────────┘
```

### API Partnership Template

```
Dear [Operator] Business Development Team,

Africa Railways is building a pan-African railway booking platform 
to simplify cross-border travel. We would like to integrate your 
schedules and booking system.

We request:
1. API access for real-time schedules
2. Booking API for ticket purchases
3. Revenue sharing agreement (90% operator / 10% platform)

Benefits to [Operator]:
- Increased visibility across Africa
- Access to cross-border travelers
- Modern booking interface
- Multi-currency payment processing

Contact: partnerships@africarailways.com
```

---

## Data Requirements per Operator

| Data Type | Required | Optional |
|-----------|----------|----------|
| Schedules | ✅ | - |
| Stations | ✅ | - |
| Fares | ✅ | - |
| Real-time status | - | ✅ |
| Seat availability | - | ✅ |
| Online booking | - | ✅ |

---

## Next Steps

1. **Immediate:** Implement TAZARA scraper (primary partner)
2. **Week 1:** Contact Gautrain for API partnership
3. **Week 2:** Implement SNCFT Tunisia scraper
4. **Month 1:** Reach out to Kenya Railways, ONCF
5. **Ongoing:** Build operator network across Africa

---

## References

- TAZARA: https://www.tazarasite.com/
- Gautrain: https://www.gautrain.co.za/
- SNCFT: https://www.sncft.com.tn/
- Railway Technology Africa: https://www.railway-technology.com/
