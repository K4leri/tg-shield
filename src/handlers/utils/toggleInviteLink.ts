import { ChatMemberUpdate } from "@mtcute/core"
import ChatConfig from "../../utils/chat/ChatConfig.js"
import { bot } from "../../clients/tgclient.js"
import { logger } from "../../utils/log/logProvider.js"


export async function toggleInviteLink(upd: ChatMemberUpdate, chatConfig: ChatConfig ) {
    if (upd.inviteLink 
      && !upd.inviteLink.approvalNeeded 
      && !chatConfig.links.nonEditableLinks.has(upd.inviteLink)) 
    {
      const link = chatConfig.links.allInviteLinks.find(ChatInviteLink => ChatInviteLink.link.includes(upd.inviteLink!.link.split('.')[1]))!
      
      const editLink = await bot.editInviteLink({chatId: upd.chat.id, link: link, withApproval: true})
        .catch(err => {
          if (err === 'The invite link has expired') {
            logger.warn('Ссылка не может быть изменена')
            chatConfig.links.nonEditableLinks.add(upd.inviteLink!)
          } else {
            logger.warn('Не являюсь админом чата или ссылка другого админа. Не могу изменить ссылку для предовтращения атак. Продолжаю работать в режиме удаление сообщений на вступление')
          }
        })

      if (editLink) {
        logger.warn(`Изменил ссылку ${upd.inviteLink.link} в чате ${upd.chat.id} на вступление по заявкам`)
      }
    }
  }