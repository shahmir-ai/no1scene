'use client';

import React from 'react';
import { useCamera, useSceneStore } from '../lib/store';

export function CameraPanel() {
  const camera = useCamera();
  const { updateCamera } = useSceneStore();

  const handleZoomChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const distance = parseFloat(event.target.value);
    // Calculate current direction from target to camera
    const currentPos = camera.position;
    const target = camera.target;
    const direction = [
      currentPos[0] - target[0],
      currentPos[1] - target[1], 
      currentPos[2] - target[2]
    ];
    
    // Normalize direction and multiply by new distance
    const currentDistance = Math.sqrt(direction[0]**2 + direction[1]**2 + direction[2]**2);
    if (currentDistance > 0) {
      const normalizedDir = direction.map(d => d / currentDistance);
      const newPosition: [number, number, number] = [
        target[0] + normalizedDir[0] * distance,
        target[1] + normalizedDir[1] * distance,
        target[2] + normalizedDir[2] * distance
      ];
      updateCamera({ position: newPosition });
    }
  };

  const handlePreset = (preset: 'front' | '45' | 'profile') => {
    const presets = {
      front: {
        position: [0, 1.6, 4] as [number, number, number],
        target: [0, 1, 0] as [number, number, number],
      },
      45: {
        position: [3, 2.5, 3] as [number, number, number],
        target: [0, 1, 0] as [number, number, number],
      },
      profile: {
        position: [4, 1.6, 0] as [number, number, number],
        target: [0, 1, 0] as [number, number, number],
      },
    };

    updateCamera(presets[preset]);
  };

  const handleFrameAll = () => {
    // Reset to default wide view
    updateCamera({
      position: [0, 0, 20],
      target: [0, 0, 0],
    });
  };



  return (
    <div className="panel">
      <h3>Camera</h3>
      
      <div style={{ 
        fontSize: '11px', 
        color: '#888', 
        marginBottom: '12px',
        padding: '8px',
        background: 'rgba(255, 255, 255, 0.05)',
        borderRadius: '4px'
      }}>
        <strong>Mouse Controls:</strong><br />
        • Drag to orbit around scene<br />
        • Scroll to zoom in/out<br />
        • Use presets for standard angles
      </div>
      
      <div className="control-group">
        <label className="control-label">Zoom</label>
        <input
          type="range"
          min="0.5"
          max="50"
          step="0.1"
          value={Math.sqrt(
            (camera.position[0] - camera.target[0])**2 + 
            (camera.position[1] - camera.target[1])**2 + 
            (camera.position[2] - camera.target[2])**2
          )}
          onChange={handleZoomChange}
          className="control-input"
        />
        <span style={{ fontSize: '11px', color: '#999' }}>
          {Math.sqrt(
            (camera.position[0] - camera.target[0])**2 + 
            (camera.position[1] - camera.target[1])**2 + 
            (camera.position[2] - camera.target[2])**2
          ).toFixed(1)}m
        </span>
      </div>



      <div className="control-group">
        <label className="control-label">Presets</label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
          <button
            onClick={() => handlePreset('front')}
            className="control-button secondary"
            title="Camera preset: Front view (Press 1)"
          >
            Front
          </button>
          <button
            onClick={() => handlePreset('45')}
            className="control-button secondary"
            title="Camera preset: 45° angle (Press 2)"
          >
            45°
          </button>
          <button
            onClick={() => handlePreset('profile')}
            className="control-button secondary"
            title="Camera preset: Side profile (Press 3)"
          >
            Profile
          </button>
          <button
            onClick={handleFrameAll}
            className="control-button secondary"
          >
            Frame All
          </button>
        </div>
      </div>
    </div>
  );
}
