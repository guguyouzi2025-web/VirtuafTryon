export enum AppStep {
  MODEL_CREATION,
  WORKSPACE,
}

export interface ModelCriteria {
  nationality: string;
  gender: string;
  skinTone: string;
  ageRange: string;
  heightRange: string;
  height: number;
  build: string;
  hairColor: string;
  hairStyle: string;
  eyeColor: string;
  faceShape: string;
  expression: string;
  shotType: string;
  cameraAngle: string;
  lightingStyle: string;
  lensType: string;
}

export interface Model {
  image: string; // base64 image data
  description: string; // The prompt that generated the model
}

export interface Pose {
  name: string;
  imageUrl: string;
  prompt: string;
}

export type GarmentType = 'full outfit' | 'top only' | 'bottom only';

export interface GarmentData {
  segmented: string;
  original: string;
}

export interface Garment extends GarmentData {
  id: string;
  thumbnail: string;
  type: GarmentType;
}

export interface WorkspaceState {
  selectedPose: Pose | null;
  posedImages: Record<string, string>;
  garment: string | null;
  originalGarment: string | null;
  garmentType: GarmentType;
  fabricType: string;
  finalImage: string | null;
}

export interface SavedProject {
  id: string;
  name: string;
  thumbnail: string;
  initialModel: Model;
  workspaceState: WorkspaceState;
}

export interface Bottom {
    name: string;
    thumbnail: string;
    segmented: string;
}