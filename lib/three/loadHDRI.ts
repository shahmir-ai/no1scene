import * as THREE from 'three';
import { RGBELoader } from 'three-stdlib';

export interface HDRIResult {
  texture: THREE.DataTexture;
  envMap: THREE.Texture;
}

export async function loadHDRI(path: string): Promise<HDRIResult> {
  return new Promise((resolve, reject) => {
    const loader = new RGBELoader();
    
    loader.load(
      path,
      (texture) => {
        // Create environment map using PMREM
        const pmremGenerator = new THREE.PMREMGenerator(new THREE.WebGLRenderer());
        pmremGenerator.compileEquirectangularShader();
        
        const envMap = pmremGenerator.fromEquirectangular(texture).texture;
        
        // Clean up
        pmremGenerator.dispose();
        
        resolve({ texture, envMap });
      },
      undefined,
      (error) => {
        console.error('Error loading HDRI:', error);
        reject(error);
      }
    );
  });
}

export function applyHDRIToScene(
  scene: THREE.Scene, 
  envMap: THREE.Texture, 
  exposure: number = 1
): void {
  scene.environment = envMap;
  scene.background = envMap;
  
  // Apply exposure
  if (scene.environment) {
    (scene.environment as any).mapping = THREE.EquirectangularReflectionMapping;
  }
}

export function removeHDRIFromScene(scene: THREE.Scene): void {
  scene.environment = null;
  scene.background = new THREE.Color(0x000000);
}

export function createDefaultEnvironment(): THREE.Texture {
  // Create a simple gradient environment as fallback
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 512;
  
  const context = canvas.getContext('2d')!;
  
  // Create gradient from sky blue to ground
  const gradient = context.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, '#87CEEB'); // Sky blue
  gradient.addColorStop(0.7, '#98D4E8'); // Lighter blue
  gradient.addColorStop(1, '#F0F8FF'); // Almost white
  
  context.fillStyle = gradient;
  context.fillRect(0, 0, canvas.width, canvas.height);
  
  const texture = new THREE.CanvasTexture(canvas);
  texture.mapping = THREE.EquirectangularReflectionMapping;
  
  return texture;
}
