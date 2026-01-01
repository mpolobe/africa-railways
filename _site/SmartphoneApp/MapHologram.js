import React, { useEffect } from 'react';
import { useWindowDimensions, View } from 'react-native';
import { 
  Canvas, 
  Fill, 
  Shader, 
  Skia, 
  useImage, 
  ImageShader 
} from "@shopify/react-native-skia";
import { 
  useSharedValue, 
  withRepeat, 
  withTiming, 
  useDerivedValue, 
  easing 
} from "react-native-reanimated";

/**
 * GLSL Shader Logic:
 * 1. Pixelates the input image into discrete blocks.
 * 2. Adds vertical scanlines that move over time.
 * 3. Introduces a high-frequency "flicker" for that unstable hologram look.
 */
const hologramShader = Skia.RuntimeEffect.Make(`
  uniform vec2 u_resolution;
  uniform float u_pixelSize;
  uniform float u_time;
  uniform shader image;

  half4 main(float2 xy) {
    // Pixelate: Create grid coordinates
    vec2 pixelatedUV = floor(xy / u_pixelSize) * u_pixelSize;
    
    // Sample the mask image (Africa silhouette)
    vec4 color = image.eval(pixelatedUV);
    
    // If the pixel is part of the Africa silhouette
    if (color.a > 0.1) {
       // Animated scanlines (scrolling bars)
       float scanline = sin(xy.y * 0.15 - u_time * 10.0) * 0.1;
       
       // High-frequency jitter/flicker
       float flicker = fract(sin(u_time * 60.0) * 43758.5453) * 0.08;
       
       // Final brightness combine
       float brightness = 0.8 + scanline + flicker;

       // Electric Blue color (Hex: #6166F2)
       return vec4(0.38 * brightness, 0.40 * brightness, 0.95 * brightness, 0.9 * brightness);
    }
    
    return vec4(0.0, 0.0, 0.0, 0.0);
  }
`)!;

export const MapHologram = () => {
  const { width } = useWindowDimensions();
  const canvasSize = width - 80;
  
  // Load the silhouette asset
  const image = useImage(require('./assets/africa-mask.png'));
  
  // Animation driver: cycles from 0 to 1 over time
  const time = useSharedValue(0);

  useEffect(() => {
    time.value = withRepeat(
      withTiming(1, { duration: 2000, easing: easing.linear }),
      -1, // Infinite loop
      false
    );
  }, []);

  // Update uniforms at 60fps without re-rendering the component
  const uniforms = useDerivedValue(() => ({
    u_resolution: [canvasSize, canvasSize],
    u_pixelSize: 6.0,
    u_time: time.value,
  }));

  if (!image) return null;

  return (
    <View style={{ alignItems: 'center', marginVertical: 10 }}>
      <Canvas style={{ width: canvasSize, height: canvasSize }}>
        <Fill>
          <Shader source={hologramShader} uniforms={uniforms}>
            <ImageShader 
              image={image} 
              fit="contain" 
              rect={{ x: 0, y: 0, width: canvasSize, height: canvasSize }} 
            />
          </Shader>
        </Fill>
      </Canvas>
    </View>
  );
};
