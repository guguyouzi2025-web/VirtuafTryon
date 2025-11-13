import { useCallback } from 'react';
import { Model, Pose } from '../types';
import { simpleHash } from '../utils/fileUtils';

const CACHE_PREFIX = 'poseCache_';

const getCacheKey = (model: Model, pose: Pose): string => {
    // Note: Hashing the full base64 string can be slow. For production, a more
    // efficient unique identifier for the model would be better.
    const modelHash = simpleHash(model.image);
    return `${CACHE_PREFIX}${modelHash}_${pose.name}`;
};

export const usePoseCache = () => {
    const getCachedPose = useCallback((model: Model, pose: Pose): string | null => {
        try {
            return localStorage.getItem(getCacheKey(model, pose));
        } catch (e) {
            console.error("Error reading from pose cache:", e);
            return null;
        }
    }, []);

    const setCachedPose = useCallback((model: Model, pose: Pose, image: string) => {
        try {
            localStorage.setItem(getCacheKey(model, pose), image);
        } catch (e) {
            console.error("Error writing to pose cache. Cache might be full.", e);
            // Optional: Implement a cache clearing strategy here
        }
    }, []);

    return { getCachedPose, setCachedPose };
};
