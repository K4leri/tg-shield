// ChatManager.ts
import ChatConfig from "./ChatConfig.js";
import RateLimiter from "../ratelimiter/rateLimiter.js";
import RecentJoinsManager from "./recentJoinsManager.js";
import { ChatConfigFromJson } from "../../types/config.js";
import { config } from "../config.js";
import { logChatConfig } from "../log/initLog.js";


class ChatManager {
    // whiteListId: Set<number> = new Set<number>();
    chatConfigs: Map<number, ChatConfig> = new Map();
    elements: number = 0;

    constructor() {
      config.chats.forEach(chat => {
        this.addChatConfig(chat)
      })
    }
  
    addChatConfig(
      options: ChatConfigFromJson
    ) {
        const chatConfig = new ChatConfig(
          options.chatId, 
          new RateLimiter(options),
          new RecentJoinsManager(),
          options
        );
        this.chatConfigs.set(options.chatId, chatConfig);
        this.elements++
        // options.whiteListuserId.forEach(adminId => {
        //   this.whiteListId.add(adminId)
        // })
        logChatConfig(options, this.elements)
    }


    deleteChatConfig (chatId: number) {
      this.chatConfigs.delete(chatId)
    }

}

export const chatManager = new ChatManager();