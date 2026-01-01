/**
 * AlchemyAuthContext - Authentication Context for OCC Portal
 * 
 * Integrates:
 * - Alchemy Account Kit for Smart Contract Accounts
 * - OTP Service for phone-based authentication
 * - Supabase for user profiles and permissions
 * 
 * Flow:
 * 1. User enters phone number
 * 2. OTP sent via Africa's Talking/Twilio
 * 3. User verifies OTP
 * 4. Alchemy creates/retrieves Smart Contract Account
 * 5. User profile loaded from Supabase
 */

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAlchemyAccountContext } from "@account-kit/react";
import { createClient } from '@supabase/supabase-js';
import { otpService } from '../lib/otpService';

// Initialize Supabase client
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

interface OCCUser {
  id: string;
  email: string;
  phoneNumber: string;
  fullName?: string;
  role: 'admin' | 'station_master' | 'operator' | 'staff';
  status: 'pending' | 'approved' | 'suspended' | 'revoked';
  suiAddress?: string;
  alchemyAccount?: string;
  stations?: Array<{ code: string; name: string }>;
  lastLogin?: string;
  createdAt: string;
}

interface AlchemyAuthContextType {
  user: OCCUser | null;
  loading: boolean;
  sendOTP: (phoneNumber: string) => Promise<{ success: boolean; error?: string }>;
  verifyOTP: (phoneNumber: string, code: string) => Promise<{ success: boolean; error?: string }>;
  resendOTP: (phoneNumber: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AlchemyAuthContext = createContext<AlchemyAuthContextType | undefined>(undefined);

export function AlchemyAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<OCCUser | null>(null);
  const [loading, setLoading] = useState(true);
  const { address, isConnected } = useAlchemyAccountContext();

  // Load user profile from Supabase
  const loadUserProfile = async (phoneNumber: string, alchemyAddress?: string) => {
    try {
      // Query user by phone number
      const { data: profile, error } = await supabase
        .from('profiles')
        .select(`
          *,
          staff_stations (
            station_code,
            station_name
          )
        `)
        .eq('phone_number', phoneNumber)
        .single();

      if (error) throw error;

      if (profile) {
        // Update Alchemy account address if provided
        if (alchemyAddress && profile.alchemy_account !== alchemyAddress) {
          await supabase
            .from('profiles')
            .update({ 
              alchemy_account: alchemyAddress,
              last_login: new Date().toISOString()
            })
            .eq('id', profile.id);
        }

        // Map to OCCUser format
        const occUser: OCCUser = {
          id: profile.id,
          email: profile.email,
          phoneNumber: profile.phone_number,
          fullName: profile.full_name,
          role: profile.role,
          status: profile.status,
          suiAddress: profile.sui_address,
          alchemyAccount: alchemyAddress || profile.alchemy_account,
          stations: profile.staff_stations?.map((s: any) => ({
            code: s.station_code,
            name: s.station_name
          })),
          lastLogin: profile.last_login,
          createdAt: profile.created_at
        };

        setUser(occUser);
        
        // Store in localStorage for persistence
        localStorage.setItem('occ_user', JSON.stringify(occUser));

        // Log authentication event
        await supabase.from('auth_logs').insert({
          user_id: profile.id,
          phone_number: phoneNumber,
          event_type: 'login_success',
          success: true
        });

        return occUser;
      }

      return null;
    } catch (error: any) {
      console.error('Error loading user profile:', error);
      
      // Log failed authentication
      await supabase.from('auth_logs').insert({
        phone_number: phoneNumber,
        event_type: 'login_failed',
        success: false,
        error_message: error.message
      });

      throw error;
    }
  };

  // Check for existing session on mount
  useEffect(() => {
    const checkSession = async () => {
      try {
        const storedUser = localStorage.getItem('occ_user');
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          
          // Verify user still exists and is approved
          const { data: profile } = await supabase
            .from('profiles')
            .select('status, role')
            .eq('id', parsedUser.id)
            .single();

          if (profile && profile.status === 'approved') {
            setUser(parsedUser);
          } else {
            localStorage.removeItem('occ_user');
          }
        }
      } catch (error) {
        console.error('Error checking session:', error);
        localStorage.removeItem('occ_user');
      } finally {
        setLoading(false);
      }
    };

    checkSession();
  }, []);

  // Send OTP to phone number
  const sendOTP = async (phoneNumber: string) => {
    try {
      // Log OTP send attempt
      await supabase.from('auth_logs').insert({
        phone_number: phoneNumber,
        event_type: 'otp_sent',
        success: true
      });

      const result = await otpService.sendOTP(phoneNumber);
      
      if (result.success) {
        return { success: true };
      }
      
      return {
        success: false,
        error: result.error || 'Failed to send OTP'
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to send OTP'
      };
    }
  };

  // Verify OTP and authenticate user
  const verifyOTP = async (phoneNumber: string, code: string) => {
    try {
      // Verify OTP code
      const result = otpService.verifyOTP(phoneNumber, code);
      
      if (!result.valid) {
        // Log failed verification
        await supabase.from('auth_logs').insert({
          phone_number: phoneNumber,
          event_type: 'otp_verified',
          success: false,
          error_message: result.error
        });

        return {
          success: false,
          error: result.error || 'Invalid OTP'
        };
      }

      // Log successful verification
      await supabase.from('auth_logs').insert({
        phone_number: phoneNumber,
        event_type: 'otp_verified',
        success: true
      });

      // Load user profile (Alchemy account will be created/retrieved by Account Kit)
      await loadUserProfile(phoneNumber, address);

      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to verify OTP'
      };
    }
  };

  // Resend OTP
  const resendOTP = async (phoneNumber: string) => {
    try {
      const result = await otpService.resendOTP(phoneNumber);
      
      if (result.success) {
        return { success: true };
      }
      
      return {
        success: false,
        error: result.error || 'Failed to resend OTP'
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to resend OTP'
      };
    }
  };

  // Logout user
  const logout = async () => {
    try {
      if (user) {
        // Log logout event
        await supabase.from('auth_logs').insert({
          user_id: user.id,
          phone_number: user.phoneNumber,
          event_type: 'logout',
          success: true
        });
      }

      // Clear user state
      setUser(null);
      localStorage.removeItem('occ_user');

      // Disconnect Alchemy (if needed)
      // Note: Alchemy Account Kit handles this automatically
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  // Refresh user profile
  const refreshUser = async () => {
    if (user) {
      try {
        await loadUserProfile(user.phoneNumber, address);
      } catch (error) {
        console.error('Error refreshing user:', error);
      }
    }
  };

  const value = {
    user,
    loading,
    sendOTP,
    verifyOTP,
    resendOTP,
    logout,
    refreshUser
  };

  return (
    <AlchemyAuthContext.Provider value={value}>
      {children}
    </AlchemyAuthContext.Provider>
  );
}

// Hook to use auth context
export function useAuth() {
  const context = useContext(AlchemyAuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AlchemyAuthProvider');
  }
  return context;
}

export default AlchemyAuthContext;
