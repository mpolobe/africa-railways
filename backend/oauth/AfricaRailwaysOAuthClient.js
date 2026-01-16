/**
 * Africa Railways OAuth Client SDK
 * For third-party railway operators to integrate with Africa Railways platform
 */

class AfricaRailwaysOAuthClient {
  constructor(config) {
    this.clientId = config.clientId;
    this.clientSecret = config.clientSecret;
    this.redirectUri = config.redirectUri;
    this.baseUrl = config.baseUrl || 'https://api.africa-railways.com';
    this.accessToken = null;
    this.refreshToken = null;
    this.tokenExpiry = null;
  }

  /**
   * Generate authorization URL for user to approve access
   * @param {string[]} scopes - Array of requested scopes
   * @param {string} state - Random state for CSRF protection
   */
  getAuthorizationUrl(scopes, state) {
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      scope: scopes.join(' '),
      state: state,
      response_type: 'code'
    });

    return `${this.baseUrl}/oauth/authorize?${params.toString()}`;
  }

  /**
   * Exchange authorization code for access token
   * @param {string} code - Authorization code from callback
   */
  async getAccessToken(code) {
    try {
      const response = await fetch(`${this.baseUrl}/oauth/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          grant_type: 'authorization_code',
          code: code,
          redirect_uri: this.redirectUri,
          client_id: this.clientId,
          client_secret: this.clientSecret
        })
      });

      if (!response.ok) {
        throw new Error(`Token request failed: ${response.statusText}`);
      }

      const data = await response.json();

      this.accessToken = data.access_token;
      this.refreshToken = data.refresh_token;
      this.tokenExpiry = Date.now() + (data.expires_in * 1000);

      return data;
    } catch (error) {
      console.error('Failed to get access token:', error);
      throw error;
    }
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken() {
    try {
      const response = await fetch(`${this.baseUrl}/oauth/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          grant_type: 'refresh_token',
          refresh_token: this.refreshToken,
          client_id: this.clientId,
          client_secret: this.clientSecret
        })
      });

      if (!response.ok) {
        throw new Error(`Token refresh failed: ${response.statusText}`);
      }

      const data = await response.json();

      this.accessToken = data.access_token;
      this.tokenExpiry = Date.now() + (data.expires_in * 1000);

      return data;
    } catch (error) {
      console.error('Failed to refresh token:', error);
      throw error;
    }
  }

  /**
   * Ensure token is valid, refresh if needed
   */
  async ensureValidToken() {
    if (!this.accessToken) {
      throw new Error('No access token available. Please authenticate first.');
    }

    // Refresh if token expires in less than 5 minutes
    if (this.tokenExpiry && (this.tokenExpiry - Date.now() < 5 * 60 * 1000)) {
      await this.refreshAccessToken();
    }
  }

  /**
   * Make authenticated API request
   */
  async apiRequest(endpoint, options = {}) {
    await this.ensureValidToken();

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.status === 401) {
      // Try refreshing token once
      await this.refreshAccessToken();
      return this.apiRequest(endpoint, options);
    }

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error_description || error.error || 'API request failed');
    }

    return response.json();
  }

  // ============================================================================
  // Ticket Management APIs
  // ============================================================================

  /**
   * Get ticket information by ID
   * Requires scope: read:tickets
   */
  async getTicket(ticketId) {
    return this.apiRequest(`/api/tickets/${ticketId}`);
  }

  /**
   * Validate a ticket (mark as used)
   * Requires scope: write:tickets
   */
  async validateTicket(ticketId) {
    return this.apiRequest(`/api/tickets/${ticketId}/validate`, {
      method: 'POST'
    });
  }

  /**
   * Search tickets by criteria
   * Requires scope: read:tickets
   */
  async searchTickets(filters = {}) {
    const params = new URLSearchParams(filters);
    return this.apiRequest(`/api/tickets?${params.toString()}`);
  }

  // ============================================================================
  // Booking Management APIs
  // ============================================================================

  /**
   * Create a new booking
   * Requires scope: write:bookings
   */
  async createBooking(bookingData) {
    return this.apiRequest('/api/bookings', {
      method: 'POST',
      body: JSON.stringify(bookingData)
    });
  }

  /**
   * Get booking by ID
   * Requires scope: read:bookings
   */
  async getBooking(bookingId) {
    return this.apiRequest(`/api/bookings/${bookingId}`);
  }

  /**
   * Update booking
   * Requires scope: write:bookings
   */
  async updateBooking(bookingId, updates) {
    return this.apiRequest(`/api/bookings/${bookingId}`, {
      method: 'PATCH',
      body: JSON.stringify(updates)
    });
  }

  /**
   * Cancel booking
   * Requires scope: write:bookings
   */
  async cancelBooking(bookingId) {
    return this.apiRequest(`/api/bookings/${bookingId}/cancel`, {
      method: 'POST'
    });
  }

  // ============================================================================
  // Route and Schedule APIs
  // ============================================================================

  /**
   * Get all available routes
   * Requires scope: read:routes
   */
  async getRoutes(filters = {}) {
    const params = new URLSearchParams(filters);
    return this.apiRequest(`/api/routes?${params.toString()}`);
  }

  /**
   * Get route by ID
   * Requires scope: read:routes
   */
  async getRoute(routeId) {
    return this.apiRequest(`/api/routes/${routeId}`);
  }

  /**
   * Get train schedules
   * Requires scope: read:routes
   */
  async getSchedules(routeId, date) {
    const params = new URLSearchParams({ route_id: routeId, date });
    return this.apiRequest(`/api/schedules?${params.toString()}`);
  }

  // ============================================================================
  // Africoin Payment APIs
  // ============================================================================

  /**
   * Get Africoin wallet balance
   * Requires scope: read:africoin
   */
  async getAfricoinBalance(walletAddress) {
    return this.apiRequest(`/api/africoin/balance/${walletAddress}`);
  }

  /**
   * Transfer Africoin tokens
   * Requires scope: write:africoin
   */
  async transferAfricoin(fromWallet, toWallet, amount) {
    return this.apiRequest('/api/africoin/transfer', {
      method: 'POST',
      body: JSON.stringify({
        from: fromWallet,
        to: toWallet,
        amount: amount
      })
    });
  }

  /**
   * Process payment with Africoin
   * Requires scope: write:payments
   */
  async processPayment(bookingId, paymentData) {
    return this.apiRequest(`/api/payments/${bookingId}`, {
      method: 'POST',
      body: JSON.stringify(paymentData)
    });
  }

  // ============================================================================
  // Analytics APIs
  // ============================================================================

  /**
   * Get operator analytics
   * Requires scope: read:analytics
   */
  async getAnalytics(startDate, endDate, metrics = []) {
    const params = new URLSearchParams({
      start_date: startDate,
      end_date: endDate,
      metrics: metrics.join(',')
    });
    return this.apiRequest(`/api/analytics?${params.toString()}`);
  }

  /**
   * Get route performance data
   * Requires scope: read:analytics
   */
  async getRoutePerformance(routeId, period = '30d') {
    return this.apiRequest(`/api/analytics/routes/${routeId}?period=${period}`);
  }
}

module.exports = AfricaRailwaysOAuthClient;
