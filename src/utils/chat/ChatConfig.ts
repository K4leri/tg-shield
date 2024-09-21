// ChatConfig.ts
import EventEmitter from "events";
import { ChatConfigOptions, links } from "../../types/chatConfig.js";
import RateLimiter from "../ratelimiter/rateLimiter.js";
import RecentJoinsManager from "./recentJoinsManager.js";
import { MessageContext } from "@mtcute/dispatcher";



class ChatConfig {
  private eventEmitter: EventEmitter;
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
  links: links = {
    allInviteLinks : [],
    approvalNeeded: new Set(),
    nonEditableLinks: new Set(),
  }

  constructor(
    chatId: number, 
    rateLimiter: RateLimiter,
    recentJoinsManager: RecentJoinsManager,
    options: ChatConfigOptions,
) {
    this.chatId = chatId;
    this.rateLimiter = rateLimiter;
    this.recentJoinsManager = recentJoinsManager;
    this.notificationChatId = options.notificationChatId || 0;
    this.whiteListuserId = options.whiteListuserId;
    this.hoursToOffManualMode = (options.hoursToOffManualMode || 16) * 60 * 60 * 1000;
    this.eventEmitter = new EventEmitter();

    this.eventEmitter.on('tokenBucketChanged', () => {
      this.spamMessages.length = 0
    });
  }
}

export default ChatConfig
