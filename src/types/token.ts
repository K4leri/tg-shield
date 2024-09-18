// rateLimiter.ts
export interface TokenBucket {
    tokens: number;
    lastRefill: number; // in milliseconds
}