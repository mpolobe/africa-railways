/**
 * Supabase database types generated from migration schemas.
 *
 * Regenerate with `supabase gen types typescript` when connected
 * to the live project.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          auth_id: string | null
          phone: string | null
          email: string | null
          full_name: string | null
          country: string | null
          preferred_currency: string
          wallet_address: string | null
          afc_address: string | null
          sent_address: string | null
          afrc_address: string | null
          auth_provider: string | null
          phone_verified: boolean
          email_verified: boolean
          notification_preferences: Json
          total_bookings: number
          total_spent_usd: number
          afrc_earned: number
          created_at: string
          updated_at: string
          last_login_at: string | null
          metadata: Json
        }
        Insert: {
          id?: string
          auth_id?: string | null
          phone?: string | null
          email?: string | null
          full_name?: string | null
          country?: string | null
          preferred_currency?: string
          wallet_address?: string | null
          afc_address?: string | null
          sent_address?: string | null
          afrc_address?: string | null
          auth_provider?: string | null
          phone_verified?: boolean
          email_verified?: boolean
          notification_preferences?: Json
          total_bookings?: number
          total_spent_usd?: number
          afrc_earned?: number
          created_at?: string
          updated_at?: string
          last_login_at?: string | null
          metadata?: Json
        }
        Update: {
          id?: string
          auth_id?: string | null
          phone?: string | null
          email?: string | null
          full_name?: string | null
          country?: string | null
          preferred_currency?: string
          wallet_address?: string | null
          afc_address?: string | null
          sent_address?: string | null
          afrc_address?: string | null
          auth_provider?: string | null
          phone_verified?: boolean
          email_verified?: boolean
          notification_preferences?: Json
          total_bookings?: number
          total_spent_usd?: number
          afrc_earned?: number
          last_login_at?: string | null
          metadata?: Json
        }
      }
      bookings: {
        Row: {
          id: string
          booking_ref: string
          ticket_id: string | null
          nft_id: string | null
          souvenir_id: string | null
          passenger_name: string
          passenger_phone: string
          passenger_email: string | null
          user_id: string | null
          wallet_address: string | null
          wallet_created_from_phone: boolean
          route: string
          from_station: string
          to_station: string
          travel_date: string
          departure_time: string | null
          arrival_time: string | null
          class: string
          seat: string | null
          car_number: string | null
          passengers: number
          is_return_trip: boolean
          return_date: string | null
          base_price_usd: number
          discount_percent: number
          discount_amount_usd: number
          taxes_usd: number
          total_price_usd: number
          local_currency: string | null
          total_price_local: number | null
          exchange_rate: number | null
          total_price_afrc: number | null
          afrc_earned: number
          payment_method: string | null
          payment_status: string
          payment_tx_hash: string | null
          payment_provider: string | null
          payment_provider_ref: string | null
          booking_status: string
          booking_source: string
          checked_in_at: string | null
          checked_in_by: string | null
          checked_in_location: string | null
          used_at: string | null
          used_by: string | null
          used_location: string | null
          cancelled_at: string | null
          cancelled_by: string | null
          cancellation_reason: string | null
          refund_amount_usd: number | null
          refund_status: string | null
          refund_tx_hash: string | null
          qr_code_data: string | null
          ipfs_hash: string | null
          metadata: Json
          created_at: string
          updated_at: string
          expires_at: string | null
        }
        Insert: {
          id?: string
          booking_ref?: string
          ticket_id?: string | null
          nft_id?: string | null
          souvenir_id?: string | null
          passenger_name: string
          passenger_phone: string
          passenger_email?: string | null
          user_id?: string | null
          wallet_address?: string | null
          wallet_created_from_phone?: boolean
          route: string
          from_station: string
          to_station: string
          travel_date: string
          departure_time?: string | null
          arrival_time?: string | null
          class: string
          seat?: string | null
          car_number?: string | null
          passengers?: number
          is_return_trip?: boolean
          return_date?: string | null
          base_price_usd: number
          discount_percent?: number
          discount_amount_usd?: number
          taxes_usd?: number
          total_price_usd: number
          local_currency?: string | null
          total_price_local?: number | null
          exchange_rate?: number | null
          total_price_afrc?: number | null
          afrc_earned?: number
          payment_method?: string | null
          payment_status?: string
          payment_tx_hash?: string | null
          payment_provider?: string | null
          payment_provider_ref?: string | null
          booking_status?: string
          booking_source: string
          qr_code_data?: string | null
          ipfs_hash?: string | null
          metadata?: Json
          expires_at?: string | null
        }
        Update: {
          booking_ref?: string
          ticket_id?: string | null
          nft_id?: string | null
          souvenir_id?: string | null
          passenger_name?: string
          passenger_phone?: string
          passenger_email?: string | null
          user_id?: string | null
          wallet_address?: string | null
          route?: string
          from_station?: string
          to_station?: string
          travel_date?: string
          class?: string
          seat?: string | null
          car_number?: string | null
          passengers?: number
          payment_method?: string | null
          payment_status?: string
          payment_tx_hash?: string | null
          payment_provider?: string | null
          payment_provider_ref?: string | null
          booking_status?: string
          checked_in_at?: string | null
          checked_in_by?: string | null
          checked_in_location?: string | null
          used_at?: string | null
          used_by?: string | null
          used_location?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          cancellation_reason?: string | null
          refund_amount_usd?: number | null
          refund_status?: string | null
          refund_tx_hash?: string | null
          metadata?: Json
        }
      }
      payments: {
        Row: {
          id: string
          payment_ref: string
          booking_id: string | null
          amount: number
          currency: string
          amount_usd: number | null
          exchange_rate: number | null
          method: string
          provider: string | null
          provider_ref: string | null
          tx_hash: string | null
          block_number: number | null
          from_wallet: string | null
          to_wallet: string | null
          gas_fee: number | null
          phone_number: string | null
          mobile_money_name: string | null
          card_last_four: string | null
          card_brand: string | null
          status: string
          failure_reason: string | null
          initiated_at: string
          completed_at: string | null
          failed_at: string | null
          metadata: Json
        }
        Insert: {
          id?: string
          payment_ref: string
          booking_id?: string | null
          amount: number
          currency: string
          amount_usd?: number | null
          exchange_rate?: number | null
          method: string
          provider?: string | null
          provider_ref?: string | null
          tx_hash?: string | null
          block_number?: number | null
          from_wallet?: string | null
          to_wallet?: string | null
          gas_fee?: number | null
          phone_number?: string | null
          mobile_money_name?: string | null
          card_last_four?: string | null
          card_brand?: string | null
          status?: string
          failure_reason?: string | null
          metadata?: Json
        }
        Update: {
          booking_id?: string | null
          amount?: number
          currency?: string
          amount_usd?: number | null
          method?: string
          provider?: string | null
          provider_ref?: string | null
          tx_hash?: string | null
          status?: string
          failure_reason?: string | null
          completed_at?: string | null
          failed_at?: string | null
          metadata?: Json
        }
      }
      nft_souvenirs: {
        Row: {
          id: string
          souvenir_id: string
          booking_id: string | null
          ticket_id: string | null
          nft_token_id: string | null
          wallet_address: string | null
          name: string
          description: string | null
          image_url: string | null
          ipfs_hash: string | null
          theme: string | null
          culture: string | null
          route: string | null
          origin_country: string | null
          destination_country: string | null
          travel_date: string | null
          traits: Json
          rarity: string
          tx_hash: string | null
          minted_at: string | null
          metadata: Json
          created_at: string
        }
        Insert: {
          id?: string
          souvenir_id: string
          booking_id?: string | null
          ticket_id?: string | null
          nft_token_id?: string | null
          wallet_address?: string | null
          name: string
          description?: string | null
          image_url?: string | null
          ipfs_hash?: string | null
          theme?: string | null
          culture?: string | null
          route?: string | null
          origin_country?: string | null
          destination_country?: string | null
          travel_date?: string | null
          traits?: Json
          rarity?: string
          tx_hash?: string | null
          minted_at?: string | null
          metadata?: Json
        }
        Update: {
          nft_token_id?: string | null
          wallet_address?: string | null
          name?: string
          description?: string | null
          image_url?: string | null
          ipfs_hash?: string | null
          traits?: Json
          rarity?: string
          tx_hash?: string | null
          minted_at?: string | null
          metadata?: Json
        }
      }
      afrc_transactions: {
        Row: {
          id: string
          tx_ref: string
          from_wallet: string | null
          to_wallet: string | null
          amount: number
          tx_type: string
          booking_id: string | null
          user_phone: string | null
          tx_hash: string | null
          block_number: number | null
          gas_fee: number | null
          status: string
          created_at: string
          confirmed_at: string | null
          description: string | null
          metadata: Json
        }
        Insert: {
          id?: string
          tx_ref: string
          from_wallet?: string | null
          to_wallet?: string | null
          amount: number
          tx_type: string
          booking_id?: string | null
          user_phone?: string | null
          tx_hash?: string | null
          block_number?: number | null
          gas_fee?: number | null
          status?: string
          description?: string | null
          metadata?: Json
        }
        Update: {
          from_wallet?: string | null
          to_wallet?: string | null
          amount?: number
          tx_type?: string
          tx_hash?: string | null
          block_number?: number | null
          status?: string
          confirmed_at?: string | null
          description?: string | null
          metadata?: Json
        }
      }
      train_operators: {
        Row: {
          id: string
          name: string
          full_name: string | null
          countries: string[]
          website: string | null
          phone: string | null
          email: string | null
          color: string | null
          logo_url: string | null
          is_active: boolean
          metadata: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          name: string
          full_name?: string | null
          countries: string[]
          website?: string | null
          phone?: string | null
          email?: string | null
          color?: string | null
          logo_url?: string | null
          is_active?: boolean
          metadata?: Json
        }
        Update: {
          name?: string
          full_name?: string | null
          countries?: string[]
          website?: string | null
          phone?: string | null
          email?: string | null
          color?: string | null
          logo_url?: string | null
          is_active?: boolean
          metadata?: Json
        }
      }
      train_stations: {
        Row: {
          id: string
          code: string
          name: string
          city: string | null
          country: string
          operator_id: string | null
          latitude: number | null
          longitude: number | null
          timezone: string | null
          address: string | null
          facilities: string[] | null
          is_active: boolean
          metadata: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          code: string
          name: string
          city?: string | null
          country: string
          operator_id?: string | null
          latitude?: number | null
          longitude?: number | null
          timezone?: string | null
          address?: string | null
          facilities?: string[] | null
          is_active?: boolean
          metadata?: Json
        }
        Update: {
          code?: string
          name?: string
          city?: string | null
          country?: string
          operator_id?: string | null
          latitude?: number | null
          longitude?: number | null
          timezone?: string | null
          address?: string | null
          facilities?: string[] | null
          is_active?: boolean
          metadata?: Json
        }
      }
      train_routes: {
        Row: {
          id: string
          name: string
          operator_id: string | null
          route_type: string
          from_station_code: string | null
          to_station_code: string | null
          from_city: string | null
          to_city: string | null
          from_country: string | null
          to_country: string | null
          distance_km: number | null
          duration_hours: number | null
          frequency: string | null
          classes: string[]
          amenities: string[] | null
          is_active: boolean
          is_cross_border: boolean
          metadata: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          name: string
          operator_id?: string | null
          route_type: string
          from_station_code?: string | null
          to_station_code?: string | null
          from_city?: string | null
          to_city?: string | null
          from_country?: string | null
          to_country?: string | null
          distance_km?: number | null
          duration_hours?: number | null
          frequency?: string | null
          classes: string[]
          amenities?: string[] | null
          is_active?: boolean
          is_cross_border?: boolean
          metadata?: Json
        }
        Update: {
          name?: string
          operator_id?: string | null
          route_type?: string
          from_station_code?: string | null
          to_station_code?: string | null
          distance_km?: number | null
          duration_hours?: number | null
          frequency?: string | null
          classes?: string[]
          amenities?: string[] | null
          is_active?: boolean
          is_cross_border?: boolean
          metadata?: Json
        }
      }
      train_schedules: {
        Row: {
          id: string
          route_id: string | null
          schedule_name: string | null
          direction: string
          departure_day: string | null
          departure_time: string
          departure_timezone: string | null
          arrival_day: string | null
          arrival_time: string | null
          is_daily: boolean
          departure_type: string | null
          operating_days: number[] | null
          is_active: boolean
          effective_from: string | null
          effective_until: string | null
          metadata: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          route_id?: string | null
          schedule_name?: string | null
          direction: string
          departure_day?: string | null
          departure_time: string
          departure_timezone?: string | null
          arrival_day?: string | null
          arrival_time?: string | null
          is_daily?: boolean
          departure_type?: string | null
          operating_days?: number[] | null
          is_active?: boolean
          effective_from?: string | null
          effective_until?: string | null
          metadata?: Json
        }
        Update: {
          route_id?: string | null
          schedule_name?: string | null
          direction?: string
          departure_day?: string | null
          departure_time?: string
          arrival_day?: string | null
          arrival_time?: string | null
          is_daily?: boolean
          departure_type?: string | null
          operating_days?: number[] | null
          is_active?: boolean
          metadata?: Json
        }
      }
      schedule_stops: {
        Row: {
          id: string
          schedule_id: string | null
          station_code: string | null
          station_name: string
          arrival_time: string | null
          departure_time: string | null
          day_offset: number
          km_from_origin: number | null
          stop_order: number
          is_origin: boolean
          is_destination: boolean
          is_major_stop: boolean
          metadata: Json
          created_at: string
        }
        Insert: {
          id?: string
          schedule_id?: string | null
          station_code?: string | null
          station_name: string
          arrival_time?: string | null
          departure_time?: string | null
          day_offset?: number
          km_from_origin?: number | null
          stop_order: number
          is_origin?: boolean
          is_destination?: boolean
          is_major_stop?: boolean
          metadata?: Json
        }
        Update: {
          schedule_id?: string | null
          station_code?: string | null
          station_name?: string
          arrival_time?: string | null
          departure_time?: string | null
          day_offset?: number
          km_from_origin?: number | null
          stop_order?: number
          is_origin?: boolean
          is_destination?: boolean
          is_major_stop?: boolean
          metadata?: Json
        }
      }
      train_fares: {
        Row: {
          id: string
          route_id: string | null
          from_station_code: string | null
          to_station_code: string | null
          ticket_class: string
          price_local: number
          currency_local: string
          price_usd: number | null
          price_afrc: number | null
          effective_from: string | null
          effective_until: string | null
          is_active: boolean
          metadata: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          route_id?: string | null
          from_station_code?: string | null
          to_station_code?: string | null
          ticket_class: string
          price_local: number
          currency_local: string
          price_usd?: number | null
          price_afrc?: number | null
          effective_from?: string | null
          effective_until?: string | null
          is_active?: boolean
          metadata?: Json
        }
        Update: {
          route_id?: string | null
          ticket_class?: string
          price_local?: number
          currency_local?: string
          price_usd?: number | null
          price_afrc?: number | null
          is_active?: boolean
          metadata?: Json
        }
      }
      subscription_plans: {
        Row: {
          id: string
          name: string
          description: string | null
          price: number
          currency: string
          billing_cycle: string
          features: Json
          active: boolean
          created_at: string
        }
        Insert: {
          id: string
          name: string
          description?: string | null
          price: number
          currency?: string
          billing_cycle?: string
          features?: Json
          active?: boolean
        }
        Update: {
          name?: string
          description?: string | null
          price?: number
          currency?: string
          billing_cycle?: string
          features?: Json
          active?: boolean
        }
      }
      subscriptions: {
        Row: {
          id: string
          user_id: string | null
          plan_id: string
          status: string
          start_date: string
          end_date: string | null
          next_billing_date: string
          payment_method: string
          phone_number: string
          failed_attempts: number
          billing_cycle: string
          plan_features: Json | null
          metadata: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          plan_id: string
          status: string
          start_date: string
          next_billing_date: string
          payment_method: string
          phone_number: string
          failed_attempts?: number
          billing_cycle?: string
          plan_features?: Json | null
          metadata?: Json | null
        }
        Update: {
          plan_id?: string
          status?: string
          end_date?: string | null
          next_billing_date?: string
          payment_method?: string
          phone_number?: string
          failed_attempts?: number
          billing_cycle?: string
          plan_features?: Json | null
          metadata?: Json | null
        }
      }
      subscription_usage: {
        Row: {
          id: string
          subscription_id: string | null
          user_id: string
          booking_id: string | null
          usage_type: string
          usage_date: string
          metadata: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          subscription_id?: string | null
          user_id: string
          booking_id?: string | null
          usage_type: string
          metadata?: Json | null
        }
        Update: {
          subscription_id?: string | null
          user_id?: string
          booking_id?: string | null
          usage_type?: string
          metadata?: Json | null
        }
      }
      telemetry_readings: {
        Row: {
          id: string
          device_id: string
          user_id: string | null
          latitude: number
          longitude: number
          altitude: number | null
          speed_kmh: number | null
          heading: number | null
          accuracy_m: number | null
          g_force_x: number | null
          g_force_y: number | null
          g_force_z: number | null
          g_force_magnitude: number | null
          is_alert: boolean
          alert_type: string | null
          route_id: string | null
          recorded_at: string
          created_at: string
          metadata: Json
        }
        Insert: {
          id?: string
          device_id: string
          user_id?: string | null
          latitude: number
          longitude: number
          altitude?: number | null
          speed_kmh?: number | null
          heading?: number | null
          accuracy_m?: number | null
          g_force_x?: number | null
          g_force_y?: number | null
          g_force_z?: number | null
          g_force_magnitude?: number | null
          is_alert?: boolean
          alert_type?: string | null
          route_id?: string | null
          recorded_at?: string
          metadata?: Json
        }
        Update: {
          latitude?: number
          longitude?: number
          altitude?: number | null
          speed_kmh?: number | null
          heading?: number | null
          g_force_x?: number | null
          g_force_y?: number | null
          g_force_z?: number | null
          g_force_magnitude?: number | null
          is_alert?: boolean
          alert_type?: string | null
          metadata?: Json
        }
      }
      seat_locks: {
        Row: {
          id: string
          schedule_id: string
          seat_number: string
          car_number: string
          locked_by: string
          locked_at: string
          expires_at: string
          booking_id: string | null
          status: string
        }
        Insert: {
          id?: string
          schedule_id: string
          seat_number: string
          car_number: string
          locked_by: string
          expires_at: string
          booking_id?: string | null
          status?: string
        }
        Update: {
          booking_id?: string | null
          status?: string
          expires_at?: string
        }
      }
    }
    Functions: {
      upsert_user: {
        Args: {
          p_phone?: string | null
          p_email?: string | null
          p_full_name?: string | null
          p_country?: string | null
          p_wallet_address?: string | null
          p_auth_provider?: string
          p_auth_id?: string | null
        }
        Returns: Database['public']['Tables']['users']['Row']
      }
      generate_booking_ref: {
        Args: Record<string, never>
        Returns: string
      }
      generate_ticket_id: {
        Args: Record<string, never>
        Returns: string
      }
      calculate_monthly_savings: {
        Args: { p_subscription_id: string }
        Returns: number
      }
      acquire_seat_lock: {
        Args: {
          p_schedule_id: string
          p_seat_number: string
          p_car_number: string
          p_user_id: string
          p_ttl_seconds?: number
        }
        Returns: { success: boolean; lock_id: string | null; expires_at: string | null }
      }
      release_seat_lock: {
        Args: { p_lock_id: string; p_user_id: string }
        Returns: boolean
      }
      confirm_seat_lock: {
        Args: { p_lock_id: string; p_user_id: string; p_booking_id: string }
        Returns: boolean
      }
    }
  }
}
