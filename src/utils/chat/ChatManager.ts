// ChatManager.ts
import ChatConfig from "./ChatConfig.js";
import RateLimiter from "../ratelimiter/rateLimiter.js";
import RecentJoinsManager from "./recentJoinsManager.js";
import { ChatConfigFromJson } from "../../types/config.js";
import { config } from "../config.js";
import { logChatConfig } from "../log/initLog.js";
import EventEmitter from "events";


class ChatManager {
    allowChatId: number[] = []
    chatConfigs: Map<number, ChatConfig> = new Map();
    elements: number = 0;

    constructor() {
      config.chats.forEach(chat => {
        this.addChatConfig(chat)
        this.allowChatId.push(chat.chatId)
      })
    }
  
    addChatConfig(options: ChatConfigFromJson) {
      const eventEmitter = new EventEmitter();
      const rateLimiter = new RateLimiter(options, eventEmitter)
      const chatConfig = new ChatConfig(
        options.chatId, 
        rateLimiter,
        new RecentJoinsManager(),
        options,
        eventEmitter
      );
      this.chatConfigs.set(options.chatId, chatConfig);
      this.elements++
      logChatConfig(options, this.elements)
    }


    deleteChatConfig (chatId: number) {
      this.chatConfigs.delete(chatId)
    }

}

export const chatManager = new ChatManager();