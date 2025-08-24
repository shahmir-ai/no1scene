'use client';

import React, { useRef, useEffect, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { GLTFLoader } from 'three-stdlib';
import * as THREE from 'three';
import { applyNeutralPose } from '../lib/three/poseUtils';

interface AvatarPreviewProps {
  modelUrl: string;
  width?: number;
  height?: number;
  variant?: 'library' | 'popup'; // Different zoom levels for different use cases
}

function RotatingModel({ modelUrl, variant = 'library' }: { modelUrl: string; variant?: 'library' | 'popup' }) {
  const meshRef = useRef<THREE.Group>(null);
  const [model, setModel] = useState<THREE.Group | null>(null);

  useEffect(() => {
    const loader = new GLTFLoader();
    loader.load(
      modelUrl,
      (gltf) => {
        const scene = gltf.scene;
        
        // Auto-scale the model to fit in view
        const box = new THREE.Box3().setFromObject(scene);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        
        // Different scaling based on variant
        const maxDim = Math.max(size.x, size.y, size.z);
        let scale: number;
        
        if (variant === 'popup') {
          // For popup: 2x zoom towards faces from current
          scale = 5 / maxDim;
          scene.scale.setScalar(scale);
          
          // Position for face focus
          scene.position.copy(center).multiplyScalar(-scale);
          scene.position.y -= (size.y * scale) / 2.5; // Focus on face area
        } else {
          // For library: double the current zoom
          scale = 6 / maxDim;
          scene.scale.setScalar(scale);
          
          // Position for normal view - move models up
          scene.position.copy(center).multiplyScalar(-scale);
          scene.position.y -= (size.y * scale) / 2.5; // Move models up higher
        }
        
        // Apply neutral pose if the model has a skeleton
        const skinnedMesh = scene.getObjectByProperty('type', 'SkinnedMesh') as THREE.SkinnedMesh;
        if (skinnedMesh && skinnedMesh.skeleton) {
          try {
            applyNeutralPose(skinnedMesh);
            console.log('Applied neutral pose to preview model');
          } catch (error) {
            console.log('Could not apply neutral pose to preview model:', error);
          }
        }
        
        setModel(scene);
      },
      (progress) => {
        // Loading progress
      },
      (error) => {
        console.error('Error loading model:', error);
      }
    );
  }, [modelUrl]);

  useFrame((state) => {
    if (meshRef.current) {
      // Dynamic rotation speed based on viewing angle
      const currentRotation = meshRef.current.rotation.y;
      const normalizedRotation = ((currentRotation % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
      
      // Face is visible when rotation is between 0 and PI (front 180 degrees)
      // Back is visible when rotation is between PI and 2*PI (back 180 degrees)
      const isFaceVisible = normalizedRotation < Math.PI;
      
      // Slow when face is visible (0.3), fast when back is visible (1.2)
      const speed = isFaceVisible ? 0.3 : 1.2;
      
      meshRef.current.rotation.y += speed * 0.016; // ~60fps delta time
    }
  });

  return model ? <primitive ref={meshRef} object={model} /> : null;
}

export function AvatarPreview({ modelUrl, width = 100, height = 80, variant = 'library' }: AvatarPreviewProps) {
  // Different camera settings based on variant
  const cameraSettings = variant === 'popup' 
    ? { position: [0, 1, 2] as [number, number, number], fov: 35 }  // Face focus for popup
    : { position: [0, 1, 2] as [number, number, number], fov: 40 }; // Double zoom for library

  return (
    <div style={{ width: `${width}px`, height: `${height}px` }}>
      <Canvas
        camera={{
          position: cameraSettings.position,
          fov: cameraSettings.fov,
          near: 0.1,
          far: 1000,
        }}
        style={{ background: '#333' }}
      >
        <ambientLight intensity={0.6} />
        <directionalLight position={[2, 2, 2]} intensity={0.8} />
        <RotatingModel modelUrl={modelUrl} variant={variant} />
      </Canvas>
    </div>
  );
}
