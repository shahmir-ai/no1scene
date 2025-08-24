# NO1Creative — **NEXT_STEP**: Avatar Posing + Library + Provider Hook (Delta from Editor-Only MVP)

This doc is an **incremental plan** from the current editor you already have (loads .glb, camera & lighting controls). It avoids repetition and focuses on what’s missing to make a **showable, end‑to‑end MVP**: move/pose avatars, adjust expressions, save/load scenes, and (optionally) create avatars via a third‑party provider.

> TL;DR expected outcome: I can **create or import a rigged avatar**, **move/rotate/scale** it in the scene, **pose** arms/legs with IK (when rigged), tweak **expressions** (if morphs exist), then **export PNG + scene.json**. Optionally, I can generate a new avatar via a provider and pick it from a simple **Library**.

---

## 0) Baseline (what exists now)
- Next.js app with a working **scene editor**: camera controls, lighting, ability to add a `.glb` avatar (centered), export PNG/JSON (if implemented).
- **Missing:** per‑avatar transform gizmos, pose/IK, expressions, a library, and provider hookup.

Keep all current behavior; implement the deltas below.

---

## 1) Move/Rotate/Scale avatars (no rig required)

Add per‑avatar **TransformControls** so users can place characters anywhere.

- Use `@react-three/drei` **TransformControls** on a **top‑level Group** that wraps each imported avatar.
- When TransformControls is active, **disable** OrbitControls to prevent conflicts.

**Key details**
- Create a `Group` per avatar: `AvatarRoot` → add the glTF scene **inside** it.
- Normalize **scale** on import (compute bounding box height; target ~1.75m).
- Save `position/rotation/scale` in `scene.json` under each avatar.

**Sketch (R3F-ish pseudocode)**
```tsx
const [mode, setMode] = useState<'translate'|'rotate'|'scale'>('translate');
const { controlsRef } = useOrbitControlsStore();

<TransformControls
  mode={mode}
  object={avatarRootRef.current}
  onMouseDown={() => (controlsRef.current.enabled = false)}
  onMouseUp={() => (controlsRef.current.enabled = true)}
/>
```

**Pivot & centering**
- After GLB load, compute `Box3().setFromObject(gltf.scene)`.
- Re-center by subtracting the **box center** from the model’s position so feet are near y=0.
- Keep a small **ground plane + shadow** so users can judge placement.

---

## 2) Detect rigs & enable IK posing (when rigged)

**Goal:** If the GLB has a skeleton, expose IK handles for hands/feet. If not, show a tooltip “This model isn’t rigged; IK disabled.”

**Rig detection (loader step)**
```ts
let isRigged = false;
gltf.scene.traverse((o:any) => {
  if (o.isSkinnedMesh && o.skeleton && o.skeleton.bones?.length) isRigged = true;
});
```

**IK wiring**
- Use `three-stdlib` **CCDIKSolver**.
- Define chains:
  - **Arm**: shoulder → elbow → wrist (end effector = wrist)
  - **Leg**: hip → knee → ankle (end effector = ankle)
- Place small **gizmo spheres** at IK target positions; drag to move targets.
- Clamp target distance to avoid hyperextension; run ~10–15 solver iterations per frame.

**Runtime step**
```ts
// pseudo
solver.update(); // in your render loop or R3F useFrame
```

**UX**
- Toggle: “IK On/Off” per avatar.
- Mode switch: “Hands only / Hands+Feet” to keep UI simple at first.

---

## 3) Expressions (morph targets)

If the avatar has facial **morph targets**, autogenerate sliders.

**Detection**
```ts
const morphs: Record<string, number> = {};
gltf.scene.traverse((o:any) => {
  if (o.isMesh && o.morphTargetDictionary) {
    Object.keys(o.morphTargetDictionary).forEach(name => morphs[name] = 0);
  }
});
```

**Binding**
- Maintain state per avatar: `{ morphs: { [name]: value } }` with 0..1 range.
- Apply values each frame to meshes that own the morph.

Show only a handful by default (e.g., `mouthOpen`, `smile`, `browUp`), with “Show All” toggle.

---

## 4) Scene persistence (extend scene.json)

Add per‑avatar fields (store under `avatars[]`):
```ts
{
  id, src,
  position: [x,y,z],
  rotationEuler: [rx,ry,rz],
  scale: number,
  ikTargets?: { rightHand?: [x,y,z], leftHand?: [x,y,z], rightFoot?: [x,y,z], leftFoot?: [x,y,z] },
  morphs?: { [name:string]: number }
}
```
On load, re-apply transforms, IK targets, and morph values.

---

## 5) Avatar Library (minimal, local)

**Purpose:** Pick previously created/imported avatars without re-uploading.

- Store **name, provider, glb_url, thumb_url** in a local **SQLite** table.
- New routes:
  - `/create-avatar` — *optional*: provider flow (see §6).
  - `/library` — grid of avatars (Use in Editor / Rename / Delete).
- Editor gets a **Library** button to append selected avatars to the scene.

Offline fallback: show 2–3 **sample GLBs** from `/public/seed/` when DB is empty.

---

## 6) Provider hook (optional for the demo, but recommended)

Integrate **one** provider for “selfie → avatar”:
- **Ready Player Me** embed flow (fastest) **OR** **Avaturn** REST upload.
- API endpoints:
  - `POST /api/avatars` → create avatar via provider; save record.
  - `GET /api/avatars` → list; `GET /api/avatars/[id]` → fetch.
- `.env.local` keys for the chosen provider; keep others unused.

If unavailable, keep **manual GLB upload** working so the demo is never blocked.

---

## 7) Acceptance criteria (for this NEXT_STEP)

1) **TransformControls:** I can move/rotate/scale multiple avatars independently; OrbitControls disables while dragging.  
2) **Rig detection:** Non‑rigged GLBs show “IK disabled.” Rigged GLBs enable IK UI.  
3) **IK posing:** With a rigged GLB, I can drag hand/foot targets and see limbs solve plausibly.  
4) **Expressions:** If morphs exist, I see sliders and the face changes live.  
5) **Persistence:** Exported `scene.json` reproduces transform/IK/morph state on reload.  
6) **Library:** I can save/import avatars (name + GLB URL + thumb) and load them into the editor.  
7) **Provider (optional):** I can generate an avatar via one provider and see it appear in the Library.  
8) **Performance:** Editor remains responsive; pixel ratio capped; PNG export at 1920×1080 works.

---

## 8) Task list for Cursor (ordered, minimal backtracking)

1. **TransformControls** per avatar root; lock Orbit while active; save TRS to scene.json.  
2. **Scale & pivot normalization** on import (feet ≈ y=0; scale ~1.75m).  
3. **Rig detection** + UI toggle; scaffold `ik.ts` helpers (create chains, update loop).  
4. **IK gizmos** for wrist/ankle; clamp ranges; solver iterations in `useFrame`.  
5. **Morph sliders** (auto from detected morphTargetDictionary).  
6. **Scene load/save** with new fields (TRS, IK, morphs).  
7. **Library** (SQLite) + routes `/library`, with “Use in Editor” flow.  
8. **Provider hook** (RPM embed OR Avaturn REST) behind a feature flag; keep manual GLB upload.  
9. **Polish**: ground shadow, simple gizmo styling, minimal toasts for errors.

---

## 9) Notes & gotchas

- **Not all GLBs are rigged.** IK requires a **SkinnedMesh + Skeleton**; plain meshes won’t pose.  
- **Morph names vary.** Map common ARKit names if present; otherwise list raw keys.  
- **Transform precision.** Write Euler in radians; cap decimals to keep JSON tidy.  
- **Don’t break the editor.** If IK/morph fails, fail soft and keep transforms working.  
- **Provider timeouts.** If the provider is slow, show a spinner + allow cancel; never block local editing.

---

## 10) Run & demo

- `npm i`  
- `npm run dev` → http://localhost:3000  
- Load two avatars (one rigged if possible), place them with TransformControls, pose with IK, tweak expressions, export PNG + scene.json.  
- Optional: create an avatar via provider at `/create-avatar`, then load it from `/library`.
