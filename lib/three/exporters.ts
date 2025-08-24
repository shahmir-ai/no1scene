import * as THREE from 'three';
import type { SceneJSON } from '../sceneSchema';

export interface ExportOptions {
  width?: number;
  height?: number;
  transparent?: boolean;
  format?: 'png' | 'jpeg';
  quality?: number; // For JPEG
}

export async function exportPNG(
  scene: THREE.Scene,
  camera: THREE.Camera,
  renderer: THREE.WebGLRenderer,
  options: ExportOptions = {}
): Promise<Blob> {
  const {
    width = 1920,
    height = 1080,
    transparent = false,
    format = 'png',
    quality = 0.9
  } = options;

  // Store original settings
  const originalBackground = scene.background;
  const originalSize = renderer.getSize(new THREE.Vector2());
  const originalPixelRatio = renderer.getPixelRatio();

  try {
    // Set up for export
    if (transparent) {
      scene.background = null;
    }
    
    renderer.setSize(width, height);
    renderer.setPixelRatio(1); // Use 1:1 pixel ratio for consistent output
    
    // Render
    renderer.render(scene, camera);
    
    // Get canvas and convert to blob
    const canvas = renderer.domElement;
    
    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to create blob from canvas'));
          }
        },
        `image/${format}`,
        format === 'jpeg' ? quality : undefined
      );
    });
  } finally {
    // Restore original settings
    scene.background = originalBackground;
    renderer.setSize(originalSize.width, originalSize.height);
    renderer.setPixelRatio(originalPixelRatio);
  }
}

export async function exportDepth(
  scene: THREE.Scene,
  camera: THREE.Camera,
  renderer: THREE.WebGLRenderer,
  options: ExportOptions = {}
): Promise<Blob> {
  const { width = 1920, height = 1080 } = options;

  // Create depth material
  const depthMaterial = new THREE.MeshDepthMaterial();
  depthMaterial.depthPacking = THREE.RGBADepthPacking;

  // Store original materials
  const originalMaterials = new Map<THREE.Object3D, THREE.Material | THREE.Material[]>();
  
  scene.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      originalMaterials.set(child, child.material);
      child.material = depthMaterial;
    }
  });

  try {
    // Render depth
    const blob = await exportPNG(scene, camera, renderer, { ...options, width, height, transparent: false });
    return blob;
  } finally {
    // Restore original materials
    scene.traverse((child) => {
      if (child instanceof THREE.Mesh && originalMaterials.has(child)) {
        child.material = originalMaterials.get(child)!;
      }
    });
  }
}

export async function exportNormal(
  scene: THREE.Scene,
  camera: THREE.Camera,
  renderer: THREE.WebGLRenderer,
  options: ExportOptions = {}
): Promise<Blob> {
  const { width = 1920, height = 1080 } = options;

  // Create normal material
  const normalMaterial = new THREE.MeshNormalMaterial();

  // Store original materials
  const originalMaterials = new Map<THREE.Object3D, THREE.Material | THREE.Material[]>();
  
  scene.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      originalMaterials.set(child, child.material);
      child.material = normalMaterial;
    }
  });

  try {
    // Render normals
    const blob = await exportPNG(scene, camera, renderer, { ...options, width, height, transparent: false });
    return blob;
  } finally {
    // Restore original materials
    scene.traverse((child) => {
      if (child instanceof THREE.Mesh && originalMaterials.has(child)) {
        child.material = originalMaterials.get(child)!;
      }
    });
  }
}

export function exportSceneJSON(sceneData: SceneJSON): Blob {
  const jsonString = JSON.stringify(sceneData, null, 2);
  return new Blob([jsonString], { type: 'application/json' });
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

// Utility function to generate timestamp for filenames
export function generateTimestamp(): string {
  const now = new Date();
  return now.toISOString().slice(0, 19).replace(/[:-]/g, '').replace('T', '_');
}
