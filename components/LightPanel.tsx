'use client';

import React from 'react';
import { useLighting, useSceneStore } from '../lib/store';
import { type LightingData } from '../lib/sceneSchema';

export function LightPanel() {
  const lighting = useLighting();
  const { updateLighting } = useSceneStore();

  const handlePresetChange = (preset: LightingData['preset']) => {
    // Set both the preset and a sensible default intensity for it
    let intensity = 0.5;
    if (preset === 'dramatic') intensity = 0.8;
    if (preset === 'dark') intensity = 0.2;
    
    updateLighting({ preset, environmentIntensity: intensity });
  };

  const handleColorChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    updateLighting({ keyLightColor: event.target.value });
  };

  const handleIntensityChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    updateLighting({ environmentIntensity: parseFloat(event.target.value) });
  };

  const presets: { id: LightingData['preset']; name: string }[] = [
    { id: 'soft', name: 'Soft Studio' },
    { id: 'dramatic', name: 'Dramatic' },
    { id: 'dark', name: 'Dark' },
  ];

  return (
    <div className="panel">
      <h3>Lighting</h3>
      
      <div className="control-group">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {presets.map((preset) => (
            <button
              key={preset.id}
              onClick={() => handlePresetChange(preset.id)}
              style={{
                padding: '8px 12px',
                background: lighting.preset === preset.id ? '#0070f3' : 'rgba(255, 255, 255, 0.1)',
                border: 'none',
                color: 'white',
                borderRadius: '4px',
                fontSize: '11px',
                cursor: 'pointer',
                textAlign: 'center',
              }}
            >
              {preset.name}
            </button>
          ))}
        </div>
      </div>
      
      <div className="control-group">
        <label className="control-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Key Light Color</span>
          <div style={{ position: 'relative', width: '24px', height: '24px' }}>
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              background: lighting.keyLightColor,
              borderRadius: '4px',
              border: '1px solid #555'
            }} />
            <input
              type="color"
              value={lighting.keyLightColor}
              onChange={handleColorChange}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                opacity: 0,
                cursor: 'pointer',
              }}
            />
          </div>
        </label>
      </div>
    </div>
  );
}
