/**
 * Analytics Service
 * Tracks user interactions and app events
 * Can be integrated with Firebase Analytics, Amplitude, or custom backend
 */

class AnalyticsService {
  constructor() {
    this.enabled = true;
    this.events = [];
    this.sessionId = this.generateSessionId();
    this.sessionStart = Date.now();
  }

  generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Track a custom event
   */
  trackEvent(eventName, properties = {}) {
    if (!this.enabled) return;

    const event = {
      name: eventName,
      properties: {
        ...properties,
        sessionId: this.sessionId,
        timestamp: Date.now(),
        platform: 'mobile'
      }
    };

    this.events.push(event);
    console.log('[Analytics] Event:', event);

    // Here you would send to your analytics backend
    // Example: this.sendToBackend(event);
  }

  /**
   * Track screen view
   */
  trackScreenView(screenName, properties = {}) {
    this.trackEvent('screen_view', {
      screen_name: screenName,
      ...properties
    });
  }

  /**
   * Track ticket scan
   */
  trackTicketScan(success, ticketId = null, error = null) {
    this.trackEvent('ticket_scan', {
      success,
      ticket_id: ticketId,
      error: error?.message
    });
  }

  /**
   * Track user action
   */
  trackAction(actionName, properties = {}) {
    this.trackEvent('user_action', {
      action: actionName,
      ...properties
    });
  }

  /**
   * Track error
   */
  trackError(error, context = {}) {
    this.trackEvent('error', {
      error_message: error.message,
      error_stack: error.stack,
      ...context
    });
  }

  /**
   * Track performance metric
   */
  trackPerformance(metricName, value, unit = 'ms') {
    this.trackEvent('performance', {
      metric: metricName,
      value,
      unit
    });
  }

  /**
   * Track network status change
   */
  trackNetworkChange(isOnline, connectionType) {
    this.trackEvent('network_change', {
      is_online: isOnline,
      connection_type: connectionType
    });
  }

  /**
   * Track cache usage
   */
  trackCacheUsage(action, cacheKey, hit = false) {
    this.trackEvent('cache_usage', {
      action,
      cache_key: cacheKey,
      cache_hit: hit
    });
  }

  /**
   * Get session duration
   */
  getSessionDuration() {
    return Date.now() - this.sessionStart;
  }

  /**
   * Get all tracked events
   */
  getEvents() {
    return this.events;
  }

  /**
   * Clear events
   */
  clearEvents() {
    this.events = [];
  }

  /**
   * Enable/disable analytics
   */
  setEnabled(enabled) {
    this.enabled = enabled;
  }

  /**
   * Send events to backend (placeholder)
   */
  async sendToBackend(event) {
    // Implement your backend integration here
    // Example:
    // try {
    //   await fetch('https://your-analytics-endpoint.com/events', {
    //     method: 'POST',
    //     headers: { 'Content-Type': 'application/json' },
    //     body: JSON.stringify(event)
    //   });
    // } catch (error) {
    //   console.error('Failed to send analytics:', error);
    // }
  }

  /**
   * Flush all pending events to backend
   */
  async flush() {
    if (this.events.length === 0) return;

    console.log(`[Analytics] Flushing ${this.events.length} events`);
    
    // Send all events in batch
    // await this.sendToBackend({ events: this.events });
    
    this.clearEvents();
  }
}

// Export singleton instance
export const analytics = new AnalyticsService();

// Export event names as constants
export const EVENTS = {
  SCREEN_VIEW: 'screen_view',
  TICKET_SCAN: 'ticket_scan',
  USER_ACTION: 'user_action',
  ERROR: 'error',
  PERFORMANCE: 'performance',
  NETWORK_CHANGE: 'network_change',
  CACHE_USAGE: 'cache_usage'
};

// Export action names
export const ACTIONS = {
  BUTTON_PRESS: 'button_press',
  NAVIGATION: 'navigation',
  SCAN_START: 'scan_start',
  SCAN_COMPLETE: 'scan_complete',
  CACHE_CLEAR: 'cache_clear',
  REFRESH: 'refresh'
};

export default analytics;
