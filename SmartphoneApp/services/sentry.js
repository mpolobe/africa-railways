// Sentry Error Tracking Configuration
import * as Sentry from '@sentry/react-native';
import Constants from 'expo-constants';

const SENTRY_DSN = Constants.expoConfig?.extra?.sentryDsn || 
  'https://da12fbfe77b5504802bbd0b624cacaba@o4510700950061056.ingest.us.sentry.io/4510700954058752';

export const initSentry = () => {
  Sentry.init({
    dsn: SENTRY_DSN,
    
    // Set environment based on build
    environment: __DEV__ ? 'development' : 'production',
    
    // Enable performance monitoring
    enableAutoSessionTracking: true,
    sessionTrackingIntervalMillis: 30000,
    
    // Capture 100% of transactions for performance monitoring
    tracesSampleRate: __DEV__ ? 1.0 : 0.2,
    
    // Enable native crash reporting
    enableNativeCrashHandling: true,
    
    // Attach stack traces to all messages
    attachStacktrace: true,
    
    // Set app version
    release: `africa-railways@${Constants.expoConfig?.version || '1.0.0'}`,
    
    // Set distribution (build number)
    dist: Constants.expoConfig?.android?.versionCode?.toString() || '1',
    
    // Configure integrations
    integrations: [
      new Sentry.ReactNativeTracing({
        tracingOrigins: ['localhost', 'africarailways.com', /^\//],
        routingInstrumentation: Sentry.reactNavigationIntegration,
      }),
    ],
    
    // Before sending event, add extra context
    beforeSend(event) {
      // Add app variant info
      event.tags = {
        ...event.tags,
        app_variant: Constants.expoConfig?.extra?.APP_VARIANT || 'railways',
      };
      return event;
    },
  });
};

// Capture custom error with context
export const captureError = (error, context = {}) => {
  Sentry.withScope((scope) => {
    Object.keys(context).forEach((key) => {
      scope.setExtra(key, context[key]);
    });
    Sentry.captureException(error);
  });
};

// Set user context for error tracking
export const setUserContext = (user) => {
  if (user) {
    Sentry.setUser({
      id: user.id || user.phone,
      email: user.email,
      username: user.name,
    });
  } else {
    Sentry.setUser(null);
  }
};

// Add breadcrumb for debugging
export const addBreadcrumb = (message, category = 'app', data = {}) => {
  Sentry.addBreadcrumb({
    message,
    category,
    data,
    level: 'info',
  });
};

// Capture message (non-error)
export const captureMessage = (message, level = 'info') => {
  Sentry.captureMessage(message, level);
};

export default Sentry;
