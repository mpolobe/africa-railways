import axios from 'axios';

export class UberService {
  private static baseURL = 'https://api.uber.com/v1';

  // Step 1: Get Price/Time Estimates
  static async getEstimates(pickup: { lat: number, lng: number }, destination: { lat: number, lng: number }) {
    const { data } = await axios.post(`${this.baseURL}/guests/trips/estimates`, {
      pickup_location: { latitude: pickup.lat, longitude: pickup.lng },
      destination_location: { latitude: destination.lat, longitude: destination.lng }
    }, {
      headers: { Authorization: `Bearer ${process.env.UBER_SERVER_TOKEN}` }
    });
    return data.prices; // Returns UberX, XL, etc.
  }

  // Step 2: Book the Ride (Guest Mode)
  static async bookGuestRide(guestInfo: any, pickup: any, destination: any) {
    const { data } = await axios.post(`${this.baseURL}/guests/trips`, {
      guest: guestInfo, // { first_name, last_name, phone_number }
      pickup_location: pickup,
      destination_location: destination
    }, {
      headers: { Authorization: `Bearer ${process.env.UBER_GUEST_TOKEN}` }
    });
    return data.trip_id;
  }
}
