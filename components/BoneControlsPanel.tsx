'use client';

import React, { useState, useEffect } from 'react';
import { useSceneStore, useAvatars } from '../lib/store';
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

export function BoneControlsPanel() {
  const { ui } = useSceneStore();
  const avatars = useAvatars();
  const [selectedBones, setSelectedBones] = useState<{ [boneName: string]: BoneData }>({});
  const [originalRotations, setOriginalRotations] = useState<{ [boneName: string]: BoneRotation }>({});
  const [selectedBoneName, setSelectedBoneName] = useState<string | null>(null);

  // Get the currently selected avatar
  const selectedAvatar = avatars.find(avatar => avatar.id === ui.selectedAvatarId);

  // Major bones to show controls for (based on working HTML example)
  const majorBones = [
    // Mixamo naming convention
    'mixamorigHips', 'mixamorigSpine', 'mixamorigSpine1', 'mixamorigSpine2', 
    'mixamorigNeck', 'mixamorigHead',
    'mixamorigLeftShoulder', 'mixamorigLeftArm', 'mixamorigLeftForeArm', 'mixamorigLeftHand',
    'mixamorigRightShoulder', 'mixamorigRightArm', 'mixamorigRightForeArm', 'mixamorigRightHand',
    'mixamorigLeftUpLeg', 'mixamorigLeftLeg', 'mixamorigLeftFoot',
    'mixamorigRightUpLeg', 'mixamorigRightLeg', 'mixamorigRightFoot',
    // Alternative naming
    'Hips', 'Spine', 'Spine1', 'Spine2', 'Neck', 'Head', 
    'LeftShoulder', 'LeftArm', 'LeftForeArm', 'LeftHand',
    'RightShoulder', 'RightArm', 'RightForeArm', 'RightHand',
    'LeftUpLeg', 'LeftLeg', 'LeftFoot', 
    'RightUpLeg', 'RightLeg', 'RightFoot',
    // Unity/other naming
    'LeftUpperArm', 'RightUpperArm', 'LeftLowerArm', 'RightLowerArm',
    'LeftUpperLeg', 'RightUpperLeg', 'LeftLowerLeg', 'RightLowerLeg'
  ];

  // Find and store bones when avatar changes
  useEffect(() => {
    if (!selectedAvatar?.object) {
      setSelectedBones({});
      setOriginalRotations({});
      return;
    }

    const bones: { [name: string]: THREE.Bone } = {};
    const originals: { [name: string]: BoneRotation } = {};

    // Find all bones in the avatar
    selectedAvatar.object.traverse((child) => {
      if ((child as any).isBone) {
        const bone = child as THREE.Bone;
        bones[bone.name] = bone;
        // Store original rotation
        originals[bone.name] = {
          x: bone.rotation.x,
          y: bone.rotation.y,
          z: bone.rotation.z
        };
      }
    });

    // Create BoneData for major bones that exist
    const boneData: { [boneName: string]: BoneData } = {};
    const addedBones = new Set<string>();

    majorBones.forEach(boneName => {
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

  // Get rotation ranges for different bone types
  const getRotationRanges = (boneName: string) => {
    let xRange = [-90, 90];
    let yRange = [-90, 90]; 
    let zRange = [-90, 90];
    
    // Arms should have wider Z rotation range
    if (boneName.includes('Arm') && !boneName.includes('Fore')) {
      zRange = [-180, 180];
    }
    // Forearms mainly rotate on Y axis
    if (boneName.includes('ForeArm')) {
      yRange = [-135, 135];
    }
    // Legs have limited ranges
    if (boneName.includes('Leg') || boneName.includes('UpLeg')) {
      xRange = [-90, 45];
      yRange = [-45, 45];
      zRange = [-45, 45];
    }
    // Spine has moderate ranges
    if (boneName.includes('Spine') || boneName.includes('Hips')) {
      xRange = [-45, 45];
      yRange = [-60, 60];
      zRange = [-30, 30];
    }
    // Head and neck
    if (boneName.includes('Head') || boneName.includes('Neck')) {
      xRange = [-60, 60];
      yRange = [-90, 90];
      zRange = [-45, 45];
    }
    
    return { xRange, yRange, zRange };
  };

  // Handle bone rotation change
  const handleBoneRotation = (boneName: string, axis: 'x' | 'y' | 'z', degrees: number) => {
    const boneData = selectedBones[boneName];
    if (!boneData) return;

    const radians = THREE.MathUtils.degToRad(degrees);
    const original = boneData.originalRotation;

    // Apply rotation relative to original
    boneData.bone.rotation[axis] = original[axis] + radians;

    // Update current rotation tracking
    setSelectedBones(prev => ({
      ...prev,
      [boneName]: {
        ...prev[boneName],
        currentRotation: {
          ...prev[boneName].currentRotation,
          [axis]: degrees
        }
      }
    }));
  };

  // Reset all bones to original positions
  const resetPose = () => {
    Object.entries(selectedBones).forEach(([boneName, boneData]) => {
      const original = boneData.originalRotation;
      boneData.bone.rotation.x = original.x;
      boneData.bone.rotation.y = original.y;
      boneData.bone.rotation.z = original.z;
    });

    // Reset UI state
    setSelectedBones(prev => {
      const updated = { ...prev };
      Object.keys(updated).forEach(boneName => {
        updated[boneName].currentRotation = { x: 0, y: 0, z: 0 };
      });
      return updated;
    });
  };

  // Apply neutral pose - natural relaxed standing position
  const applyNeutralPose = () => {
    // First reset to original
    resetPose();

    // Helper to find bone with multiple naming conventions
    const findBone = (names: string[]) => {
      for (let name of names) {
        if (selectedBones[name]) return selectedBones[name];
      }
      return null;
    };

    // Helper to add rotation in degrees to existing rotation
    const addRotationDeg = (boneData: BoneData | null, x?: number, y?: number, z?: number) => {
      if (!boneData) return;
      
      const original = boneData.originalRotation;
      if (x !== undefined) {
        boneData.bone.rotation.x = original.x + THREE.MathUtils.degToRad(x);
        boneData.currentRotation.x = x;
      }
      if (y !== undefined) {
        boneData.bone.rotation.y = original.y + THREE.MathUtils.degToRad(y);
        boneData.currentRotation.y = y;
      }
      if (z !== undefined) {
        boneData.bone.rotation.z = original.z + THREE.MathUtils.degToRad(z);
        boneData.currentRotation.z = z;
      }
    };

    // Natural neutral pose - arms slightly away from body, relaxed stance
    const leftArm = findBone(['mixamorigLeftArm', 'LeftArm', 'LeftUpperArm']);
    const rightArm = findBone(['mixamorigRightArm', 'RightArm', 'RightUpperArm']);
    const leftForeArm = findBone(['mixamorigLeftForeArm', 'LeftForeArm', 'LeftLowerArm']);
    const rightForeArm = findBone(['mixamorigRightForeArm', 'RightForeArm', 'RightLowerArm']);
    
    // Arms naturally at sides with slight outward angle
    addRotationDeg(leftArm, 0, 0, 15);   // Left arm slightly away from body
    addRotationDeg(rightArm, 0, 0, -15); // Right arm slightly away from body
    
    // Slight bend in elbows for natural look
    addRotationDeg(leftForeArm, 0, -10, 0);  // Small forward bend
    addRotationDeg(rightForeArm, 0, 10, 0);  // Small forward bend

    // Force re-render to update sliders
    setSelectedBones(prev => ({ ...prev }));
  };

  // Set pose presets
  const setPosePreset = (poseType: string) => {
    // First reset to original
    resetPose();

    // Helper to find bone with multiple naming conventions
    const findBone = (names: string[]) => {
      for (let name of names) {
        if (selectedBones[name]) return selectedBones[name];
      }
      return null;
    };

    // Helper to add rotation in degrees to existing rotation
    const addRotationDeg = (boneData: BoneData | null, x?: number, y?: number, z?: number) => {
      if (!boneData) return;
      
      const original = boneData.originalRotation;
      if (x !== undefined) {
        boneData.bone.rotation.x = original.x + THREE.MathUtils.degToRad(x);
        boneData.currentRotation.x = x;
      }
      if (y !== undefined) {
        boneData.bone.rotation.y = original.y + THREE.MathUtils.degToRad(y);
        boneData.currentRotation.y = y;
      }
      if (z !== undefined) {
        boneData.bone.rotation.z = original.z + THREE.MathUtils.degToRad(z);
        boneData.currentRotation.z = z;
      }
    };

    switch (poseType) {
      case 'tpose':
        const leftArmT = findBone(['mixamorigLeftArm', 'LeftArm', 'LeftUpperArm']);
        const rightArmT = findBone(['mixamorigRightArm', 'RightArm', 'RightUpperArm']);
        addRotationDeg(leftArmT, 0, 0, 90);
        addRotationDeg(rightArmT, 0, 0, -90);
        break;
        
      case 'apose':
        const leftArmA = findBone(['mixamorigLeftArm', 'LeftArm', 'LeftUpperArm']);
        const rightArmA = findBone(['mixamorigRightArm', 'RightArm', 'RightUpperArm']);
        addRotationDeg(leftArmA, 0, 0, 45);
        addRotationDeg(rightArmA, 0, 0, -45);
        break;
        
      case 'action':
        const leftArmAction = findBone(['mixamorigLeftArm', 'LeftArm', 'LeftUpperArm']);
        const rightArmAction = findBone(['mixamorigRightArm', 'RightArm', 'RightUpperArm']);
        const leftForeArm = findBone(['mixamorigLeftForeArm', 'LeftForeArm', 'LeftLowerArm']);
        const rightForeArm = findBone(['mixamorigRightForeArm', 'RightForeArm', 'RightLowerArm']);
        
        addRotationDeg(leftArmAction, -20, 0, 30);
        addRotationDeg(rightArmAction, 10, 0, -15);
        addRotationDeg(leftForeArm, 0, -30, 0);
        addRotationDeg(rightForeArm, 0, 20, 0);
        break;
    }

    // Force re-render to update sliders
    setSelectedBones(prev => ({ ...prev }));
  };

  if (!selectedAvatar) {
    return (
      <div className="panel">
        <h3>Avatar Posing</h3>
        <div style={{ color: '#888', fontSize: '12px' }}>
          Select an avatar to control bones
        </div>
      </div>
    );
  }

  if (Object.keys(selectedBones).length === 0) {
    return (
      <div className="panel">
        <h3>Avatar Posing</h3>
        <div style={{ color: '#888', fontSize: '12px' }}>
          No compatible bones found in avatar
        </div>
      </div>
    );
  }

  // Get all available bones for the visual selector
  const availableBones: { [name: string]: THREE.Bone } = {};
  Object.entries(selectedBones).forEach(([name, boneData]) => {
    availableBones[name] = boneData.bone;
  });

  // Get selected bone data
  const selectedBoneData = selectedBoneName ? selectedBones[selectedBoneName] : null;

  // Format bone names for display
  const formatBoneName = (boneName: string): string => {
    return boneName
      .replace(/mixamorig/g, '')
      .replace(/([A-Z])/g, ' $1')
      .replace(/Up Leg/g, 'Upper Leg')
      .replace(/Fore Arm/g, 'Forearm')
      .replace(/([0-9])/g, ' $1')
      .trim()
      .toLowerCase()
      .replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <div className="panel">
      <h3>Avatar Posing</h3>
      
      {/* Visual Bone Selector */}
      <VisualBoneSelector
        availableBones={availableBones}
        onBoneSelect={setSelectedBoneName}
        selectedBone={selectedBoneName}
      />
      
      {/* Reset button */}
      <div style={{ margin: '15px 0' }}>
        <button 
          className="control-button secondary"
          onClick={resetPose}
          style={{ 
            fontSize: '11px', 
            padding: '8px 12px',
            width: '100%'
          }}
        >
          Reset Pose
        </button>
      </div>

      {/* Single Bone Controls - only show for selected bone */}
      {selectedBoneData && (
        <div style={{ 
          background: '#1a1a1a',
          padding: '15px',
          borderRadius: '4px',
          border: '1px solid #0070f3'
        }}>
          <div style={{ 
            fontWeight: 'bold', 
            marginBottom: '12px', 
            color: '#0070f3', 
            fontSize: '12px',
            textAlign: 'center'
          }}>
            {formatBoneName(selectedBoneName!)}
          </div>
          
          {(() => {
            const { xRange, yRange, zRange } = getRotationRanges(selectedBoneName!);
            const current = selectedBoneData.currentRotation;
            
            return (
              <>
                {/* X Axis */}
                <div style={{ marginBottom: '12px' }}>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '5px'
                  }}>
                    <span style={{ fontWeight: 'bold', color: '#ff6b6b' }}>X-Axis</span>
                    <span style={{ fontSize: '10px', color: '#888' }}>{current.x.toFixed(1)}°</span>
                  </div>
                  <input
                    type="range"
                    min={xRange[0]}
                    max={xRange[1]}
                    value={current.x}
                    onChange={(e) => handleBoneRotation(selectedBoneName!, 'x', parseFloat(e.target.value))}
                    style={{ 
                      width: '100%',
                      height: '6px',
                      background: '#333',
                      borderRadius: '3px',
                      outline: 'none'
                    }}
                  />
                </div>
                
                {/* Y Axis */}
                <div style={{ marginBottom: '12px' }}>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '5px'
                  }}>
                    <span style={{ fontWeight: 'bold', color: '#4CAF50' }}>Y-Axis</span>
                    <span style={{ fontSize: '10px', color: '#888' }}>{current.y.toFixed(1)}°</span>
                  </div>
                  <input
                    type="range"
                    min={yRange[0]}
                    max={yRange[1]}
                    value={current.y}
                    onChange={(e) => handleBoneRotation(selectedBoneName!, 'y', parseFloat(e.target.value))}
                    style={{ 
                      width: '100%',
                      height: '6px',
                      background: '#333',
                      borderRadius: '3px',
                      outline: 'none'
                    }}
                  />
                </div>
                
                {/* Z Axis */}
                <div style={{ marginBottom: '8px' }}>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '5px'
                  }}>
                    <span style={{ fontWeight: 'bold', color: '#64B5F6' }}>Z-Axis</span>
                    <span style={{ fontSize: '10px', color: '#888' }}>{current.z.toFixed(1)}°</span>
                  </div>
                  <input
                    type="range"
                    min={zRange[0]}
                    max={zRange[1]}
                    value={current.z}
                    onChange={(e) => handleBoneRotation(selectedBoneName!, 'z', parseFloat(e.target.value))}
                    style={{ 
                      width: '100%',
                      height: '6px',
                      background: '#333',
                      borderRadius: '3px',
                      outline: 'none'
                    }}
                  />
                </div>
              </>
            );
          })()}
        </div>
      )}
      
      {/* No bone selected message */}
      {!selectedBoneData && Object.keys(selectedBones).length > 0 && (
        <div style={{ 
          background: '#1a1a1a',
          padding: '15px',
          borderRadius: '4px',
          textAlign: 'center',
          color: '#888',
          fontSize: '11px'
        }}>
          Click to select body part
        </div>
      )}
    </div>
  );
}
