# Scene JSON Specification

This document defines the structure and format of the `scene.json` file that captures all scene state for reproducibility.

## Schema Version
Current version: `0.1`

## File Structure

```json
{
  "version": "0.1",
  "canvas": {
    "width": 1920,
    "height": 1080
  },
  "camera": {
    "fov": 50,
    "position": [0, 2, 5],
    "target": [0, 0, 0]
  },
  "lighting": {
    "key": {
      "intensity": 1,
      "color": "#ffffff",
      "azimuth": 45,
      "elevation": 45
    },
    "hdri": {
      "path": "/hdri/studio.hdr",
      "exposure": 1,
      "enabled": true
    }
  },
  "background": {
    "mode": "flat",
    "color": "#000000",
    "hdriPath": "/hdri/environment.hdr",
    "setPath": "/sets/studio.glb"
  },
  "avatars": [
    {
      "id": "avatar_12345",
      "src": "character.glb",
      "position": [0, 0, 0],
      "rotationEuler": [0, 0, 0],
      "scale": 1,
      "pose": {
        "LeftArm": [0, 0, 0, 1],
        "RightArm": [0, 0, 0, 1]
      },
      "ikTargets": {
        "leftArm": [1, 1.5, 0.5],
        "rightArm": [-1, 1.5, 0.5]
      },
      "morphs": {
        "smile": 0.7,
        "eyesWide": 0.3
      }
    }
  ]
}
```

## Field Specifications

### Canvas
- **width**: Output image width in pixels (default: 1920)
- **height**: Output image height in pixels (default: 1080)

### Camera
- **fov**: Field of view in degrees (10-120, default: 50)
- **position**: Camera position as [x, y, z] in world space (meters)
- **target**: Camera look-at target as [x, y, z] in world space (meters)

### Lighting
- **key.intensity**: Directional light intensity (0-10, default: 1)
- **key.color**: Light color as hex string (default: "#ffffff")
- **key.azimuth**: Horizontal angle in degrees (-180 to 180, default: 45)
- **key.elevation**: Vertical angle in degrees (-90 to 90, default: 45)
- **hdri.path**: Path to HDRI file (optional)
- **hdri.exposure**: HDRI exposure value (-5 to 5, default: 1)
- **hdri.enabled**: Whether HDRI lighting is active (default: true)

### Background
- **mode**: Background type - "flat", "hdri", or "set"
- **color**: Flat background color as hex string (when mode = "flat")
- **hdriPath**: Path to HDRI file (when mode = "hdri")
- **setPath**: Path to 3D set file (when mode = "set")

### Avatars
Array of avatar objects with the following properties:

- **id**: Unique identifier string
- **src**: Path to avatar .glb/.gltf file
- **position**: Avatar position as [x, y, z] in world space (meters)
- **rotationEuler**: Avatar rotation as [x, y, z] Euler angles (radians)
- **scale**: Uniform scale factor (0.1-5, default: 1)
- **pose**: Bone rotations as quaternions [x, y, z, w]
- **ikTargets**: IK target positions as [x, y, z] (optional)
- **morphs**: Morph target weights 0-1 (optional)

## Coordinate System
- **Units**: Meters
- **Origin**: World center (0, 0, 0)
- **Axes**: 
  - X: Right (positive) / Left (negative)
  - Y: Up (positive) / Down (negative)  
  - Z: Forward (positive) / Backward (negative)
- **Rotations**: Right-handed coordinate system
- **Angles**: Radians for pose data, degrees for lighting angles

## Validation Rules
1. All numeric values must be finite
2. Colors must be valid hex strings (e.g., "#ffffff")
3. File paths should be relative to the project root
4. Avatar IDs must be unique within the scene
5. Morph target weights must be between 0 and 1
6. Quaternions should be normalized (though normalization will be enforced on load)

## Compatibility Notes
- **Forward Compatibility**: Unknown fields are ignored
- **Backward Compatibility**: Missing optional fields use defaults
- **Version Handling**: Future versions may add fields but won't remove existing ones
- **File Paths**: Relative paths are preferred for portability

## Usage Examples

### Minimal Scene
```json
{
  "version": "0.1",
  "canvas": { "width": 1920, "height": 1080 },
  "camera": { "fov": 50, "position": [0, 2, 5], "target": [0, 0, 0] },
  "lighting": { "key": { "intensity": 1, "color": "#ffffff", "azimuth": 45, "elevation": 45 } },
  "background": { "mode": "flat", "color": "#000000" },
  "avatars": []
}
```

### Two-Character Scene
```json
{
  "version": "0.1",
  "canvas": { "width": 1920, "height": 1080 },
  "camera": { "fov": 45, "position": [0, 1.8, 3], "target": [0, 1.2, 0] },
  "lighting": {
    "key": { "intensity": 1.2, "color": "#ffffff", "azimuth": 30, "elevation": 60 },
    "hdri": { "path": "/hdri/studio.hdr", "exposure": 0.8, "enabled": true }
  },
  "background": { "mode": "hdri", "hdriPath": "/hdri/studio.hdr" },
  "avatars": [
    {
      "id": "character_1",
      "src": "hero.glb",
      "position": [-0.5, 0, 0],
      "rotationEuler": [0, 0.2, 0],
      "scale": 1,
      "morphs": { "smile": 0.8, "eyesWide": 0.4 }
    },
    {
      "id": "character_2", 
      "src": "sidekick.glb",
      "position": [0.5, 0, 0],
      "rotationEuler": [0, -0.2, 0],
      "scale": 0.9,
      "morphs": { "surprised": 0.6 }
    }
  ]
}
```
