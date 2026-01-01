import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { otpService } from '@/lib/otpService';

interface ZkLoginUser {
  id: string;
  phoneNumber: string;
  suiAddress?: string;
  createdAt: string;
}

interface ZkLoginContextType {
  user: ZkLoginUser | null;
  loading: boolean;
  sendOTP: (phoneNumber: string) => Promise<{ success: boolean; error?: string }>;
  verifyOTP: (phoneNumber: string, code: string) => Promise<{ success: boolean; error?: string }>;
  resendOTP: (phoneNumber: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

const ZkLoginContext = createContext<ZkLoginContextType | undefined>(undefined);

export function ZkLoginProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<ZkLoginUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing session
    const storedUser = localStorage.getItem('zklogin_user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error('Failed to parse stored user:', error);
        localStorage.removeItem('zklogin_user');
      }
    }
    setLoading(false);
  }, []);

  const sendOTP = async (phoneNumber: string) => {
    try {
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

  const verifyOTP = async (phoneNumber: string, code: string) => {
    try {
      const result = otpService.verifyOTP(phoneNumber, code);
      
      if (result.valid) {
        // Create user session
        const newUser: ZkLoginUser = {
          id: generateUserId(phoneNumber),
          phoneNumber,
          createdAt: new Date().toISOString()
        };

        // Generate Sui address (placeholder - would integrate with actual zkLogin)
        newUser.suiAddress = await generateSuiAddress(phoneNumber);

        // Store session
        localStorage.setItem('zklogin_user', JSON.stringify(newUser));
        setUser(newUser);

        return { success: true };
      }
      
      return {
        success: false,
        error: result.error || 'Invalid OTP'
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to verify OTP'
      };
    }
  };

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

  const logout = () => {
    localStorage.removeItem('zklogin_user');
    setUser(null);
  };

  return (
    <ZkLoginContext.Provider
      value={{
        user,
        loading,
        sendOTP,
        verifyOTP,
        resendOTP,
        logout
      }}
    >
      {children}
    </ZkLoginContext.Provider>
  );
}

export function useZkLogin() {
  const context = useContext(ZkLoginContext);
  if (!context) {
    throw new Error('useZkLogin must be used within ZkLoginProvider');
  }
  return context;
}

// Helper functions

function generateUserId(phoneNumber: string): string {
  // Generate deterministic user ID from phone number
  return `zklogin_${btoa(phoneNumber).replace(/=/g, '')}`;
}

async function generateSuiAddress(phoneNumber: string): Promise<string> {
  // Placeholder for actual zkLogin Sui address generation
  // In production, this would use the zkLogin SDK to derive the address
  // from the OAuth JWT token and salt
  
  // For now, generate a mock Sui address
  const hash = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(phoneNumber)
  );
  const hashArray = Array.from(new Uint8Array(hash));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  return `0x${hashHex.substring(0, 64)}`;
}
