import { GLTFLoader } from 'three-stdlib';
import * as THREE from 'three';
import { applyNeutralPose } from './three/poseUtils';

export interface AvatarLoadResult {
  scene: THREE.Group;
  bones: { [name: string]: THREE.Object3D };
  morphTargets: string[];
  skinnedMesh: THREE.SkinnedMesh | null;
}

const extractMorphTargetNames = (object: THREE.Object3D): string[] => {
  const morphTargets: string[] = [];
  
  object.traverse((child) => {
    if (child instanceof THREE.Mesh && child.morphTargetDictionary) {
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

const findSkinnedMesh = (object: THREE.Object3D): THREE.SkinnedMesh | null => {
  let skinnedMesh: THREE.SkinnedMesh | null = null;
  
  object.traverse((child) => {
    if (child instanceof THREE.SkinnedMesh && !skinnedMesh) {
      skinnedMesh = child;
    }
  });
  
  return skinnedMesh;
};

const calculateAutoScale = (scene: THREE.Group): number => {
  const box = new THREE.Box3().setFromObject(scene);
  const size = box.getSize(new THREE.Vector3());
  const currentHeight = size.y;
  
  const targetHeight = 8.0; // Target height in meters (increased for better visibility)
  
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

export async function loadAvatarFromUrl(url: string, name?: string): Promise<AvatarLoadResult> {
  const loader = new GLTFLoader();
  
  // Load the GLTF file
  const gltf = await new Promise<any>((resolve, reject) => {
    loader.load(
      url,
      (gltf) => resolve(gltf),
      (progress) => {
        // Optional progress callback
        console.log('Loading progress:', progress);
      },
      (error) => reject(error)
    );
  });

  // Process the loaded model
  const scene = gltf.scene;
  scene.name = name || 'Avatar';
  
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

  // Auto-scale the model
  const autoScale = calculateAutoScale(scene);
  scene.scale.setScalar(autoScale);

  // Position the model on the floor
  const box = new THREE.Box3().setFromObject(scene);
  const size = box.getSize(new THREE.Vector3());
  scene.position.y = -(box.min.y * autoScale);

  // Apply neutral pose for rigged models
  if (skinnedMesh && Object.keys(bones).length > 0) {
    try {
      console.log(`Applying neutral pose to rigged model: ${name}`);
      applyNeutralPose(skinnedMesh);
    } catch (error) {
      console.warn('Failed to apply neutral pose:', error);
    }
  }

  return {
    scene,
    bones,
    morphTargets,
    skinnedMesh
  };
}

export async function loadAvatarFromFile(file: File): Promise<AvatarLoadResult> {
  const url = URL.createObjectURL(file);
  try {
    const result = await loadAvatarFromUrl(url, file.name.replace(/\.[^/.]+$/, ''));
    return result;
  } finally {
    URL.revokeObjectURL(url);
  }
}
