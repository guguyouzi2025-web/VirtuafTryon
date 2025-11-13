export class GeminiError extends Error {
    constructor(
        message: string, 
        public code?: 'SAFETY_BLOCK' | 'RATE_LIMIT_EXCEEDED' | 'NO_CANDIDATE' | 'UNKNOWN' | 'API_ERROR', 
        public details?: any
    ) {
        super(message);
        this.name = 'GeminiError';
    }
}
