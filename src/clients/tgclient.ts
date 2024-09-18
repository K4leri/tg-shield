import { Dispatcher } from '@mtcute/dispatcher'
import { TelegramClient } from '@mtcute/bun'
import { logger } from '../utils/log/logProvider.js';
import { LogManager } from '@mtcute/core/utils.js';


export const tg = new TelegramClient({
    apiId: Number(process.env.API_ID!),
    apiHash: process.env.API_HASH!,
    storage: 'bot-data/user/session',
    // logLevel: 5
});

(tg.log as LogManager).handler = (color, level, tag, fmt, args) => {
    switch (level) {
      case 4: // DEBUG
        logger.debug(fmt);
        break;
      case 3: // INFO
        logger.info(fmt);
        break;
      case 2: // WARN
        logger.warn(fmt);
        break;
      case 1: // ERROR
        logger.error(fmt);
        break;
      default:
        logger.info(fmt);
        break;
    }
};

export const bot = new TelegramClient({
    apiId: Number(process.env.API_ID!),
    apiHash: process.env.API_HASH!,
    storage: 'bot-data/bot/session',
    // logger: new CustomLogManager('botclient')
    // logLevel: 0
    // disableUpdates: true,
})

export const NotifBot = new TelegramClient({
    apiId: Number(process.env.API_ID!),
    apiHash: process.env.API_HASH!,
    storage: 'bot-data/notifBot/session',
    // logger: new CustomLogManager('notifclient')
    // logLevel: 5
    // disableUpdates: true,
})

// export const dp = Dispatcher.for(tg)
export const botdp = Dispatcher.for(bot)
// export const Notifdp = Dispatcher.for(NotifBot)