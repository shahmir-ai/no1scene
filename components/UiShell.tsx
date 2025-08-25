'use client';

import React, { useRef, useEffect } from 'react';
import { SceneCanvas } from './SceneCanvas';
import { AvatarToolsPanel } from './AvatarToolsPanel';
import { AvatarPopup } from './AvatarPopup';

import { LightPanel } from './LightPanel';
import { BackgroundPanel } from './BackgroundPanel';
import { ExpressionPanel } from './ExpressionPanel';
import { ExportPanel } from './ExportPanel';


import { useSceneStore, useCamera, useUI } from '../lib/store';
import * as THREE from 'three';
// import { CameraInfo } from './CameraInfo';
import { ScreenshotOverlay } from './ScreenshotOverlay';
import { ScreenshotPreview } from './ScreenshotPreview';

export function UiShell() {
  const { toggleGrid, resetScene, updateCamera, setTransformMode, setActiveTool, addAvatar, setAvatarObject, toggleScreenshotMode } = useSceneStore();
  const camera = useCamera();
  const [showAvatarPopup, setShowAvatarPopup] = React.useState(false);
  const objectFileInputRef = React.useRef<HTMLInputElement>(null);
  
  // Handle object file upload
  const handleObjectUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const url = URL.createObjectURL(file);
      
      // Simple object loader - no avatar processing
      const { GLTFLoader } = await import('three-stdlib');
      const loader = new GLTFLoader();
      
      const gltf = await new Promise<any>((resolve, reject) => {
        loader.load(
          url,
          (gltf) => resolve(gltf),
          undefined,
          (error) => reject(error)
        );
      });

      const scene = gltf.scene;
      scene.name = file.name.replace(/\.(glb|gltf)$/i, '');
      
      // Simple scaling for objects - keep original size or scale to reasonable bounds
      const box = new THREE.Box3().setFromObject(scene);
      const size = box.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z);
      
      // Scale objects to reasonable size (max dimension = 1.8 units, same as avatars)
      if (maxDim > 1.8) {
        const scale = 1.8 / maxDim;
        scene.scale.setScalar(scale);
        console.log(`Object scaled down by ${scale.toFixed(3)} to fit scene`);
      } else if (maxDim < 0.1) {
        const scale = 1.8 / maxDim;
        scene.scale.setScalar(scale);
        console.log(`Object scaled up by ${scale.toFixed(3)} to be visible`);
      } else {
        // For objects in reasonable range, keep original size
        console.log(`Object size is reasonable (${maxDim.toFixed(3)} units), keeping original scale`);
      }
      
      // Position object on the floor
      const scaledBox = new THREE.Box3().setFromObject(scene);
      scene.position.y = -scaledBox.min.y;
      
      // Generate unique ID for the object
      const objectId = `object_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Add as avatar but mark it as an object
      const objectData = {
        id: objectId,
        src: file.name,
        position: [0, 0, 0] as [number, number, number],
        rotationEuler: [0, 0, 0] as [number, number, number],
        scale: 1,
        pose: {},
        hasRig: false, // Objects are typically not rigged
        displayName: file.name.replace(/\.(glb|gltf)$/i, '')
      };
      
      addAvatar(objectData);
      setAvatarObject(objectId, scene, {}, [], undefined);
      
      console.log(`Object loaded successfully: ${file.name}`);
    } catch (error) {
      console.error('Failed to load object:', error);
      alert('Failed to load object. Please check the file format.');
    } finally {
      // Reset file input
      if (objectFileInputRef.current) {
        objectFileInputRef.current.value = '';
      }
    }
  };
  
  // Track pressed keys for smooth movement
  const keysPressed = useRef(new Set<string>());
  const animationFrameRef = useRef<number | null>(null);
  
  // Track arrow keys for smooth camera controls
  const arrowKeysPressed = useRef(new Set<string>());
  const arrowAnimationFrameRef = useRef<number | null>(null);
  
  const smoothPanCamera = useRef(() => {
    if (keysPressed.current.size === 0) {
      animationFrameRef.current = null;
      return;
    }
    
    const panSpeed = 0.08; // Smooth movement speed
    const currentTarget = camera.target;
    const currentPos = camera.position;
    
    // Calculate camera-relative directions
    const cameraPos = new THREE.Vector3(currentPos[0], currentPos[1], currentPos[2]);
    const cameraTarget = new THREE.Vector3(currentTarget[0], currentTarget[1], currentTarget[2]);
    const cameraDirection = new THREE.Vector3().subVectors(cameraTarget, cameraPos).normalize();
    const cameraRight = new THREE.Vector3().crossVectors(cameraDirection, new THREE.Vector3(0, 1, 0)).normalize();
    const cameraUp = new THREE.Vector3().crossVectors(cameraRight, cameraDirection).normalize();
    
    let deltaX = 0;
    let deltaY = 0;
    let deltaZ = 0;
    
    if (keysPressed.current.has('w') || keysPressed.current.has('W')) {
      // Move up on Y-axis (keep original behavior)
      deltaY += panSpeed;
    }
    if (keysPressed.current.has('s') || keysPressed.current.has('S')) {
      // Move down on Y-axis (keep original behavior)
      deltaY -= panSpeed;
    }
    if (keysPressed.current.has('a') || keysPressed.current.has('A')) {
      // Move left relative to camera view
      deltaX -= cameraRight.x * panSpeed;
      deltaZ -= cameraRight.z * panSpeed;
    }
    if (keysPressed.current.has('d') || keysPressed.current.has('D')) {
      // Move right relative to camera view
      deltaX += cameraRight.x * panSpeed;
      deltaZ += cameraRight.z * panSpeed;
    }
    
    if (deltaX !== 0 || deltaY !== 0 || deltaZ !== 0) {
      const newTarget: [number, number, number] = [
        currentTarget[0] + deltaX,
        currentTarget[1] + deltaY,
        currentTarget[2] + deltaZ
      ];
      
      // Calculate new camera position maintaining the same relative distance and angle
      const offset = [
        currentPos[0] - currentTarget[0],
        currentPos[1] - currentTarget[1], 
        currentPos[2] - currentTarget[2]
      ];
      
      const newPosition: [number, number, number] = [
        newTarget[0] + offset[0],
        newTarget[1] + offset[1],
        newTarget[2] + offset[2]
      ];
      
      updateCamera({
        position: newPosition,
        target: newTarget
      });
    }
    
    // Continue animation
    animationFrameRef.current = requestAnimationFrame(smoothPanCamera.current);
  });

  const smoothArrowControls = useRef(() => {
    if (arrowKeysPressed.current.size === 0) {
      arrowAnimationFrameRef.current = null;
      return;
    }
    
    const controls = (window as any).__orbitControls;
    if (!controls) {
      arrowAnimationFrameRef.current = requestAnimationFrame(smoothArrowControls.current);
      return;
    }
    
    const zoomScale = 1.02; // Use a scale factor > 1 for smooth zoom
    const rotateSpeed = 0.02; // Radians per frame for smooth rotation

    // --- SMOOTH ZOOM ---
    if (arrowKeysPressed.current.has('ArrowDown')) { // Swapped for intuitive controls
      controls.dollyIn(zoomScale);
    }
    if (arrowKeysPressed.current.has('ArrowUp')) { // Swapped for intuitive controls
      controls.dollyOut(zoomScale);
    }
    
    // --- SMOOTH ROTATION ---
    const camera = controls.object;
    const target = controls.target;
    const offset = camera.position.clone().sub(target);
    let rotationOccurred = false;

    if (arrowKeysPressed.current.has('ArrowLeft')) {
      const quaternion = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), rotateSpeed);
      offset.applyQuaternion(quaternion);
      rotationOccurred = true;
    }
    if (arrowKeysPressed.current.has('ArrowRight')) {
      const quaternion = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), -rotateSpeed);
      offset.applyQuaternion(quaternion);
      rotationOccurred = true;
    }

    if (rotationOccurred) {
      camera.position.copy(target).add(offset);
    }
    
    controls.update();
    
    // Continue animation
    arrowAnimationFrameRef.current = requestAnimationFrame(smoothArrowControls.current);
  });
  
  // Update the smoothPanCamera ref to use current camera values
  smoothPanCamera.current = () => {
    if (keysPressed.current.size === 0) {
      animationFrameRef.current = null;
      return;
    }
    
    const panSpeed = 0.08;
    const currentTarget = camera.target;
    const currentPos = camera.position;
    
    // Calculate camera-relative directions
    const cameraPos = new THREE.Vector3(currentPos[0], currentPos[1], currentPos[2]);
    const cameraTarget = new THREE.Vector3(currentTarget[0], currentTarget[1], currentTarget[2]);
    const cameraDirection = new THREE.Vector3().subVectors(cameraTarget, cameraPos).normalize();
    const cameraRight = new THREE.Vector3().crossVectors(cameraDirection, new THREE.Vector3(0, 1, 0)).normalize();
    const cameraUp = new THREE.Vector3().crossVectors(cameraRight, cameraDirection).normalize();
    
    let deltaX = 0;
    let deltaY = 0;
    let deltaZ = 0;
    
    if (keysPressed.current.has('w') || keysPressed.current.has('W')) {
      // Move up on Y-axis (keep original behavior)
      deltaY += panSpeed;
    }
    if (keysPressed.current.has('s') || keysPressed.current.has('S')) {
      // Move down on Y-axis (keep original behavior)
      deltaY -= panSpeed;
    }
    if (keysPressed.current.has('a') || keysPressed.current.has('A')) {
      // Move left relative to camera view
      deltaX -= cameraRight.x * panSpeed;
      deltaZ -= cameraRight.z * panSpeed;
    }
    if (keysPressed.current.has('d') || keysPressed.current.has('D')) {
      // Move right relative to camera view
      deltaX += cameraRight.x * panSpeed;
      deltaZ += cameraRight.z * panSpeed;
    }
    
    if (deltaX !== 0 || deltaY !== 0 || deltaZ !== 0) {
      const newTarget: [number, number, number] = [
        currentTarget[0] + deltaX,
        currentTarget[1] + deltaY,
        currentTarget[2] + deltaZ
      ];
      
      const offset = [
        currentPos[0] - currentTarget[0],
        currentPos[1] - currentTarget[1], 
        currentPos[2] - currentTarget[2]
      ];
      
      const newPosition: [number, number, number] = [
        newTarget[0] + offset[0],
        newTarget[1] + offset[1],
        newTarget[2] + offset[2]
      ];
      
      updateCamera({
        position: newPosition,
        target: newTarget
      });
    }
    
    animationFrameRef.current = requestAnimationFrame(smoothPanCamera.current);
  };
  
  const panCamera = (direction: 'left' | 'right' | 'up' | 'down') => {
    const panAmount = 1; // 1 meter movement for non-WASD controls
    const currentTarget = camera.target;
    
    let newTarget: [number, number, number];
    
    switch (direction) {
      case 'left':
        newTarget = [currentTarget[0] - panAmount, currentTarget[1], currentTarget[2]];
        break;
      case 'right':
        newTarget = [currentTarget[0] + panAmount, currentTarget[1], currentTarget[2]];
        break;
      case 'up':
        newTarget = [currentTarget[0], currentTarget[1] + panAmount, currentTarget[2]];
        break;
      case 'down':
        newTarget = [currentTarget[0], currentTarget[1] - panAmount, currentTarget[2]];
        break;
    }
    
    // Calculate new camera position maintaining the same relative distance and angle
    const currentPos = camera.position;
    const offset = [
      currentPos[0] - currentTarget[0],
      currentPos[1] - currentTarget[1], 
      currentPos[2] - currentTarget[2]
    ];
    
    const newPosition: [number, number, number] = [
      newTarget[0] + offset[0],
      newTarget[1] + offset[1],
      newTarget[2] + offset[2]
    ];
    
    updateCamera({
      position: newPosition,
      target: newTarget
    });
  };

  // Keyboard shortcuts and smooth WASD movement
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Prevent shortcuts when typing in inputs
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return;
      }

      // Add to pressed keys for smooth movement
      if (['w', 'W', 'a', 'A', 's', 'S', 'd', 'D'].includes(event.key)) {
        const wasEmpty = keysPressed.current.size === 0;
        keysPressed.current.add(event.key);
        // Start smooth animation if not already running
        if (wasEmpty && !animationFrameRef.current) {
          animationFrameRef.current = requestAnimationFrame(smoothPanCamera.current);
        }
        return;
      }

      // Handle arrow key controls
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) {
        const wasEmpty = arrowKeysPressed.current.size === 0;
        arrowKeysPressed.current.add(event.key);
        // Start smooth arrow key animation if not already running
        if (wasEmpty && !arrowAnimationFrameRef.current) {
          arrowAnimationFrameRef.current = requestAnimationFrame(smoothArrowControls.current);
        }
        return;
      }

      switch (event.key) {
        case 'z':
        case 'Z':
          toggleGrid();
          break;
        case '1':
          // Front preset
          updateCamera({
            position: [0, 1.6, 4],
            target: [0, 1, 0],
          });
          break;
        case '2':
          // 45° preset
          updateCamera({
            position: [3, 2.5, 3],
            target: [0, 1, 0],
          });
          break;
        case '3':
          // Profile preset
          updateCamera({
            position: [4, 1.6, 0],
            target: [0, 1, 0],
          });
          break;
        case 'g':
        case 'G':
          // Transform mode: translate
          setTransformMode('translate');
          break;
        case 'r':
        case 'R':
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            resetScene();
          } else {
            // Transform mode: rotate
            setTransformMode('rotate');
          }
          break;
        case 't':
        case 'T':
          // Transform mode: scale (using T since S is taken)
          setTransformMode('scale');
          break;

        case 'Escape':
          // Select tool
          setActiveTool('select');
          break;
        default:
          break;
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      // Remove from pressed keys
      keysPressed.current.delete(event.key);
      
      // Stop animation if no keys pressed
      if (keysPressed.current.size === 0 && animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      
      // Remove from arrow keys
      arrowKeysPressed.current.delete(event.key);
      
      // Stop arrow animation if no keys pressed
      if (arrowKeysPressed.current.size === 0 && arrowAnimationFrameRef.current) {
        cancelAnimationFrame(arrowAnimationFrameRef.current);
        arrowAnimationFrameRef.current = null;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      // Clean up animation frames
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (arrowAnimationFrameRef.current) {
        cancelAnimationFrame(arrowAnimationFrameRef.current);
      }
    };
  }, [toggleGrid, resetScene, updateCamera, setTransformMode, setActiveTool, toggleScreenshotMode]);

  const { isScreenshotModeActive } = useUI();
  const controlsRef = useRef<any>();

  return (
    <div className="editor-layout">
      {/* Left Panel - Avatar Loading and Tools */}
      <div className="left-panel">
        {/* Logo */}
        <div style={{ 
          textAlign: 'center', 
          marginBottom: '20px',
          padding: '10px' 
        }}>
          <img 
            src="/no1.png" 
            alt="No1Creative" 
            style={{ 
              maxWidth: '120px',
              height: 'auto'
            }} 
          />
        </div>
        
        <div className="panel">
          <h3>Scene Tools</h3>
          <div className="control-group">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <button 
                onClick={() => setShowAvatarPopup(true)}
                style={{
                  display: 'block',
                  width: '100%',
                  padding: '8px 12px',
                  background: 'rgba(255, 255, 255, 0.1)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '11px',
                  textAlign: 'center',
                  cursor: 'pointer'
                }}
              >
                Add Avatar
              </button>
              
              <input
                type="file"
                accept=".glb,.gltf"
                onChange={handleObjectUpload}
                style={{ display: 'none' }}
                ref={objectFileInputRef}
              />
              <button
                onClick={() => objectFileInputRef.current?.click()}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  background: 'rgba(255, 255, 255, 0.1)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '11px',
                  textAlign: 'center',
                  cursor: 'pointer'
                }}
              >
                Add Object
              </button>

              <button 
                onClick={toggleGrid} 
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  background: 'rgba(255, 255, 255, 0.1)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '11px',
                  textAlign: 'center',
                  cursor: 'pointer'
                }}
              >
                Toggle Grid
              </button>
              <button 
                onClick={toggleScreenshotMode} 
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  background: '#0070f3',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '11px',
                  textAlign: 'center',
                  cursor: 'pointer'
                }}
              >
                Thumbnail
              </button>
            </div>
          </div>
        </div>
        
        <AvatarToolsPanel />
        
        {/* <ExportPanel /> */}
      </div>

      {/* Center Canvas */}
      <div className="center-canvas-container">
        <SceneCanvas />
        {/* {!isScreenshotModeActive && <CameraInfo />} */}
        <ScreenshotOverlay />
      </div>

      {/* Right Panel - Scene Controls */}
      <div className="right-panel">
        <LightPanel />
        <BackgroundPanel />
        {/* <ExpressionPanel /> */}
      </div>

      {/* Avatar Selection Popup */}
      <AvatarPopup 
        isOpen={showAvatarPopup} 
        onClose={() => setShowAvatarPopup(false)} 
      />
      
      <ScreenshotPreview />
    </div>
  );
}
