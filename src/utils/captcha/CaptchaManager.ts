import { Message, TelegramClient, User } from "@mtcute/bun";
import MathCaptcha, { captchaOptions } from "./captchaTypes.ts/matchCaptcha.js";
import AudioCaptcha from "./captchaTypes.ts/audioCaptcha.js";
import { bot } from "../../clients/tgclient.js";
import { logger } from "../log/logProvider.js";

enum CaptchaType {
  Math,
  Audio,
}

class CaptchaManager {
  captchaMap: Map<number, { correctAnswer: number; timeoutId: Timer; message: Message; captchaType: CaptchaType }>;
  private bot: TelegramClient; // Your bot instance
  private mathCaptcha: MathCaptcha;
  private audioCaptcha: AudioCaptcha;
  private standartType = CaptchaType.Math
  private failedAttempts: Map<number, number> = new Map();
  userIds: number[] = []

  constructor(bot: TelegramClient) {
    this.captchaMap = new Map();
    this.bot = bot;
    this.mathCaptcha = new MathCaptcha(captchaOptions);
    this.audioCaptcha = new AudioCaptcha({voice: "ru-RU-SvetlanaNeural"});
  }

  async sendCaptcha(chatId: number, user: User, captchaType: CaptchaType = this.standartType) {
    let captchaImage: Buffer;
    let correctAnswer: number;
    let timeoutDuration: number;
    const failedAttempts = this.failedAttempts.get(user.id) || 0
    if (failedAttempts >= 2) captchaType = CaptchaType.Audio

    switch (captchaType) {
        case CaptchaType.Math:
            this.mathCaptcha.generateCaptcha();
            captchaImage = this.mathCaptcha.getImage();
            correctAnswer = this.mathCaptcha.correctAnswer;
            timeoutDuration = 20000; // 20 seconds
            break;
        case CaptchaType.Audio:
            const audioBuffer = await this.audioCaptcha.getAudio();
            captchaImage = audioBuffer;
            correctAnswer = this.audioCaptcha.correctAnswer;
            timeoutDuration = 30000; // 30 seconds
            break;
        default:
            throw new Error("Invalid CAPTCHA type");
    }
  
    // Store the correct answer and timeout ID in the map
    const timeoutId = setTimeout(() => {
      this.kickUser(chatId, user.id);
    }, timeoutDuration);
  

    const message = await this.bot.sendMedia(chatId, { 
      fileName: `captcha.${captchaType === CaptchaType.Math ? 'png' : 'mp3'}`,
      type: captchaType === CaptchaType.Math ? 'photo' : 'audio', 
      file: captchaImage, 
      caption: `${user.username ? `@${user.username}` : `${user.displayName},`} Посчитай правильное значение для вступления (${captchaType === CaptchaType.Math ? '20' : '30'} сек)`,  
    },
    { silent: true,  }
    );

    this.captchaMap.set(user.id, { correctAnswer, timeoutId, message, captchaType });
    this.userIds.push(user.id)
  }


  changeCaptchaType(type: CaptchaType = this.standartType) {
    if (!isNaN(type)) {
      this.standartType = type;
    } else {
        this.standartType = (this.standartType + 1) % (Object.keys(CaptchaType).length / 2);
        
    }
    logger.warn(`Переключил капчу на тип ${CaptchaType[this.standartType]}`)
  }

  async verifyAnswer(chatId: number, userId: number, msg: Message) {
    const captchaData = this.captchaMap.get(userId)!;
    
    const { correctAnswer, timeoutId, message, captchaType } = captchaData;
    if (+msg.text !== correctAnswer) {
      await this.kickUser(chatId, userId)
      return false;
    }

    clearTimeout(timeoutId);
    await this.bot.deleteMessages([message, msg]);
    this.userIds = this.userIds.filter(id => id !== userId)
    this.captchaMap.delete(userId);
    return true;
  }

  async kickUser(chatId: number, userId: number) {
    const messagesToDelete: Message[] = []
    const failedAttempts = this.failedAttempts.get(userId) || 0;
    this.failedAttempts.set(userId, failedAttempts + 1);

    if (failedAttempts >= 2) {
      return await this.banUser(chatId, userId);
    } 

    const message = await this.bot.kickChatMember({ chatId, userId});
    if (message)  messagesToDelete.push(message)
    const captchaData = this.captchaMap.get(userId);
    if (captchaData) {
      messagesToDelete.push(captchaData.message)
      this.captchaMap.delete(userId);
    }
    this.userIds = this.userIds.filter(id => id !== userId)
    await this.bot.deleteMessages(messagesToDelete);
  }

  async banUser(chatId: number, userId: number) {
    await this.bot.banChatMember({ chatId, participantId: userId, untilDate: Date.now() + 86400000 }); // ban for 1 day
    this.userIds = this.userIds.filter(id => id !== userId)
    this.captchaMap.delete(userId);
    this.failedAttempts.delete(userId);
  }
}

export const captchaManager = new CaptchaManager(bot);
