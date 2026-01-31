/**
 * GTFS Export API
 * Generates GTFS-compliant feeds from Supabase data
 * 
 * Supabase Project: llvprbmrnjvamjzavmhg
 */

const SUPABASE_URL = 'https://llvprbmrnjvamjzavmhg.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxsdnByYm1ybmp2YW1qemF2bWhnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU3NDQ1NTIsImV4cCI6MjA4MTMyMDU1Mn0.YvLr0yIuPvaBIjZ0_RZ10H6FzJ6eFbbaPOH6lM0RNtY';

/**
 * Fetch data from Supabase
 */
async function supabaseFetch(table, options = {}) {
  const { select = '*', filters = [], order, limit } = options;
  
  let url = `${SUPABASE_URL}/rest/v1/${table}?select=${encodeURIComponent(select)}`;
  
  filters.forEach(f => {
    url += `&${f.column}=${f.operator}.${encodeURIComponent(f.value)}`;
  });
  
  if (order) {
    url += `&order=${order}`;
  }
  
  if (limit) {
    url += `&limit=${limit}`;
  }
  
  const response = await fetch(url, {
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json'
    }
  });
  
  if (!response.ok) {
    throw new Error(`Supabase error: ${response.status}`);
  }
  
  return response.json();
}

/**
 * Export agency.txt
 */
async function exportAgency() {
  const agencies = await supabaseFetch('gtfs_agency');
  
  const header = 'agency_id,agency_name,agency_url,agency_timezone,agency_lang,agency_phone,agency_fare_url,agency_email';
  const rows = agencies.map(a => [
    a.agency_id,
    `"${a.agency_name}"`,
    a.agency_url || '',
    a.agency_timezone,
    a.agency_lang || 'en',
    a.agency_phone || '',
    a.agency_fare_url || '',
    a.agency_email || ''
  ].join(','));
  
  return [header, ...rows].join('\n');
}

/**
 * Export stops.txt
 */
async function exportStops() {
  const stops = await supabaseFetch('gtfs_stops');
  
  const header = 'stop_id,stop_code,stop_name,stop_desc,stop_lat,stop_lon,zone_id,stop_url,location_type,parent_station,stop_timezone,wheelchair_boarding';
  const rows = stops.map(s => [
    s.stop_id,
    s.stop_code || '',
    `"${s.stop_name}"`,
    s.stop_desc ? `"${s.stop_desc}"` : '',
    s.stop_lat,
    s.stop_lon,
    s.zone_id || '',
    s.stop_url || '',
    s.location_type || 0,
    s.parent_station || '',
    s.stop_timezone || '',
    s.wheelchair_boarding || 0
  ].join(','));
  
  return [header, ...rows].join('\n');
}

/**
 * Export routes.txt
 */
async function exportRoutes() {
  const routes = await supabaseFetch('gtfs_routes');
  
  const header = 'route_id,agency_id,route_short_name,route_long_name,route_desc,route_type,route_url,route_color,route_text_color,route_sort_order';
  const rows = routes.map(r => [
    r.route_id,
    r.agency_id || '',
    r.route_short_name || '',
    `"${r.route_long_name}"`,
    r.route_desc ? `"${r.route_desc}"` : '',
    r.route_type || 2,
    r.route_url || '',
    r.route_color || '',
    r.route_text_color || '',
    r.route_sort_order || ''
  ].join(','));
  
  return [header, ...rows].join('\n');
}

/**
 * Export calendar.txt
 */
async function exportCalendar() {
  const calendars = await supabaseFetch('gtfs_calendar');
  
  const header = 'service_id,monday,tuesday,wednesday,thursday,friday,saturday,sunday,start_date,end_date';
  const rows = calendars.map(c => [
    c.service_id,
    c.monday ? 1 : 0,
    c.tuesday ? 1 : 0,
    c.wednesday ? 1 : 0,
    c.thursday ? 1 : 0,
    c.friday ? 1 : 0,
    c.saturday ? 1 : 0,
    c.sunday ? 1 : 0,
    c.start_date.replace(/-/g, ''),
    c.end_date.replace(/-/g, '')
  ].join(','));
  
  return [header, ...rows].join('\n');
}

/**
 * Export trips.txt
 */
async function exportTrips() {
  const trips = await supabaseFetch('gtfs_trips');
  
  const header = 'route_id,service_id,trip_id,trip_headsign,trip_short_name,direction_id,block_id,shape_id,wheelchair_accessible,bikes_allowed';
  const rows = trips.map(t => [
    t.route_id,
    t.service_id,
    t.trip_id,
    t.trip_headsign ? `"${t.trip_headsign}"` : '',
    t.trip_short_name || '',
    t.direction_id ?? '',
    t.block_id || '',
    t.shape_id || '',
    t.wheelchair_accessible || 0,
    t.bikes_allowed || 0
  ].join(','));
  
  return [header, ...rows].join('\n');
}

/**
 * Export stop_times.txt
 */
async function exportStopTimes() {
  const stopTimes = await supabaseFetch('gtfs_stop_times', {
    order: 'trip_id,stop_sequence'
  });
  
  const header = 'trip_id,arrival_time,departure_time,stop_id,stop_sequence,stop_headsign,pickup_type,drop_off_type,shape_dist_traveled,timepoint';
  const rows = stopTimes.map(st => [
    st.trip_id,
    st.arrival_time || '',
    st.departure_time || '',
    st.stop_id,
    st.stop_sequence,
    st.stop_headsign ? `"${st.stop_headsign}"` : '',
    st.pickup_type || 0,
    st.drop_off_type || 0,
    st.shape_dist_traveled || '',
    st.timepoint ?? 1
  ].join(','));
  
  return [header, ...rows].join('\n');
}

/**
 * Export shapes.txt from sensor GPS data
 */
async function exportShapes() {
  const shapes = await supabaseFetch('gtfs_shapes', {
    order: 'shape_id,shape_pt_sequence'
  });
  
  const header = 'shape_id,shape_pt_lat,shape_pt_lon,shape_pt_sequence,shape_dist_traveled';
  const rows = shapes.map(s => [
    s.shape_id,
    s.shape_pt_lat,
    s.shape_pt_lon,
    s.shape_pt_sequence,
    s.shape_dist_traveled || ''
  ].join(','));
  
  return [header, ...rows].join('\n');
}

/**
 * Export fare_attributes.txt
 */
async function exportFareAttributes() {
  const fares = await supabaseFetch('gtfs_fare_attributes');
  
  const header = 'fare_id,price,currency_type,payment_method,transfers,agency_id,transfer_duration';
  const rows = fares.map(f => [
    f.fare_id,
    f.price,
    f.currency_type,
    f.payment_method || 0,
    f.transfers ?? '',
    f.agency_id || '',
    f.transfer_duration || ''
  ].join(','));
  
  return [header, ...rows].join('\n');
}

/**
 * Main export handler
 */
module.exports = async function handler(req, res) {
  const { file, format = 'csv' } = req.query;
  
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  try {
    let content;
    let filename;
    
    switch (file) {
      case 'agency':
        content = await exportAgency();
        filename = 'agency.txt';
        break;
      case 'stops':
        content = await exportStops();
        filename = 'stops.txt';
        break;
      case 'routes':
        content = await exportRoutes();
        filename = 'routes.txt';
        break;
      case 'calendar':
        content = await exportCalendar();
        filename = 'calendar.txt';
        break;
      case 'trips':
        content = await exportTrips();
        filename = 'trips.txt';
        break;
      case 'stop_times':
        content = await exportStopTimes();
        filename = 'stop_times.txt';
        break;
      case 'shapes':
        content = await exportShapes();
        filename = 'shapes.txt';
        break;
      case 'fare_attributes':
        content = await exportFareAttributes();
        filename = 'fare_attributes.txt';
        break;
      default:
        return res.status(200).json({
          message: 'Africa Railways GTFS Export API',
          available_files: [
            'agency',
            'stops', 
            'routes',
            'calendar',
            'trips',
            'stop_times',
            'shapes',
            'fare_attributes'
          ],
          usage: 'GET /api/gtfs/export?file=<filename>',
          format_options: ['csv', 'json'],
          data_sources: {
            operator: 'Official operator timetables',
            sentinel: 'GPS data from Sentinel sensors on trains',
            community: 'Crowdsourced arrival/departure times'
          }
        });
    }
    
    if (format === 'json') {
      // Parse CSV to JSON
      const lines = content.split('\n');
      const headers = lines[0].split(',');
      const records = lines.slice(1).map(line => {
        const values = line.split(',');
        const record = {};
        headers.forEach((h, i) => {
          record[h] = values[i]?.replace(/^"|"$/g, '') || '';
        });
        return record;
      });
      
      return res.status(200).json({
        file: filename,
        records,
        count: records.length
      });
    }
    
    // Return as CSV/text
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.status(200).send(content);
    
  } catch (error) {
    console.error('GTFS export error:', error);
    return res.status(500).json({
      error: 'Export failed',
      message: error.message
    });
  }
};
