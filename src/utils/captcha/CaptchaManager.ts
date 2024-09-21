import { Message, TelegramClient, User } from "@mtcute/bun";
import MathCaptcha, { captchaOptions } from "./captchaTypes.ts/matchCaptcha.js";
import AudioCaptcha from "./captchaTypes.ts/audioCaptcha.js";
import { bot } from "../../clients/tgclient.js";
import { logger } from "../log/logProvider.js";
import { html } from '@mtcute/html-parser'
import { chatManager } from "../chat/ChatManager.js";
import { deleteSpamMessages } from "../../handlers/utils/deleteSpamMessages.js";
import ChatConfig from "../chat/ChatConfig.js";


enum CaptchaType {
  Math,
  Audio,
}

class CaptchaManager {
  captchaMap: Map<number, { correctAnswer: number; timeoutId: Timer; message: Message; captchaType: CaptchaType }>;
  private mathCaptcha: MathCaptcha;
  private audioCaptcha: AudioCaptcha;
  private standartType = CaptchaType.Math
  private failedAttempts: Map<number, number> = new Map();
  userIds: number[] = []

  constructor() {
    this.captchaMap = new Map();
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
            timeoutDuration = 30000; // 20 seconds
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
    


    const userNotif = html`${user.username ? `@${user.username},` : html`<a href="tg://user?id=${user.id}">${user.displayName}</a>,` }`
    const caption = html`${userNotif} Посчитай правильное значение для вступления (${captchaType === CaptchaType.Math ? '30' : '30'} сек)`

    const message = await bot.sendMedia(chatId, { 
      fileName: `captcha.${captchaType === CaptchaType.Math ? 'png' : 'mp3'}`,
      type: captchaType === CaptchaType.Math ? 'photo' : 'audio', 
      file: captchaImage, 
      caption: caption, 
    },
    { silent: true,  }
    );

    this.captchaMap.set(user.id, { correctAnswer, timeoutId, message, captchaType });
    this.userIds.push(user.id)
  }

  clearTimers(userId: number) {
    const captchaInfo = this.captchaMap.get(userId)
    if (captchaInfo)
      clearTimeout(captchaInfo.timeoutId)
  }

  /**
   * Changes the captcha type.
   *
   * @param type The new captcha type. If not provided, the type will be incremented.
   * @returns A promise that resolves when the function has completed its execution.
   *
   * @description This function changes the captcha type. If a new type is provided, it will be set as the new standard type. If not, the type will be incremented.
   *
   * @throws {Error} If an error occurs while changing the captcha type.
  */
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
    
    const { correctAnswer, timeoutId, message } = captchaData;
    if (+msg.text !== correctAnswer) {
      await this.kickUser(chatId, userId)
      return false;
    }

    clearTimeout(timeoutId);
    await bot.deleteMessages([message, msg]);
    this.userIds = this.userIds.filter(id => id !== userId)
    this.captchaMap.delete(userId);
    return true;
  }

  async kickUser(chatId: number, userId: number) {
    const messagesToDelete: Message[] = []
    const captchaData = this.captchaMap.get(userId);
    if (captchaData) {
      clearTimeout(captchaData.timeoutId);
      messagesToDelete.push(captchaData.message)
      this.captchaMap.delete(userId);
    }

    const failedAttempts = (this.failedAttempts.get(userId) || 0) + 1;
    this.failedAttempts.set(userId, failedAttempts);

    const chatConfig = chatManager.chatConfigs.get(chatId)
    if (!chatConfig) return logger.warn(`No chat config found for chat ${chatId}`);

    const message = await bot.kickChatMember({ chatId, userId});
    if (message && (failedAttempts < chatConfig.maxFailedAttemps)) messagesToDelete.push(message)

    this.userIds = this.userIds.filter(id => id !== userId)
    await bot.deleteMessages(messagesToDelete);

    if (failedAttempts >= chatConfig.maxFailedAttemps) this.banUser(chatConfig, chatId, userId)
  }

  async banUser(chatConfig: ChatConfig, chatId: number, userId: number) {
    await bot.banChatMember({ chatId, participantId: userId, untilDate: Date.now() + 86400000 }); // ban for 1 day
    logger.info(`ban - ${userId} in chat - ${chatId} cause of max attemps`);
    await deleteSpamMessages(chatConfig, userId)
    this.userIds = this.userIds.filter(id => id !== userId)
    this.captchaMap.delete(userId);
    this.failedAttempts.delete(userId);
  }
}

export const captchaManager = new CaptchaManager();
