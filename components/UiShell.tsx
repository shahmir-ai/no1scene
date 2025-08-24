'use client';

import React, { useRef, useEffect } from 'react';
import { SceneCanvas } from './SceneCanvas';
import { AvatarToolsPanel } from './AvatarToolsPanel';
import { AvatarPopup } from './AvatarPopup';

import { LightPanel } from './LightPanel';
import { BackgroundPanel } from './BackgroundPanel';
import { ExpressionPanel } from './ExpressionPanel';
import { ExportPanel } from './ExportPanel';


import { useSceneStore, useCamera } from '../lib/store';

export function UiShell() {
  const { toggleGrid, resetScene, updateCamera, setTransformMode, setActiveTool, addAvatar, setAvatarObject } = useSceneStore();
  const camera = useCamera();
  const [showAvatarPopup, setShowAvatarPopup] = React.useState(false);
  const objectFileInputRef = React.useRef<HTMLInputElement>(null);
  
  // Handle object file upload
  const handleObjectUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const url = URL.createObjectURL(file);
      const { loadAvatarFromUrl } = await import('../lib/avatarLoader');
      
      const { scene, bones, morphTargets, skinnedMesh } = await loadAvatarFromUrl(url);
      
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
      setAvatarObject(objectId, scene, bones, morphTargets, skinnedMesh);
      
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
  
  const smoothPanCamera = useRef(() => {
    if (keysPressed.current.size === 0) {
      animationFrameRef.current = null;
      return;
    }
    
    const panSpeed = 0.08; // Smooth movement speed
    const currentTarget = camera.target;
    const currentPos = camera.position;
    
    let deltaX = 0;
    let deltaY = 0;
    
    if (keysPressed.current.has('w') || keysPressed.current.has('W')) {
      deltaY += panSpeed;
    }
    if (keysPressed.current.has('s') || keysPressed.current.has('S')) {
      deltaY -= panSpeed;
    }
    if (keysPressed.current.has('a') || keysPressed.current.has('A')) {
      deltaX -= panSpeed;
    }
    if (keysPressed.current.has('d') || keysPressed.current.has('D')) {
      deltaX += panSpeed;
    }
    
    if (deltaX !== 0 || deltaY !== 0) {
      const newTarget: [number, number, number] = [
        currentTarget[0] + deltaX,
        currentTarget[1] + deltaY,
        currentTarget[2]
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
  
  // Update the smoothPanCamera ref to use current camera values
  smoothPanCamera.current = () => {
    if (keysPressed.current.size === 0) {
      animationFrameRef.current = null;
      return;
    }
    
    const panSpeed = 0.08;
    const currentTarget = camera.target;
    const currentPos = camera.position;
    
    let deltaX = 0;
    let deltaY = 0;
    
    if (keysPressed.current.has('w') || keysPressed.current.has('W')) {
      deltaY += panSpeed;
    }
    if (keysPressed.current.has('s') || keysPressed.current.has('S')) {
      deltaY -= panSpeed;
    }
    if (keysPressed.current.has('a') || keysPressed.current.has('A')) {
      deltaX -= panSpeed;
    }
    if (keysPressed.current.has('d') || keysPressed.current.has('D')) {
      deltaX += panSpeed;
    }
    
    if (deltaX !== 0 || deltaY !== 0) {
      const newTarget: [number, number, number] = [
        currentTarget[0] + deltaX,
        currentTarget[1] + deltaY,
        currentTarget[2]
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
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      // Clean up animation frame
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [toggleGrid, resetScene, updateCamera, setTransformMode, setActiveTool]);

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
            <button 
              onClick={() => setShowAvatarPopup(true)}
              style={{
                display: 'block',
                width: '100%',
                padding: '8px 12px',
                background: '#0070f3',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                fontSize: '12px',
                textAlign: 'center',
                marginBottom: '8px',
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
                padding: '8px 16px',
                background: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                fontSize: '12px',
                textAlign: 'center',
                cursor: 'pointer'
              }}
            >
              Add Object
            </button>
          </div>

          <div className="control-group">
            <button 
              className="control-button secondary"
              onClick={toggleGrid}
              title="Toggle grid (Z)"
              style={{
                width: '100%',
                padding: '8px 12px',
                fontSize: '12px'
              }}
            >
              Toggle Grid
            </button>
          </div>
        </div>
        
        <AvatarToolsPanel />
        
        {/* <ExportPanel /> */}
      </div>

      {/* Center - 3D Canvas */}
      <div className="center-canvas">
        <SceneCanvas />
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
    </div>
  );
}
