// recentJoinsManager.ts
import RateLimiter from "../ratelimiter/rateLimiter.js";
import { RecentJoin, RecentJoinsMap } from "../../types/reacentJoin.js";


class RecentJoinsManager {
  private recentJoinsMap: RecentJoinsMap;
  // private messageIdsMap: Map<number, number[]>;

  constructor() {
    this.recentJoinsMap = new Map<number, RecentJoin[]>();
    // this.messageIdsMap = new Map<number, number[]>();
  }

  getRecentJoins(chatId: number): RecentJoin[] {
    return this.recentJoinsMap.get(chatId) || [];
  }


  addRecentJoin(chatId: number, userId: number, timestamp: number) {
    const recentJoins = this.getRecentJoins(chatId);
    recentJoins.push({ userId, timestamp });
    this.recentJoinsMap.set(chatId, recentJoins);
  }
  

  removeOldJoins(chatId: number, rateLimiter: RateLimiter) {
    const recentJoins = this.getRecentJoins(chatId);
    const maxJoinsToKeep = rateLimiter.bucketSize;
    const numToRemove = recentJoins.length - maxJoinsToKeep;
  
    if (numToRemove > 0) {
        recentJoins.splice(0, numToRemove);
        this.recentJoinsMap.set(chatId, recentJoins);
    }
    
    return recentJoins;
  }
      
  
  clearRecentJoins(chatId: number) {
    this.recentJoinsMap.set(chatId, []);
  }
}
  
export default RecentJoinsManager;
  