import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Text } from 'react-native';
import ErrorBoundary from '../components/ErrorBoundary';

// Component that throws an error
const ThrowError = () => {
  throw new Error('Test error');
};

// Component that works fine
const WorkingComponent = () => <Text>Working Component</Text>;

describe('ErrorBoundary', () => {
  // Suppress console.error for these tests
  beforeAll(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterAll(() => {
    console.error.mockRestore();
  });

  it('renders children when there is no error', () => {
    const { getByText } = render(
      <ErrorBoundary>
        <WorkingComponent />
      </ErrorBoundary>
    );
    
    expect(getByText('Working Component')).toBeTruthy();
  });

  it('renders error UI when child component throws', () => {
    const { getByText } = render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );
    
    expect(getByText('Oops! Something went wrong')).toBeTruthy();
    expect(getByText(/The app encountered an unexpected error/)).toBeTruthy();
  });

  it('shows Try Again button in error state', () => {
    const { getByText } = render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );
    
    expect(getByText('Try Again')).toBeTruthy();
  });

  it('calls onReset when provided', () => {
    const onReset = jest.fn();
    const { getByText } = render(
      <ErrorBoundary onReset={onReset}>
        <ThrowError />
      </ErrorBoundary>
    );
    
    const goHomeButton = getByText('Go to Home');
    fireEvent.press(goHomeButton);
    
    expect(onReset).toHaveBeenCalled();
  });
});
