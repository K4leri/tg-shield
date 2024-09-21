import { ChatMemberUpdate } from "@mtcute/core";
import { chatManager } from "../../utils/chat/ChatManager.js";
import { logger } from "../../utils/log/logProvider.js";
import { rateLimitChecker } from "../utils/rateLimitChecks.js"; 
import { captchaManager } from "../../utils/captcha/CaptchaManager.js";
import { handleUserLeft } from "../utils/leftUser.js";
import { toggleInviteLink } from "../utils/toggleInviteLink.js";



export async function handleChatMemberUpdate(upd: ChatMemberUpdate) {
  const chatId = upd.chat.id;
  const chatConfig = chatManager.chatConfigs.get(chatId)
  if (!chatConfig) return logger.warn(`No chat config found for chat ${chatId}`);
  
  if (chatConfig.whiteListuserId.includes(upd.actor.id)) {
    return logger.info(`whiteListuserId user - ${upd.actor.id} in chat - ${chatId} make action "${upd.type}" with ${upd.user.id}`)
  }

  if (upd.type === 'left') {
    const shouldGoOut = await handleUserLeft(chatId, upd.user.id)
    if (shouldGoOut) return 
  }
  
  const limit = await rateLimitChecker(chatConfig, chatId, upd.user.id);
  if (limit) return toggleInviteLink(upd, chatConfig)

  if (upd.type !== 'left') // this make cause user can left group and it will consume token but we dont need to send captcha him
    await captchaManager.sendCaptcha(chatId, upd.user)
}