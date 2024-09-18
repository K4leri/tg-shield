// logManipulater.ts
import { chatManager } from "../chat/ChatManager.js";
import ansiEscapes from 'ansi-escapes';


class LogManipulater {
    private _elements = 0;
    private intervalId: Timer | null = null;

    constructor() {
        this._elements = Array.from(chatManager.chatConfigs.values()).length
    }
    
    async updateChatBars(): Promise<void> {
        // const array = Array.from(chatManager.chatConfigs.values())
        
        // let someTokenZero = false
        // for (const progressData of array) {
        //     const { rateLimiter: { tokenBucket: { tokens } } } = progressData;
        //     if (!tokens) someTokenZero = true;
        //     const progressBar = progressData.rateLimiter.progressBar.getProgressBar(tokens);
        //     process.stdout.write(`${progressBar}\n`);
        // }
    
        // if (someTokenZero) {
        //     this.startBlinking();
        // }
    }


    startBlinking(): void {
        let visible = true;
        this.intervalId = setInterval(() => {
            this.clearProgressBar();
            let allTokensGreaterThanZero = true;
            for (const progressData of chatManager.chatConfigs.values()) {
                const { rateLimiter: { tokenBucket: { tokens } } } = progressData;
                const progressBar = progressData.rateLimiter.progressBar.getProgressBar(tokens);
                if (tokens === 0) {
                    allTokensGreaterThanZero = false;
                    process.stdout.write(visible ? `${progressBar}\n` : `\n`);
                } else {
                    process.stdout.write(`${progressBar}\n`);
                }
            }
            visible = !visible;
            if (allTokensGreaterThanZero && this.intervalId !== null) {
                clearInterval(this.intervalId);
                this.intervalId = null;
            }
        }, 700); // 700ms interval
    }
    

    clearProgressBar(): void {
        // process.stdout.write(ansiEscapes.cursorUp(
        //     this._elements
        // ));
        // process.stdout.write(ansiEscapes.eraseDown);
    }

    stopBlinking(): void {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
    }
}

export default LogManipulater;
