/**
 * Save to Airtable
 * 
 * Saves scraped railway data to Airtable
 */

import { base } from './airtable.js';

export async function saveSchedules(schedules) {
  for (const s of schedules) {
    await base('Rail Schedules').create({
      'Train Number': s.trainNumber,
      'Origin': s.origin,
      'Destination': s.destination,
      'Departure Time': s.departureTime,
      'Arrival Time': s.arrivalTime,
      'Source': 'Africa Railways Website',
    });
  }
}

/**
 * Save schedules with batch processing (more efficient)
 */
export async function saveSchedulesBatch(schedules) {
  const batchSize = 10; // Airtable limit
  
  for (let i = 0; i < schedules.length; i += batchSize) {
    const batch = schedules.slice(i, i + batchSize);
    
    const records = batch.map(s => ({
      fields: {
        'Train Number': s.trainNumber,
        'Origin': s.origin,
        'Destination': s.destination,
        'Departure Time': s.departureTime,
        'Arrival Time': s.arrivalTime,
        'Source': 'Africa Railways Website',
      },
    }));
    
    await base('Rail Schedules').create(records);
    
    // Rate limiting
    await new Promise(resolve => setTimeout(resolve, 200));
  }
}

/**
 * Save with upsert (update if exists, create if not)
 */
export async function saveSchedulesUpsert(schedules) {
  for (const s of schedules) {
    // Check if record exists
    const existing = await base('Rail Schedules')
      .select({
        filterByFormula: `{Train Number} = '${s.trainNumber}'`,
        maxRecords: 1,
      })
      .firstPage();
    
    if (existing.length > 0) {
      // Update existing
      await base('Rail Schedules').update(existing[0].id, {
        'Origin': s.origin,
        'Destination': s.destination,
        'Departure Time': s.departureTime,
        'Arrival Time': s.arrivalTime,
        'Source': 'Africa Railways Website',
      });
    } else {
      // Create new
      await base('Rail Schedules').create({
        'Train Number': s.trainNumber,
        'Origin': s.origin,
        'Destination': s.destination,
        'Departure Time': s.departureTime,
        'Arrival Time': s.arrivalTime,
        'Source': 'Africa Railways Website',
      });
    }
  }
}

export default saveSchedules;
