export interface RecentJoin {
    userId: number;
    timestamp: number;
  //   message?: filters.Modify<MessageContext, {
  //     action: ActionUserJoinedLink;
  //     sender: User;
  // }>;
}
  
  
export interface RecentJoinsMap extends Map<number, RecentJoin[]> {}