import { ChatConfigFromJson } from "./config.js";

// loggerInterface.ts
export interface Logger {
    start: (message: string) => void;
    table: (message: string, element: number) => void;
    info: (message: string, tokens: number) => void;
    debug: (message: string, tokens: number) => void;
    warn: (message: string, tokens: number) => void;
    error: (message: string, tokens: number) => void;
}