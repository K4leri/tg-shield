// index.ts
import { ChatInviteLink, ChatMemberUpdate, Message } from '@mtcute/bun'
import { filters, MessageContext } from '@mtcute/dispatcher'
import { bot, botdp, NotifBot, tg } from './clients/tgclient.js';
import { adapter, joinRequestHandler } from './handlers/joinRequestHandler.js';
import { logger } from './utils/log/logProvider.js';
import { getAllMessagesToDelete, logMessageJoin } from './db/methods.js';
import LogManipulater from './utils/log/logManipulater.js';
import { chatManager } from './utils/chat/ChatManager.js';
import { captchaManager } from './utils/captcha/CaptchaManager.js';

export const barLogger = new LogManipulater()


botdp.onChatJoinRequest(async (upd) => {
  //@ts-expect-error
  await joinRequestHandler.handleJoinRequest(upd);
});

botdp.onChatMemberUpdate(
  filters.and(
    filters.or(
      filters.chat('group'),
      filters.chat('gigagroup'),
      filters.chat('supergroup')
    ),
    filters.chatMember(['left', 'joined', 'added']),
    (upd: ChatMemberUpdate) => !upd.actor.isBot
  ),
  async (upd) => {
    //@ts-expect-error
    await joinRequestHandler.handleChatMemberUpdate(upd);
  }
);


botdp.onNewMessage(
  filters.and(
    filters.action('user_joined_link'), 
    // (msg: MessageContext) => {
    //   const chatConfig = chatManager.chatConfigs.get(msg.chat.id)
    //   if (!chatConfig) return false
    //   if (!chatConfig..includes(msg.sender.id)) return false
    //   return true
    // }
  ),
  async (upd) => {
    const chatId = upd.chat.id
 
    const tokenBucket = joinRequestHandler.handleMessageJoin(chatId)
    if (tokenBucket?.tokens === 0) {
      const messages = await getAllMessagesToDelete(adapter, chatId, tokenBucket.lastRefill)
      if (messages.length) {
        logger.info(`Приступил к удалению ${messages.length} сообщений о поступивших заявках`)
        const batchSize = 10
        const batches = Math.ceil(messages.length / batchSize);

        for (let i = 0; i < batches; i++) {
          const batch = messages.slice(i * batchSize, (i + 1) * batchSize);
          await bot.deleteMessagesById(
            messages[0].chatId,
            batch.map(message => message.messageId)
          );
        }
      }
      
      await logMessageJoin(adapter, chatId, upd.sender.id, upd.messages[0].id, 'ban')
      return await upd.delete();
    }

    await logMessageJoin(adapter, chatId, upd.sender.id, upd.messages[0].id)
  }
);


let timeOut: Timer;

botdp.onNewMessage(
  (msg: Message) => {
    if (!/\/toggle|\/type(?:\d+| \d+)?/.test(msg.text)) return false;
    const chatConfig = chatManager.chatConfigs.get(msg.chat.id)
    if (!chatConfig) return false
    if (!chatConfig.whiteListuserId.includes(msg.sender.id)) return false
    return true
  }, 
  async (msg) => {
    await msg.delete()
    const chatConfig = chatManager.chatConfigs.get(msg.chat.id)!
    if (msg.text.includes('/type')) return captchaManager.changeCaptchaType(parseInt(msg.text.replace('/type', '')));

    chatConfig.manualApproveMode = !chatConfig.manualApproveMode;
    if (chatConfig.manualApproveMode) {
      logger.warn(`Включил ручной режим работы в чате ${msg.chat.id}, автоматически данный режим отключится через ${chatConfig.hoursToOffManualMode / (60 * 60 * 1000)} часов`)
      await msg.answerText(`Включил ручной режим работы`)
      timeOut = setTimeout(async () => {
        logger.warn(`Отключил ручной режим работы в чате ${msg.chat.id}`)
        chatConfig.manualApproveMode = true
        await msg.answerText(`Отключил ручной режим работы`);
      }, chatConfig.hoursToOffManualMode);
    } else {
      clearTimeout(timeOut);
      logger.warn(`Отключил ручной режим работы в чате ${msg.chat.id}`)
      await msg.answerText(`Ручной режим работы отключен`);
    }
  }
);



botdp.onNewMessage(
  (msg) => {
    return captchaManager.userIds.includes(msg.sender.id)
  },
  async (msg) => {
    if (!(msg.text && !isNaN(Number(msg.text)) && Number.isInteger(Number(msg.text)))) {
      await msg.delete()
      return await captchaManager.kickUser(msg.chat.id,  msg.sender.id)
    }
    
    await captchaManager.verifyAnswer(msg.chat.id, msg.sender.id, msg)
    return
})



let count = 0;
function callback() {
  count++;
  if (count === 3) {
    barLogger.updateChatBars();
  }
}

bot.run({ botToken: process.env.BOT_TOKEN }, async (self) => {
  logger.start(`Logged in as ${self.username}`)
  callback()
})
// человек может выйти до того, как его кикнет
tg.run(async (user) => {
  logger.start(`Logged in as ${user.username}`)
  callback()
  // await tg.unbanChatMember({chatId: -1002413530580, participantId: 7432055163})
  const chatConfigs = chatManager.chatConfigs.values()
  for (const chatConfig of chatConfigs) {
    const links = await tg.getInviteLinks(chatConfig.chatId)
    for (const link of links) {
      if (link instanceof ChatInviteLink) {
        //@ts-expect-error
        chatConfig.links.allInviteLinks.push(link)
      }
    }
  }
  
})

NotifBot.run({ botToken: process.env.NOTIF_BOT_TOKEN }, (self) => {
  logger.start(`Logged in as ${self.username}`)
  callback()
});

