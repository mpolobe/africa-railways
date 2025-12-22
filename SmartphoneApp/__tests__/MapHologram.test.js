import React from 'react';
import { render } from '@testing-library/react-native';
import { MapHologram } from '../MapHologram';

// Mock react-native-skia
jest.mock('@shopify/react-native-skia', () => ({
  Canvas: 'Canvas',
  Fill: 'Fill',
  Shader: 'Shader',
  Skia: {
    RuntimeEffect: {
      Make: jest.fn(() => ({}))
    }
  },
  useImage: jest.fn(() => ({ width: 100, height: 100 })),
  ImageShader: 'ImageShader'
}));

// Mock react-native-reanimated
jest.mock('react-native-reanimated', () => ({
  useSharedValue: jest.fn(() => ({ value: 0 })),
  withRepeat: jest.fn((config) => config),
  withTiming: jest.fn((value, config) => value),
  useDerivedValue: jest.fn((fn) => fn()),
  easing: {
    linear: jest.fn()
  }
}));

describe('MapHologram Component', () => {
  it('renders without crashing', () => {
    const { container } = render(<MapHologram />);
    expect(container).toBeTruthy();
  });

  it('renders a Canvas component', () => {
    const { UNSAFE_getByType } = render(<MapHologram />);
    expect(UNSAFE_getByType('Canvas')).toBeTruthy();
  });
});
