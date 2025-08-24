import * as THREE from 'three';

export interface SceneSetup {
  scene: THREE.Scene;
  renderer: THREE.WebGLRenderer;
  camera: THREE.PerspectiveCamera;
}

export function initializeScene(canvas: HTMLCanvasElement): SceneSetup {
  // Create scene
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x000000);

  // Create renderer
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
    preserveDrawingBuffer: true, // For screenshots
  });

  // Set up renderer properties
  renderer.setSize(1920, 1080);
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1;

  // Enable shadows
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  // Create camera
  const camera = new THREE.PerspectiveCamera(
    50, // fov
    1920 / 1080, // aspect ratio
    0.1, // near
    1000 // far
  );
  camera.position.set(0, 2, 5);

  // Add ground plane with shadow receiving
  const groundGeometry = new THREE.PlaneGeometry(20, 20);
  const groundMaterial = new THREE.MeshLambertMaterial({ 
    color: 0x333333,
    transparent: true,
    opacity: 0.5
  });
  const ground = new THREE.Mesh(groundGeometry, groundMaterial);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  return { scene, renderer, camera };
}

export function updateRendererSize(renderer: THREE.WebGLRenderer, width: number, height: number) {
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio));
}

export function updateCameraAspect(camera: THREE.PerspectiveCamera, aspect: number) {
  camera.aspect = aspect;
  camera.updateProjectionMatrix();
}
