import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = process.env.API_BASE_URL || 'https://api.africorailways.com';

class SubscriptionService {
  async getAuthToken() {
    return await AsyncStorage.getItem('authToken');
  }

  async getCurrentSubscription() {
    try {
      const token = await this.getAuthToken();
      const response = await fetch(`${API_BASE_URL}/api/subscriptions/status`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch subscription');
      }

      const data = await response.json();
      return data.subscription;
    } catch (error) {
      console.error('Get subscription error:', error);
      return null;
    }
  }

  async getAvailablePlans() {
    try {
      const response = await fetch(`${API_BASE_URL}/api/subscriptions/plans`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch plans');
      }

      const data = await response.json();
      return data.plans;
    } catch (error) {
      console.error('Get plans error:', error);
      throw error;
    }
  }

  async initiateSubscription(planId, paymentMethod, phoneNumber) {
    try {
      const token = await this.getAuthToken();
      const response = await fetch(`${API_BASE_URL}/api/subscriptions/initiate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          plan_id: planId,
          payment_method: paymentMethod,
          phone_number: phoneNumber,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Payment initiation failed');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Initiate subscription error:', error);
      throw error;
    }
  }

  async checkPaymentStatus(transactionId) {
    try {
      const token = await this.getAuthToken();
      const response = await fetch(
        `${API_BASE_URL}/api/subscriptions/payment-status/${transactionId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to check payment status');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Check payment status error:', error);
      throw error;
    }
  }

  async cancelSubscription() {
    try {
      const token = await this.getAuthToken();
      const response = await fetch(`${API_BASE_URL}/api/subscriptions/cancel`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to cancel subscription');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Cancel subscription error:', error);
      throw error;
    }
  }

  async updatePaymentMethod(paymentMethod, phoneNumber) {
    try {
      const token = await this.getAuthToken();
      const response = await fetch(`${API_BASE_URL}/api/subscriptions/payment-method`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          payment_method: paymentMethod,
          phone_number: phoneNumber,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update payment method');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Update payment method error:', error);
      throw error;
    }
  }

  async getTransactionHistory() {
    try {
      const token = await this.getAuthToken();
      const response = await fetch(`${API_BASE_URL}/api/subscriptions/transactions`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch transactions');
      }

      const data = await response.json();
      return data.transactions;
    } catch (error) {
      console.error('Get transactions error:', error);
      throw error;
    }
  }

  validatePhoneNumber(phoneNumber) {
    // Zambian phone number validation
    const zambianPattern = /^\+260(76|77|96|97|95)\d{7}$/;
    return zambianPattern.test(phoneNumber);
  }

  detectNetwork(phoneNumber) {
    if (!phoneNumber.startsWith('+260')) {
      return null;
    }

    const prefix = phoneNumber.substring(4, 6);
    
    if (['96', '76'].includes(prefix)) {
      return 'mtn';
    } else if (['97', '77'].includes(prefix)) {
      return 'airtel';
    } else if (prefix === '95') {
      return 'zamtel';
    }
    
    return null;
  }

  formatPhoneNumber(phoneNumber) {
    // Remove spaces and dashes
    let cleaned = phoneNumber.replace(/[\s-]/g, '');
    
    // Add +260 if not present
    if (!cleaned.startsWith('+260')) {
      if (cleaned.startsWith('260')) {
        cleaned = '+' + cleaned;
      } else if (cleaned.startsWith('0')) {
        cleaned = '+260' + cleaned.substring(1);
      } else {
        cleaned = '+260' + cleaned;
      }
    }
    
    return cleaned;
  }
}

export const subscriptionService = new SubscriptionService();
