import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
  PHONE_NUMBER: 'user_phone_number',
  PHONE_VERIFIED: 'user_phone_verified',
};

// Simulated OTP for development - in production, this would be sent via SMS
let pendingOTP = null;
let otpExpiry = null;

export const phoneVerificationService = {
  /**
   * Get the stored phone number
   */
  async getPhoneNumber() {
    try {
      const phone = await AsyncStorage.getItem(STORAGE_KEYS.PHONE_NUMBER);
      const verified = await AsyncStorage.getItem(STORAGE_KEYS.PHONE_VERIFIED);
      return {
        phoneNumber: phone,
        isVerified: verified === 'true',
      };
    } catch (error) {
      console.error('Error getting phone number:', error);
      return { phoneNumber: null, isVerified: false };
    }
  },

  /**
   * Format phone number to standard format
   */
  formatPhoneNumber(phoneNumber) {
    let cleaned = phoneNumber.replace(/[\s\-\(\)]/g, '');
    
    // Handle Zambian numbers
    if (cleaned.startsWith('0')) {
      cleaned = '+260' + cleaned.substring(1);
    } else if (!cleaned.startsWith('+')) {
      cleaned = '+260' + cleaned;
    }
    
    return cleaned;
  },

  /**
   * Validate phone number format
   */
  validatePhoneNumber(phoneNumber) {
    // Support multiple African country formats
    const patterns = [
      /^\+260[79]\d{8}$/,  // Zambia
      /^\+255[67]\d{8}$/,  // Tanzania
      /^\+244[9]\d{8}$/,   // Angola
      /^\+243[89]\d{8}$/,  // DRC
      /^\+27[67]\d{8}$/,   // South Africa
    ];
    
    const formatted = this.formatPhoneNumber(phoneNumber);
    return patterns.some(pattern => pattern.test(formatted));
  },

  /**
   * Send OTP to phone number
   * In production, this would call your SMS API (Twilio, Africa's Talking, etc.)
   */
  async sendOTP(phoneNumber) {
    try {
      const formatted = this.formatPhoneNumber(phoneNumber);
      
      if (!this.validatePhoneNumber(formatted)) {
        return {
          success: false,
          error: 'Invalid phone number format',
        };
      }

      // Generate 6-digit OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      pendingOTP = otp;
      otpExpiry = Date.now() + 5 * 60 * 1000; // 5 minutes expiry

      // In production, send via SMS API
      // For now, we'll log it (remove in production!)
      console.log(`[DEV] OTP for ${formatted}: ${otp}`);

      // TODO: Replace with actual SMS API call
      // Example with Twilio:
      // await fetch('YOUR_BACKEND_URL/api/send-otp', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ phoneNumber: formatted }),
      // });

      return {
        success: true,
        message: 'OTP sent successfully',
        // Remove this in production - only for testing
        devOTP: __DEV__ ? otp : undefined,
      };
    } catch (error) {
      console.error('Error sending OTP:', error);
      return {
        success: false,
        error: 'Failed to send OTP. Please try again.',
      };
    }
  },

  /**
   * Verify OTP and save phone number
   */
  async verifyOTP(phoneNumber, otp) {
    try {
      // Check if OTP has expired
      if (!pendingOTP || !otpExpiry || Date.now() > otpExpiry) {
        return {
          success: false,
          error: 'OTP has expired. Please request a new one.',
        };
      }

      // Verify OTP
      if (otp !== pendingOTP) {
        return {
          success: false,
          error: 'Invalid OTP. Please try again.',
        };
      }

      // Save verified phone number
      const formatted = this.formatPhoneNumber(phoneNumber);
      await AsyncStorage.setItem(STORAGE_KEYS.PHONE_NUMBER, formatted);
      await AsyncStorage.setItem(STORAGE_KEYS.PHONE_VERIFIED, 'true');

      // Clear pending OTP
      pendingOTP = null;
      otpExpiry = null;

      return {
        success: true,
        message: 'Phone number verified successfully',
        phoneNumber: formatted,
      };
    } catch (error) {
      console.error('Error verifying OTP:', error);
      return {
        success: false,
        error: 'Verification failed. Please try again.',
      };
    }
  },

  /**
   * Remove phone number
   */
  async removePhoneNumber() {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.PHONE_NUMBER);
      await AsyncStorage.removeItem(STORAGE_KEYS.PHONE_VERIFIED);
      return { success: true };
    } catch (error) {
      console.error('Error removing phone number:', error);
      return { success: false, error: 'Failed to remove phone number' };
    }
  },

  /**
   * Resend OTP
   */
  async resendOTP(phoneNumber) {
    // Clear existing OTP
    pendingOTP = null;
    otpExpiry = null;
    
    // Send new OTP
    return this.sendOTP(phoneNumber);
  },
};

export default phoneVerificationService;
