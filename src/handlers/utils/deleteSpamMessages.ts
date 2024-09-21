import { logger } from "../../utils/log/logProvider.js";
import { bot } from "../../clients/tgclient.js";
import ChatConfig from "../../utils/chat/ChatConfig.js";



export async function deleteSpamMessages(chatConfig: ChatConfig, userId: number | undefined = undefined) {
    // const messagesFromDb = getAllMessagesToDelete(
    //     adapter,
    //     chatConfig.chatId, 
    //     chatConfig.rateLimiter.tokenBucket.lastRefill
    // )

    const inMemoryMessages = chatConfig.spamMessages.filter(message => {
        if (userId) {
            return userId === message.sender.id
        } else {
            return message.date.getTime()  > chatConfig.rateLimiter.tokenBucket.lastRefill
        }
    });
    // const messagesFromDbResult = await messagesFromDb;
    const messageCount = inMemoryMessages.length
    let deleteCount = 0

    if (messageCount) {
        logger.info(`Приступил к удалению ${messageCount} сообщений о поступивших заявках`)
        const batchSize = 10
        const batches = Math.ceil(messageCount / batchSize);

        for (let i = 0; i < batches; i++) {
            const batch = inMemoryMessages.slice(i * batchSize, (i + 1) * batchSize);
            const messageIds = batch.map(message => message.id)
            logger.warn(`deleting from ${chatConfig.chatId} message ${messageIds}`)
            await bot.deleteMessagesById(chatConfig.chatId, messageIds);
            deleteCount += batch.length
        }

        logger.info(`Удалил все сообщения и обновил действия в бд ${userId ? `для юзера ${userId}` : ''}`)
    }
    
    if (userId) {
        chatConfig.spamMessages = chatConfig.spamMessages.filter(message => message.sender.id !== userId);
    } else {
        chatConfig.spamMessages.length = 0; // delete all messages if its not user message deleting
    }
    return deleteCount
}