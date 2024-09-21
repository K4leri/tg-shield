import { ProgressBarSettings } from "../../types/progressDataInterface.js";
import chalk from 'chalk';
import { barLogger } from "../../index.js";
import EventEmitter from "events";

// progressBar.ts
class ProgressBar {
    progressBarSettings: ProgressBarSettings;

    constructor(progressBarSettings: ProgressBarSettings, eventEmitter: EventEmitter) {
        this.progressBarSettings = progressBarSettings
        eventEmitter.on('tokenBucketChanged', () => {
            barLogger.clearProgressBar();
            barLogger.updateChatBars();
        });
    }


    getProgressBar(tokens: number): String {
        const bucketSize = this.progressBarSettings.bucketSize
        const filledLength = Math.floor((tokens / bucketSize) * this.progressBarSettings.maxLengthOfBar);
        const emptyLength = this.progressBarSettings.maxLengthOfBar - filledLength;
        const filledBar = '█'.repeat(filledLength);
        const emptyBar = '░'.repeat(emptyLength);
        const percentage = Math.floor((tokens / bucketSize) * 100);


        if (!tokens) return chalk.red(`${filledBar}${emptyBar} ${percentage}% | Tokens: ${tokens}/${bucketSize} | Chat ${this.progressBarSettings.chatId}`)
        return `${filledBar}${emptyBar} ${percentage}% | Tokens: ${tokens}/${bucketSize} | Chat ${this.progressBarSettings.chatId}`
    }  
}

export default ProgressBar;
