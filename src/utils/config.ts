// config.ts
import configJson from '../../config.json' assert { type: 'json' };
import { Config, ChatConfigFromJson } from '../types/config.js';

const config: Config = {
  chats: configJson.chats.map((chat: ChatConfigFromJson) => ({
    ...chat,
    maxFailedAttemps: chat?.maxFailedAttemps ?? 3,
  })),
};

export { config };