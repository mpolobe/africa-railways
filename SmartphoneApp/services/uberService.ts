import axios from 'axios';

/**
 * Uber Service for the Rail OS
 * Scopes required: 'request', 'profile'
 */
export class UberService {
  private static api = axios.create({
    baseURL: 'https://api.uber.com/v1',
  });

  // Get price and time estimates for the station-to-home leg
  static async getEstimates(token: string, pickup: { lat: number, lng: number }, dropoff: { lat: number, lng: number }) {
    const response = await this.api.post('/guests/trips/estimates', {
      pickup: { latitude: pickup.lat, longitude: pickup.lng },
      dropoff: { latitude: dropoff.lat, longitude: dropoff.lng }
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  }

  // Request the ride after user confirmation
  static async requestRide(token: string, productId: string, pickup: any, dropoff: any) {
    const response = await this.api.post('/requests', {
      product_id: productId,
      start_latitude: pickup.lat,
      start_longitude: pickup.lng,
      end_latitude: dropoff.lat,
      end_longitude: dropoff.lng
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  }
}
