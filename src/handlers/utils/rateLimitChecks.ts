// joinRequestHandler.ts
import { bot} from '../../clients/tgclient.js';
import { logger } from '../../utils/log/logProvider.js'; 
import ChatConfig from '../../utils/chat/ChatConfig.js';
import { deleteSpamMessages } from './deleteSpamMessages.js';




export async function rateLimitChecker(chatConfig: ChatConfig, chatId: number, userId: number, requestJoin = false) {
  const recentJoinsManager = chatConfig.recentJoinsManager;
  const rateLimiter = chatConfig.rateLimiter;

  recentJoinsManager.addRecentJoin(chatId, userId, Date.now());
  if (!rateLimiter.consumeToken(chatId)) {
    const recentJoins = recentJoinsManager.removeOldJoins(chatId, rateLimiter);
    // Ban the remaining joiners
    for (const joiner of recentJoins) {
      if (!chatConfig.recentlyBannedUsers.has(joiner.userId)) {
        if (requestJoin) {
          logger.info(`declining joinRequest of user - ${joiner.userId} in chat - ${chatId}`)
          await bot.hideJoinRequest({action: 'decline', chatId, user: joiner.userId})
        }
        logger.info(`ban - ${joiner.userId} in chat - ${chatId}`)
        await bot.banChatMember({ chatId, participantId: joiner.userId });
        chatConfig.recentlyBannedUsers.add(joiner.userId);
      }
    }
    await deleteSpamMessages(chatConfig)
    chatConfig.recentlyBannedUsers.clear()
    return true
  }
  
  return false
}

