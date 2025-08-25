'use client';

import React from 'react';

export function CameraInfo() {
  return (
    <div
      style={{
        position: 'absolute',
        bottom: '10px',
        left: '10px',
        color: '#ccc',
        fontSize: '11px',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        padding: '4px 8px',
        borderRadius: '4px',
        pointerEvents: 'none',
        zIndex: 100,
      }}
    >
      WASD: Pan • Arrows: Zoom/Rotate • Mouse: Look
    </div>
  );
}
