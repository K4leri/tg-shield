import { MessageContext } from "@mtcute/dispatcher"
import { captchaManager } from "../../utils/captcha/CaptchaManager.js"

export async function makeCaptchaAnswer(msg: MessageContext) {
    await msg.delete()
    if (!(msg.text && !isNaN(Number(msg.text)) && Number.isInteger(Number(msg.text)))) {
      return await captchaManager.kickUser(msg.chat.id,  msg.sender.id)
    }
    
    await captchaManager.verifyAnswer(msg.chat.id, msg.sender.id, msg)
}