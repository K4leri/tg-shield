import { bot } from "../../clients/tgclient.js";
import { captchaManager } from "../../utils/captcha/CaptchaManager.js";
import { logger } from "../../utils/log/logProvider.js";


export async function handleUserLeft(chatId: number, userId: number) {
    if (process.env.NODE_ENV !== 'production') {
      logger.info('Not banning user in development mode');
      return true;
    }

    if (captchaManager.userIds.includes(userId)) {
      captchaManager.clearTimers(userId);
      return false
    }

    logger.info(`ban - ${userId} in chat - ${chatId} cause of leaving group`);
    await bot.banChatMember({ chatId, participantId: userId });
    return true
}