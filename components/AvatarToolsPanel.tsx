'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useSceneStore, useUI } from '../lib/store';
import { useSelectedAvatar, useAvatars } from '../lib/store';
import { ConfirmationPopup } from './ConfirmationPopup';
import { VisualBoneSelector } from './VisualBoneSelector';
import * as THREE from 'three';

interface BoneRotation {
  x: number;
  y: number;
  z: number;
}

interface BoneData {
  bone: THREE.Bone;
  originalRotation: BoneRotation;
  currentRotation: BoneRotation;
}

// Major bones to show controls for (moved outside component to avoid re-creation)
const MAJOR_BONES = [
  'mixamorigHips', 'mixamorigSpine', 'mixamorigSpine1', 'mixamorigSpine2', 
  'mixamorigNeck', 'mixamorigHead',
  'mixamorigLeftShoulder', 'mixamorigLeftArm', 'mixamorigLeftForeArm', 'mixamorigLeftHand',
  'mixamorigRightShoulder', 'mixamorigRightArm', 'mixamorigRightForeArm', 'mixamorigRightHand',
  'mixamorigLeftUpLeg', 'mixamorigLeftLeg', 'mixamorigLeftFoot',
  'mixamorigRightUpLeg', 'mixamorigRightLeg', 'mixamorigRightFoot',
  'Hips', 'Spine', 'Spine1', 'Spine2', 'Neck', 'Head', 
  'LeftShoulder', 'LeftArm', 'LeftForeArm', 'LeftHand',
  'RightShoulder', 'RightArm', 'RightForeArm', 'RightHand',
  'LeftUpLeg', 'LeftLeg', 'LeftFoot', 
  'RightUpLeg', 'RightLeg', 'RightFoot',
  'LeftUpperArm', 'RightUpperArm', 'LeftLowerArm', 'RightLowerArm',
  'LeftUpperLeg', 'RightUpperLeg', 'LeftLowerLeg', 'RightLowerLeg'
];

export function AvatarToolsPanel() {
  const { setActiveTool, setTransformMode, removeAvatar, setSelectedAvatar } = useSceneStore();
  const ui = useUI();
  const avatars = useAvatars();
  const selectedAvatar = useSelectedAvatar();
  const [showConfirmRemove, setShowConfirmRemove] = useState(false);
  
  // Bone controls state
  const [selectedBones, setSelectedBones] = useState<{ [boneName: string]: BoneData }>({});
  const [originalRotations, setOriginalRotations] = useState<{ [boneName: string]: BoneRotation }>({});
  const [selectedBoneName, setSelectedBoneName] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<'transform' | 'posing'>('transform');

  const hasRig = selectedAvatar?.hasRig;

  const handleTransformModeChange = (mode: 'translate' | 'rotate' | 'scale') => {
    setTransformMode(mode);
    setActiveTool('move');
    setActiveSection('transform');
  };

  const handlePoseMode = () => {
    setActiveSection('posing');
  };

  const handleRemoveAvatar = () => {
    setShowConfirmRemove(true);
  };

  const confirmRemoveAvatar = () => {
    if (selectedAvatar) {
      removeAvatar(selectedAvatar.id);
      setSelectedAvatar(null);
    }
    setShowConfirmRemove(false);
  };

  const cancelRemoveAvatar = () => {
    setShowConfirmRemove(false);
  };

  // Find and store bones when avatar changes - SIMPLE VERSION FROM WORKING PANEL
  useEffect(() => {
    if (!selectedAvatar || !selectedAvatar.object) {
      setSelectedBones({});
      setOriginalRotations({});
      return;
    }

    const bones: { [boneName: string]: THREE.Bone } = {};
    const originals: { [boneName: string]: BoneRotation } = {};

    selectedAvatar.object.traverse((child: any) => {
      if ((child as any).isBone) {
        const bone = child as THREE.Bone;
        if (MAJOR_BONES.includes(bone.name)) {
          bones[bone.name] = bone;
          originals[bone.name] = {
            x: bone.rotation.x,
            y: bone.rotation.y,
            z: bone.rotation.z
          };
        }
      }
    });

    const boneData: { [boneName: string]: BoneData } = {};
    const addedBones = new Set<string>();

    MAJOR_BONES.forEach(boneName => {
      if (bones[boneName] && !addedBones.has(boneName)) {
        const bone = bones[boneName];
        const original = originals[boneName];
        boneData[boneName] = {
          bone,
          originalRotation: original,
          currentRotation: { x: 0, y: 0, z: 0 }
        };
        addedBones.add(boneName);
      }
    });

    setSelectedBones(boneData);
    setOriginalRotations(originals);
  }, [selectedAvatar?.object]);

  if (!selectedAvatar) {
    return (
      <div className="panel">
        <h3>Avatar Tools</h3>
        <div style={{ 
          fontSize: '11px', 
          color: '#888', 
          textAlign: 'center',
          padding: '20px 0' 
        }}>
          Select an avatar to use tools
        </div>
      </div>
    );
  }

  return (
    <div className="panel">
      <h3>Avatar Tools</h3>
      
      {/* Avatar info */}
      <div className="control-group">
        <div style={{ fontSize: '11px', marginBottom: '8px' }}>
          <div style={{ color: '#888' }}>
            Avatar: <span style={{ color: '#4CAF50' }}>
              {(selectedAvatar as any)?.displayName || selectedAvatar?.id || 'Unknown'}
            </span>
          </div>
          
        </div>
      </div>

      {/* Transform Controls */}
      <div className="control-group">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <button
            onClick={() => handleTransformModeChange('translate')}
            style={{
              padding: '8px 12px',
              background: (ui.transformMode === 'translate' && ui.activeTool === 'move') ? '#0070f3' : 'rgba(255, 255, 255, 0.1)',
              border: 'none',
              color: 'white',
              borderRadius: '4px',
              fontSize: '11px',
              cursor: 'pointer',
              fontWeight: (ui.transformMode === 'translate' && ui.activeTool === 'move') ? 600 : 400,
            }}
          >
            Move
          </button>
          <button
            onClick={() => handleTransformModeChange('rotate')}
            style={{
              padding: '8px 12px',
              background: (ui.transformMode === 'rotate' && ui.activeTool === 'move') ? '#0070f3' : 'rgba(255, 255, 255, 0.1)',
              border: 'none',
              color: 'white',
              borderRadius: '4px',
              fontSize: '11px',
              cursor: 'pointer',
              fontWeight: (ui.transformMode === 'rotate' && ui.activeTool === 'move') ? 600 : 400,
            }}
          >
            Rotate
          </button>
          <button
            onClick={() => handleTransformModeChange('scale')}
            style={{
              padding: '8px 12px',
              background: (ui.transformMode === 'scale' && ui.activeTool === 'move') ? '#0070f3' : 'rgba(255, 255, 255, 0.1)',
              border: 'none',
              color: 'white',
              borderRadius: '4px',
              fontSize: '11px',
              cursor: 'pointer',
              fontWeight: (ui.transformMode === 'scale' && ui.activeTool === 'move') ? 600 : 400,
            }}
          >
            Scale
          </button>

          <button
            onClick={handleRemoveAvatar}
            style={{
              padding: '8px 12px',
              background: '#dc3545',
              border: 'none',
              color: 'white',
              borderRadius: '4px',
              fontSize: '11px',
              cursor: 'pointer',
              fontWeight: 500,
            }}
          >
            Remove
          </button>
        </div>
      </div>

      {/* Bone Controls - Always show for rigged models */}
      {hasRig && Object.keys(selectedBones).length > 0 && (
        <div className="control-group">
          <VisualBoneSelector
            selectedBone={selectedBoneName}
            onBoneSelect={setSelectedBoneName}
            availableBones={Object.keys(selectedBones).reduce((acc, key) => {
              acc[key] = selectedBones[key].bone;
              return acc;
            }, {} as { [name: string]: THREE.Bone })}
          />
          
          {selectedBoneName && selectedBones[selectedBoneName] && (
            <div style={{ marginTop: '12px' }}>
              <h4 style={{ fontSize: '11px', margin: '0 0 8px 0', color: '#ccc' }}>
                {selectedBoneName.replace(/mixamorig/g, '').replace(/([A-Z])/g, ' $1').trim()}
              </h4>
              
              {['x', 'y', 'z'].map((axis) => (
                <div key={axis} style={{ marginBottom: '8px' }}>
                  <label style={{ fontSize: '10px', color: '#888', display: 'block' }}>
                    {axis.toUpperCase()}: {selectedBones[selectedBoneName]?.currentRotation[axis as keyof BoneRotation]?.toFixed(0)}°
                  </label>
                  <input
                    type="range"
                    min="-180"
                    max="180"
                    step="1"
                    value={selectedBones[selectedBoneName]?.currentRotation[axis as keyof BoneRotation] || 0}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value);
                      const boneData = selectedBones[selectedBoneName!];
                      if (!boneData) return;

                      const radians = THREE.MathUtils.degToRad(value);
                      const original = boneData.originalRotation;

                      boneData.bone.rotation[axis as 'x' | 'y' | 'z'] = original[axis as keyof BoneRotation] + radians;

                      setSelectedBones(prev => ({
                        ...prev,
                        [selectedBoneName!]: {
                          ...prev[selectedBoneName!],
                          currentRotation: {
                            ...prev[selectedBoneName!].currentRotation,
                            [axis]: value
                          }
                        }
                      }));
                    }}
                    style={{
                      width: '100%',
                      height: '20px',
                      background: '#333',
                      outline: 'none',
                      cursor: 'pointer'
                    }}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Confirmation Popup - rendered as portal to body for full-screen coverage */}
      {showConfirmRemove && typeof window !== 'undefined' && createPortal(
        <ConfirmationPopup
          isOpen={showConfirmRemove}
          title="Remove Avatar"
          message={`Remove avatar "${(selectedAvatar as any)?.displayName || selectedAvatar?.id || 'Unknown'}" from the scene?`}
          confirmText="Remove"
          cancelText="Cancel"
          onConfirm={confirmRemoveAvatar}
          onCancel={cancelRemoveAvatar}
        />,
        document.body
      )}
    </div>
  );
}