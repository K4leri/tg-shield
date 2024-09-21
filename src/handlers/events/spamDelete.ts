import { logger } from "../../utils/log/logProvider.js";
import { bot } from "../../clients/tgclient.js";
import ChatConfig from "../../utils/chat/ChatConfig.js";



export async function deleteSpamMessages(chatConfig: ChatConfig) {
    // const messagesFromDb = getAllMessagesToDelete(
    //     adapter,
    //     chatConfig.chatId, 
    //     chatConfig.rateLimiter.tokenBucket.lastRefill
    // )
    const inMemoryMessages = chatConfig.spamMessages.filter(message => 
        (message.date.getTime()  > chatConfig.rateLimiter.tokenBucket.lastRefill
    ));
    // const messagesFromDbResult = await messagesFromDb;
    const messageCount = inMemoryMessages.length
    let deleteCount = 0

    if (messageCount) {
        logger.info(`Приступил к удалению ${messageCount} сообщений о поступивших заявках`)
        const batchSize = 10
        const batches = Math.ceil(messageCount / batchSize);

        for (let i = 0; i < batches; i++) {
            const batch = inMemoryMessages.slice(i * batchSize, (i + 1) * batchSize);
            logger.warn(`deleting from ${chatConfig.chatId} message ${batch.join(', ')}`)
            await bot.deleteMessagesById(chatConfig.chatId, batch.map(message => message.id));
            deleteCount += batch.length
        }
    }
    
    chatConfig.spamMessages.length = 0
    logger.error('Удалил все сообщения и обновил действия в бд')
    return deleteCount
}