import { useEffect, useRef } from 'react';
import { analytics, ACTIONS } from '../services/analytics';

/**
 * Custom hook for analytics tracking
 * Automatically tracks screen views and provides tracking functions
 */
export const useAnalytics = (screenName) => {
  const screenStartTime = useRef(Date.now());

  useEffect(() => {
    // Track screen view on mount
    analytics.trackScreenView(screenName);

    // Track screen duration on unmount
    return () => {
      const duration = Date.now() - screenStartTime.current;
      analytics.trackPerformance(`${screenName}_duration`, duration);
    };
  }, [screenName]);

  return {
    trackEvent: analytics.trackEvent.bind(analytics),
    trackAction: analytics.trackAction.bind(analytics),
    trackError: analytics.trackError.bind(analytics),
    trackPerformance: analytics.trackPerformance.bind(analytics)
  };
};

/**
 * Hook to track button presses
 */
export const useTrackPress = (buttonName, additionalProps = {}) => {
  return () => {
    analytics.trackAction(ACTIONS.BUTTON_PRESS, {
      button_name: buttonName,
      ...additionalProps
    });
  };
};

export default useAnalytics;
