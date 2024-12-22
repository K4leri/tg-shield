export interface ChatConfigFromJson {
  chatId: number;
  rateLimiter: {
    bucketSize: number;
    refillRate: number;
    refillInterval: number;
    stopAgressiveTimeout: number;
    tokenBucket: {
      tokens: number;
      lastRefill: number;
    };
  };
  sendCapctha: boolean;
  maxLengthOfBar?: number;
  notificationChatId: number;
  whiteListuserId: number[];
  hoursToOffManualMode: number;
  maxFailedAttemps: number;
}

export interface Config {
  chats: ChatConfigFromJson[];
}
