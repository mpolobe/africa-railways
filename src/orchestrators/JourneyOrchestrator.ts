import { supabase } from '../../lib/supabase'
import { UberService } from '../services/UberService'
import { BookingService } from '../services/BookingService'
import { ExpediaService } from '../services/ExpediaService'

export class JourneyOrchestrator {
  static async getArrivalPackage(stationId: string, destinationLat: number, destinationLng: number) {
    // 1. Fetch Station Coordinates from Supabase
    const { data: station, error } = await supabase
      .from('stations')
      .select('id, name, lat, lng')
      .eq('id', stationId)
      .single()

    if (error || !station) {
      throw new Error(`Station not found: ${stationId}`)
    }

    // 2. Parallel fetch of all add-ons
    const [transport, hotels, premiumStays] = await Promise.all([
      UberService.getEstimates(station, { lat: destinationLat, lng: destinationLng }),
      BookingService.searchStays(station.lat, station.lng),
      ExpediaService.getRapidOffers(station.lat, station.lng)
    ])

    return {
      lastMile: transport,
      localStays: hotels,
      luxuryStays: premiumStays,
      timestamp: new Date().toISOString()
    }
  }
}
