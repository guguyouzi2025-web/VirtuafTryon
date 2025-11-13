
import { GoogleGenAI, Modality, GenerateContentResponse, Type } from "@google/genai";
import { getModelGenerationPrompt, getPoseGenerationPrompt, getVirtualTryOnPrompt, getGarmentSegmentationPrompt, getGarmentRefinementPrompt, getModelCriteriaFromGarmentPrompt, getSwapModelPrompt, getChangeBackgroundPrompt } from '../prompts';
import { ModelCriteria, GarmentType } from "../types";
import { GeminiError } from "./geminiError";

const IMAGE_MODEL_NAME = 'gemini-2.5-flash-image';
const PRO_MODEL_NAME = 'gemini-2.5-pro';

function getAiClient() {
    if (!process.env.API_KEY) {
        throw new Error("API_KEY environment variable is not set.");
    }
    return new GoogleGenAI({ apiKey: process.env.API_KEY });
}

function parseImageResponse(response: GenerateContentResponse): string {
    const candidate = response.candidates?.[0];
    
    if (!candidate) {
        if (response.promptFeedback?.blockReason) {
            const reason = response.promptFeedback.blockReason;
            const ratings = response.promptFeedback.safetyRatings;
            throw new GeminiError(`Request blocked due to ${reason}.`, 'SAFETY_BLOCK', { ratings });
        }
        throw new GeminiError("No candidates found in response. The request may have been blocked.", 'NO_CANDIDATE');
    }

    if (candidate.finishReason === 'SAFETY') {
        const ratings = candidate.safetyRatings;
        throw new GeminiError(`Image generation blocked for safety reasons.`, 'SAFETY_BLOCK', { ratings });
    }

    if (candidate.finishReason && !['STOP', 'MAX_TOKENS'].includes(candidate.finishReason)) {
        throw new GeminiError(`Image generation stopped unexpectedly. Reason: ${candidate.finishReason}`, 'UNKNOWN');
    }

    if (candidate.content?.parts) {
        for (const part of candidate.content.parts) {
            if (part.inlineData?.data) {
                return part.inlineData.data;
            }
        }
    }
    
    throw new GeminiError("No image data found in response candidate.", 'NO_CANDIDATE');
}


async function generateImageFromPrompt(prompt: string, image?: string): Promise<string> {
    const ai = getAiClient();
    const imagePart = image ? { inlineData: { mimeType: 'image/png', data: image } } : null;
    const textPart = { text: prompt };
    const parts = imagePart ? [imagePart, textPart] : [textPart];

    try {
        const response: GenerateContentResponse = await ai.models.generateContent({
            model: IMAGE_MODEL_NAME,
            contents: { parts },
            config: {
                responseModalities: [Modality.IMAGE],
            },
        });
        return parseImageResponse(response);
    } catch (error: any) {
        console.error("Error generating image from prompt:", error);
        if (error instanceof GeminiError) {
            throw error; // Re-throw custom errors
        }
        const errorMessage = (error?.message || '').toLowerCase();
        if (errorMessage.includes('429') || errorMessage.includes('resource_exhausted')) {
            throw new GeminiError("Rate limit exceeded.", 'RATE_LIMIT_EXCEEDED');
        }
        throw new GeminiError(error.message || 'An unknown API error occurred.', 'API_ERROR');
    }
}

export const generateSingleModel = async (criteria: ModelCriteria): Promise<{ image: string, description: string }> => {
    const prompt = getModelGenerationPrompt(criteria);
    const image = await generateImageFromPrompt(prompt);
    return { image, description: prompt };
};

export const generateModelPose = async (modelImage: string, posePrompt: string): Promise<string> => {
    const prompt = getPoseGenerationPrompt(posePrompt);
    return generateImageFromPrompt(prompt, modelImage);
};

export const segmentGarment = async (garmentImage: string, segmentationType: GarmentType = 'full outfit'): Promise<string> => {
    const prompt = getGarmentSegmentationPrompt(segmentationType);
    return generateImageFromPrompt(prompt, garmentImage);
};

const modelCriteriaSchema = {
    type: Type.OBJECT,
    properties: {
        nationality: { type: Type.STRING, description: 'e.g., "American", "Italian", "Japanese"' },
        gender: { type: Type.STRING, description: '"Female" or "Male"' },
        skinTone: { type: Type.STRING, description: '"Fair", "Light", "Medium", "Olive", "Tan", "Dark"' },
        ageRange: { type: Type.STRING, description: '"18-25", "26-35", "36-45"' },
        build: { type: Type.STRING, description: '"Slim", "Athletic", "Well-proportioned", "Curvy"' },
        hairColor: { type: Type.STRING, description: '"Black", "Brown", "Blonde", "Red"' },
        hairStyle: { type: Type.STRING, description: '"Short Pixie Cut", "Medium Wavy", "Long Straight", "Curly Afro"' },
        eyeColor: { type: Type.STRING, description: '"Brown", "Blue", "Green", "Hazel"' },
        faceShape: { type: Type.STRING, description: '"Oval", "Round", "Square", "Heart"' },
        expression: { type: Type.STRING, description: '"Neutral", "Smiling", "Confident", "Serious"' },
    },
    required: ["nationality", "gender", "skinTone", "ageRange", "build", "hairColor", "hairStyle", "eyeColor", "faceShape", "expression"]
};

export const generateModelCriteriaFromGarment = async (garmentImage: string): Promise<Partial<ModelCriteria>> => {
    const ai = getAiClient();
    const prompt = getModelCriteriaFromGarmentPrompt();

    const imagePart = { inlineData: { mimeType: 'image/png', data: garmentImage } };
    const textPart = { text: prompt };

    try {
        const response = await ai.models.generateContent({
            model: PRO_MODEL_NAME,
            contents: { parts: [imagePart, textPart] },
            config: {
                responseMimeType: "application/json",
                responseSchema: modelCriteriaSchema,
            },
        });

        const jsonString = response.text;
        const criteria = JSON.parse(jsonString);
        return criteria;

    } catch (error: any) {
        console.error("Error generating model criteria from garment:", error);
        const errorMessage = (error?.message || '').toLowerCase();
        if (errorMessage.includes('429') || errorMessage.includes('resource_exhausted')) {
            throw new GeminiError("Rate limit exceeded.", 'RATE_LIMIT_EXCEEDED');
        }
        throw new GeminiError("Failed to analyze garment style. Please try again.", 'API_ERROR');
    }
};

export const refineGarmentSegmentation = async (originalGarment: string, segmentedGarment: string): Promise<string> => {
    const ai = getAiClient();
    const prompt = getGarmentRefinementPrompt();

    const originalImagePart = {
        inlineData: {
            mimeType: 'image/png',
            data: originalGarment,
        },
    };
    const segmentedImagePart = {
        inlineData: {
            mimeType: 'image/png',
            data: segmentedGarment,
        },
    };
    const textPart = {
        text: prompt,
    };

    try {
        const response = await ai.models.generateContent({
            model: IMAGE_MODEL_NAME,
            contents: { parts: [originalImagePart, segmentedImagePart, textPart] },
            config: {
                responseModalities: [Modality.IMAGE],
            },
        });
        return parseImageResponse(response);
    } catch (error: any) {
        console.error("Error refining garment segmentation:", error);
         if (error instanceof GeminiError) {
            throw error;
        }
        const errorMessage = (error?.message || '').toLowerCase();
        if (errorMessage.includes('429') || errorMessage.includes('resource_exhausted')) {
            throw new GeminiError("Rate limit exceeded.", 'RATE_LIMIT_EXCEEDED');
        }
        throw new GeminiError(error.message || 'An unknown API error occurred.', 'API_ERROR');
    }
};

export const performVirtualTryOn = async (modelWithPoseImage: string, segmentedGarmentImage: string, garmentType: GarmentType, fabricType: string): Promise<string> => {
    const ai = getAiClient();
    const prompt = getVirtualTryOnPrompt(garmentType, fabricType);
    
    const modelImagePart = {
        inlineData: { mimeType: 'image/png', data: modelWithPoseImage },
    };
    const segmentedGarmentImagePart = {
        inlineData: { mimeType: 'image/png', data: segmentedGarmentImage },
    };
    const textPart = {
        text: prompt,
    };

    try {
        const response = await ai.models.generateContent({
            model: IMAGE_MODEL_NAME,
            contents: { parts: [modelImagePart, segmentedGarmentImagePart, textPart] },
            config: {
                responseModalities: [Modality.IMAGE],
            },
        });

        return parseImageResponse(response);
    } catch (error: any) {
        console.error("Error in virtual try-on:", error);
        if (error instanceof GeminiError) {
            throw error;
        }
        const errorMessage = (error?.message || '').toLowerCase();
        if (errorMessage.includes('429') || errorMessage.includes('resource_exhausted')) {
            throw new GeminiError("Rate limit exceeded.", 'RATE_LIMIT_EXCEEDED');
        }
        throw new GeminiError(error.message || 'An unknown API error occurred.', 'API_ERROR');
    }
};

export const swapModel = async (baseImage: string, criteria: Partial<ModelCriteria>): Promise<string> => {
    const prompt = getSwapModelPrompt(criteria);
    return generateImageFromPrompt(prompt, baseImage);
};

export const changeBackground = async (baseImage: string, backgroundPrompt: string): Promise<string> => {
    const prompt = getChangeBackgroundPrompt(backgroundPrompt);
    return generateImageFromPrompt(prompt, baseImage);
};