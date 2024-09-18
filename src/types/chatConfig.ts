import { ChatInviteLink } from "@mtcute/core";

export interface ChatConfigOptions {
    notificationChatId: number;
    whiteListuserId: number[];
    hoursToOffManualMode: number;
}

export interface links {
    nonEditableLinks: Set<ChatInviteLink>
    allInviteLinks: ChatInviteLink[] 
    approvalNeeded: Set<ChatInviteLink>
}