export class JourneyOrchestrator {
  static async getArrivalPackage(stationId: string, destinationLat: number, destinationLng: number) {
    // 1. Fetch Station Coordinates from Supabase
    const station = await prisma.station.findUnique({ where: { id: stationId } });

    // 2. Parallel fetch of all add-ons (Maximum Performance)
    const [transport, hotels, premiumStays] = await Promise.all([
      UberService.getEstimates(station, { lat: destinationLat, lng: destinationLng }),
      BookingService.searchStays(station.lat, station.lng),
      ExpediaService.getRapidOffers(station.lat, station.lng)
    ]);

    return {
      lastMile: transport,
      localStays: hotels, // Booking.com
      luxuryStays: premiumStays, // Expedia
      timestamp: new Date().toISOString()
    };
  }
}
