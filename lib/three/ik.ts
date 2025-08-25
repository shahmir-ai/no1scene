import * as THREE from 'three';
import { CCDIKSolver, CCDIKHelper } from 'three-stdlib';

export interface IKChain {
  name: string;
  solver: CCDIKSolver;
  helper?: CCDIKHelper;
  target: THREE.Object3D;
  effector: THREE.Bone;
  links: THREE.Bone[];
}

export interface IKSetup {
  chains: IKChain[];
  update: () => void;
  dispose: () => void;
}

// Common bone name patterns for different rig types
const BONE_PATTERNS = {
  leftArm: [
    ['LeftShoulder', 'LeftArm', 'LeftForeArm', 'LeftHand'],
    ['Left_Shoulder', 'Left_Arm', 'Left_ForeArm', 'Left_Hand'],
    ['shoulder.L', 'upper_arm.L', 'forearm.L', 'hand.L'],
    ['Shoulder_L', 'UpperArm_L', 'LowerArm_L', 'Hand_L']
  ],
  rightArm: [
    ['RightShoulder', 'RightArm', 'RightForeArm', 'RightHand'],
    ['Right_Shoulder', 'Right_Arm', 'Right_ForeArm', 'Right_Hand'],
    ['shoulder.R', 'upper_arm.R', 'forearm.R', 'hand.R'],
    ['Shoulder_R', 'UpperArm_R', 'LowerArm_R', 'Hand_R']
  ],
  leftLeg: [
    ['LeftUpLeg', 'LeftLeg', 'LeftFoot'],
    ['Left_UpLeg', 'Left_Leg', 'Left_Foot'],
    ['thigh.L', 'shin.L', 'foot.L'],
    ['UpperLeg_L', 'LowerLeg_L', 'Foot_L']
  ],
  rightLeg: [
    ['RightUpLeg', 'RightLeg', 'RightFoot'],
    ['Right_UpLeg', 'Right_Leg', 'Right_Foot'],
    ['thigh.R', 'shin.R', 'foot.R'],
    ['UpperLeg_R', 'LowerLeg_R', 'Foot_R']
  ]
};

export function findBoneByPatterns(skeleton: THREE.Skeleton, patterns: string[][]): THREE.Bone[] {
  const bones = skeleton.bones;
  
  for (const pattern of patterns) {
    const foundBones: THREE.Bone[] = [];
    
    for (const boneName of pattern) {
      const bone = bones.find(b => 
        b.name === boneName || 
        b.name.toLowerCase() === boneName.toLowerCase() ||
        b.name.includes(boneName) ||
        boneName.includes(b.name)
      );
      
      if (bone) {
        foundBones.push(bone);
      } else {
        break; // Pattern doesn't match, try next
      }
    }
    
    if (foundBones.length === pattern.length) {
      return foundBones;
    }
  }
  
  return [];
}

export function createIKTarget(name: string, position: THREE.Vector3): THREE.Object3D {
  const target = new THREE.Object3D();
  target.name = `${name}_IK_Target`;
  target.position.copy(position);
  
  // Add visual helper
  const geometry = new THREE.SphereGeometry(0.05, 8, 6);
  const material = new THREE.MeshBasicMaterial({ 
    color: 0xff4444, 
    transparent: true, 
    opacity: 0.7 
  });
  const helper = new THREE.Mesh(geometry, material);
  target.add(helper);
  
  return target;
}

export function setupIKForAvatar(skinnedMesh: THREE.SkinnedMesh, scene: THREE.Scene): IKSetup | null {
  if (!skinnedMesh.skeleton) {
    console.warn('SkinnedMesh has no skeleton');
    return null;
  }

  const skeleton = skinnedMesh.skeleton;
  const chains: IKChain[] = [];

  // Setup arm chains
  const leftArmBones = findBoneByPatterns(skeleton, BONE_PATTERNS.leftArm);
  const rightArmBones = findBoneByPatterns(skeleton, BONE_PATTERNS.rightArm);
  const leftLegBones = findBoneByPatterns(skeleton, BONE_PATTERNS.leftLeg);
  const rightLegBones = findBoneByPatterns(skeleton, BONE_PATTERNS.rightLeg);

  // Create IK chains
  if (leftArmBones.length >= 3) {
    const effector = leftArmBones[leftArmBones.length - 1];
    const target = createIKTarget('LeftHand', effector.getWorldPosition(new THREE.Vector3()));
    scene.add(target);

    const ikData = {
      target: target,
      effector: effector,
      links: leftArmBones.slice(0, -1).map(bone => ({ index: skeleton.bones.indexOf(bone) })),
      iteration: 15,
      minAngle: 0,
      maxAngle: 1,
    };

    const solver = new CCDIKSolver(skinnedMesh, [ikData]);
    const helper = new CCDIKHelper(skinnedMesh, [ikData]);
    helper.visible = false; // Hidden by default

    chains.push({
      name: 'leftArm',
      solver,
      helper,
      target,
      effector,
      links: leftArmBones.slice(0, -1)
    });
  }

  if (rightArmBones.length >= 3) {
    const effector = rightArmBones[rightArmBones.length - 1];
    const target = createIKTarget('RightHand', effector.getWorldPosition(new THREE.Vector3()));
    scene.add(target);

    const ikData = {
      target: target,
      effector: effector,
      links: rightArmBones.slice(0, -1).map(bone => ({ index: skeleton.bones.indexOf(bone) })),
      iteration: 15,
      minAngle: 0,
      maxAngle: 1,
    };

    const solver = new CCDIKSolver(skinnedMesh, [ikData]);
    const helper = new CCDIKHelper(skinnedMesh, [ikData]);
    helper.visible = false;

    chains.push({
      name: 'rightArm',
      solver,
      helper,
      target,
      effector,
      links: rightArmBones.slice(0, -1)
    });
  }

  if (leftLegBones.length >= 3) {
    const effector = leftLegBones[leftLegBones.length - 1];
    const target = createIKTarget('LeftFoot', effector.getWorldPosition(new THREE.Vector3()));
    scene.add(target);

    const ikData = {
      target: target,
      effector: effector,
      links: leftLegBones.slice(0, -1).map(bone => ({ index: skeleton.bones.indexOf(bone) })),
      iteration: 15,
      minAngle: 0,
      maxAngle: 1,
    };

    const solver = new CCDIKSolver(skinnedMesh, [ikData]);
    const helper = new CCDIKHelper(skinnedMesh, [ikData]);
    helper.visible = false;

    chains.push({
      name: 'leftLeg',
      solver,
      helper,
      target,
      effector,
      links: leftLegBones.slice(0, -1)
    });
  }

  if (rightLegBones.length >= 3) {
    const effector = rightLegBones[rightLegBones.length - 1];
    const target = createIKTarget('RightFoot', effector.getWorldPosition(new THREE.Vector3()));
    scene.add(target);

    const ikData = {
      target: target,
      effector: effector,
      links: rightLegBones.slice(0, -1).map(bone => ({ index: skeleton.bones.indexOf(bone) })),
      iteration: 15,
      minAngle: 0,
      maxAngle: 1,
    };

    const solver = new CCDIKSolver(skinnedMesh, [ikData]);
    const helper = new CCDIKHelper(skinnedMesh, [ikData]);
    helper.visible = false;

    chains.push({
      name: 'rightLeg',
      solver,
      helper,
      target,
      effector,
      links: rightLegBones.slice(0, -1)
    });
  }

  if (chains.length === 0) {
    console.warn('No IK chains could be created for this avatar');
    return null;
  }

  return {
    chains,
    update: () => {
      // Update all IK solvers
      chains.forEach(chain => {
        chain.solver.update();
      });
    },
    dispose: () => {
      // Clean up targets and helpers
      chains.forEach(chain => {
        scene.remove(chain.target);
        if (chain.helper) {
          scene.remove(chain.helper);
        }
      });
    }
  };
}

export function getIKTargetPositions(ikSetup: IKSetup): { [chainName: string]: [number, number, number] } {
  const positions: { [chainName: string]: [number, number, number] } = {};
  
  ikSetup.chains.forEach(chain => {
    const pos = chain.target.position;
    positions[chain.name] = [pos.x, pos.y, pos.z];
  });
  
  return positions;
}

export function setIKTargetPositions(ikSetup: IKSetup, positions: { [chainName: string]: [number, number, number] }): void {
  ikSetup.chains.forEach(chain => {
    const pos = positions[chain.name];
    if (pos) {
      chain.target.position.set(pos[0], pos[1], pos[2]);
    }
  });
}
