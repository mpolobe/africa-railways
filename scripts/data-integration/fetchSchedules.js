/**
 * Fetch Schedules from Africa Railways Website
 * 
 * Scrapes train schedule data using Cheerio
 */

import axios from 'axios';
import * as cheerio from 'cheerio';

export async function fetchSchedules() {
  const url = `${process.env.AFRICA_RAIL_BASE_URL}/train-schedules`;

  const { data } = await axios.get(url, {
    headers: {
      'User-Agent': 'AfricoinRailBot/1.0',
    },
  });

  const $ = cheerio.load(data);
  const schedules = [];

  $('.schedule-row').each((_, el) => {
    schedules.push({
      trainNumber: $(el).find('.train-no').text().trim(),
      origin: $(el).find('.origin').text().trim(),
      destination: $(el).find('.destination').text().trim(),
      departureTime: $(el).find('.departure').text().trim(),
      arrivalTime: $(el).find('.arrival').text().trim(),
    });
  });

  return schedules;
}

/**
 * Transform scraped schedule to Airtable format
 */
export function transformScheduleForAirtable(schedule) {
  return {
    'Schedule ID': `SCH-${schedule.trainNumber}-${Date.now()}`,
    'Train': schedule.trainNumber,
    'Route': `${schedule.origin} - ${schedule.destination}`,
    'Departure Station': schedule.origin,
    'Arrival Station': schedule.destination,
    'Departure Time': schedule.departureTime,
    'Arrival Time': schedule.arrivalTime,
    'Status': 'Active',
  };
}

export default fetchSchedules;
