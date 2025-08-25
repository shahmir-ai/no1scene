import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type { SceneJSON, AvatarData, CameraData, LightingData, BackgroundData } from './sceneSchema';
import { defaultSceneData } from './sceneSchema';
import type { Group, SkinnedMesh, Object3D } from 'three';
import type { IKSetup } from './three/ik';

// Extended avatar data with Three.js objects
export interface LoadedAvatar extends AvatarData {
  object?: Group; // The loaded Three.js group
  bones?: { [name: string]: Object3D }; // Bone references
  morphTargets?: string[]; // Available morph target names
  skinnedMesh?: SkinnedMesh; // Main skinned mesh reference
  ikSetup?: IKSetup; // IK setup if rigged
  hasRig: boolean; // Whether avatar has a usable skeleton
}

// UI state
interface UIState {
  selectedAvatarId: string | null;
  activeTool: 'select' | 'move' | 'rotate' | 'ik';
  transformMode: 'translate' | 'rotate' | 'scale';
  showGrid: boolean;
  showHelpers: boolean;
  isScreenshotModeActive: boolean;
  screenshotPreviewUrl: string | null;
}

// Scene store interface
interface SceneStore {
  // Scene data
  scene: SceneJSON;
  loadedAvatars: LoadedAvatar[];
  
  // UI state
  ui: UIState;
  
  // Scene actions
  updateCamera: (camera: Partial<CameraData>) => void;
  updateLighting: (lighting: Partial<LightingData>) => void;
  updateBackground: (background: Partial<BackgroundData>) => void;
  
  // Avatar actions
  addAvatar: (avatar: AvatarData) => void;
  removeAvatar: (id: string) => void;
  updateAvatar: (id: string, updates: Partial<AvatarData>) => void;
  setAvatarObject: (id: string, object: Group, bones?: { [name: string]: Object3D }, morphTargets?: string[], skinnedMesh?: SkinnedMesh) => void;
  setAvatarIK: (id: string, ikSetup: IKSetup | null) => void;
  updateAvatarMorph: (id: string, morphName: string, value: number) => void;
  
  // UI actions
  setSelectedAvatar: (id: string | null) => void;
  setActiveTool: (tool: UIState['activeTool']) => void;
  setTransformMode: (mode: UIState['transformMode']) => void;
  toggleGrid: () => void;
  toggleHelpers: () => void;
  toggleScreenshotMode: () => void;
  setScreenshotPreviewUrl: (url: string | null) => void;
  
  // Scene management
  loadScene: (sceneData: SceneJSON) => void;
  resetScene: () => void;
  exportScene: () => SceneJSON;
  saveCurrentPoses: () => void;
  restoreAvatarFromData: (avatarData: AvatarData) => void;
}

export const useSceneStore = create<SceneStore>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    scene: defaultSceneData,
    loadedAvatars: [],
    ui: {
      selectedAvatarId: null,
      activeTool: 'select',
      transformMode: 'translate',
      showGrid: true,
      showHelpers: true,
      isScreenshotModeActive: false,
      screenshotPreviewUrl: null,
    },

    // Scene actions
    updateCamera: (camera) =>
      set((state) => ({
        scene: {
          ...state.scene,
          camera: { ...state.scene.camera, ...camera },
        },
      })),

    updateLighting: (lighting) =>
      set((state) => ({
        scene: {
          ...state.scene,
          lighting: { ...state.scene.lighting, ...lighting },
        },
      })),

    updateBackground: (background) =>
      set((state) => ({
        scene: {
          ...state.scene,
          background: { ...state.scene.background, ...background },
        },
      })),

    // Avatar actions
    addAvatar: (avatar) =>
      set((state) => ({
        scene: {
          ...state.scene,
          avatars: [...state.scene.avatars, avatar],
        },
        loadedAvatars: [...state.loadedAvatars, avatar],
      })),

    removeAvatar: (id) =>
      set((state) => ({
        scene: {
          ...state.scene,
          avatars: state.scene.avatars.filter((a) => a.id !== id),
        },
        loadedAvatars: state.loadedAvatars.filter((a) => a.id !== id),
        ui: {
          ...state.ui,
          selectedAvatarId: state.ui.selectedAvatarId === id ? null : state.ui.selectedAvatarId,
        },
      })),

    updateAvatar: (id, updates) =>
      set((state) => ({
        scene: {
          ...state.scene,
          avatars: state.scene.avatars.map((a) =>
            a.id === id ? { ...a, ...updates } : a
          ),
        },
        loadedAvatars: state.loadedAvatars.map((a) =>
          a.id === id ? { ...a, ...updates } : a
        ),
      })),

    setAvatarObject: (id, object, bones, morphTargets, skinnedMesh) =>
      set((state) => ({
        loadedAvatars: state.loadedAvatars.map((a) =>
          a.id === id ? { ...a, object, bones, morphTargets, skinnedMesh, hasRig: !!skinnedMesh?.skeleton } : a
        ),
      })),

    setAvatarIK: (id, ikSetup) =>
      set((state) => ({
        loadedAvatars: state.loadedAvatars.map((a) =>
          a.id === id ? { ...a, ikSetup } : a
        ),
      })),

    updateAvatarMorph: (id, morphName, value) =>
      set((state) => ({
        loadedAvatars: state.loadedAvatars.map((a) => {
          if (a.id === id) {
            const updatedMorphs = { ...a.morphs, [morphName]: value };
            
            // Also update the Three.js object if available
            if (a.skinnedMesh && a.skinnedMesh.morphTargetDictionary) {
              const morphIndex = a.skinnedMesh.morphTargetDictionary[morphName];
              if (morphIndex !== undefined && a.skinnedMesh.morphTargetInfluences) {
                a.skinnedMesh.morphTargetInfluences[morphIndex] = value;
              }
            }
            
            return { ...a, morphs: updatedMorphs };
          }
          return a;
        }),
        scene: {
          ...state.scene,
          avatars: state.scene.avatars.map((a) =>
            a.id === id ? { ...a, morphs: { ...a.morphs, [morphName]: value } } : a
          ),
        },
      })),

    // UI actions
    setSelectedAvatar: (id) =>
      set((state) => ({
        ui: { ...state.ui, selectedAvatarId: id },
      })),

    setActiveTool: (tool) =>
      set((state) => ({
        ui: { ...state.ui, activeTool: tool },
      })),

    setTransformMode: (mode) =>
      set((state) => ({
        ui: { ...state.ui, transformMode: mode },
      })),

    toggleGrid: () =>
      set((state) => ({
        ui: { ...state.ui, showGrid: !state.ui.showGrid },
      })),

    toggleHelpers: () =>
      set((state) => ({
        ui: { ...state.ui, showHelpers: !state.ui.showHelpers },
      })),

    toggleScreenshotMode: () =>
      set((state) => ({
        ui: { ...state.ui, isScreenshotModeActive: !state.ui.isScreenshotModeActive },
      })),

    setScreenshotPreviewUrl: (url) =>
      set((state) => ({
        ui: { ...state.ui, screenshotPreviewUrl: url },
      })),

    // Scene management
    loadScene: (sceneData) => {
      set(() => ({
        scene: sceneData,
        loadedAvatars: sceneData.avatars.map((avatar) => ({ ...avatar, hasRig: false })),
        ui: {
          selectedAvatarId: null,
          activeTool: 'select',
          transformMode: 'translate',
          showGrid: true,
          showHelpers: true,
          isScreenshotModeActive: false,
          screenshotPreviewUrl: null,
        },
      }));
      
      // Restore avatar poses after a short delay to allow 3D objects to load
      setTimeout(() => {
        const state = get();
        sceneData.avatars.forEach(avatarData => {
          state.restoreAvatarFromData(avatarData);
        });
      }, 100);
    },

    resetScene: () =>
      set(() => ({
        scene: { ...defaultSceneData },
        loadedAvatars: [],
        ui: {
          selectedAvatarId: null,
          activeTool: 'select',
          transformMode: 'translate',
          showGrid: true,
          showHelpers: true,
          isScreenshotModeActive: false,
          screenshotPreviewUrl: null,
        },
      })),

    exportScene: () => {
      const state = get();
      // First save current poses before exporting
      state.saveCurrentPoses();
      return state.scene;
    },

    saveCurrentPoses: () =>
      set((state) => ({
        scene: {
          ...state.scene,
          avatars: state.scene.avatars.map((avatarData) => {
            const loadedAvatar = state.loadedAvatars.find(a => a.id === avatarData.id);
            if (!loadedAvatar) return avatarData;

            const updatedAvatar = { ...avatarData };

            // Save IK target positions if available
            if (loadedAvatar.ikSetup) {
              const ikTargets: { [chainName: string]: [number, number, number] } = {};
              loadedAvatar.ikSetup.chains.forEach(chain => {
                const pos = chain.target.position;
                ikTargets[chain.name] = [pos.x, pos.y, pos.z];
              });
              updatedAvatar.ikTargets = ikTargets;
            }

            // Morph values are already updated in real-time by updateAvatarMorph
            // Transform data is already updated by updateAvatar

            return updatedAvatar;
          }),
        },
      })),

    restoreAvatarFromData: (avatarData) => {
      const state = get();
      const loadedAvatar = state.loadedAvatars.find(a => a.id === avatarData.id);
      if (!loadedAvatar) return;

      // Restore IK target positions
      if (avatarData.ikTargets && loadedAvatar.ikSetup) {
        loadedAvatar.ikSetup.chains.forEach(chain => {
          const targetPos = avatarData.ikTargets?.[chain.name];
          if (targetPos) {
            chain.target.position.set(targetPos[0], targetPos[1], targetPos[2]);
          }
        });
      }

      // Restore morph target values
      if (avatarData.morphs && loadedAvatar.skinnedMesh?.morphTargetDictionary) {
        Object.entries(avatarData.morphs).forEach(([morphName, value]) => {
          const morphIndex = loadedAvatar.skinnedMesh!.morphTargetDictionary![morphName];
          if (morphIndex !== undefined && loadedAvatar.skinnedMesh!.morphTargetInfluences) {
            loadedAvatar.skinnedMesh!.morphTargetInfluences[morphIndex] = value;
          }
        });
      }

      // Transform data is already handled by the scene loading
    },
  }))
);

// Selector hooks for commonly used data
export const useCamera = () => useSceneStore((state) => state.scene.camera);
export const useLighting = () => useSceneStore((state) => state.scene.lighting);
export const useBackground = () => useSceneStore((state) => state.scene.background);
export const useAvatars = () => useSceneStore((state) => state.loadedAvatars);
export const useSelectedAvatar = () => {
  const selectedId = useSceneStore((state) => state.ui.selectedAvatarId);
  const avatars = useSceneStore((state) => state.loadedAvatars);
  return selectedId ? avatars.find((a) => a.id === selectedId) : null;
};
export const useUI = () => useSceneStore((state) => state.ui);
