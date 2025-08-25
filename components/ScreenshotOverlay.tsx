'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useSceneStore } from '../lib/store';

export function ScreenshotOverlay() {
  const { isScreenshotModeActive } = useSceneStore(state => state.ui);
  const setScreenshotPreviewUrl = useSceneStore(state => state.setScreenshotPreviewUrl);
  const toggleScreenshotMode = useSceneStore(state => state.toggleScreenshotMode);
  const [mouseY, setMouseY] = useState(0.5); // Vertical position of the crop box (0 to 1)
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      if (overlayRef.current) {
        const rect = overlayRef.current.getBoundingClientRect();
        const y = event.clientY - rect.top;
        setMouseY(y / rect.height);
      }
    };

    if (isScreenshotModeActive) {
      document.addEventListener('mousemove', handleMouseMove);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
    };
  }, [isScreenshotModeActive]);
  
  if (!isScreenshotModeActive) return null;

  const handleCapture = async () => {
    try {
      // Find the Three.js canvas
      const canvas = document.querySelector('canvas');
      if (!canvas) {
        console.error('Canvas not found');
        return;
      }

      // Temporarily hide the overlay to capture clean image
      if (overlayRef.current) {
        overlayRef.current.style.display = 'none';
      }

      // Wait a frame for the overlay to disappear
      await new Promise(resolve => requestAnimationFrame(resolve));

      // Create a new canvas for the cropped image
      const cropCanvas = document.createElement('canvas');
      const ctx = cropCanvas.getContext('2d');
      if (!ctx) {
        console.error('Failed to get 2D context');
        return;
      }

      // Calculate crop dimensions (16:9 aspect ratio)
      const canvasWidth = canvas.width;
      const canvasHeight = canvas.height;
      const cropWidth = canvasWidth;
      const cropHeight = canvasWidth / (16 / 9);

      // Calculate crop position based on mouse Y
      const maxTop = canvasHeight - cropHeight;
      const targetTop = mouseY * canvasHeight - cropHeight / 2;
      const cropTop = Math.max(0, Math.min(targetTop, maxTop));

      // Set crop canvas size
      cropCanvas.width = cropWidth;
      cropCanvas.height = cropHeight;

      // Draw the cropped portion
      ctx.drawImage(
        canvas,
        0, cropTop, cropWidth, cropHeight,  // Source rectangle
        0, 0, cropWidth, cropHeight          // Destination rectangle
      );

      // Convert to data URL
      const dataUrl = cropCanvas.toDataURL('image/png');

      // Store the screenshot
      setScreenshotPreviewUrl(dataUrl);

      // Exit screenshot mode
      toggleScreenshotMode();

    } catch (error) {
      console.error('Screenshot capture failed:', error);
    } finally {
      // Re-show the overlay if there was an error
      if (overlayRef.current) {
        overlayRef.current.style.display = 'block';
      }
    }
  };
  
  // Calculate the top position of the 16:9 crop area
  const getCropStyle = () => {
    if (!overlayRef.current) return {};
    const overlayHeight = overlayRef.current.clientHeight;
    const cropHeight = overlayRef.current.clientWidth / (16 / 9);
    
    // Clamp the vertical position of the crop box
    const maxTop = overlayHeight - cropHeight;
    const targetTop = mouseY * overlayHeight - cropHeight / 2;
    const top = Math.max(0, Math.min(targetTop, maxTop));

    return {
      position: 'absolute' as const,
      left: '0px',
      top: `${top}px`,
      width: '100%',
      height: `${cropHeight}px`,
      boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.7)',
      border: '1px dashed #fff',
      cursor: 'crosshair',
    };
  };

  return (
    <div
      ref={overlayRef}
      onClick={handleCapture}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 1000,
        cursor: 'crosshair',
      }}
    >
      <div style={getCropStyle()}></div>
      <div style={{
        position: 'absolute',
        bottom: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        color: 'white',
        background: 'rgba(0,0,0,0.6)',
        padding: '8px 16px',
        borderRadius: '8px',
        pointerEvents: 'none',
        fontSize: '14px',
      }}>
        Move your mouse to position the crop area, then click to capture.
      </div>
    </div>
  );
}
