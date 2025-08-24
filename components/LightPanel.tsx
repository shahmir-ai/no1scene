'use client';

import React from 'react';
import { useLighting, useSceneStore } from '../lib/store';

export function LightPanel() {
  const lighting = useLighting();
  const { updateLighting } = useSceneStore();

  const handleIntensityChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const intensity = parseFloat(event.target.value);
    updateLighting({
      key: { ...lighting.key, intensity }
    });
  };

  const handleColorChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const color = event.target.value;
    updateLighting({
      key: { ...lighting.key, color }
    });
  };

  const handleAzimuthChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const azimuth = parseFloat(event.target.value);
    updateLighting({
      key: { ...lighting.key, azimuth }
    });
  };

  const handleElevationChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const elevation = parseFloat(event.target.value);
    updateLighting({
      key: { ...lighting.key, elevation }
    });
  };

  const handleHDRIExposureChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const exposure = parseFloat(event.target.value);
    updateLighting({
      hdri: { ...lighting.hdri, exposure }
    });
  };

  const handleHDRIToggle = () => {
    updateLighting({
      hdri: { 
        ...lighting.hdri, 
        enabled: !lighting.hdri?.enabled 
      }
    });
  };

  return (
    <div className="panel">
      <h3>Lighting</h3>
      
      <div className="control-group">
        <label className="control-label">Key Light Intensity</label>
        <input
          type="range"
          min="0"
          max="5"
          step="0.1"
          value={lighting.key.intensity}
          onChange={handleIntensityChange}
          className="control-input"
        />
        <span style={{ fontSize: '11px', color: '#999' }}>{lighting.key.intensity.toFixed(1)}</span>
      </div>

      <div className="control-group">
        <label className="control-label">Key Light Color</label>
        <input
          type="color"
          value={lighting.key.color}
          onChange={handleColorChange}
          className="control-input"
          style={{ height: '32px' }}
        />
      </div>

      <div className="control-group">
        <label className="control-label">Azimuth (Horizontal)</label>
        <input
          type="range"
          min="-180"
          max="180"
          step="1"
          value={lighting.key.azimuth}
          onChange={handleAzimuthChange}
          className="control-input"
        />
        <span style={{ fontSize: '11px', color: '#999' }}>{lighting.key.azimuth}°</span>
      </div>

      <div className="control-group">
        <label className="control-label">Elevation (Vertical)</label>
        <input
          type="range"
          min="-90"
          max="90"
          step="1"
          value={lighting.key.elevation}
          onChange={handleElevationChange}
          className="control-input"
        />
        <span style={{ fontSize: '11px', color: '#999' }}>{lighting.key.elevation}°</span>
      </div>

      <div className="control-group">
        <label className="control-label">Environment</label>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <input
            type="checkbox"
            checked={lighting.hdri?.enabled ?? true}
            onChange={handleHDRIToggle}
            style={{ margin: 0 }}
          />
          <span style={{ fontSize: '12px' }}>Enable HDRI</span>
        </div>
        
        {lighting.hdri?.enabled && (
          <>
            <label className="control-label">HDRI Exposure</label>
            <input
              type="range"
              min="-2"
              max="3"
              step="0.1"
              value={lighting.hdri?.exposure ?? 1}
              onChange={handleHDRIExposureChange}
              className="control-input"
            />
            <span style={{ fontSize: '11px', color: '#999' }}>
              {(lighting.hdri?.exposure ?? 1).toFixed(1)}
            </span>
          </>
        )}
      </div>

      <div className="control-group">
        <button
          onClick={() => {
            updateLighting({
              key: {
                intensity: 1,
                color: '#ffffff',
                azimuth: 45,
                elevation: 45,
              }
            });
          }}
          className="control-button secondary"
          title="Reset lighting to defaults"
        >
          Reset Lighting
        </button>
      </div>
    </div>
  );
}
