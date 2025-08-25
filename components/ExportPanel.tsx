'use client';

import React, { useState, useRef } from 'react';
import { useSceneStore } from '../lib/store';
import { validateSceneJSON } from '../lib/sceneSchema';
import { 
  exportPNG, 
  exportDepth, 
  exportNormal, 
  exportSceneJSON, 
  downloadBlob, 
  generateTimestamp 
} from '../lib/three/exporters';

export function ExportPanel() {
  const { exportScene, loadScene } = useSceneStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [exportOptions, setExportOptions] = useState({
    transparent: false,
    includeDepth: false,
    includeNormal: false,
  });

  const getSceneObjects = () => {
    // Access global scene objects set by SceneCanvas
    const renderer = (window as any).__sceneRenderer;
    const camera = (window as any).__sceneCamera;
    const scene = (window as any).__scene;
    
    if (!renderer || !camera || !scene) {
      throw new Error('Scene not initialized. Please wait for the 3D scene to load.');
    }
    
    return { renderer, camera, scene };
  };

  const handleExportPNG = async () => {
    try {
      setIsExporting(true);
      const { renderer, camera, scene } = getSceneObjects();
      
      const blob = await exportPNG(scene, camera, renderer, {
        width: 1920,
        height: 1080,
        transparent: exportOptions.transparent,
      });
      
      const timestamp = generateTimestamp();
      downloadBlob(blob, `no1scene_${timestamp}.png`);
    } catch (error) {
      console.error('Failed to export PNG:', error);
      alert('Failed to export PNG. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportDepth = async () => {
    try {
      setIsExporting(true);
      const { renderer, camera, scene } = getSceneObjects();
      
      const blob = await exportDepth(scene, camera, renderer, {
        width: 1920,
        height: 1080,
      });
      
      const timestamp = generateTimestamp();
      downloadBlob(blob, `no1scene_depth_${timestamp}.png`);
    } catch (error) {
      console.error('Failed to export depth:', error);
      alert('Failed to export depth map. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportNormal = async () => {
    try {
      setIsExporting(true);
      const { renderer, camera, scene } = getSceneObjects();
      
      const blob = await exportNormal(scene, camera, renderer, {
        width: 1920,
        height: 1080,
      });
      
      const timestamp = generateTimestamp();
      downloadBlob(blob, `no1scene_normal_${timestamp}.png`);
    } catch (error) {
      console.error('Failed to export normal map:', error);
      alert('Failed to export normal map. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportScene = () => {
    try {
      const sceneData = exportScene();
      const blob = exportSceneJSON(sceneData);
      const timestamp = generateTimestamp();
      downloadBlob(blob, `no1scene_${timestamp}.json`);
    } catch (error) {
      console.error('Failed to export scene JSON:', error);
      alert('Failed to export scene. Please try again.');
    }
  };

  const handleSaveScene = () => {
    try {
      const sceneData = exportScene();
      const blob = exportSceneJSON(sceneData);
      const timestamp = generateTimestamp();
      downloadBlob(blob, `scene_${timestamp}.json`);
      console.log('Scene saved with poses and expressions:', sceneData);
    } catch (error) {
      console.error('Failed to save scene:', error);
      alert('Failed to save scene. Please try again.');
    }
  };

  const handleLoadScene = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.json')) {
      alert('Please select a JSON file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const jsonText = e.target?.result as string;
        const sceneData = JSON.parse(jsonText);
        
        // Validate the scene data
        const validatedScene = validateSceneJSON(sceneData);
        
        // Load the scene
        loadScene(validatedScene);
        console.log('Scene loaded successfully:', validatedScene);
        alert('Scene loaded successfully!');
        
      } catch (error) {
        console.error('Failed to load scene:', error);
        alert('Failed to load scene. Please check the file format.');
      }
    };
    
    reader.readAsText(file);
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleExportAll = async () => {
    try {
      setIsExporting(true);
      const timestamp = generateTimestamp();
      
      // Export main PNG
      await handleExportPNG();
      
      // Export scene JSON
      handleExportScene();
      
      // Export optional maps
      if (exportOptions.includeDepth) {
        await handleExportDepth();
      }
      
      if (exportOptions.includeNormal) {
        await handleExportNormal();
      }
      
    } catch (error) {
      console.error('Failed to export all:', error);
      alert('Failed to export all files. Some exports may have succeeded.');
    } finally {
      setIsExporting(false);
    }
  };



  return (
    <div className="panel">
      <h3>Export</h3>
      
      {/* Scene Save/Load */}
      <div className="control-group">
        <label className="control-label">Scene Management</label>
        <div style={{ display: 'flex', gap: '4px', marginBottom: '8px' }}>
          <button
            onClick={handleSaveScene}
            className="control-button primary"
            style={{ flex: 1, fontSize: '11px' }}
          >
            💾 Save Scene
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="control-button secondary"
            style={{ flex: 1, fontSize: '11px' }}
          >
            📁 Load Scene
          </button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleLoadScene}
          style={{ display: 'none' }}
        />
        <div style={{ 
          fontSize: '10px', 
          color: '#888', 
          padding: '6px',
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '4px'
        }}>
          <strong>Save:</strong> Captures all poses, expressions, camera, lighting<br/>
          <strong>Load:</strong> Restores complete scene state
        </div>
      </div>
      
      <div className="control-group">
        <label className="control-label">Export Options</label>
        <div style={{ fontSize: '12px', marginBottom: '8px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
            <input
              type="checkbox"
              checked={exportOptions.transparent}
              onChange={(e) => setExportOptions({
                ...exportOptions,
                transparent: e.target.checked
              })}
            />
            Transparent background
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
            <input
              type="checkbox"
              checked={exportOptions.includeDepth}
              onChange={(e) => setExportOptions({
                ...exportOptions,
                includeDepth: e.target.checked
              })}
            />
            Include depth map
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <input
              type="checkbox"
              checked={exportOptions.includeNormal}
              onChange={(e) => setExportOptions({
                ...exportOptions,
                includeNormal: e.target.checked
              })}
            />
            Include normal map
          </label>
        </div>
      </div>

      <div className="control-group">
        <label className="control-label">Quick Export</label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px', marginBottom: '8px' }}>
          <button
            onClick={handleExportPNG}
            disabled={isExporting}
            className="control-button"
          >
            PNG
          </button>
          <button
            onClick={handleExportScene}
            disabled={isExporting}
            className="control-button secondary"
          >
            JSON
          </button>
        </div>
        
        <button
          onClick={handleExportAll}
          disabled={isExporting}
          className="control-button"
          style={{ width: '100%', marginBottom: '8px' }}
        >
          {isExporting ? 'Exporting...' : 'Export All'}
        </button>
      </div>

      <div className="control-group">
        <label className="control-label">Advanced</label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
          <button
            onClick={handleExportDepth}
            disabled={isExporting}
            className="control-button secondary"
          >
            Depth
          </button>
          <button
            onClick={handleExportNormal}
            disabled={isExporting}
            className="control-button secondary"
          >
            Normal
          </button>
        </div>
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
        <strong>Export Info:</strong><br />
        • PNG: 1920×1080 render<br />
        • JSON: Complete scene data<br />
        • Depth/Normal: For AI processing
      </div>
    </div>
  );
}
