'use client';

import React from 'react';
import { useBackground, useSceneStore } from '../lib/store';

export function BackgroundPanel() {
  const background = useBackground();
  const { updateBackground } = useSceneStore();

  const handleModeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const mode = event.target.value as 'flat' | 'hdri' | 'set';
    updateBackground({ mode });
  };

  const handleColorChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const color = event.target.value;
    updateBackground({ color });
  };

  const handleHDRIChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      updateBackground({ hdriPath: url });
    }
  };

  const handleSetChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const setPath = event.target.value;
    updateBackground({ setPath: setPath || undefined });
  };

  return (
    <div className="panel">
      <h3>Background</h3>
      
      <div className="control-group">
        <label className="control-label">Mode</label>
        <select
          value={background.mode}
          onChange={handleModeChange}
          className="control-input"
        >
          <option value="flat">Flat Color</option>
          <option value="hdri">HDRI</option>
          <option value="set">3D Set</option>
        </select>
      </div>

      {background.mode === 'flat' && (
        <div className="control-group">
          <label className="control-label">Background Color</label>
          <input
            type="color"
            value={background.color || '#000000'}
            onChange={handleColorChange}
            className="control-input"
            style={{ height: '32px' }}
          />
        </div>
      )}

      {background.mode === 'hdri' && (
        <div className="control-group">
          <label className="control-label">HDRI File</label>
          <input
            type="file"
            accept=".hdr,.hdri,.exr"
            onChange={handleHDRIChange}
            className="control-input"
            style={{ 
              padding: '4px',
              fontSize: '11px',
              height: 'auto'
            }}
          />
          <div style={{ 
            fontSize: '10px', 
            color: '#888', 
            marginTop: '4px',
            lineHeight: '1.3'
          }}>
            Upload .hdr, .hdri, or .exr files for environment lighting
          </div>
          {background.hdriPath && (
            <div style={{ 
              fontSize: '10px', 
              color: '#4CAF50', 
              marginTop: '4px' 
            }}>
              ✓ HDRI loaded
            </div>
          )}
        </div>
      )}

      {background.mode === 'set' && (
        <div className="control-group">
          <label className="control-label">3D Set</label>
          <select
            value={background.setPath || ''}
            onChange={handleSetChange}
            className="control-input"
          >
            <option value="">None</option>
            <option value="/sets/studio.glb">Studio Cyclorama</option>
            <option value="/sets/warehouse.glb">Warehouse</option>
            <option value="/sets/forest.glb">Forest Scene</option>
          </select>
          <div style={{ 
            fontSize: '10px', 
            color: '#888', 
            marginTop: '4px',
            lineHeight: '1.3'
          }}>
            Select a pre-made 3D environment
          </div>
        </div>
      )}

      <div className="control-group">
        <button
          onClick={() => {
            updateBackground({
              mode: 'flat',
              color: '#000000',
              hdriPath: undefined,
              setPath: undefined,
            });
          }}
          className="control-button secondary"
        >
          Reset Background
        </button>
      </div>

      <div style={{ 
        fontSize: '10px', 
        color: '#666', 
        lineHeight: '1.4',
        marginTop: '12px',
        padding: '8px',
        background: 'rgba(255, 255, 255, 0.05)',
        borderRadius: '4px'
      }}>
        <strong>Tip:</strong> Use 'B' key to cycle between background modes quickly
      </div>
    </div>
  );
}
