/**
 * Train Schedules Data
 * Mock data for African railway routes
 * Based on real operators: TAZARA, Kenya Railways, PRASA, TRC, etc.
 */

export const TRAIN_OPERATORS = {
  TAZARA: {
    id: 'tazara',
    name: 'TAZARA',
    fullName: 'Tanzania-Zambia Railway Authority',
    countries: ['Tanzania', 'Zambia'],
    logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/8/8e/TAZARA_logo.svg/200px-TAZARA_logo.svg.png',
    color: '#1E40AF',
  },
  SGR_KENYA: {
    id: 'sgr_kenya',
    name: 'Madaraka Express',
    fullName: 'Kenya Standard Gauge Railway',
    countries: ['Kenya'],
    logo: 'https://www.krc.co.ke/wp-content/uploads/2020/01/KRC-Logo.png',
    color: '#DC2626',
  },
  PRASA: {
    id: 'prasa',
    name: 'PRASA',
    fullName: 'Passenger Rail Agency of South Africa',
    countries: ['South Africa'],
    logo: 'https://www.prasa.com/images/prasa-logo.png',
    color: '#059669',
  },
  TRC: {
    id: 'trc',
    name: 'TRC',
    fullName: 'Tanzania Railways Corporation',
    countries: ['Tanzania'],
    logo: null,
    color: '#F59E0B',
  },
  ENR: {
    id: 'enr',
    name: 'ENR',
    fullName: 'Egyptian National Railways',
    countries: ['Egypt'],
    logo: null,
    color: '#7C3AED',
  },
};

export const ROUTES = [
  // TAZARA Routes
  {
    id: 'tazara-express',
    name: 'TAZARA Express',
    operator: 'TAZARA',
    from: { city: 'Dar es Salaam', station: 'Dar es Salaam Station', country: 'Tanzania' },
    to: { city: 'Kapiri Mposhi', station: 'Kapiri Mposhi Station', country: 'Zambia' },
    distance: 1860,
    duration: { hours: 46, minutes: 0 },
    stops: [
      { name: 'Dar es Salaam', arrivalOffset: 0, departureOffset: 0 },
      { name: 'Mlimba', arrivalOffset: 8, departureOffset: 8.5 },
      { name: 'Makambako', arrivalOffset: 14, departureOffset: 14.5 },
      { name: 'Mbeya', arrivalOffset: 18, departureOffset: 19 },
      { name: 'Tunduma', arrivalOffset: 22, departureOffset: 22.5 },
      { name: 'Nakonde', arrivalOffset: 23, departureOffset: 24 },
      { name: 'Kasama', arrivalOffset: 32, departureOffset: 33 },
      { name: 'Mpika', arrivalOffset: 38, departureOffset: 39 },
      { name: 'Serenje', arrivalOffset: 42, departureOffset: 42.5 },
      { name: 'Kapiri Mposhi', arrivalOffset: 46, departureOffset: 46 },
    ],
    classes: ['first', 'business', 'economy'],
    amenities: ['sleeper', 'dining', 'wifi'],
  },
  // Kenya SGR Routes
  {
    id: 'madaraka-express',
    name: 'Madaraka Express',
    operator: 'SGR_KENYA',
    from: { city: 'Nairobi', station: 'Nairobi Terminus', country: 'Kenya' },
    to: { city: 'Mombasa', station: 'Mombasa Terminus', country: 'Kenya' },
    distance: 472,
    duration: { hours: 4, minutes: 30 },
    stops: [
      { name: 'Nairobi Terminus', arrivalOffset: 0, departureOffset: 0 },
      { name: 'Athi River', arrivalOffset: 0.5, departureOffset: 0.6 },
      { name: 'Emali', arrivalOffset: 1.5, departureOffset: 1.6 },
      { name: 'Kibwezi', arrivalOffset: 2, departureOffset: 2.1 },
      { name: 'Mtito Andei', arrivalOffset: 2.5, departureOffset: 2.6 },
      { name: 'Voi', arrivalOffset: 3, departureOffset: 3.2 },
      { name: 'Mariakani', arrivalOffset: 4, departureOffset: 4.1 },
      { name: 'Mombasa Terminus', arrivalOffset: 4.5, departureOffset: 4.5 },
    ],
    classes: ['first', 'economy'],
    amenities: ['dining', 'wifi', 'aircon'],
  },
  // South Africa Routes
  {
    id: 'gautrain-pretoria',
    name: 'Gautrain',
    operator: 'PRASA',
    from: { city: 'Johannesburg', station: 'Park Station', country: 'South Africa' },
    to: { city: 'Pretoria', station: 'Pretoria Station', country: 'South Africa' },
    distance: 56,
    duration: { hours: 0, minutes: 42 },
    stops: [
      { name: 'Park Station', arrivalOffset: 0, departureOffset: 0 },
      { name: 'Rosebank', arrivalOffset: 0.1, departureOffset: 0.12 },
      { name: 'Sandton', arrivalOffset: 0.2, departureOffset: 0.22 },
      { name: 'Marlboro', arrivalOffset: 0.3, departureOffset: 0.32 },
      { name: 'Midrand', arrivalOffset: 0.45, departureOffset: 0.47 },
      { name: 'Centurion', arrivalOffset: 0.55, departureOffset: 0.57 },
      { name: 'Pretoria Station', arrivalOffset: 0.7, departureOffset: 0.7 },
    ],
    classes: ['first', 'economy'],
    amenities: ['wifi', 'aircon'],
  },
  // Egypt Routes
  {
    id: 'cairo-alexandria',
    name: 'Cairo-Alexandria Express',
    operator: 'ENR',
    from: { city: 'Cairo', station: 'Cairo Ramses', country: 'Egypt' },
    to: { city: 'Alexandria', station: 'Misr Station', country: 'Egypt' },
    distance: 208,
    duration: { hours: 2, minutes: 30 },
    stops: [
      { name: 'Cairo Ramses', arrivalOffset: 0, departureOffset: 0 },
      { name: 'Benha', arrivalOffset: 0.5, departureOffset: 0.55 },
      { name: 'Tanta', arrivalOffset: 1.2, departureOffset: 1.3 },
      { name: 'Damanhur', arrivalOffset: 1.8, departureOffset: 1.85 },
      { name: 'Alexandria Misr', arrivalOffset: 2.5, departureOffset: 2.5 },
    ],
    classes: ['first', 'business', 'economy'],
    amenities: ['dining', 'aircon'],
  },
  // Tanzania Internal
  {
    id: 'dar-dodoma',
    name: 'Central Line',
    operator: 'TRC',
    from: { city: 'Dar es Salaam', station: 'Dar es Salaam Central', country: 'Tanzania' },
    to: { city: 'Dodoma', station: 'Dodoma Station', country: 'Tanzania' },
    distance: 456,
    duration: { hours: 8, minutes: 0 },
    stops: [
      { name: 'Dar es Salaam Central', arrivalOffset: 0, departureOffset: 0 },
      { name: 'Morogoro', arrivalOffset: 3, departureOffset: 3.3 },
      { name: 'Kilosa', arrivalOffset: 5, departureOffset: 5.2 },
      { name: 'Dodoma', arrivalOffset: 8, departureOffset: 8 },
    ],
    classes: ['first', 'economy'],
    amenities: ['dining'],
  },
];

// Generate daily schedules
export const generateDailySchedules = (date = new Date()) => {
  const schedules = [];
  const baseDate = new Date(date);
  baseDate.setHours(0, 0, 0, 0);

  ROUTES.forEach(route => {
    // Morning departure
    const morningDeparture = new Date(baseDate);
    morningDeparture.setHours(6, 0, 0, 0);
    
    schedules.push({
      id: `${route.id}-morning-${baseDate.toISOString().split('T')[0]}`,
      routeId: route.id,
      trainNumber: `${route.operator.substring(0, 2).toUpperCase()}${Math.floor(Math.random() * 900) + 100}`,
      route: route,
      departureTime: morningDeparture.toISOString(),
      arrivalTime: new Date(morningDeparture.getTime() + (route.duration.hours * 60 + route.duration.minutes) * 60000).toISOString(),
      status: 'on-time',
      availableSeats: {
        first: Math.floor(Math.random() * 20) + 5,
        business: Math.floor(Math.random() * 40) + 10,
        economy: Math.floor(Math.random() * 100) + 50,
      },
      platform: Math.floor(Math.random() * 8) + 1,
    });

    // Afternoon departure (for shorter routes)
    if (route.duration.hours < 10) {
      const afternoonDeparture = new Date(baseDate);
      afternoonDeparture.setHours(14, 0, 0, 0);
      
      schedules.push({
        id: `${route.id}-afternoon-${baseDate.toISOString().split('T')[0]}`,
        routeId: route.id,
        trainNumber: `${route.operator.substring(0, 2).toUpperCase()}${Math.floor(Math.random() * 900) + 100}`,
        route: route,
        departureTime: afternoonDeparture.toISOString(),
        arrivalTime: new Date(afternoonDeparture.getTime() + (route.duration.hours * 60 + route.duration.minutes) * 60000).toISOString(),
        status: 'on-time',
        availableSeats: {
          first: Math.floor(Math.random() * 20) + 5,
          business: Math.floor(Math.random() * 40) + 10,
          economy: Math.floor(Math.random() * 100) + 50,
        },
        platform: Math.floor(Math.random() * 8) + 1,
      });
    }

    // Evening departure
    const eveningDeparture = new Date(baseDate);
    eveningDeparture.setHours(18, 0, 0, 0);
    
    schedules.push({
      id: `${route.id}-evening-${baseDate.toISOString().split('T')[0]}`,
      routeId: route.id,
      trainNumber: `${route.operator.substring(0, 2).toUpperCase()}${Math.floor(Math.random() * 900) + 100}`,
      route: route,
      departureTime: eveningDeparture.toISOString(),
      arrivalTime: new Date(eveningDeparture.getTime() + (route.duration.hours * 60 + route.duration.minutes) * 60000).toISOString(),
      status: 'on-time',
      availableSeats: {
        first: Math.floor(Math.random() * 20) + 5,
        business: Math.floor(Math.random() * 40) + 10,
        economy: Math.floor(Math.random() * 100) + 50,
      },
      platform: Math.floor(Math.random() * 8) + 1,
    });
  });

  return schedules;
};

// Get schedules for a specific route
export const getSchedulesForRoute = (fromCity, toCity, date = new Date()) => {
  const schedules = generateDailySchedules(date);
  return schedules.filter(s => 
    s.route.from.city.toLowerCase() === fromCity.toLowerCase() &&
    s.route.to.city.toLowerCase() === toCity.toLowerCase()
  );
};

// Get next departures from a station
export const getNextDepartures = (city, limit = 5) => {
  const now = new Date();
  const schedules = generateDailySchedules(now);
  
  return schedules
    .filter(s => s.route.from.city.toLowerCase() === city.toLowerCase())
    .filter(s => new Date(s.departureTime) > now)
    .sort((a, b) => new Date(a.departureTime) - new Date(b.departureTime))
    .slice(0, limit);
};

export default {
  TRAIN_OPERATORS,
  ROUTES,
  generateDailySchedules,
  getSchedulesForRoute,
  getNextDepartures,
};
