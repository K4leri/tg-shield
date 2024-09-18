export interface CaptchaOptions {
    width: number;
    height: number;
    fontSize: number;
    fontFamily: string;
    addNoise: boolean;
}

export interface audioCaptchaOptions {
    voice: 'ru-RU-DariyaNeural' | 'ru-RU-DmitryNeural' | 'ru-RU-SvetlanaNeural'
}