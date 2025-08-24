'use client';

import React, { useState } from 'react';
import * as THREE from 'three';

interface BoneRegion {
  id: string;
  name: string;
  boneNames: string[];
  path: string;
  center: { x: number; y: number };
}

interface VisualBoneSelectorProps {
  availableBones: { [name: string]: THREE.Bone };
  onBoneSelect: (boneName: string) => void;
  selectedBone: string | null;
}

export function VisualBoneSelector({ availableBones, onBoneSelect, selectedBone }: VisualBoneSelectorProps) {
  const [hoveredRegion, setHoveredRegion] = useState<string | null>(null);

  // Define body regions with their corresponding bone names and SVG paths
  const bodyRegions: BoneRegion[] = [
    {
      id: 'head',
      name: 'Head',
      boneNames: ['mixamorigHead', 'Head'],
      path: 'M100 30 C110 20, 130 20, 140 30 C145 40, 145 50, 140 60 C130 70, 110 70, 100 60 C95 50, 95 40, 100 30 Z',
      center: { x: 120, y: 45 }
    },
    {
      id: 'neck',
      name: 'Neck',
      boneNames: ['mixamorigNeck', 'Neck'],
      path: 'M110 70 L130 70 L125 85 L115 85 Z',
      center: { x: 120, y: 77 }
    },
    {
      id: 'leftShoulder',
      name: 'Left Shoulder',
      boneNames: ['mixamorigLeftShoulder', 'LeftShoulder'],
      path: 'M85 85 C80 80, 75 85, 80 95 C85 100, 95 95, 100 90 L115 85 L85 85 Z',
      center: { x: 90, y: 87 }
    },
    {
      id: 'rightShoulder',
      name: 'Right Shoulder',
      boneNames: ['mixamorigRightShoulder', 'RightShoulder'],
      path: 'M155 85 C160 80, 165 85, 160 95 C155 100, 145 95, 140 90 L125 85 L155 85 Z',
      center: { x: 150, y: 87 }
    },
    {
      id: 'spine',
      name: 'Spine',
      boneNames: ['mixamorigSpine', 'mixamorigSpine1', 'mixamorigSpine2', 'Spine', 'Spine1', 'Spine2'],
      path: 'M115 85 L125 85 L130 140 L110 140 Z',
      center: { x: 120, y: 112 }
    },
    {
      id: 'hips',
      name: 'Hips',
      boneNames: ['mixamorigHips', 'Hips'],
      path: 'M105 140 L135 140 L140 160 L100 160 Z',
      center: { x: 120, y: 150 }
    },
    {
      id: 'leftArm',
      name: 'Left Upper Arm',
      boneNames: ['mixamorigLeftArm', 'LeftArm', 'LeftUpperArm'],
      path: 'M75 95 C70 90, 65 95, 65 105 L60 130 C65 135, 75 135, 80 130 L85 105 C85 100, 80 95, 75 95 Z',
      center: { x: 72, y: 115 }
    },
    {
      id: 'rightArm',
      name: 'Right Upper Arm',
      boneNames: ['mixamorigRightArm', 'RightArm', 'RightUpperArm'],
      path: 'M165 95 C170 90, 175 95, 175 105 L180 130 C175 135, 165 135, 160 130 L155 105 C155 100, 160 95, 165 95 Z',
      center: { x: 168, y: 115 }
    },
    {
      id: 'leftForearm',
      name: 'Left Forearm',
      boneNames: ['mixamorigLeftForeArm', 'LeftForeArm', 'LeftLowerArm'],
      path: 'M60 130 C55 125, 50 130, 50 140 L45 170 C50 175, 60 175, 65 170 L70 140 C70 135, 65 130, 60 130 Z',
      center: { x: 57, y: 152 }
    },
    {
      id: 'rightForearm',
      name: 'Right Forearm',
      boneNames: ['mixamorigRightForeArm', 'RightForeArm', 'RightLowerArm'],
      path: 'M180 130 C185 125, 190 130, 190 140 L195 170 C190 175, 180 175, 175 170 L170 140 C170 135, 175 130, 180 130 Z',
      center: { x: 183, y: 152 }
    },
    {
      id: 'leftHand',
      name: 'Left Hand',
      boneNames: ['mixamorigLeftHand', 'LeftHand'],
      path: 'M45 170 C40 165, 35 170, 35 180 L40 190 C45 195, 55 195, 60 190 L65 180 C65 175, 60 170, 55 170 L45 170 Z',
      center: { x: 50, y: 180 }
    },
    {
      id: 'rightHand',
      name: 'Right Hand',
      boneNames: ['mixamorigRightHand', 'RightHand'],
      path: 'M195 170 C200 165, 205 170, 205 180 L200 190 C195 195, 185 195, 180 190 L175 180 C175 175, 180 170, 185 170 L195 170 Z',
      center: { x: 190, y: 180 }
    },
    {
      id: 'leftThigh',
      name: 'Left Thigh',
      boneNames: ['mixamorigLeftUpLeg', 'LeftUpLeg', 'LeftUpperLeg'],
      path: 'M105 160 C100 155, 95 160, 95 170 L90 210 C95 215, 105 215, 110 210 L115 170 C115 165, 110 160, 105 160 Z',
      center: { x: 102, y: 185 }
    },
    {
      id: 'rightThigh',
      name: 'Right Thigh',
      boneNames: ['mixamorigRightUpLeg', 'RightUpLeg', 'RightUpperLeg'],
      path: 'M135 160 C140 155, 145 160, 145 170 L150 210 C145 215, 135 215, 130 210 L125 170 C125 165, 130 160, 135 160 Z',
      center: { x: 138, y: 185 }
    },
    {
      id: 'leftShin',
      name: 'Left Shin',
      boneNames: ['mixamorigLeftLeg', 'LeftLeg', 'LeftLowerLeg'],
      path: 'M90 210 C85 205, 80 210, 80 220 L75 260 C80 265, 90 265, 95 260 L100 220 C100 215, 95 210, 90 210 Z',
      center: { x: 87, y: 235 }
    },
    {
      id: 'rightShin',
      name: 'Right Shin',
      boneNames: ['mixamorigRightLeg', 'RightLeg', 'RightLowerLeg'],
      path: 'M150 210 C155 205, 160 210, 160 220 L165 260 C160 265, 150 265, 145 260 L140 220 C140 215, 145 210, 150 210 Z',
      center: { x: 153, y: 235 }
    },
    {
      id: 'leftFoot',
      name: 'Left Foot',
      boneNames: ['mixamorigLeftFoot', 'LeftFoot'],
      path: 'M75 260 C70 255, 60 260, 55 270 L65 280 L85 275 L95 265 C95 260, 90 255, 85 260 L75 260 Z',
      center: { x: 75, y: 270 }
    },
    {
      id: 'rightFoot',
      name: 'Right Foot',
      boneNames: ['mixamorigRightFoot', 'RightFoot'],
      path: 'M165 260 C170 255, 180 260, 185 270 L175 280 L155 275 L145 265 C145 260, 150 255, 155 260 L165 260 Z',
      center: { x: 165, y: 270 }
    }
  ];

  // Find which bone exists for each region
  const getAvailableBone = (region: BoneRegion): string | null => {
    for (const boneName of region.boneNames) {
      if (availableBones[boneName]) {
        return boneName;
      }
    }
    return null;
  };

  // Get color for region based on state
  const getRegionColor = (region: BoneRegion): string => {
    const availableBone = getAvailableBone(region);
    if (!availableBone) return '#333'; // Disabled
    
    if (selectedBone === availableBone) return '#0070f3'; // Selected
    if (hoveredRegion === region.id) return '#4CAF50'; // Hovered
    return '#666'; // Available
  };

  // Handle region click
  const handleRegionClick = (region: BoneRegion) => {
    const availableBone = getAvailableBone(region);
    if (availableBone) {
      onBoneSelect(availableBone);
    }
  };

  return (
    <div style={{ padding: '10px' }}>
      
      <svg
        width="240"
        height="300"
        viewBox="0 0 240 300"
        style={{
          width: '100%',
          maxWidth: '200px',
          height: 'auto',
          margin: '0 auto',
          display: 'block',
          background: '#1a1a1a',
          borderRadius: '8px',
          border: '1px solid #333'
        }}
      >
        {bodyRegions.map((region) => {
          const availableBone = getAvailableBone(region);
          const isAvailable = !!availableBone;
          
          return (
            <g key={region.id}>
              <path
                d={region.path}
                fill={getRegionColor(region)}
                stroke={isAvailable ? '#888' : '#444'}
                strokeWidth="1"
                style={{
                  cursor: isAvailable ? 'pointer' : 'not-allowed',
                  transition: 'fill 0.2s ease'
                }}
                onMouseEnter={() => isAvailable && setHoveredRegion(region.id)}
                onMouseLeave={() => setHoveredRegion(null)}
                onClick={() => handleRegionClick(region)}
              />

            </g>
          );
        })}
      </svg>
      
      {/* Legend */}
      <div style={{ 
        fontSize: '9px', 
        color: '#888', 
        textAlign: 'center',
        marginTop: '8px' 
      }}>

      </div>
    </div>
  );
}
