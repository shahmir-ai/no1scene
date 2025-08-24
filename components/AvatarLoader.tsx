'use client';

import React, { useRef, useState } from 'react';
import { GLTFLoader } from 'three-stdlib';
import * as THREE from 'three';
import { useSceneStore, useAvatars } from '../lib/store';
import { setupIKForAvatar } from '../lib/three/ik';
import { applyNeutralPose } from '../lib/three/poseUtils';

export function AvatarLoader() {
  const { addAvatar, removeAvatar, setAvatarObject, setSelectedAvatar, setAvatarIK } = useSceneStore();
  const avatars = useAvatars();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);

  const generateAvatarId = () => {
    return `avatar_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  const extractMorphTargetNames = (object: THREE.Object3D): string[] => {
    const morphTargets: string[] = [];
    
    object.traverse((child) => {
      if (child instanceof THREE.SkinnedMesh && child.morphTargetDictionary) {
        Object.keys(child.morphTargetDictionary).forEach(name => {
          if (!morphTargets.includes(name)) {
            morphTargets.push(name);
          }
        });
      }
    });
    
    return morphTargets;
  };

  const extractBones = (object: THREE.Object3D): { [name: string]: THREE.Object3D } => {
    const bones: { [name: string]: THREE.Object3D } = {};
    
    object.traverse((child) => {
      if (child instanceof THREE.Bone) {
        bones[child.name] = child;
      }
    });
    
    return bones;
  };

  const findSkinnedMesh = (object: THREE.Object3D): THREE.SkinnedMesh | undefined => {
    let skinnedMesh: THREE.SkinnedMesh | undefined;
    
    object.traverse((child) => {
      if (child instanceof THREE.SkinnedMesh && !skinnedMesh) {
        skinnedMesh = child;
      }
    });
    
    return skinnedMesh;
  };

  const calculateAutoScale = (object: THREE.Object3D, targetHeight: number = 5.0): number => {
    // Calculate the bounding box of the entire object
    const box = new THREE.Box3().setFromObject(object);
    const currentHeight = box.max.y - box.min.y;
    
    console.log(`Original model height: ${currentHeight.toFixed(4)} units`);
    
    // If the model is extremely small (< 0.01), it's probably in millimeters
    if (currentHeight < 0.01) {
      const scale = (targetHeight / currentHeight) * 1000;
      console.log(`Very tiny model detected, scaling by ${scale.toFixed(2)} (assuming millimeters)`);
      return scale;
    }
    
    // If the model is small (< 1), it might be in centimeters or small units
    if (currentHeight < 1) {
      const scale = targetHeight / currentHeight;
      console.log(`Small model detected, scaling by ${scale.toFixed(2)} to reach ${targetHeight}m`);
      return scale;
    }
    
    // If the model is huge (> 20), scale it down
    if (currentHeight > 20) {
      const scale = targetHeight / currentHeight;
      console.log(`Large model detected, scaling down by ${scale.toFixed(3)}`);
      return scale;
    }
    
    // For normal-ish sized models, scale to target height
    const scale = targetHeight / currentHeight;
    console.log(`Normal model, scaling by ${scale.toFixed(3)} to reach ${targetHeight}m`);
    return scale;
  };

  const loadGLTF = async (file: File): Promise<void> => {
    setIsLoading(true);
    setLoadingProgress(0);

    try {
      const loader = new GLTFLoader();
      const url = URL.createObjectURL(file);
      
      // Load the GLTF file
      const gltf = await new Promise<any>((resolve, reject) => {
        loader.load(
          url,
          (gltf) => resolve(gltf),
          (progress) => {
            if (progress.lengthComputable) {
              const percent = (progress.loaded / progress.total) * 100;
              setLoadingProgress(percent);
            }
          },
          (error) => reject(error)
        );
      });

      // Clean up the object URL
      URL.revokeObjectURL(url);

      // Process the loaded model
      const scene = gltf.scene;
      scene.name = file.name.replace(/\.[^/.]+$/, ''); // Remove file extension
      
      // Extract morph targets and bones
      const morphTargets = extractMorphTargetNames(scene);
      const bones = extractBones(scene);
      const skinnedMesh = findSkinnedMesh(scene);

      // Set up materials for better rendering
      scene.traverse((child: THREE.Object3D) => {
        if (child instanceof THREE.Mesh) {
          child.castShadow = true;
          child.receiveShadow = true;
          
          // Ensure materials work with lights
          if (child.material instanceof THREE.MeshStandardMaterial) {
            child.material.envMapIntensity = 0.5;
          }
        }
      });

      // Auto-scale the avatar to visible size (~5m for better visibility)
      const autoScale = calculateAutoScale(scene, 5.0);
      scene.scale.set(autoScale, autoScale, autoScale);

      // Position the avatar properly (move to floor level if needed)
      const box = new THREE.Box3().setFromObject(scene);
      const yOffset = -box.min.y; // Move bottom of model to Y=0
      scene.position.set(0, yOffset, 0);

      // Create avatar data
      const avatarId = generateAvatarId();
      const avatarData = {
        id: avatarId,
        src: file.name,
        position: [0, yOffset, 0] as [number, number, number],
        rotationEuler: [0, 0, 0] as [number, number, number],
        scale: autoScale,
        pose: {},
        morphs: {},
      };

      // Add to store
      addAvatar(avatarData);
      
      // Set the Three.js object
      setAvatarObject(avatarId, scene, bones, morphTargets, skinnedMesh);

      // Set up IK if possible
      if (skinnedMesh && (window as any).__scene) {
        try {
          const ikSetup = setupIKForAvatar(skinnedMesh, (window as any).__scene);
          if (ikSetup) {
            console.log(`IK setup successful for ${file.name}:`, ikSetup.chains.map(c => c.name));
            setAvatarIK(avatarId, ikSetup);
          }
        } catch (error) {
          console.warn('Failed to setup IK for avatar:', error);
          setAvatarIK(avatarId, null);
        }
      } else {
        setAvatarIK(avatarId, null);
      }

      // Apply neutral pose for rigged models
      if (skinnedMesh && bones && Object.keys(bones).length > 0) {
        try {
          console.log(`Applying neutral pose to rigged model: ${file.name}`);
          applyNeutralPose(skinnedMesh);
        } catch (error) {
          console.warn('Failed to apply neutral pose:', error);
        }
      }

      // Auto-select the new avatar
      setSelectedAvatar(avatarId);

      console.log(`Avatar loaded successfully:`, {
        name: file.name,
        morphTargets: morphTargets.length,
        bones: Object.keys(bones).length,
        hasSkinnedMesh: !!skinnedMesh,
      });

    } catch (error) {
      console.error('Failed to load avatar:', error);
      alert(`Failed to load avatar: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
      setLoadingProgress(0);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const validExtensions = ['.glb', '.gltf'];
      const fileExtension = file.name.toLowerCase().slice(file.name.lastIndexOf('.'));
      
      if (!validExtensions.includes(fileExtension)) {
        alert('Please select a .glb or .gltf file');
        return;
      }
      
      loadGLTF(file);
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    
    if (file) {
      const validExtensions = ['.glb', '.gltf'];
      const fileExtension = file.name.toLowerCase().slice(file.name.lastIndexOf('.'));
      
      if (!validExtensions.includes(fileExtension)) {
        alert('Please drop a .glb or .gltf file');
        return;
      }
      
      loadGLTF(file);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const handleRemoveAvatar = (avatarId: string) => {
    removeAvatar(avatarId);
  };

  const handleSelectAvatar = (avatarId: string) => {
    setSelectedAvatar(avatarId);
  };

  return (
    <div className="panel">
      <h3>Avatars</h3>
      
      {/* Upload Area */}
      <div className="control-group">
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onClick={() => fileInputRef.current?.click()}
          style={{
            border: '2px dashed #666',
            borderRadius: '8px',
            padding: '20px',
            textAlign: 'center',
            cursor: 'pointer',
            background: isLoading ? 'rgba(0, 112, 243, 0.1)' : 'rgba(255, 255, 255, 0.05)',
            transition: 'all 0.2s ease',
          }}
        >
          {isLoading ? (
            <div>
              <div style={{ marginBottom: '8px', fontSize: '12px' }}>
                Loading avatar...
              </div>
              <div style={{
                background: '#333',
                borderRadius: '4px',
                height: '4px',
                overflow: 'hidden',
              }}>
                <div style={{
                  background: '#0070f3',
                  height: '100%',
                  width: `${loadingProgress}%`,
                  transition: 'width 0.3s ease',
                }} />
              </div>
              <div style={{ fontSize: '10px', color: '#888', marginTop: '4px' }}>
                {Math.round(loadingProgress)}%
              </div>
            </div>
          ) : (
            <div>
              <div style={{ marginBottom: '8px', fontSize: '12px' }}>
                Drop .glb/.gltf files here
              </div>
              <div style={{ fontSize: '10px', color: '#888' }}>
                or click to browse
              </div>
            </div>
          )}
        </div>
        
        <input
          ref={fileInputRef}
          type="file"
          accept=".glb,.gltf"
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />
      </div>

      {/* Avatar List */}
      {avatars.length > 0 && (
        <div className="control-group">
          <label className="control-label">Loaded Avatars</label>
          {avatars.map((avatar) => (
            <div
              key={avatar.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px',
                background: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '4px',
                marginBottom: '4px',
                border: '1px solid transparent',
                cursor: 'pointer',
              }}
              onClick={() => handleSelectAvatar(avatar.id)}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ 
                  fontSize: '11px', 
                  fontWeight: 500,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}>
                  {avatar.src}
                </div>
                <div style={{ fontSize: '9px', color: '#888' }}>
                  {avatar.morphTargets?.length || 0} expressions • {Object.keys(avatar.bones || {}).length} bones
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveAvatar(avatar.id);
                }}
                style={{
                  background: '#ff4444',
                  border: 'none',
                  color: 'white',
                  padding: '4px 6px',
                  borderRadius: '3px',
                  fontSize: '10px',
                  cursor: 'pointer',
                  marginLeft: '8px',
                }}
              >
                ✕
              </button>
            </div>
          ))}
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
        <strong>Supported:</strong> .glb and .gltf files with rigged characters and morph targets for expressions
      </div>
    </div>
  );
}
