

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
  maxLengthOfBar?: number;
  notificationChatId: number;
  whiteListuserId: number[];
  hoursToOffManualMode: number;
}

export interface Config {
  chats: ChatConfigFromJson[];
}
