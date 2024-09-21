// rateLimiter.ts
import { logger } from "../log/logProvider.js";
import { TokenBucket } from "../../types/token.js";
import ProgressBar from "./progressBar.js";
import { ChatConfigFromJson } from "../../types/config.js";
import EventEmitter from "events";


/**
 * A rate limiter class that uses a token bucket algorithm to limit the number of requests.
 * 
 */
class RateLimiter {
  private refillRate: number;
  private refillInterval: number;
  private stopAgressiveTimeout: number;
  private stopped: boolean;
  private timeoutId: Timer  | null;
  private intervalId: Timer | null;
  private eventEmitter: EventEmitter;
  progressBar: ProgressBar;
  bucketSize: number;
  tokenBucket: TokenBucket;

  constructor(options: ChatConfigFromJson, eventEmitter: EventEmitter) {
    // this.chatId = chatId;
    this.bucketSize = options.rateLimiter.bucketSize || 5;
    this.tokenBucket = {
      tokens: this.bucketSize,
      lastRefill: Date.now(),
    };
    this.refillRate = options.rateLimiter.refillRate || 1;
    this.refillInterval = (options.rateLimiter.refillInterval || 1) * 60 * 1000;
    this.stopAgressiveTimeout = (options.rateLimiter.stopAgressiveTimeout || 15) * 60 * 1000;
    this.stopped = false;
    this.timeoutId = null;
    this.intervalId = null;
    this.eventEmitter = eventEmitter;
    this.progressBar = new ProgressBar({
      bucketSize: this.bucketSize, 
      chatId: options.chatId,
      maxLengthOfBar: options.maxLengthOfBar || 50,
    }, eventEmitter)
  }

  /**
   * Refills the token bucket with new tokens.
   */
  private refillTokens(): void {
    this.tokenBucket.tokens = Math.min(this.bucketSize, this.tokenBucket.tokens + this.refillRate);
    this.tokenBucket.lastRefill = Date.now();
    this.eventEmitter.emit('tokenBucketChanged', this.tokenBucket);
  
    if (this.tokenBucket.tokens === this.bucketSize) {
      clearInterval(this.intervalId!);
      this.intervalId = null;
    }
  }
  

  /**
   * Resumes the rate limiter after a stop.
   */
  private resume(chatId: number): void {
    this.timeoutId = null;
    const timeSinceLastRefill = Date.now() - this.tokenBucket.lastRefill;
    const tokensToAdd = timeSinceLastRefill >= this.refillInterval ? this.refillRate : 1;
    this.tokenBucket.tokens = Math.min(this.bucketSize, this.tokenBucket.tokens + tokensToAdd);
    this.tokenBucket.lastRefill = Date.now();
    this.eventEmitter.emit('tokenBucketChanged', this.tokenBucket);
    if (this.tokenBucket.tokens < this.bucketSize) {
      this.intervalId = setInterval(() => {
        this.refillTokens();
      }, this.refillInterval);
    }
    this.stopped = false;
    logger.warn(`Включил заявки для чата: ${chatId}`)
  }
  

  /**
   * Stops the rate limiter.
   */
  private stop(chatId: number): void {
    logger.warn(`Останавливаю поступление новых заявок для чата: ${chatId}`)
    this.stopped = true;
    clearInterval(this.intervalId!);
  }

  /**
   * Consumes a token from the token bucket.
   * @returns Whether the token was consumed successfully.
   */
  consumeToken(chatId: number): boolean {
    if (this.tokenBucket.tokens > 0) {
      this.tokenBucket.tokens -= 1;
      if (!this.intervalId) {
        this.intervalId = setInterval(() => {
          this.refillTokens();
        }, this.refillInterval);
      }
      this.eventEmitter.emit('tokenBucketChanged', this.tokenBucket);
      return true;
    } else {
      if (!this.stopped) this.stop(chatId);
      // make outside from stop to prevent stoping after t minutes. It can contain long attack by this way
      if (this.timeoutId) { 
        clearTimeout(this.timeoutId);
      }
      this.timeoutId = setTimeout(() => {
        this.resume(chatId);
      }, this.stopAgressiveTimeout);
      return false;
    }
  }
  
}

export default RateLimiter;
