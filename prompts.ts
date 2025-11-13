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
            return "Render the fabric as **Cotton**: a soft, matte finish that absorbs light, with natural, gentle micro-wrinkles and a comfortable, breathable drape.";
        case "Silk":
            return "Render the fabric as **Silk**: a high-sheen, fluid material with sharp specular highlights. It should have a liquid-like, flowing drape that clings to the body and forms fine, delicate wrinkles.";
        case "Denim":
            return "Render the fabric as **Denim**: a sturdy, heavy material with a distinct diagonal twill weave texture. It has a matte finish and a stiff structure, creating characteristic sharp creases and folds.";
        case "Leather":
            return "Render the fabric as **Leather**: a material with a distinct, semi-gloss sheen and strong light reflections. Give it a structured, heavy weight that creates defined, substantial folds and creases.";
        case "Wool":
            return "Render the fabric as **Wool**: a thick, heavy material with a soft, slightly fuzzy texture that diffuses light. It should have a heavy drape with soft, thick folds rather than sharp wrinkles.";
        default:
            return "Drape the new garment naturally on the person's body, respecting its apparent material.";
    }
}

/**
 * Generates a prompt for the virtual try-on task based on the garments provided.
 * @param garmentConfig - An object indicating which garments are provided and their fabrics.
 * @returns A specific string prompt for the virtual try-on.
 */
export const getVirtualTryOnPrompt = (garmentConfig: { top?: { fabric: string }, bottom?: { fabric: string } }): string => {
  const hasTop = !!garmentConfig.top;
  const hasBottom = !!garmentConfig.bottom;
  
  let imageSources = "1.  **Target Model:** The person to dress. Their pose, body shape, and lighting are the target context.";
  let partIndex = 2;
  if (hasTop) {
    imageSources += `\n${partIndex}.  **Top Garment:** The clothing for the upper body, isolated on a transparent background. This is your source of truth for the top.`;
    partIndex++;
  }
  if (hasBottom) {
    imageSources += `\n${partIndex}.  **Bottom Garment:** The clothing for the lower body, isolated on a transparent background. This is your source of truth for the bottom.`;
  }
  
  let taskInstruction = '';
  let preservationRule = '';
  
  if (hasTop && hasBottom) {
    taskInstruction = "Replace the **entire outfit** on the **Target Model** using the **Top Garment** and **Bottom Garment** provided.";
    preservationRule = "**REPLACE ALL CLOTHING:** You MUST replace every single piece of clothing on the Target Model. Do NOT preserve the original pants, shirt, or any other garment.";
  } else if (hasTop) {
    taskInstruction = "Replace **only the top garment** (e.g., shirt, t-shirt, jacket) on the **Target Model** using the provided **Top Garment** image.";
    preservationRule = "**PRESERVE BOTTOMS:** The Target Model's original pants, skirt, or any lower body clothing MUST remain completely unchanged.";
  } else if (hasBottom) {
    taskInstruction = "Replace **only the bottom garment** (e.g., pants, skirt, shorts) on the **Target Model** using the provided **Bottom Garment** image.";
    preservationRule = "**PRESERVE TOP:** The Target Model's original shirt, t-shirt, or any upper body clothing MUST remain completely unchanged.";
  }

  let fabricRules = [];
  if (hasTop) fabricRules.push(`**Top Fabric:** ${getFabricDescription(garmentConfig.top!.fabric)}`);
  if (hasBottom) fabricRules.push(`**Bottom Fabric:** ${getFabricDescription(garmentConfig.bottom!.fabric)}`);
  
  const prompt = `
**Source Images:**
You are provided with the following images:
${imageSources}

**Task:** ${taskInstruction}

**Crucial Rules:**
1.  **Absolute Fidelity to Source:** The final rendered garment(s) MUST perfectly match the texture, material, color, patterns, and all fine details from the source Garment image(s). This is the highest priority.
2.  **Strict Proportion Preservation:** The garment's original length and proportions must be strictly maintained. A crop top must remain a crop top.
3.  **Preserve Person & Background:** Do NOT change the Target Model's face, hair, body shape, pose, or the background.
4.  **Realistic Draping & Fit:** The garment(s) must be draped naturally, conforming to the body and pose. Lighting, colors, and shadows must be consistent with the Target Model's photo.
5.  **Fabric Rendering:** ${fabricRules.join(' ')}
6.  ${preservationRule}
`;
  return prompt;
};


/**
 * Generates a prompt for segmenting a full outfit from an image.
 * @returns A string prompt that instructs the model to isolate a full outfit and return it on a transparent background.
 */
export const getGarmentSegmentationPrompt = (garmentType: GarmentType = 'full outfit'): string => {
  let garmentDescription: string;
  switch (garmentType) {
    case 'top only':
      garmentDescription = "the top clothing item (e.g., shirt, t-shirt, jacket)";
      break;
    case 'bottom only':
      garmentDescription = "the bottom clothing item (e.g., pants, skirt, shorts)";
      break;
    default: // 'full outfit'
      garmentDescription = "the entire outfit";
  }

  return `
**Task: Isolate Garment**
Your goal is to extract **only ${garmentDescription}** from the provided photograph.

**Crucial Rules:**
1.  **Complete Isolation:** The output MUST be the garment alone on a perfectly transparent background.
2.  **Aggressive Removal:** It is critical to remove every single trace of the person, mannequin, hanger, or any background elements. Be meticulous.
3.  **Reconstruct Hidden Parts:** Intelligently reconstruct any parts of the garment that were obscured by the person or other objects.
4.  **Preserve Fidelity:** The garment's original fabric texture, color, lighting, shadows, and fine details MUST be preserved perfectly.
`;
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
**Task: Photorealistic Background Replacement**
You are provided with a photograph of a person. Your task is to replace the existing background with a new, hyper-realistic one described below.

**New Background Description:** "${backgroundDescription}"

**CRITICAL INSTRUCTIONS - Adhere Strictly:**

1.  **SUBJECT INTEGRITY IS PARAMOUNT:** The person, including their clothing, pose, hair, and any accessories, MUST remain absolutely identical. **DO NOT CHANGE THE SUBJECT.**

2.  **FORENSIC LIGHTING ANALYSIS:** Before rendering, you MUST perform a detailed analysis of the new background's lighting environment. Identify:
    *   **Primary Light Source(s):** Direction (e.g., top-left, back-right), color (e.g., warm golden hour sun, cool overcast sky), and hardness (e.g., sharp, direct sun creating hard shadows; or soft, diffused light from a cloudy sky).
    *   **Ambient Light:** The overall color and intensity of the indirect light filling the scene.
    *   **Reflections & Bounces:** Note any colored light bouncing off surfaces in the new background (e.g., green light bouncing from grass, warm light from a wooden wall).

3.  **APPLY ANALYZED LIGHTING TO SUBJECT:** You MUST meticulously re-light the subject to match the analyzed environment.
    *   **Highlights:** Place highlights on the subject that perfectly correspond to the direction and quality of the main light source(s).
    *   **Shadows:** Cast realistic shadows from the subject onto the new background. The subject's own self-shadowing must also be adjusted to match the light direction. Shadow hardness must match the light source hardness.
    *   **Color Grading:** Subtly color grade the subject to match the ambient light and color bounces of the new scene. The subject must feel like they are *truly in* the environment, not cut and pasted.

4.  **SEAMLESS COMPOSITION:** The final image must be indistinguishable from a real photograph. Pay extreme attention to edges, perspective, and depth of field to ensure a flawless composite.
`;
};

export const getInpaintingPrompt = (correctionPrompt: string): string => {
  return `
**Task: Inpainting Correction**
You are provided with three inputs: 1. A base image, 2. A mask image, 3. A text prompt.

Your goal is to edit the base image **only in the area defined by the white parts of the mask**.

**Correction Instruction:** "${correctionPrompt}"

**Crucial Rules:**
1.  **STRICT MASK ADHERENCE:** You MUST NOT change any part of the base image that is outside the masked area (the black region). The unmasked area must remain absolutely identical to the original.
2.  **SEAMLESS BLENDING:** The edited area must blend seamlessly with the surrounding image. Match the original texture, lighting, grain, and color palette perfectly.
3.  **PHOTOREALISM:** The final output must be a high-quality, photorealistic image.
4.  **FOLLOW THE PROMPT:** The change you make inside the mask must accurately reflect the user's text prompt.
`;
};

export const getUpscalePrompt = (): string => {
  return `
**Task: AI Image Upscaling and Enhancement**
You are provided with a single image. Your task is to upscale this image to 4K resolution (approximately 3840x2160 pixels, maintaining the original aspect ratio).

**CRITICAL INSTRUCTIONS - Adhere Strictly:**

1.  **ENHANCE DETAILS:** Intelligently add finer details to textures, fabrics, hair, and skin. Sharpen edges and improve overall clarity.
2.  **NO CONTENT CHANGE:** You MUST NOT add, remove, or change any objects, elements, or the composition of the original image. The content must remain identical.
3.  **PRESERVE PHOTOREALISM:** The final output must be a hyper-realistic, high-quality photograph, free of digital artifacts. Maintain the original lighting, colors, and mood.
4.  **4K RESOLUTION:** The output image dimensions should be as close to 4K as possible while preserving the aspect ratio of the input image.
`;
};