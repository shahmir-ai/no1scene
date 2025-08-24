'use client';

import React, { useRef, useEffect, useState } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { OrbitControls, Grid, TransformControls } from '@react-three/drei';
import * as THREE from 'three';
import { useSceneStore, useCamera, useLighting, useBackground, useAvatars, useUI } from '../lib/store';
import { loadHDRI, applyHDRIToScene, removeHDRIFromScene, createDefaultEnvironment } from '../lib/three/loadHDRI';


// Simple working scale handle - rebuilt from scratch
function ScaleHandle({ target, onScale }: { target: THREE.Group, onScale: (scale: number) => void }) {
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ y: 0, scale: 1 });
  const { gl } = useThree();

  // Position the handle above the avatar
  const handlePosition = new THREE.Vector3();
  if (target) {
    const box = new THREE.Box3().setFromObject(target);
    handlePosition.copy(box.max);
    handlePosition.y += 0.8; // Float above the avatar
  }

  const startDrag = (event: any) => {
    event.stopPropagation();
    setIsDragging(true);
    dragStart.current = {
      y: event.clientY,
      scale: target.scale.x
    };
    
    // Disable orbit controls
    const controls = (window as any).__orbitControls;
    if (controls) controls.enabled = false;
  };

  useEffect(() => {
    if (!isDragging) return;

    const onMove = (event: MouseEvent) => {
      const deltaY = dragStart.current.y - event.clientY; // Up = bigger
      const sensitivity = 0.01;
      const newScale = Math.max(0.1, Math.min(3.0, dragStart.current.scale + deltaY * sensitivity));
      onScale(newScale);
    };

    const onEnd = () => {
      setIsDragging(false);
      // Re-enable orbit controls
      const controls = (window as any).__orbitControls;
      if (controls) controls.enabled = true;
    };

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onEnd);

    return () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onEnd);
    };
  }, [isDragging, onScale]);

  return (
    <group position={handlePosition}>
      {/* Large invisible clickable sphere */}
      <mesh onPointerDown={startDrag}>
        <sphereGeometry args={[0.4]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>
      
      {/* Visible white sphere handle */}
      <mesh>
        <sphereGeometry args={[0.15]} />
        <meshBasicMaterial 
          color={isDragging ? "#00ff00" : "#ffffff"} 
          transparent 
          opacity={0.8}
        />
      </mesh>
      
      {/* Up/down arrows for clarity */}
      <mesh position={[0, 0.3, 0]}>
        <coneGeometry args={[0.08, 0.15]} />
        <meshBasicMaterial 
          color={isDragging ? "#00ff00" : "#ffffff"} 
          transparent 
          opacity={0.8}
        />
      </mesh>
      
      <mesh position={[0, -0.3, 0]} rotation={[Math.PI, 0, 0]}>
        <coneGeometry args={[0.08, 0.15]} />
        <meshBasicMaterial 
          color={isDragging ? "#00ff00" : "#ffffff"} 
          transparent 
          opacity={0.8}
        />
      </mesh>
    </group>
  );
}

// Avatar with transform controls component
function AvatarWithTransform({ avatar }: { avatar: any }) {
  const { setSelectedAvatar, updateAvatar } = useSceneStore();
  const ui = useUI();
  const groupRef = useRef<THREE.Group>(null);
  const transformRef = useRef<any>(null);
  const { camera, gl } = useThree();
  
  const isSelected = ui.selectedAvatarId === avatar.id;

  const handleSelect = (event: any) => {
    event.stopPropagation();
    setSelectedAvatar(avatar.id);
  };

            // Handle uniform scaling - any scale handle will scale proportionally
          useFrame(() => {
            if (transformRef.current && groupRef.current && ui.transformMode === 'scale') {
              const group = groupRef.current;
              // Force uniform scaling by making all axes the same
              const scale = Math.max(group.scale.x, group.scale.y, group.scale.z);
              group.scale.set(scale, scale, scale);
            }
          });

  return (
    <>
      <group
        ref={groupRef}
        position={avatar.position}
        rotation={avatar.rotationEuler}
        scale={avatar.scale}
        onClick={handleSelect}
      >
        <primitive object={avatar.object} />
      </group>
      
              {/* Transform Controls - only show when in move mode and not in scale mode */}
        {isSelected && groupRef.current && ui.activeTool === 'move' && ui.transformMode !== 'scale' && (
          <TransformControls
            ref={transformRef}
            object={groupRef.current}
            camera={camera}
            domElement={gl.domElement}
            mode={ui.transformMode}
            onMouseDown={() => {
              const controls = (window as any).__orbitControls;
              if (controls) controls.enabled = false;
            }}
            onMouseUp={() => {
              const controls = (window as any).__orbitControls;
              if (controls) controls.enabled = true;
              
              // Update avatar data in store
              if (groupRef.current) {
                const group = groupRef.current;
                updateAvatar(avatar.id, {
                  position: [group.position.x, group.position.y, group.position.z],
                  rotationEuler: [group.rotation.x, group.rotation.y, group.rotation.z],
                  scale: group.scale.x,
                });
              }
            }}
            size={0.7}
            space="world"
            showX={true}
            showY={true}
            showZ={true}
            translationSnap={ui.transformMode === 'translate' ? 0.25 : null}
            rotationSnap={ui.transformMode === 'rotate' ? Math.PI / 8 : null}
          />
        )}
        
        {/* Custom intuitive scale handle - only show when in move mode and scale mode */}
        {isSelected && groupRef.current && ui.activeTool === 'move' && ui.transformMode === 'scale' && (
          <ScaleHandle 
            target={groupRef.current}
            onScale={(scale) => {
              if (groupRef.current) {
                const group = groupRef.current;
                group.scale.set(scale, scale, scale);
                updateAvatar(avatar.id, {
                  position: [group.position.x, group.position.y, group.position.z],
                  rotationEuler: [group.rotation.x, group.rotation.y, group.rotation.z],
                  scale: scale,
                });
              }
            }}
          />
        )}


    </>
  );
}

// Scene setup component that runs inside the Canvas
function SceneSetup() {
  const { scene, gl, camera } = useThree();
  const cameraData = useCamera();
  const lighting = useLighting();
  const background = useBackground();
  const avatars = useAvatars();
  const { updateCamera } = useSceneStore();
  
  // Store renderer reference for exports
  useEffect(() => {
    // Store renderer reference in a way that export functions can access it
    (window as any).__sceneRenderer = gl;
    (window as any).__sceneCamera = camera;
    (window as any).__scene = scene;
  }, [gl, camera, scene]);

  // Set up initial environment
  useEffect(() => {
    const defaultEnv = createDefaultEnvironment();
    scene.environment = defaultEnv;
  }, [scene]);

  // Handle HDRI loading
  useEffect(() => {
    if (background.mode === 'hdri' && background.hdriPath) {
      loadHDRI(background.hdriPath)
        .then(({ envMap }) => {
          applyHDRIToScene(scene, envMap, lighting.hdri?.exposure || 1);
        })
        .catch((error) => {
          console.error('Failed to load HDRI:', error);
          // Fallback to default environment
          const defaultEnv = createDefaultEnvironment();
          scene.environment = defaultEnv;
        });
    } else if (background.mode === 'flat') {
      removeHDRIFromScene(scene);
      scene.background = new THREE.Color(background.color || '#000000');
    } else {
      removeHDRIFromScene(scene);
    }
  }, [scene, background, lighting.hdri?.exposure]);

  // Update camera position and target
  useEffect(() => {
    if (camera instanceof THREE.PerspectiveCamera) {
      camera.position.set(...cameraData.position);
      camera.lookAt(...cameraData.target);
      camera.fov = cameraData.fov;
      camera.updateProjectionMatrix();
    }
  }, [camera, cameraData]);

  // Render avatars with transforms
  const avatarObjects = avatars.map((avatar) => {
    if (!avatar.object) return null;

    return (
      <AvatarWithTransform
        key={avatar.id}
        avatar={avatar}
      />
    );
  }).filter(Boolean);

  return (
    <>
      {avatarObjects}
    </>
  );
}

// Light setup component
function LightSetup() {
  const lighting = useLighting();
  const lightRef = useRef<THREE.DirectionalLight>(null);

  // Update light properties
  useFrame(() => {
    if (lightRef.current) {
      const light = lightRef.current;
      light.intensity = lighting.key.intensity;
      light.color.setHex(parseInt(lighting.key.color.replace('#', ''), 16));
      
      // Convert azimuth and elevation to position
      const azimuth = (lighting.key.azimuth * Math.PI) / 180;
      const elevation = (lighting.key.elevation * Math.PI) / 180;
      
      const distance = 10;
      light.position.set(
        distance * Math.cos(elevation) * Math.cos(azimuth),
        distance * Math.sin(elevation),
        distance * Math.cos(elevation) * Math.sin(azimuth)
      );
    }
  });

  return (
    <directionalLight
      ref={lightRef}
      castShadow
      shadow-mapSize-width={2048}
      shadow-mapSize-height={2048}
      shadow-camera-far={50}
      shadow-camera-left={-10}
      shadow-camera-right={10}
      shadow-camera-top={10}
      shadow-camera-bottom={-10}
    />
  );
}

// FPS Counter component
function FPSCounter({ onFpsUpdate }: { onFpsUpdate: (fps: number) => void }) {
  const frameCount = useRef(0);
  const lastTime = useRef(performance.now());

  useFrame(() => {
    frameCount.current++;
    const currentTime = performance.now();
    
    if (currentTime - lastTime.current >= 1000) {
      const newFps = Math.round((frameCount.current * 1000) / (currentTime - lastTime.current));
      onFpsUpdate(newFps);
      frameCount.current = 0;
      lastTime.current = currentTime;
    }
  });

  return null; // This component doesn't render anything in the 3D scene
}

// Camera info overlay component  
function CameraInfo() {
  const { updateCamera } = useSceneStore();
  const camera = useCamera();

  return (
    <div style={{
      position: 'absolute',
      bottom: '20px',
      right: '20px',
      pointerEvents: 'auto',
      background: 'rgba(0, 0, 0, 0.7)',
      padding: '12px',
      borderRadius: '8px',
      backdropFilter: 'blur(10px)',
      minWidth: '120px'
    }}>
      {/* Target coordinates display */}
      <div style={{
        fontSize: '11px',
        color: '#ccc',
        textAlign: 'center',
        marginBottom: '8px'
      }}>
        Camera Target
      </div>
      
      <div style={{
        fontSize: '9px',
        color: '#888',
        textAlign: 'center',
        marginBottom: '8px'
      }}>
        X: {camera.target[0].toFixed(1)} Y: {camera.target[1].toFixed(1)}
      </div>
      
      {/* Reset button */}
      <button
        onClick={() => updateCamera({ 
          position: [0, 15, 20], 
          target: [0, 0, 0] 
        })}
        style={{
          width: '100%',
          height: '24px',
          background: '#333',
          border: '1px solid #555',
          borderRadius: '4px',
          color: '#ccc',
          cursor: 'pointer',
          fontSize: '10px'
        }}
        title="Reset camera position and rotation"
      >
        Reset Camera
      </button>
      
      <div style={{
        fontSize: '8px',
        color: '#666',
        textAlign: 'center',
        marginTop: '6px',
        lineHeight: '1.2'
      }}>
        Use WASD to pan camera
      </div>
    </div>
  );
}

// Camera controls component
function CameraControls() {
  const { updateCamera } = useSceneStore();
  const controlsRef = useRef<any>(null);
  const cameraData = useCamera();
  const applyingPreset = useRef(false);
  const lastSyncTime = useRef(0);

  useFrame(({ camera }) => {
    if (controlsRef.current) {
      const controls = controlsRef.current;
      
      // Apply preset changes
      if (applyingPreset.current) {
        camera.position.set(...cameraData.position);
        controls.target.set(...cameraData.target);
        controls.update();
        applyingPreset.current = false;
      } else {
        // CONSTANTLY sync store with actual camera - this is the ONE source of truth
        const now = Date.now();
        if (now - lastSyncTime.current > 50) { // Update UI 20 times per second
          updateCamera({
            position: [
              Math.round(camera.position.x * 100) / 100,
              Math.round(camera.position.y * 100) / 100,
              Math.round(camera.position.z * 100) / 100
            ],
            target: [
              Math.round(controls.target.x * 100) / 100,
              Math.round(controls.target.y * 100) / 100,
              Math.round(controls.target.z * 100) / 100
            ],

          });
          lastSyncTime.current = now;
        }
      }

    }
  });

  // Listen for preset changes only
  useEffect(() => {
    applyingPreset.current = true;
  }, [cameraData.position, cameraData.target]);

  // Expose controls globally for TransformControls
  useEffect(() => {
    if (controlsRef.current) {
      (window as any).__orbitControls = controlsRef.current;
    }
  }, []);

  return (
    <OrbitControls
      ref={controlsRef}
      enablePan={true}
      enableZoom={true}
      enableRotate={true}
      maxPolarAngle={Math.PI * 0.9}
      minDistance={0.5}
      maxDistance={50}
    />
  );
}

export function SceneCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ui = useUI();
  const [fps, setFps] = useState(0);

  return (
    <div className="canvas-container" style={{ width: '100%', height: '100%' }}>
      <Canvas
        ref={canvasRef}
        style={{
          width: '100%',
          height: '100%',
        }}
        camera={{
          position: [0, 15, 20],
          fov: 50,
          near: 0.1,
          far: 1000,
        }}
        resize={{ scroll: false, debounce: { scroll: 50, resize: 0 } }}
        shadows
        gl={{
          antialias: true,
          alpha: true,
          preserveDrawingBuffer: true,
          outputColorSpace: THREE.SRGBColorSpace,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1,
        }}
      >
        <SceneSetup />
        <LightSetup />
        <CameraControls />
        <FPSCounter onFpsUpdate={setFps} />
        
        {/* Grid - Much larger canvas area */}
        {ui.showGrid && (
          <Grid
            position={[0, 0, 0]}
            args={[100, 100]}
            cellSize={1}
            cellThickness={0.5}
            cellColor="#444444"
            sectionSize={10}
            sectionThickness={1}
            sectionColor="#666666"
          />
        )}
        
        {/* Ambient light for basic illumination */}
        <ambientLight intensity={0.3} />
      </Canvas>
      
      {/* Canvas overlay for UI elements */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        pointerEvents: 'none',
        padding: '16px',
      }}>
        {/* Top left info */}
        <div style={{
          position: 'absolute',
          top: '16px',
          left: '16px',
        }}>
          <div style={{
            background: 'rgba(0, 0, 0, 0.7)',
            color: 'white',
            padding: '8px 12px',
            borderRadius: '4px',
            fontSize: '12px',
            fontFamily: 'monospace',
          }}>
            Full Screen • {ui.showGrid ? 'Grid On' : 'Grid Off'}
          </div>
        </div>

        {/* Top right FPS */}
        <div style={{
          position: 'absolute',
          top: '16px',
          right: '16px',
        }}>
          <div style={{
            background: 'rgba(0, 0, 0, 0.7)',
            color: 'white',
            padding: '8px 12px',
            borderRadius: '4px',
            fontSize: '12px',
            fontFamily: 'monospace',
          }}>
            {fps} FPS
          </div>
        </div>
      </div>

      {/* Pan Controls Overlay */}
      <CameraInfo />
    </div>
  );
}
