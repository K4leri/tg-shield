import {  MessageContext } from "@mtcute/dispatcher";
import { logger } from "../../utils/log/logProvider.js";
import { captchaManager } from "../../utils/captcha/CaptchaManager.js";
import { chatManager } from "../../utils/chat/ChatManager.js";


/**
 * Toggles the manual approval mode for a chat.
 *
 * @param msg The incoming message context.
 * @returns A promise that resolves when the function has completed its execution.
 *
 * @description This function toggles the manual approval mode for a chat. If the mode is enabled, 
 * it sets a timeout to automatically disable it after a specified period of time. 
 * If the message text includes '/type', it changes the captcha type.
 *
 * @throws {Error} If an error occurs while toggling the manual approval mode or changing the captcha type.
 */
export async function makeAdminAction(msg: MessageContext) {
    await msg.delete()
    const chatConfig = chatManager.chatConfigs.get(msg.chat.id)!
    if (msg.text.includes('/type')) return captchaManager.changeCaptchaType(parseInt(msg.text.replace('/type', '')));

    chatConfig.manualApproveMode = !chatConfig.manualApproveMode;
    if (chatConfig.manualApproveMode) {
        logger.warn(`Включил ручной режим работы в чате ${msg.chat.id}, автоматически данный режим отключится через ${chatConfig.hoursToOffManualMode / (60 * 60 * 1000)} часов`)
        await msg.answerText(`Включил ручной режим работы`)
        chatConfig.timerIdOfManualMode = setTimeout(async () => {
            logger.warn(`Отключил ручной режим работы в чате ${msg.chat.id}`)
            chatConfig.manualApproveMode = false
            await msg.answerText(`Отключил ручной режим работы`);
        }, chatConfig.hoursToOffManualMode);
    } else {
        clearTimeout(chatConfig.timerIdOfManualMode);
        logger.warn(`Отключил ручной режим работы в чате ${msg.chat.id}`)
        await msg.answerText(`Ручной режим работы отключен`);
    }
}