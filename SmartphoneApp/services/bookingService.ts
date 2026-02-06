import axios from 'axios';

/**
 * Booking.com Demand API (V3.1)
 * Optimized for regional African inventory
 */
export class BookingService {
  private static baseURL = 'https://demandapi.booking.com/3.1';
  private static headers = {
    'Authorization': `Bearer ${process.env.BOOKING_API_TOKEN}`,
    'Content-Type': 'application/json'
  };

  // Search for stays near a specific railway station
  static async searchStays(lat: number, lng: number, radius: number = 5) {
    const response = await axios.post(`${this.baseURL}/accommodations/search`, {
      latitude: lat,
      longitude: lng,
      radius: radius, // in KM
      rows: 10,
      checkin: new Date().toISOString().split('T')[0], // Default to today
      checkout: new Date(Date.now() + 86400000).toISOString().split('T')[0]
    }, { headers: this.headers });

    return response.data.results;
  }
}
