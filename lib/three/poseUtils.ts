import * as THREE from 'three';

// Bone patterns for different naming conventions
const MAJOR_BONE_PATTERNS = [
  { key: 'mixamorigHead', patterns: ['mixamorigHead', 'Head'] },
  { key: 'mixamorigNeck', patterns: ['mixamorigNeck', 'Neck'] },
  { key: 'mixamorigSpine', patterns: ['mixamorigSpine', 'Spine'] },
  { key: 'mixamorigSpine1', patterns: ['mixamorigSpine1', 'Spine1', 'Chest'] },
  { key: 'mixamorigSpine2', patterns: ['mixamorigSpine2', 'Spine2', 'UpperChest'] },
  { key: 'mixamorigHips', patterns: ['mixamorigHips', 'Hips', 'Root'] },
  
  // Arms
  { key: 'mixamorigLeftShoulder', patterns: ['mixamorigLeftShoulder', 'LeftShoulder'] },
  { key: 'mixamorigRightShoulder', patterns: ['mixamorigRightShoulder', 'RightShoulder'] },
  { key: 'mixamorigLeftArm', patterns: ['mixamorigLeftArm', 'LeftArm', 'LeftUpperArm'] },
  { key: 'mixamorigRightArm', patterns: ['mixamorigRightArm', 'RightArm', 'RightUpperArm'] },
  { key: 'mixamorigLeftForeArm', patterns: ['mixamorigLeftForeArm', 'LeftForeArm', 'LeftLowerArm'] },
  { key: 'mixamorigRightForeArm', patterns: ['mixamorigRightForeArm', 'RightForeArm', 'RightLowerArm'] },
  
  // Hands
  { key: 'mixamorigLeftHand', patterns: ['mixamorigLeftHand', 'LeftHand'] },
  { key: 'mixamorigRightHand', patterns: ['mixamorigRightHand', 'RightHand'] },
  
  // Legs
  { key: 'mixamorigLeftUpLeg', patterns: ['mixamorigLeftUpLeg', 'LeftUpLeg', 'LeftUpperLeg', 'LeftThigh'] },
  { key: 'mixamorigRightUpLeg', patterns: ['mixamorigRightUpLeg', 'RightUpLeg', 'RightUpperLeg', 'RightThigh'] },
  { key: 'mixamorigLeftLeg', patterns: ['mixamorigLeftLeg', 'LeftLeg', 'LeftLowerLeg', 'LeftShin'] },
  { key: 'mixamorigRightLeg', patterns: ['mixamorigRightLeg', 'RightLeg', 'RightLowerLeg', 'RightShin'] },
  
  // Feet
  { key: 'mixamorigLeftFoot', patterns: ['mixamorigLeftFoot', 'LeftFoot'] },
  { key: 'mixamorigRightFoot', patterns: ['mixamorigRightFoot', 'RightFoot'] },
];

interface BoneData {
  bone: THREE.Bone;
  originalRotation: { x: number; y: number; z: number };
}

export function findAvailableBones(skinnedMesh: THREE.SkinnedMesh): { [key: string]: BoneData } {
  const bones: { [key: string]: BoneData } = {};

  if (!skinnedMesh.skeleton?.bones) {
    return bones;
  }

  // Find bones using pattern matching
  MAJOR_BONE_PATTERNS.forEach(({ key, patterns }) => {
    for (let pattern of patterns) {
      const bone = skinnedMesh.skeleton.bones.find(bone => 
        bone.name.includes(pattern)
      );
      
      if (bone && !bones[bone.name]) {
        bones[bone.name] = {
          bone,
          originalRotation: {
            x: bone.rotation.x,
            y: bone.rotation.y,
            z: bone.rotation.z
          }
        };
        break; // Found match for this pattern, move to next
      }
    }
  });

  return bones;
}

export function applyNeutralPose(skinnedMesh: THREE.SkinnedMesh): void {
  const bones = findAvailableBones(skinnedMesh);
  
  if (Object.keys(bones).length === 0) {
    console.log('No compatible bones found for neutral pose');
    return;
  }

  console.log('Applying neutral pose to', Object.keys(bones).length, 'bones');

  // Helper to find bone with multiple naming conventions
  const findBone = (patterns: string[]) => {
    for (let pattern of patterns) {
      const foundBone = Object.values(bones).find(boneData => 
        boneData.bone.name.includes(pattern)
      );
      if (foundBone) return foundBone;
    }
    return null;
  };

  // Helper to add rotation in degrees to existing rotation
  const addRotationDeg = (boneData: BoneData | null, x?: number, y?: number, z?: number) => {
    if (!boneData) return;
    
    const original = boneData.originalRotation;
    if (x !== undefined) {
      boneData.bone.rotation.x = original.x + THREE.MathUtils.degToRad(x);
    }
    if (y !== undefined) {
      boneData.bone.rotation.y = original.y + THREE.MathUtils.degToRad(y);
    }
    if (z !== undefined) {
      boneData.bone.rotation.z = original.z + THREE.MathUtils.degToRad(z);
    }
  };

  // Natural neutral pose - arms in natural relaxed position
  const leftArm = findBone(['LeftArm', 'LeftUpperArm']);
  const rightArm = findBone(['RightArm', 'RightUpperArm']);
  
  // Set arms to natural position: x:80, y:0, z:22
  addRotationDeg(leftArm, 80, 0, 22);   // Left arm natural position
  addRotationDeg(rightArm, 80, 0, -22); // Right arm natural position (mirrored Z)

  console.log('Neutral pose applied successfully');
}
