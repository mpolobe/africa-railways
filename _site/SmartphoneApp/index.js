import React from 'react';
import { registerRootComponent } from 'expo';
import AppNavigator from './navigation/AppNavigator';
import ErrorBoundary from './components/ErrorBoundary';

// Wrap the app with ErrorBoundary
const AppWithErrorBoundary = () => (
  <ErrorBoundary>
    <AppNavigator />
  </ErrorBoundary>
);

registerRootComponent(AppWithErrorBoundary);
