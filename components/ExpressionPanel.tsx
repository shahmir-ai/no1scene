'use client';

import React from 'react';
import { useSelectedAvatar, useSceneStore } from '../lib/store';

export function ExpressionPanel() {
  const selectedAvatar = useSelectedAvatar();
  const { updateAvatar } = useSceneStore();

  if (!selectedAvatar) {
    return (
      <div className="panel">
        <h3>Expressions</h3>
        <div style={{ 
          color: '#888', 
          fontSize: '12px',
          textAlign: 'center',
          padding: '20px 0'
        }}>
          Select an avatar to control expressions
        </div>
      </div>
    );
  }

  const morphTargets = selectedAvatar.morphTargets || [];

  if (morphTargets.length === 0) {
    return (
      <div className="panel">
        <h3>Expressions</h3>
        <div style={{ 
          color: '#888', 
          fontSize: '12px',
          textAlign: 'center',
          padding: '20px 0'
        }}>
          No expression targets found on selected avatar
        </div>
      </div>
    );
  }

  const handleMorphChange = (morphName: string, value: number) => {
    const currentMorphs = selectedAvatar.morphs || {};
    const updatedMorphs = {
      ...currentMorphs,
      [morphName]: value,
    };

    updateAvatar(selectedAvatar.id, { morphs: updatedMorphs });

    // Apply to Three.js object if available
    if (selectedAvatar.skinnedMesh && selectedAvatar.skinnedMesh.morphTargetInfluences) {
      const morphIndex = selectedAvatar.skinnedMesh.morphTargetDictionary?.[morphName];
      if (morphIndex !== undefined) {
        selectedAvatar.skinnedMesh.morphTargetInfluences[morphIndex] = value;
      }
    }
  };

  const resetExpressions = () => {
    const resetMorphs: { [key: string]: number } = {};
    morphTargets.forEach(name => {
      resetMorphs[name] = 0;
    });

    updateAvatar(selectedAvatar.id, { morphs: resetMorphs });

    // Reset Three.js morph targets
    if (selectedAvatar.skinnedMesh && selectedAvatar.skinnedMesh.morphTargetInfluences) {
      selectedAvatar.skinnedMesh.morphTargetInfluences.fill(0);
    }
  };

  return (
    <div className="panel">
      <h3>Expressions</h3>
      <div style={{ 
        fontSize: '11px', 
        color: '#999', 
        marginBottom: '12px' 
      }}>
        Avatar: {selectedAvatar.id}
      </div>

      {morphTargets.map((morphName) => {
        const currentValue = selectedAvatar.morphs?.[morphName] || 0;
        const displayName = morphName
          .replace(/([A-Z])/g, ' $1') // Add space before capitals
          .replace(/^./, str => str.toUpperCase()) // Capitalize first letter
          .trim();

        return (
          <div key={morphName} className="control-group">
            <label className="control-label">{displayName}</label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={currentValue}
              onChange={(e) => handleMorphChange(morphName, parseFloat(e.target.value))}
              className="control-input"
            />
            <span style={{ fontSize: '10px', color: '#888' }}>
              {(currentValue * 100).toFixed(0)}%
            </span>
          </div>
        );
      })}

      {morphTargets.length > 0 && (
        <div className="control-group">
          <button
            onClick={resetExpressions}
            className="control-button secondary"
          >
            Reset All
          </button>
        </div>
      )}

      <div style={{ 
        fontSize: '10px', 
        color: '#666', 
        lineHeight: '1.4',
        marginTop: '12px',
        padding: '8px',
        background: 'rgba(255, 255, 255, 0.05)',
        borderRadius: '4px'
      }}>
        <strong>Tip:</strong> Expression values range from 0% (neutral) to 100% (full expression)
      </div>
    </div>
  );
}
