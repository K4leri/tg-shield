// ChatConfig.ts
import { ChatInviteLink } from "@mtcute/core";
import { ChatConfigOptions, links } from "../../types/chatConfig.js";
import RateLimiter from "../ratelimiter/rateLimiter.js";
import RecentJoinsManager from "./recentJoinsManager.js";


class ChatConfig {
  manualApproveMode = false;
  chatId: number;
  rateLimiter: RateLimiter;
  notificationChatId: number;
  whiteListuserId: number[];
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
  }
}

export default ChatConfig
