import { ChatJoinRequestUpdate, getMarkedPeerId } from "@mtcute/core";
import { UpdateContext } from "@mtcute/dispatcher";
import { chatManager } from "../../utils/chat/ChatManager.js";
import { logger } from "../../utils/log/logProvider.js";
import { logJoinRequest } from "../../db/methods.js";
import { rateLimitChecker } from "../utils/rateLimitChecks.js"; 
import { bot } from "../../clients/tgclient.js";
import { captchaManager } from "../../utils/captcha/CaptchaManager.js";
import { adapter } from "../../db/database.js";


export async function handleJoinRequest(upd: UpdateContext<ChatJoinRequestUpdate>) {
    if (!upd.recentRequesters.length) return

    const chatId = getMarkedPeerId(upd.raw.peer);
    const chatConfig = chatManager.chatConfigs.get(chatId)
    if (!chatConfig) return logger.warn(`No chat config found for chat ${chatId}`);
    
    if (chatConfig.manualApproveMode) {
      return logger.info(`ручной режим включен. Пропускаю user - ${upd.recentRequestersIds[0]} in chat - ${upd.chatId}`)
    }
    
    const userId = upd.recentRequesters[0].id;

    await logJoinRequest(adapter, chatId, userId)
    const limit = await rateLimitChecker(chatConfig, chatId, userId, true)
    if (limit) return

    await bot.hideJoinRequest({action: 'approve', chatId: chatId, user: userId})
    logger.info(`approve user - ${userId} in chat - ${chatId}`)

    setTimeout(async () => {
      await captchaManager.sendCaptcha(chatId, upd.recentRequesters[0])
    }, 1000)
  }