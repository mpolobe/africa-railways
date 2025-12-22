import { analytics, EVENTS, ACTIONS } from '../services/analytics';

describe('Analytics Service', () => {
  beforeEach(() => {
    analytics.clearEvents();
    analytics.setEnabled(true);
  });

  describe('trackEvent', () => {
    it('should track a custom event', () => {
      analytics.trackEvent('test_event', { foo: 'bar' });
      
      const events = analytics.getEvents();
      expect(events).toHaveLength(1);
      expect(events[0].name).toBe('test_event');
      expect(events[0].properties.foo).toBe('bar');
    });

    it('should include session information', () => {
      analytics.trackEvent('test_event');
      
      const events = analytics.getEvents();
      expect(events[0].properties.sessionId).toBeDefined();
      expect(events[0].properties.timestamp).toBeDefined();
      expect(events[0].properties.platform).toBe('mobile');
    });

    it('should not track when disabled', () => {
      analytics.setEnabled(false);
      analytics.trackEvent('test_event');
      
      expect(analytics.getEvents()).toHaveLength(0);
    });
  });

  describe('trackScreenView', () => {
    it('should track screen views', () => {
      analytics.trackScreenView('HomeScreen');
      
      const events = analytics.getEvents();
      expect(events).toHaveLength(1);
      expect(events[0].name).toBe('screen_view');
      expect(events[0].properties.screen_name).toBe('HomeScreen');
    });
  });

  describe('trackTicketScan', () => {
    it('should track successful ticket scan', () => {
      analytics.trackTicketScan(true, 'ticket_123');
      
      const events = analytics.getEvents();
      expect(events).toHaveLength(1);
      expect(events[0].name).toBe('ticket_scan');
      expect(events[0].properties.success).toBe(true);
      expect(events[0].properties.ticket_id).toBe('ticket_123');
    });

    it('should track failed ticket scan with error', () => {
      const error = new Error('Invalid ticket');
      analytics.trackTicketScan(false, null, error);
      
      const events = analytics.getEvents();
      expect(events[0].properties.success).toBe(false);
      expect(events[0].properties.error).toBe('Invalid ticket');
    });
  });

  describe('trackAction', () => {
    it('should track user actions', () => {
      analytics.trackAction(ACTIONS.BUTTON_PRESS, { button_name: 'scan' });
      
      const events = analytics.getEvents();
      expect(events).toHaveLength(1);
      expect(events[0].name).toBe('user_action');
      expect(events[0].properties.action).toBe(ACTIONS.BUTTON_PRESS);
    });
  });

  describe('trackError', () => {
    it('should track errors with context', () => {
      const error = new Error('Test error');
      analytics.trackError(error, { screen: 'HomeScreen' });
      
      const events = analytics.getEvents();
      expect(events).toHaveLength(1);
      expect(events[0].name).toBe('error');
      expect(events[0].properties.error_message).toBe('Test error');
      expect(events[0].properties.screen).toBe('HomeScreen');
    });
  });

  describe('trackPerformance', () => {
    it('should track performance metrics', () => {
      analytics.trackPerformance('api_call', 250, 'ms');
      
      const events = analytics.getEvents();
      expect(events).toHaveLength(1);
      expect(events[0].name).toBe('performance');
      expect(events[0].properties.metric).toBe('api_call');
      expect(events[0].properties.value).toBe(250);
      expect(events[0].properties.unit).toBe('ms');
    });
  });

  describe('trackNetworkChange', () => {
    it('should track network status changes', () => {
      analytics.trackNetworkChange(true, 'wifi');
      
      const events = analytics.getEvents();
      expect(events).toHaveLength(1);
      expect(events[0].name).toBe('network_change');
      expect(events[0].properties.is_online).toBe(true);
      expect(events[0].properties.connection_type).toBe('wifi');
    });
  });

  describe('trackCacheUsage', () => {
    it('should track cache hits and misses', () => {
      analytics.trackCacheUsage('read', 'schedules', true);
      
      const events = analytics.getEvents();
      expect(events).toHaveLength(1);
      expect(events[0].name).toBe('cache_usage');
      expect(events[0].properties.cache_hit).toBe(true);
    });
  });

  describe('session management', () => {
    it('should generate unique session IDs', () => {
      const sessionId1 = analytics.sessionId;
      const newAnalytics = new (analytics.constructor)();
      const sessionId2 = newAnalytics.sessionId;
      
      expect(sessionId1).not.toBe(sessionId2);
    });

    it('should track session duration', () => {
      const duration = analytics.getSessionDuration();
      expect(duration).toBeGreaterThanOrEqual(0);
    });
  });

  describe('clearEvents', () => {
    it('should clear all tracked events', () => {
      analytics.trackEvent('event1');
      analytics.trackEvent('event2');
      expect(analytics.getEvents()).toHaveLength(2);
      
      analytics.clearEvents();
      expect(analytics.getEvents()).toHaveLength(0);
    });
  });

  describe('flush', () => {
    it('should clear events after flushing', async () => {
      analytics.trackEvent('event1');
      analytics.trackEvent('event2');
      
      await analytics.flush();
      expect(analytics.getEvents()).toHaveLength(0);
    });
  });
});
