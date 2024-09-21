import { filters, MessageContext } from "@mtcute/dispatcher"
import { chatManager } from "../../utils/chat/ChatManager.js";
import { ActionUserJoinedApproved, ActionUserJoinedLink, Peer } from "@mtcute/core";
import { logMessagesOfJoin } from "../../db/methods.js";
import { adapter } from "../../db/database.js";
import { logger } from "../../utils/log/logProvider.js";


export async function joinMessageLog(upd: filters.Modify<MessageContext, {
    action: ActionUserJoinedLink | ActionUserJoinedApproved;
    sender: Peer;
}>) {
    const chatConfig = chatManager.chatConfigs.get(upd.chat.id)
    if (!chatConfig) return logger.warn(`No chat config found for chat ${upd.chat.id}`);
    chatConfig.spamMessages.push(...upd.messages)
    const messages = upd.messages.map(message => {
      return {"message_id": message.id, "chat_id": upd.chat.id, "user_id": upd.sender.id, status: 'stay'}
    })
    await logMessagesOfJoin(adapter, messages)
}