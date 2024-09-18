// joinRequestHandler.ts
import { bot, tg } from '../clients/tgclient.js';
import { ChatJoinRequestUpdate, ChatMemberUpdate, getMarkedPeerId } from '@mtcute/core';
import {  UpdateContext } from '@mtcute/dispatcher';
import DatabaseAdapter from '../db/database.js';
import { logJoinRequest } from '../db/methods.js';
import { logger } from '../utils/log/logProvider.js'; 
import { chatManager } from '../utils/chat/ChatManager.js';
import { captchaManager } from '../utils/captcha/CaptchaManager.js';


const databaseAdapter = new DatabaseAdapter();
export const adapter = databaseAdapter.getAdapter();

/**
 * A class that handles join requests and rate limiting for a chat.
 */
class JoinRequestHandler {
  toggleManualMode(chatId: number) {
    const chatConfig = chatManager.chatConfigs.get(chatId)
    if (!chatConfig) {
      logger.warn(`No chat config found for chat ${chatId}`);
      return true
    }
    chatConfig.manualApproveMode != chatConfig.manualApproveMode
    return chatConfig.manualApproveMode
  }
  
  private async handleRateLimiting(chatId: number, userId: number, requestJoin = false) {
    const chatConfig = chatManager.chatConfigs.get(chatId)
    if (!chatConfig) {
      logger.warn(`No chat config found for chat ${chatId}`);
      return true
    }
  
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
      chatConfig.recentlyBannedUsers.clear()
      return true
    }
    
    return false
  }
  
  
  
  handleMessageJoin(chatId: number) {
    const chatConfig = chatManager.chatConfigs.get(chatId)
    if (!chatConfig) {
      logger.warn(`No chat config found for chat ${chatId}`);
      return;
    }
    return chatConfig.rateLimiter.tokenBucket;
  }

  getRandomValue(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  // async handleJoinRequest(upd: UpdateContext<MessageContext>) {
  async handleJoinRequest(upd: UpdateContext<ChatJoinRequestUpdate>) {
    const chatId = getMarkedPeerId(upd.raw.peer);
    const chatConfig = chatManager.chatConfigs.get(chatId)
    if (!chatConfig) {
      logger.warn(`No chat config found for chat ${chatId}`);
      return;
    }
    if (chatConfig.manualApproveMode) {
      logger.info(`ручной режим включен. Пропускаю user - ${upd.recentRequesters[0].id} in chat - ${upd.chatId}`)
      return
    }
    
    const userId = upd.recentRequesters[0].id;

    await logJoinRequest(adapter, chatId, userId)
    const limit = await this.handleRateLimiting(chatId, userId, true)
    if (limit) return

    logger.info(`approve user - ${userId} in chat - ${chatId}`)
    await bot.hideJoinRequest({action: 'approve', chatId: chatId, user: userId})
    //@ts-expect-error
    await captchaManager.sendCaptcha(chatId, upd.recentRequesters[0])

    return;
  }


  async handleChatMemberUpdate(upd: ChatMemberUpdate ) {
    const chatId = upd.chat.id;
    const chatConfig = chatManager.chatConfigs.get(chatId)
    if (!chatConfig) {
      logger.warn(`No chat config found for chat ${chatId}`);
      return;
    }

    const userId = upd.user.id;

    if (upd.type === 'left') {
      if (process.env.NODE_ENV !== 'production') {
        logger.info('Not banning user in development mode')
        return;
      }
      logger.info(`ban - ${userId} in chat - ${chatId} cause of leaving group`)
      await bot.banChatMember({ chatId, participantId: userId });
      return;
    }

    const whiteListuserId = chatConfig.whiteListuserId
    if (upd.type === 'added' && whiteListuserId.includes(upd.actor.id)) {
      logger.info(`whiteListuserId user - ${upd.actor.id} in chat - ${chatId} make action "added"`)
      return
    }
 

    const limit = await this.handleRateLimiting(chatId, userId);
    if (limit) {
      if (upd.inviteLink && upd.inviteLink 
        && !upd.inviteLink.approvalNeeded && !chatConfig.links.nonEditableLinks.has(upd.inviteLink)) {
        const link = chatConfig.links.allInviteLinks.find(ChatInviteLink => ChatInviteLink.link.includes(upd.inviteLink!.link.split('.')[1]))!
        
        //@ts-expect-error
        const editLink = await bot.editInviteLink({chatId: upd.chat.id, link: link, withApproval: true})
          .catch(err => {
            if (err === 'The invite link has expired') {
              logger.warn('Ссылка не может быть изменена')
              chatConfig.links.nonEditableLinks.add(upd.inviteLink!)
            } else {
              logger.warn('Не являюсь админом чата. Не могу изменить ссылку для предовтращения атак. Продолжаю работать в режиме удаление сообщений на вступление')
            }
          })

        if (editLink) {
          logger.warn(`Изменил ссылку ${upd.inviteLink.link} в чате ${chatId} на вступление по заявкам`)
        }
      }
      return
    }

    //@ts-expect-error
    await captchaManager.sendCaptcha(chatId, upd.user)
  }
}

  
export const joinRequestHandler = new JoinRequestHandler();
