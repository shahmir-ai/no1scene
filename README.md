# NO1Creative Scene Editor — MVP Handoff

**Goal:** A **browser-based scene editor** to compose YouTube-thumbnail shots using **poseable avatar proxies**, adjustable lighting, camera control, simple backgrounds, expressions, and **one-click exports** (PNG + JSON).  
**Out of scope for MVP:** 4D Gaussian Splatting, AI image beautification, ControlNet, identity locking, hosted inference, A/B testing automation, accounts/payments.

## 1) Product Scope (what this MVP does)

- Load **rigged avatars** (`.glb` or `.gltf`) as **poseable proxies** (e.g., “MrBeast” stand-in).
- **Pose** avatars via simple **IK** handles (hands/feet) + rotation gizmos.
- Adjust **expressions** (morph targets) with sliders.
- **Camera**: orbit, dolly (zoom), reset to presets (Front / 45° / Profile).
- **Lighting**: HDRI environment + single adjustable key light (intensity/angle).
- **Background**: flat color, HDRI, or simple `.glb` set (e.g., studio cyclorama).
- **Export**:
  - `snapshot.png` (current canvas @ 1920×1080)
  - `scene.json` (camera, lights, avatar pose/expr, background)
  - (Optional toggle) `depth.png` and `normal.png` for future AI passes (no AI now).

**Live dev experience:** one command to start a dev server with HMR; edit and see changes instantly in the browser.

## 2) Non-Goals (explicitly not included now)

- No 4D Gaussian Splatting / NeRF.
- No multimodal (sketch/prompt/photo-to-AI) inputs.
- No photoreal diffusion or ControlNet/InstantID.
- No auth, billing, multi-tenant, analytics, or CTR integrations.

## 3) Tech Stack (lean, web-native)

- **Next.js 14** (App Router) + **TypeScript**
- **three.js** for 3D; **@react-three/fiber** (R3F) + **@react-three/drei** for React bindings/helpers
- **three-stdlib** for `CCDIKSolver`, `RGBELoader`, etc.
- **Zustand** for lightweight scene/editor state
- **Zod** for validating `scene.json` schema

> Terms you saw:
> - **glTF / .gltf / .glb**: open 3D scene/mesh format (GLTF is JSON; **GLB is single-file binary**).
> - **DCC**: Digital Content Creation tools (Blender/Maya). Not required for MVP.
> - **IK**: Inverse Kinematics (drag a hand, the arm solves automatically).
> - **HDRI**: 360° high-dynamic-range image for environment lighting.

## 4) Project Structure (to be created by the AI)

```
no1-scene-editor/
├─ app/
│  ├─ layout.tsx
│  └─ page.tsx
├─ components/
│  ├─ SceneCanvas.tsx
│  ├─ AvatarLoader.tsx
│  ├─ IKControls.tsx
│  ├─ CameraPanel.tsx
│  ├─ LightPanel.tsx
│  ├─ BackgroundPanel.tsx
│  ├─ ExpressionPanel.tsx
│  ├─ ExportPanel.tsx
│  └─ UiShell.tsx
├─ lib/
│  ├─ three/initScene.ts
│  ├─ three/loadHDRI.ts
│  ├─ three/exporters.ts       # png/depth/normal export helpers
│  ├─ three/ik.ts              # CCDIKSolver wiring helpers
│  ├─ sceneSchema.ts           # zod schema + TS types
│  └─ store.ts                 # zustand state
├─ public/
│  ├─ hdri/placeholder.hdr     # add any CC0 HDRI here
│  ├─ sets/studio.glb          # simple cyclorama/warehouse set
│  └─ avatars/README.txt       # where to drop sample .glb avatars
├─ styles/
│  └─ globals.css
├─ docs/
│  ├─ PRODUCT_BRIEF.md
│  ├─ SCENE_JSON_SPEC.md
│  └─ DEMO_SCRIPT.md
├─ .env.example                # empty for now
├─ next.config.mjs
├─ package.json
├─ tsconfig.json
├─ .gitignore
└─ README.md                   # this file
```

## 5) Core Files — Responsibilities & TODOs

### `app/page.tsx`
- Renders `UiShell` with left toolbar (Load/Save/Export), right panels (Camera, Lights, Background, Expressions), and center `SceneCanvas`.
- Hotkeys:  
  - `1` Camera preset: Front; `2` 45°; `3` Profile  
  - `Z` Toggle grid; `L` Toggle key light; `B` Cycle background mode

### `components/SceneCanvas.tsx`
- R3F `<Canvas>` at **1920×1080** (fit in responsive container with letterbox).
- Loads HDRI via `RGBELoader` and sets `scene.environment`.
- Adds one `directionalLight` as **Key** (controls: azimuth, elevation, intensity).
- Loads **set** (optional `.glb`) at origin; ground plane + shadow catcher.
- Accepts multiple **avatars** (SkinnedMesh) with named bones & morph targets.
- Exposes **OrbitControls** (limit pitch to avoid flipping; dolly for zoom).
- Provides **RenderTargets** for (optional) depth/normal exports.

### `components/AvatarLoader.tsx`
- UI to **drop/upload** `.glb/.gltf`.
- On load, detects **morph targets** and **bone hierarchy**.
- Registers avatar in the scene store with a unique ID and default pose.

### `components/IKControls.tsx`
- Attaches **CCDIKSolver** chains for arms/legs to each avatar.
- Visible **gizmos/handles** (simple spheres) on end-effectors; drag in viewport to move IK targets within safe limits.
- Fallback: rotation gizmo per major joint.

### `components/CameraPanel.tsx`
- Sliders: FOV, focus distance (if using post-DOF later), dolly.
- Buttons: Presets (Front, 45°, Profile), Frame All, Reset.

### `components/LightPanel.tsx`
- Controls for Key light: intensity, color (simple), azimuth/elevation.
- HDRI toggle + exposure.

### `components/BackgroundPanel.tsx`
- Mode: **Flat Color** / **HDRI** / **Set (.glb)**.
- For HDRI: file picker or choose `/public/hdri/placeholder.hdr`.
- For Set: dropdown of sample `.glb` under `/public/sets`.

### `components/ExpressionPanel.tsx`
- Auto-generates sliders for any detected morph targets (e.g., `mouthOpen`, `smile`, `browUp`).

### `components/ExportPanel.tsx`
- Buttons:
  - **Export PNG** (`1920×1080`, transparent BG toggle)
  - **Export scene.json** (schema below)
  - **Export depth/normal** (optional switches)
- Uses helpers in `lib/three/exporters.ts`.

### `lib/three/initScene.ts`
- Initializes renderer with correct output encoding (sRGB), tone mapping (ACES), and pixel ratio caps.
- Sets up shadow map if enabled.

### `lib/three/loadHDRI.ts`
- Loads `.hdr` via `RGBELoader` (from `three-stdlib`), PMREM preprocess, assign to `scene.environment`.

### `lib/three/exporters.ts`
- `exportPNG(canvas): Promise<Blob>`
- `exportDepth(scene, camera): Promise<Blob>` (via `MeshDepthMaterial`)
- `exportNormal(scene, camera): Promise<Blob>` (normal material pass)

### `lib/three/ik.ts`
- Helpers to create CCDIK chains for common rigs (arm: shoulder→elbow→wrist; leg: hip→knee→ankle).
- Apply solver step each frame after controls.

### `lib/sceneSchema.ts`
- **Zod** schema + TS types for `scene.json`:
```ts
export type SceneJSON = {
  version: "0.1";
  canvas: { width: number; height: number; };
  camera: { fov: number; position: [number,number,number]; target: [number,number,number]; };
  lighting: {
    key: { intensity: number; color: string; azimuth: number; elevation: number; };
    hdri?: { path: string; exposure: number; enabled: boolean; };
  };
  background: { mode: "flat"|"hdri"|"set"; color?: string; hdriPath?: string; setPath?: string; };
  avatars: Array<{
    id: string;
    src: string;                          // path to .glb
    position: [number,number,number];
    rotationEuler: [number,number,number];
    scale: number;
    pose: { [boneName: string]: [x:number,y:number,z:number,w:number] }; // quaternions
    ikTargets?: { [chainName: string]: [number,number,number] };
    morphs?: { [morphName: string]: number }; // 0..1
  }>;
};
```

### `docs/PRODUCT_BRIEF.md`
- One page stating: **What** (scene editor for thumbnails), **Who** (NO1Creative internal + clients), **Why** (faster direction for artists), **Out of scope** list, and future phases.

### `docs/SCENE_JSON_SPEC.md`
- The schema above, with examples and notes for reproducibility (units = meters, coordinate system = three.js defaults, degrees vs radians, etc.).

### `docs/DEMO_SCRIPT.md`
- 60–90s demo steps: load two avatars → pose with IK → set camera preset → tweak key light → switch to HDRI → export PNG + JSON.

## 6) Dependencies (pin versions)

`package.json` (core deps—AI should fill exact latest minor versions that work together):

```json
{
  "name": "no1-scene-editor",
  "private": true,
  "scripts": {
    "dev": "next dev -p 3000",
    "build": "next build",
    "start": "next start -p 3000",
    "lint": "next lint"
  },
  "dependencies": {
    "next": "14.x",
    "react": "18.x",
    "react-dom": "18.x",
    "three": "^0.165.0",
    "@react-three/fiber": "^8.15.0",
    "@react-three/drei": "^9.105.0",
    "three-stdlib": "^2.29.10",
    "zustand": "^4.5.2",
    "zod": "^3.23.8"
  },
  "devDependencies": {
    "typescript": "^5.5.4",
    "@types/react": "^18.2.45",
    "@types/node": "^20.12.12",
    "eslint": "^9.4.0",
    "eslint-config-next": "14.x"
  }
}
```

**Note:** include `three-stdlib` so we can import `CCDIKSolver` and `RGBELoader` cleanly.

## 7) Live Dev (how to run)

- `npm i` (or `pnpm i` / `yarn`)
- `npm run dev` → open **http://localhost:3000**  
  HMR enabled—edit panels/components and see changes live.
- Drop sample `.glb` avatars into `/public/avatars/` (or upload via UI).
- To test HDRI, place a CC0 `.hdr` in `/public/hdri/placeholder.hdr`.

## 8) Acceptance Criteria (MVP is “done” when…)

1. Load two `.glb` avatars; both appear on a ground plane with shadows.
2. Orbit/dolly camera; switch to presets; export 1920×1080 PNG.
3. IK: drag each avatar’s hand and foot targets; limbs solve plausibly.
4. Expressions: at least three morph sliders work on a sample avatar.
5. Lighting: HDRI on/off, key light angle/intensity visibly change the scene.
6. Background modes: Flat, HDRI, and Set (.glb) all function.
7. Export `scene.json` that, when reloaded, **reproduces the same framing/pose**.
8. Optional: depth/normal images export without breaking main render.

## 9) Implementation Notes & Edge Cases

- **Units/scale:** Normalize avatar scale on import; provide a uniform `scale` slider per avatar.
- **IK safety:** Clamp IK target distance to avoid hyperextension; small per-frame solver iterations (e.g., 10–15) for stability.
- **Hands/face collisions:** Out of scope; user can adjust.
- **Morph naming:** Different rigs vary—build UI from detected morph names.
- **Performance:** Cap pixel ratio (e.g., `Math.min(2, window.devicePixelRatio)`), and enable `renderer.outputColorSpace = SRGBColorSpace`.
- **Exports:** For transparent PNGs, temporarily set background to transparent and re-render to a target.

## 10) Future Phases (reference only, not to implement now)

- Hosted inference (img2img “photoreal” lift) with ControlNet (depth/normal) + InstantID per face region.
- Library of premade poses/sets.
- Asset locker + per-client branding presets.
- A/B variant helper (batch-export with small param diffs).

## 11) Prompts/Tasks for the AI (Cursor/Gemini)

- **Create** the project skeleton exactly as in Section 4.
- **Implement** `SceneCanvas` with R3F, HDRI env, Key light, OrbitControls, and shadowed ground.
- **Wire** `AvatarLoader` to import `.glb` (drag-and-drop), detect morphs/bones, and register in state.
- **Add** `IKControls` using `CCDIKSolver` from `three-stdlib`; create draggable effectors.
- **Build** UI Panels (Camera, Light, Background, Expressions, Export) with clean, minimal layout.
- **Implement** exporters for PNG / JSON / depth / normal (depth/normal via material override passes).
- **Validate** `scene.json` with Zod; implement load/save.
- **Ship** a working demo with two sample avatars and one HDRI.

---

### Quick Q&A (for anyone new reading this)

- **Why IK?** Faster posing: drag a hand; arm solves automatically.  
- **Why HDRI?** Good-enough realism instantly (lighting + reflections) without manual multi-light rigs.  
- **What are “poseable proxies”?** Avatars that are close enough to the subject to design **layout and pose**—final pixels come later (artist/AI).

---

**End of handoff.**  
Build this in-browser, keep it snappy, and don’t bolt on AI until the editor feels great.
