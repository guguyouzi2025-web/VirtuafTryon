
import { ModelCriteria, GarmentType } from './types';

const getBuildDescription = (build: string): string => {
    switch (build) {
        case "Slim":
            return "a slim, slender physique";
        case "Athletic":
            return "an athletic, toned body with visible muscle definition";
        case "Well-proportioned":
            return "a well-proportioned, balanced physique";
        case "Curvy":
            return "a curvy figure with a defined waist and fuller hips";
        case "Plus-sized":
            return "a plus-sized and full-figured body";
        case "Pregnant":
            return "a pregnant body with a noticeable baby bump";
        default:
            return `a ${build} build`;
    }
}

const getLightingDescription = (style: string): string => {
    switch (style) {
        case "Soft Studio Light":
            return "soft, even studio lighting with a large octabox key light, filling in shadows for a clean, professional look";
        case "Dramatic Rim Light":
            return "dramatic, high-contrast rim lighting from the side and back, creating a sharp silhouette and deep shadows";
        case "Cinematic Lighting":
            return "moody cinematic lighting with a mix of warm and cool tones, creating a film-like atmosphere";
        case "Golden Hour Glow":
            return "warm, soft, and diffused golden hour sunlight, creating a beautiful, gentle glow on the subject";
        default:
            return style;
    }
}

const getLensDescription = (lens: string): string => {
    switch (lens) {
        case "85mm Portrait Lens (f/1.4)":
            return "shot on an 85mm f/1.4 lens, creating beautiful background compression and creamy bokeh";
        case "50mm Standard Lens (f/1.8)":
            return "shot on a 50mm f/1.8 lens, providing a natural field of view with pleasant depth of field";
        case "35mm Environmental Lens (f/2.0)":
            return "shot on a 35mm f/2.0 lens, capturing more of the environment with a wider perspective";
        default:
            return `shot on a ${lens}`;
    }
}

const getShotDescription = (shot: string): string => {
    switch (shot) {
        case "Close-up Portrait":
            return "a beautiful close-up portrait (head and shoulders)";
        case "Medium Shot":
            return "a professional medium shot (from the waist up)";
        case "Cowboy Shot":
            return "a stylish cowboy shot (from mid-thigh up)";
        case "Full Body Shot":
            return "a professional full body shot";
        default:
            return shot;
    }
}


/**
 * Generates a prompt for creating a model portrait.
 * @param c - The model criteria object, including nationality, gender, skin tone, etc.
 * @returns A detailed string prompt for generating a high-quality model portrait.
 *
 * Notes:
 * - "ultra-realistic, photorealistic, 8k, sharp focus": Technical parameters for high resolution and realism.
 * - Combines various physical attributes into a concise, comma-separated format.
 * - Specifies a professional studio setting with neutral lighting and background to emphasize the model.
 * - The structure is optimized for clarity and effectiveness with image generation models.
 */
export const getModelGenerationPrompt = (c: ModelCriteria): string =>
  [
    // Technical & Style Parameters
    `ultra-realistic, hyper-detailed, photorealistic, 8k, sharp focus, professional photograph.`,
    `${getLensDescription(c.lensType)}.`,
    // Shot & Subject
    `${getShotDescription(c.shotType)} of a ${c.ageRange} year old ${c.nationality} ${c.gender}.`,
    // Detailed Features
    `Detailed physical features: ${c.faceShape} face, ${c.skinTone} skin tone, ${c.eyeColor} eyes, and ${c.hairColor} ${c.hairStyle} hair.`,
    `Body type: ${c.height}cm tall with ${getBuildDescription(c.build)}.`,
    // Outfit
    `The person is wearing a simple, plain white short-sleeved t-shirt and plain white shorts.`,
    // Pose & Angle
    `Posing with a ${c.expression.toLowerCase()} expression, looking directly at the camera.`,
    `The camera is positioned at a ${c.cameraAngle.toLowerCase()}.`,
    // Lighting & Environment
    `Illuminated by ${getLightingDescription(c.lightingStyle)}.`,
    `Set against a plain, seamless, pure white studio backdrop.`
  ].join(' ');


/**
 * Generates a prompt to pose an existing model from an image.
 * @param posePrompt - The specific description of the desired pose.
 * @returns A string prompt combining the model's characteristics with the new pose.
 *
 * Notes:
 * - This prompt is designed to be used with an input image of the model.
 * - It explicitly instructs the AI to preserve all visual characteristics from the image, including clothing.
 */
export const getPoseGenerationPrompt = (posePrompt: string): string => 
  `Generate a new photograph of the person from the provided image, but in a new pose: "${posePrompt}".
It is crucial that the person's face, hair, body, and all clothing and accessories remain identical to the original image.
Only the pose should change.
Output a full body photograph set against the same plain, seamless, pure white studio backdrop.`;


const getFabricDescription = (fabric: string): string => {
    switch (fabric) {
        case "Cotton":
            return "Render the fabric with a soft, matte finish and natural, gentle wrinkles. Emphasize its comfortable drape.";
        case "Silk":
            return "Render the fabric with a noticeable, smooth sheen and a fluid, flowing drape. Create fine, delicate wrinkles where it gathers.";
        case "Denim":
            return "Render the fabric with a sturdy, slightly textured matte finish and a stiffer structure. Create characteristic creases and folds, especially around joints.";
        case "Leather":
            return "Render the fabric with a distinct sheen and reflections. Give it a structured, heavier weight and create defined folds and creases.";
        case "Wool":
            return "Render the fabric with a soft, slightly fuzzy texture and a heavy drape. It should have soft, thick folds rather than sharp wrinkles.";
        default:
            return "Drape the new garment naturally on the person's body.";
    }
}

/**
 * Generates a prompt for the virtual try-on task based on the garment type.
 * @param garmentType - The type of garment being applied ('full outfit', 'top only', 'bottom only').
 * @param fabricType - The primary fabric of the garment.
 * @returns A specific string prompt for the virtual try-on.
 */
export const getVirtualTryOnPrompt = (garmentType: GarmentType, fabricType: string): string => {
  let instructions = '';
  const fabricRule = `**Fabric Rendering:** ${getFabricDescription(fabricType)}`;

  const baseInstructions = `
**Source Images:**
You are provided with two images:
1.  **Target Model:** The person to dress.
2.  **Segmented Garment:** The clothing isolated on a transparent background. This is your **source of truth** for shape, texture, color, and fine details.

**Crucial Rules:**
1.  **Fidelity to Source:** The final rendered garment MUST perfectly match the texture, material, color, and fine details (like seams, prints, or embroidery) from the **Segmented Garment** image. This is the highest priority.
2.  **Preserve Person & Background:** Do NOT change the Target Model's face, hair, body shape, pose, or the background.
3.  **Realistic Fit:** The garment must look completely natural on the person, aligning with their body shape and pose. All lighting, colors, and shadows must be consistent with the Target Model's photo.
4.  ${fabricRule}`;

  switch (garmentType) {
    case 'top only':
      instructions = `**Task:** Replace *only the top garment* (e.g., shirt, t-shirt, jacket) on the **Target Model** using the provided **Segmented Garment** image.

${baseInstructions}

5.  **PRESERVE BOTTOMS:** The Target Model's original pants, skirt, or any lower body clothing MUST remain completely unchanged.`;
      break;
    
    case 'bottom only':
      instructions = `**Task:** Replace *only the bottom garment* (e.g., pants, skirt, shorts) on the **Target Model** using the provided **Segmented Garment** image.

${baseInstructions}

5.  **PRESERVE TOP:** The Target Model's original shirt, t-shirt, or any upper body clothing MUST remain completely unchanged.`;
      break;

    case 'full outfit':
    default:
      instructions = `**Task:** Replace the **entire outfit** on the **Target Model** with the new clothing from the **Segmented Garment** image. This is a **full body replacement**.

${baseInstructions}

5.  **MANDATORY INSTRUCTION: REPLACE ALL CLOTHING.** It is not optional. You MUST replace **every single piece of clothing** on the Target Model. Do NOT preserve the original pants, shirt, or any other garment, even if they look similar to the new ones. The final image must ONLY show the model wearing the new outfit provided. Both top and bottom garments from the original model MUST be removed and replaced.`;
      break;
  }

  return instructions;
};

/**
 * Generates a prompt for segmenting a full outfit from an image.
 * @returns A string prompt that instructs the model to isolate a full outfit and return it on a transparent background.
 */
export const getGarmentSegmentationPrompt = (garmentType: GarmentType = 'full outfit'): string => {
  if (garmentType === 'full outfit') {
    // User's suggested prompt, adapted for a transparent background and with extra instructions for clarity.
    return `Extract each clothing from the photo and place them separately on a transparent background.
Remove the person entirely and reconstruct any hidden parts of the clothing.
Preserve all original details like fabric texture, color, and lighting.`;
  }

  let targetGarmentDescription: string;
  // The remaining cases are for top or bottom only
  if (garmentType === 'top only') {
    targetGarmentDescription = "the top clothing item (e.g., shirt, blouse, t-shirt, jacket)";
  } else { // 'bottom only'
    targetGarmentDescription = "the bottom clothing item (e.g., pants, skirt, shorts)";
  }
  
  return `Extract ${targetGarmentDescription} from the photo.
The result must be ONLY the garment on a transparent background.
Remove the person entirely and reconstruct any hidden parts of the clothing.
Preserve all original details like fabric texture, color, and lighting.`;
}

/**
 * Generates a prompt for refining an existing garment segmentation.
 * @returns A string prompt that instructs the model to improve a segmentation based on the original image.
 */
export const getGarmentRefinementPrompt = (): string => {
  return `Refine the provided segmented garment image, using the original photo for reference.
The output should be a more accurate and clean segmentation of the clothing on a transparent background.`;
};

/**
 * Generates a prompt to get model criteria from a garment image.
 * @returns A string prompt instructing the model to return a JSON object.
 */
export const getModelCriteriaFromGarmentPrompt = (): string => {
  return `Analyze the provided garment image. Based on its style, color, and type, generate a JSON object describing the ideal model to wear it. The model should complement the garment and look like a professional fashion model.

Consider the following:
- **Style:** Is it casual, formal, athletic, bohemian, etc.?
- **Occasion:** Where would this garment be worn? (e.g., office, party, gym)
- **Target Demographic:** What age group and gender would most likely wear this?

Return a valid JSON object with the following keys, populated with appropriate values from the allowed options.

- **nationality**: string (e.g., "American", "Italian", "Japanese")
- **gender**: "Female" or "Male"
- **skinTone**: "Fair", "Light", "Medium", "Olive", "Tan", "Dark"
- **ageRange**: "18-25", "26-35", "36-45"
- **build**: "Slim", "Athletic", "Well-proportioned", "Curvy", "Plus-sized"
- **hairColor**: "Black", "Brown", "Blonde", "Red"
- **hairStyle**: "Short Pixie Cut", "Medium Wavy", "Long Straight", "Curly Afro", "Slicked Back"
- **eyeColor**: "Brown", "Blue", "Green", "Hazel"
- **faceShape**: "Oval", "Round", "Square", "Heart"
- **expression**: "Neutral", "Smiling", "Confident", "Serious"

The JSON output should be clean and directly parsable.`;
};

export const getSwapModelPrompt = (c: Partial<ModelCriteria>): string => {
    const descriptions = [
        `a ${c.ageRange || '25-35'} year old ${c.nationality || ''} ${c.gender || 'person'}`,
        c.faceShape && `${c.faceShape} face`,
        c.skinTone && `${c.skinTone} skin tone`,
        c.eyeColor && `${c.eyeColor} eyes`,
        c.hairColor && c.hairStyle && `${c.hairColor} ${c.hairStyle} hair`,
        c.build && `with ${getBuildDescription(c.build)}`,
    ].filter(Boolean).join(', ');

    return `
**Task: Swap Model**
You are given an image of a person wearing an outfit. Your task is to replace ONLY the person with a new one matching this description: **${descriptions}**.

**Crucial Rules:**
1.  **Preserve Everything Else:** The **clothing, pose, and background** from the original image MUST remain absolutely identical. Do NOT change them.
2.  **Seamless Integration:** The new person must be seamlessly integrated into the image, with lighting and shadows that are consistent with the original scene.
3.  **High Fidelity:** The result should be a photorealistic, high-quality photograph.
`;
};

export const getChangeBackgroundPrompt = (backgroundDescription: string): string => {
  return `
**Task: Change Background**
You are provided with a photograph of a person. Your goal is to replace the background with a new one.

**New Background Description:** "${backgroundDescription}"

**Crucial Rules:**
1.  **Preserve the Subject:** The person, their clothing, their pose, and any objects they are holding MUST remain completely unchanged. Do not alter them in any way.
2.  **Realistic Lighting:** Adjust the lighting on the person to realistically match the new background environment. For example, if the new background is a sunny beach, the person should be lit by bright sunlight.
3.  **Seamless Composite:** The final image should look like a real photograph, not an obvious composite. Ensure edges are clean and the perspective matches.
`;
};
