import { z } from 'zod';

// Camera schema
const CameraSchema = z.object({
  fov: z.number().min(10).max(120).default(50),
  position: z.tuple([z.number(), z.number(), z.number()]).default([0, 2, 5]),
  target: z.tuple([z.number(), z.number(), z.number()]).default([0, 0, 0]),
});

// Lighting schema
const LightingSchema = z.object({
  key: z.object({
    intensity: z.number().min(0).max(10).default(1),
    color: z.string().default('#ffffff'),
    azimuth: z.number().min(-180).max(180).default(45),
    elevation: z.number().min(-90).max(90).default(45),
  }),
  hdri: z.object({
    path: z.string().optional(),
    exposure: z.number().min(-5).max(5).default(1),
    enabled: z.boolean().default(true),
  }).optional(),
});

// Background schema
const BackgroundSchema = z.object({
  mode: z.enum(['flat', 'hdri', 'set']).default('flat'),
  color: z.string().optional().default('#000000'),
  hdriPath: z.string().optional(),
  setPath: z.string().optional(),
});

// Avatar schema
const AvatarSchema = z.object({
  id: z.string(),
  src: z.string(), // path to .glb file
  position: z.tuple([z.number(), z.number(), z.number()]).default([0, 0, 0]),
  rotationEuler: z.tuple([z.number(), z.number(), z.number()]).default([0, 0, 0]),
  scale: z.number().min(0.1).max(5).default(1),
  pose: z.record(z.string(), z.tuple([z.number(), z.number(), z.number(), z.number()])).default({}), // bone quaternions
  ikTargets: z.record(z.string(), z.tuple([z.number(), z.number(), z.number()])).optional(), // IK target positions
  morphs: z.record(z.string(), z.number().min(0).max(1)).optional(), // morph target weights
});

// Main scene schema
export const SceneJSONSchema = z.object({
  version: z.literal('0.1'),
  canvas: z.object({
    width: z.number().default(1920),
    height: z.number().default(1080),
  }),
  camera: CameraSchema,
  lighting: LightingSchema,
  background: BackgroundSchema,
  avatars: z.array(AvatarSchema).default([]),
});

// TypeScript types
export type SceneJSON = z.infer<typeof SceneJSONSchema>;
export type CameraData = z.infer<typeof CameraSchema>;
export type LightingData = z.infer<typeof LightingSchema>;
export type BackgroundData = z.infer<typeof BackgroundSchema>;
export type AvatarData = z.infer<typeof AvatarSchema>;

// Default scene data
export const defaultSceneData: SceneJSON = {
  version: '0.1',
  canvas: {
    width: 1920,
    height: 1080,
  },
  camera: {
    fov: 50,
    position: [0, 15, 20], // Much closer default view for better model visibility
    target: [0, 0, 0],
  },
  lighting: {
    key: {
      intensity: 1,
      color: '#ffffff',
      azimuth: 45,
      elevation: 45,
    },
    hdri: {
      exposure: 1,
      enabled: true,
    },
  },
  background: {
    mode: 'flat',
    color: '#000000',
  },
  avatars: [],
};

// Validation functions
export function validateSceneJSON(data: unknown): SceneJSON {
  return SceneJSONSchema.parse(data);
}

export function isValidSceneJSON(data: unknown): data is SceneJSON {
  try {
    SceneJSONSchema.parse(data);
    return true;
  } catch {
    return false;
  }
}
