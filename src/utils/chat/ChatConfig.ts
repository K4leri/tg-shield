// ChatConfig.ts
import EventEmitter from "events";
import { links } from "../../types/chatConfig.js";
import RateLimiter from "../ratelimiter/rateLimiter.js";
import RecentJoinsManager from "./recentJoinsManager.js";
import { MessageContext } from "@mtcute/dispatcher";
import { ChatConfigFromJson } from "../../types/config.js";



class ChatConfig {
  manualApproveMode = false;
  chatId: number;
  rateLimiter: RateLimiter;
  notificationChatId: number;
  spamMessages: MessageContext[] = []
  whiteListuserId: number[];
  timerIdOfManualMode: Timer | undefined = undefined
  hoursToOffManualMode: number;
  recentJoinsManager: RecentJoinsManager;
  recentlyBannedUsers: Set<number> = new Set();
  maxFailedAttemps: number;
  links: links = {
    allInviteLinks : [],
    approvalNeeded: new Set(),
    nonEditableLinks: new Set(),
  }

  constructor(
    chatId: number, 
    rateLimiter: RateLimiter,
    recentJoinsManager: RecentJoinsManager,
    options: ChatConfigFromJson,
) {
    this.chatId = chatId;
    this.rateLimiter = rateLimiter;
    this.recentJoinsManager = recentJoinsManager;
    this.notificationChatId = options.notificationChatId || 0;
    this.whiteListuserId = options.whiteListuserId;
    this.hoursToOffManualMode = (options.hoursToOffManualMode || 16) * 60 * 60 * 1000;
    this.maxFailedAttemps = options.maxFailedAttemps

    setInterval(() => {
      this.spamMessages = this.spamMessages.filter(message => message.date.getTime() > Date.now() - 15 * 60 * 1000)
    }, 15 * 60 * 1000); // every 15 minute
  }
}

export default ChatConfig
