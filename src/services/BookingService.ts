import axios from 'axios';

export class BookingService {
  private static baseURL = 'https://demandapi.booking.com/3.2';

  static async searchStays(stationLat: number, stationLng: number) {
    const { data } = await axios.post(`${this.baseURL}/accommodations/search`, {
      location: { latitude: stationLat, longitude: stationLng },
      radius: 5, // 5km search radius from the station
      rows: 10,
      sort_by: 'distance_from_search_location'
    }, {
      headers: { 'Authorization': `Bearer ${process.env.BOOKING_API_TOKEN}` }
    });
    return data.results;
  }
}
