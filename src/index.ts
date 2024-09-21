// index.ts
import { ChatInviteLink, ChatMemberUpdate, Message } from '@mtcute/bun'
import { filters, MessageContext } from '@mtcute/dispatcher'
import { bot, botdp, NotifBot, tg } from './clients/tgclient.js';
import { logger } from './utils/log/logProvider.js';
import LogManipulater from './utils/log/logManipulater.js';
import { chatManager } from './utils/chat/ChatManager.js';
import { captchaManager } from './utils/captcha/CaptchaManager.js';
import { makeAdminAction } from './handlers/events/togglePause.js';
import { handleJoinRequest } from './handlers/events/joinRequest.js';
import { handleChatMemberUpdate } from './handlers/events/chatMemberUpdate.js';
import { makeCaptchaAnswer } from './handlers/events/underCaptchaSolving.js';
import { joinMessageLog } from './handlers/events/joinMessage.js';

export const barLogger = new LogManipulater()


botdp.onChatJoinRequest(
  async (upd) =>  await handleJoinRequest(upd)
);


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
  async (upd) => await handleChatMemberUpdate(upd)
);



// delete spam message on attack
botdp.onNewMessage(
  filters.and(
    filters.action(['user_joined_link', 'user_joined_approved']), 
    (msg: MessageContext) => chatManager.allowChatId.includes(msg.chat.id)
  ),
  async (upd) => await joinMessageLog(upd)
);



botdp.onNewMessage(
  (msg: Message) => {
    if (!chatManager.allowChatId.includes(msg.chat.id)) return false
    if (!/\/toggle|\/type(?:\d+| \d+)?/.test(msg.text)) return false;
    const chatConfig = chatManager.chatConfigs.get(msg.chat.id)
    if (!chatConfig) return false
    if (!chatConfig.whiteListuserId.includes(msg.sender.id)) return false
    return true
  }, 
  async (msg) => await makeAdminAction(msg)
);


botdp.onNewMessage(
  (msg: Message) => {
    if (!chatManager.allowChatId.includes(msg.chat.id)) return false
    if (!/\/unban\s+(?:\d+| \d+)?/.test(msg.text)) return false;
    const chatConfig = chatManager.chatConfigs.get(msg.chat.id)
    if (!chatConfig) return false
    if (!chatConfig.whiteListuserId.includes(msg.sender.id)) return false
    return true
  }, 
  async (msg) => {
    await msg.delete()
    await bot.unbanChatMember({chatId: msg.chat.id, participantId: msg.text.split(' ')[1]})
  }
);


botdp.onNewMessage(
  filters.and(
    filters.not(filters.action('user_joined_approved')),
    (msg: Message) => captchaManager.userIds.includes(msg.sender.id),
  ),
  async (msg: MessageContext) => await makeCaptchaAnswer(msg)
)





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
  await bot.unbanChatMember({chatId: -1002413530580, participantId: 7432055163})
})

// человек может выйти до того, как его кикнет
tg.run(async (user) => {
  logger.start(`Logged in as ${user.username}`)
  callback()
  const chatConfigs = chatManager.chatConfigs.values()
  for (const chatConfig of chatConfigs) {
    const links = await tg.getInviteLinks(chatConfig.chatId)
    for (const link of links) {
      if (link instanceof ChatInviteLink) {
        chatConfig.links.allInviteLinks.push(link)
      }
    }
  }
  
})

NotifBot.run({ botToken: process.env.NOTIF_BOT_TOKEN }, (self) => {
  logger.start(`Logged in as ${self.username}`)
  callback()
});

