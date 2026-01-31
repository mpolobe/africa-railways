/**
 * Train Schedules Data
 * Real schedules from African railway operators
 * Sources: TAZARA, ZRL, Kenya Railways SGR
 */

export const TRAIN_OPERATORS = {
  TAZARA: {
    id: 'tazara',
    name: 'TAZARA',
    fullName: 'Tanzania-Zambia Railway Authority',
    countries: ['Tanzania', 'Zambia'],
    website: 'https://www.tazarasite.com',
    phone: '+255 739 998 855',
    email: 'info@tazarasite.com',
    color: '#1E40AF',
  },
  ZRL: {
    id: 'zrl',
    name: 'ZRL',
    fullName: 'Zambia Railways Limited',
    countries: ['Zambia'],
    website: 'https://www.zrl.com.zm',
    phone: '+260 765 237 196',
    color: '#006B3F',
  },
  SGR_KENYA: {
    id: 'sgr_kenya',
    name: 'Madaraka Express',
    fullName: 'Kenya Standard Gauge Railway',
    countries: ['Kenya'],
    website: 'https://metickets.krc.co.ke',
    phone: '+254 709 388 887',
    color: '#DC2626',
  },
  GAUTRAIN: {
    id: 'gautrain',
    name: 'Gautrain',
    fullName: 'Gautrain Rapid Rail Link',
    countries: ['South Africa'],
    website: 'https://www.gautrain.co.za',
    color: '#059669',
  },
};

// Real TAZARA schedules from tazarasite.com
export const TAZARA_SCHEDULES = {
  mukubaExpress: {
    id: 'tazara-mukuba-express',
    name: 'Mukuba Express',
    operator: 'TAZARA',
    type: 'express',
    frequency: 'weekly',
    distance: 1860,
    duration: { hours: 46, minutes: 0 },
    // Dar es Salaam to Kapiri Mposhi - Departs Friday 15:50 EAT
    southbound: {
      departureDay: 'Friday',
      departureTime: '15:50',
      timezone: 'EAT',
      stops: [
        { station: 'Dar es Salaam', code: 'DSM', arrival: null, departure: '15:50', dayOffset: 0, km: 0 },
        { station: 'Kilosa', code: 'KLS', arrival: '23:30', departure: '23:45', dayOffset: 0, km: 283 },
        { station: 'Kidatu', code: 'KDT', arrival: '01:20', departure: '01:35', dayOffset: 1, km: 345 },
        { station: 'Ifakara', code: 'IFK', arrival: '03:45', departure: '04:00', dayOffset: 1, km: 420 },
        { station: 'Mlimba', code: 'MLB', arrival: '07:30', departure: '08:00', dayOffset: 1, km: 550 },
        { station: 'Makambako', code: 'MKB', arrival: '13:00', departure: '13:30', dayOffset: 1, km: 780 },
        { station: 'Mbeya', code: 'MBY', arrival: '17:00', departure: '18:00', dayOffset: 1, km: 900 },
        { station: 'Tunduma', code: 'TDM', arrival: '21:30', departure: '22:00', dayOffset: 1, km: 975 },
        { station: 'Nakonde', code: 'NKD', arrival: '22:30', departure: '23:30', dayOffset: 1, km: 980 },
        { station: 'Kasama', code: 'KSM', arrival: '07:00', departure: '08:00', dayOffset: 2, km: 1250 },
        { station: 'Mpika', code: 'MPK', arrival: '13:00', departure: '14:00', dayOffset: 2, km: 1450 },
        { station: 'Serenje', code: 'SRJ', arrival: '18:00', departure: '18:30', dayOffset: 2, km: 1600 },
        { station: 'Kapiri Mposhi', code: 'KPM', arrival: '13:50', departure: null, dayOffset: 3, km: 1860 },
      ],
    },
    // Kapiri Mposhi to Dar es Salaam - Departs Tuesday 16:00 CAT
    northbound: {
      departureDay: 'Tuesday',
      departureTime: '16:00',
      timezone: 'CAT',
      stops: [
        { station: 'Kapiri Mposhi', code: 'KPM', arrival: null, departure: '16:00', dayOffset: 0, km: 0 },
        { station: 'Serenje', code: 'SRJ', arrival: '21:30', departure: '22:00', dayOffset: 0, km: 260 },
        { station: 'Mpika', code: 'MPK', arrival: '03:00', departure: '04:00', dayOffset: 1, km: 410 },
        { station: 'Kasama', code: 'KSM', arrival: '10:00', departure: '11:00', dayOffset: 1, km: 610 },
        { station: 'Nakonde', code: 'NKD', arrival: '18:30', departure: '19:30', dayOffset: 1, km: 880 },
        { station: 'Tunduma', code: 'TDM', arrival: '20:00', departure: '20:30', dayOffset: 1, km: 885 },
        { station: 'Mbeya', code: 'MBY', arrival: '00:00', departure: '01:00', dayOffset: 2, km: 960 },
        { station: 'Makambako', code: 'MKB', arrival: '05:00', departure: '05:30', dayOffset: 2, km: 1080 },
        { station: 'Mlimba', code: 'MLB', arrival: '10:00', departure: '10:30', dayOffset: 2, km: 1310 },
        { station: 'Ifakara', code: 'IFK', arrival: '14:00', departure: '14:15', dayOffset: 2, km: 1440 },
        { station: 'Kidatu', code: 'KDT', arrival: '16:30', departure: '16:45', dayOffset: 2, km: 1515 },
        { station: 'Kilosa', code: 'KLS', arrival: '18:30', departure: '18:45', dayOffset: 2, km: 1577 },
        { station: 'Dar es Salaam', code: 'DSM', arrival: '13:50', departure: null, dayOffset: 3, km: 1860 },
      ],
    },
    classes: ['sleeper', 'first', 'second', 'economy'],
    fares: {
      sleeper: { TZS: 195000, ZMW: 850, USD: 78 },
      first: { TZS: 145000, ZMW: 650, USD: 58 },
      second: { TZS: 115000, ZMW: 500, USD: 46 },
      economy: { TZS: 85000, ZMW: 370, USD: 34 },
    },
    amenities: ['sleeper', 'dining', 'scenic'],
  },
  ordinaryTrain: {
    id: 'tazara-ordinary',
    name: 'TAZARA Ordinary',
    operator: 'TAZARA',
    type: 'ordinary',
    frequency: 'weekly',
    distance: 1860,
    duration: { hours: 52, minutes: 0 },
    southbound: {
      departureDay: 'Tuesday',
      departureTime: '13:50',
      timezone: 'EAT',
    },
    northbound: {
      departureDay: 'Friday',
      departureTime: '14:00',
      timezone: 'CAT',
    },
    classes: ['first', 'second', 'economy'],
    amenities: ['dining'],
  },
};

// Real ZRL schedules from zambia-railways.html
export const ZRL_SCHEDULES = {
  northbound: {
    id: 'zrl-northbound',
    name: 'ZRL Express Northbound',
    operator: 'ZRL',
    type: 'express',
    frequency: 'weekly',
    departureDay: 'Monday',
    arrivalDay: 'Wednesday',
    distance: 850,
    duration: { hours: 34, minutes: 0 },
    stops: [
      { station: 'Livingstone', code: 'LVS', arrival: null, departure: '20:00', dayOffset: 0 },
      { station: 'Choma', code: 'CHM', arrival: '03:15', departure: '03:45', dayOffset: 1 },
      { station: 'Mazabuka', code: 'MZB', arrival: '06:00', departure: '06:30', dayOffset: 1 },
      { station: 'Kafue', code: 'KFE', arrival: '11:30', departure: '12:00', dayOffset: 1 },
      { station: 'Lusaka', code: 'LSK', arrival: '14:24', departure: '15:24', dayOffset: 1 },
      { station: 'Kabwe', code: 'KBW', arrival: '19:16', departure: '19:46', dayOffset: 1 },
      { station: 'Ndola', code: 'NDL', arrival: '02:56', departure: '03:36', dayOffset: 2 },
      { station: 'Kitwe', code: 'KTW', arrival: '06:00', departure: null, dayOffset: 2 },
    ],
    classes: ['sleeper', 'first', 'economy'],
    fares: {
      sleeper: { ZMW: 450 },
      first: { ZMW: 280 },
      economy: { ZMW: 150 },
    },
  },
  southbound: {
    id: 'zrl-southbound',
    name: 'ZRL Express Southbound',
    operator: 'ZRL',
    type: 'express',
    frequency: 'weekly',
    departureDay: 'Friday',
    arrivalDay: 'Sunday',
    distance: 850,
    duration: { hours: 34, minutes: 0 },
    stops: [
      { station: 'Kitwe', code: 'KTW', arrival: null, departure: '16:00', dayOffset: 0 },
      { station: 'Ndola', code: 'NDL', arrival: '18:25', departure: '18:55', dayOffset: 0 },
      { station: 'Kabwe', code: 'KBW', arrival: '02:15', departure: '02:55', dayOffset: 1 },
      { station: 'Lusaka', code: 'LSK', arrival: '06:56', departure: '07:36', dayOffset: 1 },
      { station: 'Kafue', code: 'KFE', arrival: '09:30', departure: '10:00', dayOffset: 1 },
      { station: 'Mazabuka', code: 'MZB', arrival: '13:30', departure: '14:00', dayOffset: 1 },
      { station: 'Choma', code: 'CHM', arrival: '18:04', departure: '18:34', dayOffset: 1 },
      { station: 'Livingstone', code: 'LVS', arrival: '02:00', departure: null, dayOffset: 2 },
    ],
    classes: ['sleeper', 'first', 'economy'],
    fares: {
      sleeper: { ZMW: 450 },
      first: { ZMW: 280 },
      economy: { ZMW: 150 },
    },
  },
};

// Real Kenya SGR schedules from metickets.krc.co.ke
export const SGR_KENYA_SCHEDULES = {
  intercounty: {
    id: 'sgr-intercounty',
    name: 'Madaraka Express Inter-County',
    operator: 'SGR_KENYA',
    type: 'express',
    frequency: 'daily',
    distance: 472,
    duration: { hours: 4, minutes: 30 },
    departures: [
      { time: '15:00', type: 'afternoon' },
      { time: '22:00', type: 'overnight' },
    ],
    stops: [
      { station: 'Nairobi Terminus', code: 'NRB', km: 0 },
      { station: 'Athi River', code: 'ATH', km: 30 },
      { station: 'Emali', code: 'EML', km: 133 },
      { station: 'Kibwezi', code: 'KBZ', km: 188 },
      { station: 'Mtito Andei', code: 'MTA', km: 233 },
      { station: 'Voi', code: 'VOI', km: 327 },
      { station: 'Misenyi', code: 'MSY', km: 390 },
      { station: 'Mariakani', code: 'MRK', km: 420 },
      { station: 'Mombasa Terminus', code: 'MBA', km: 472 },
    ],
    classes: ['first', 'economy'],
    fares: {
      first: { KES: 3000, USD: 23 },
      economy: { KES: 1000, USD: 8 },
    },
    amenities: ['dining', 'wifi', 'aircon'],
  },
  suswa: {
    id: 'sgr-suswa',
    name: 'Madaraka Express Suswa Line',
    operator: 'SGR_KENYA',
    type: 'commuter',
    frequency: 'daily',
    distance: 120,
    duration: { hours: 1, minutes: 30 },
    stops: [
      { station: 'Nairobi Terminus', code: 'NRB', km: 0 },
      { station: 'Ongata Rongai', code: 'ORG', km: 25 },
      { station: 'Ngong', code: 'NGG', km: 40 },
      { station: 'Maai Mahiu', code: 'MMH', km: 80 },
      { station: 'Suswa', code: 'SSW', km: 120 },
    ],
    classes: ['economy'],
    fares: {
      economy: { KES: 300, USD: 2.50 },
    },
  },
};

// Gautrain schedules
export const GAUTRAIN_SCHEDULES = {
  northSouth: {
    id: 'gautrain-north-south',
    name: 'Gautrain North-South Line',
    operator: 'GAUTRAIN',
    type: 'commuter',
    frequency: 'every 12 minutes peak, 20 minutes off-peak',
    distance: 80,
    duration: { hours: 0, minutes: 42 },
    operatingHours: {
      weekday: { first: '05:30', last: '20:30' },
      saturday: { first: '05:30', last: '20:30' },
      sunday: { first: '07:00', last: '19:00' },
    },
    stops: [
      { station: 'Hatfield', code: 'HAT', km: 0 },
      { station: 'Pretoria', code: 'PTA', km: 5 },
      { station: 'Centurion', code: 'CEN', km: 15 },
      { station: 'Midrand', code: 'MID', km: 30 },
      { station: 'Marlboro', code: 'MAR', km: 40 },
      { station: 'Sandton', code: 'SAN', km: 50 },
      { station: 'Rosebank', code: 'ROS', km: 55 },
      { station: 'Park Station', code: 'PRK', km: 60 },
    ],
    classes: ['standard'],
    fares: {
      standard: { ZAR: 72, USD: 4 },
    },
    amenities: ['wifi', 'aircon'],
  },
  airport: {
    id: 'gautrain-airport',
    name: 'Gautrain Airport Link',
    operator: 'GAUTRAIN',
    type: 'airport',
    frequency: 'every 12 minutes',
    distance: 25,
    duration: { hours: 0, minutes: 15 },
    stops: [
      { station: 'OR Tambo Airport', code: 'ORT', km: 0 },
      { station: 'Rhodesfield', code: 'RHD', km: 5 },
      { station: 'Marlboro', code: 'MAR', km: 20 },
      { station: 'Sandton', code: 'SAN', km: 25 },
    ],
    classes: ['standard'],
    fares: {
      standard: { ZAR: 185, USD: 10 },
    },
    amenities: ['wifi', 'aircon', 'luggage'],
  },
};

// Combined routes for the app
export const ROUTES = [
  {
    id: 'tazara-express',
    name: 'Mukuba Express',
    operator: 'TAZARA',
    from: { city: 'Dar es Salaam', station: 'Dar es Salaam Station', country: 'Tanzania' },
    to: { city: 'Kapiri Mposhi', station: 'Kapiri Mposhi Station', country: 'Zambia' },
    distance: 1860,
    duration: { hours: 46, minutes: 0 },
    frequency: 'Tue & Fri weekly',
    classes: ['sleeper', 'first', 'second', 'economy'],
    amenities: ['sleeper', 'dining', 'scenic'],
    schedule: TAZARA_SCHEDULES.mukubaExpress,
  },
  {
    id: 'zrl-main-line',
    name: 'ZRL Express',
    operator: 'ZRL',
    from: { city: 'Livingstone', station: 'Livingstone Station', country: 'Zambia' },
    to: { city: 'Kitwe', station: 'Kitwe Station', country: 'Zambia' },
    distance: 850,
    duration: { hours: 34, minutes: 0 },
    frequency: 'Mon & Fri weekly',
    classes: ['sleeper', 'first', 'economy'],
    amenities: ['sleeper', 'dining'],
    schedule: { northbound: ZRL_SCHEDULES.northbound, southbound: ZRL_SCHEDULES.southbound },
  },
  {
    id: 'sgr-nairobi-mombasa',
    name: 'Madaraka Express',
    operator: 'SGR_KENYA',
    from: { city: 'Nairobi', station: 'Nairobi Terminus', country: 'Kenya' },
    to: { city: 'Mombasa', station: 'Mombasa Terminus', country: 'Kenya' },
    distance: 472,
    duration: { hours: 4, minutes: 30 },
    frequency: 'Daily at 15:00 & 22:00',
    classes: ['first', 'economy'],
    amenities: ['dining', 'wifi', 'aircon'],
    schedule: SGR_KENYA_SCHEDULES.intercounty,
  },
  {
    id: 'gautrain-jhb-pta',
    name: 'Gautrain',
    operator: 'GAUTRAIN',
    from: { city: 'Johannesburg', station: 'Park Station', country: 'South Africa' },
    to: { city: 'Pretoria', station: 'Hatfield Station', country: 'South Africa' },
    distance: 60,
    duration: { hours: 0, minutes: 42 },
    frequency: 'Every 12-20 min',
    classes: ['standard'],
    amenities: ['wifi', 'aircon'],
    schedule: GAUTRAIN_SCHEDULES.northSouth,
  },
];

/**
 * Get next departure for a route
 */
export const getNextDeparture = (routeId, direction = 'southbound') => {
  const route = ROUTES.find(r => r.id === routeId);
  if (!route || !route.schedule) return null;

  const now = new Date();
  const dayOfWeek = now.getDay();
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  if (route.schedule.departureDay || route.schedule[direction]?.departureDay) {
    const schedule = route.schedule[direction] || route.schedule;
    const depDay = schedule.departureDay;
    const depDayIndex = dayNames.indexOf(depDay);
    
    let daysUntil = depDayIndex - dayOfWeek;
    if (daysUntil < 0) daysUntil += 7;
    if (daysUntil === 0) {
      const [hours, minutes] = schedule.departureTime.split(':').map(Number);
      const depTime = new Date(now);
      depTime.setHours(hours, minutes, 0, 0);
      if (now > depTime) daysUntil = 7;
    }

    const nextDep = new Date(now);
    nextDep.setDate(nextDep.getDate() + daysUntil);
    const [h, m] = schedule.departureTime.split(':').map(Number);
    nextDep.setHours(h, m, 0, 0);

    return {
      date: nextDep,
      time: schedule.departureTime,
      daysUntil,
      stops: schedule.stops,
    };
  }

  if (route.schedule.departures) {
    const nextDep = route.schedule.departures[0];
    return {
      date: now,
      time: nextDep.time,
      daysUntil: 0,
      stops: route.schedule.stops,
    };
  }

  return null;
};

/**
 * Get schedules for display
 */
export const getSchedulesForRoute = (fromCity, toCity) => {
  return ROUTES.filter(r =>
    (r.from.city.toLowerCase().includes(fromCity.toLowerCase()) &&
     r.to.city.toLowerCase().includes(toCity.toLowerCase())) ||
    (r.to.city.toLowerCase().includes(fromCity.toLowerCase()) &&
     r.from.city.toLowerCase().includes(toCity.toLowerCase()))
  );
};

export default {
  TRAIN_OPERATORS,
  TAZARA_SCHEDULES,
  ZRL_SCHEDULES,
  SGR_KENYA_SCHEDULES,
  GAUTRAIN_SCHEDULES,
  ROUTES,
  getNextDeparture,
  getSchedulesForRoute,
};
