import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import App from '../App';

// Mock expo-camera
jest.mock('expo-camera', () => ({
  CameraView: 'CameraView',
  useCameraPermissions: jest.fn(() => [
    { granted: true },
    jest.fn()
  ])
}));

// Mock Sui client
jest.mock('@mysten/sui/client', () => ({
  SuiClient: jest.fn().mockImplementation(() => ({
    getObject: jest.fn()
  })),
  getFullnodeUrl: jest.fn(() => 'http://localhost:9000')
}));

describe('App Component', () => {
  it('renders without crashing', () => {
    const { getByText } = render(<App />);
    expect(getByText('AFRICA RAILWAYS')).toBeTruthy();
  });

  it('displays the app title and subtitle', () => {
    const { getByText } = render(<App />);
    expect(getByText('AFRICA RAILWAYS')).toBeTruthy();
    expect(getByText('Digital Sovereign Transit')).toBeTruthy();
  });

  it('shows the live route tracker section', () => {
    const { getByText } = render(<App />);
    expect(getByText('LIVE ROUTE TRACKER')).toBeTruthy();
  });

  it('displays scan QR ticket button when not scanning', () => {
    const { getByText } = render(<App />);
    expect(getByText('SCAN QR TICKET')).toBeTruthy();
  });

  it('shows staff terminal description', () => {
    const { getByText } = render(<App />);
    expect(getByText('Staff Terminal: Validate passenger Move NFTs.')).toBeTruthy();
  });
});
