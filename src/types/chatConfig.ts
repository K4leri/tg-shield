import { ChatInviteLink } from "@mtcute/core";


export interface links {
    nonEditableLinks: Set<ChatInviteLink>
    allInviteLinks: ChatInviteLink[] 
    approvalNeeded: Set<ChatInviteLink>
}