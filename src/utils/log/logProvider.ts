// logProvider.ts
import winston from 'winston';
import chalk from 'chalk';
import { barLogger } from '../../index.js';

class LogProvider {
  private mainLogger: winston.Logger;
  
  constructor() {
    this.mainLogger = winston.createLogger({
      level: 'debug',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.colorize({
          colors: {
            debug: 'blue',
            info: 'green',
            warn: 'yellow',
            error: 'red'
          },
          message: true, // Colorize the message text
          level: true // Colorize the level text
        }),
        winston.format.printf((info) => {
          return `${chalk.magenta(info.timestamp)} ${info.level}: ${info.message}`;
        })
      ),
      transports: [
        new winston.transports.Console({
          handleExceptions: true
        })
      ]
    });
  }

  start(message: string) {
    this.mainLogger.info(message);
  }

  table(message: string) {
    this.mainLogger.debug(message);
  }

  info(message: string) {
    barLogger.clearProgressBar();
    this.mainLogger.info(message);
    barLogger.updateChatBars();
  }

  debug(message: string) {
    barLogger.clearProgressBar();
    this.mainLogger.debug(message);
    barLogger.updateChatBars();
  }

  warn(message: string) {
    barLogger.clearProgressBar();
    this.mainLogger.warn(message);
    barLogger.updateChatBars();
  }

  error(message: string) {
    barLogger.clearProgressBar();
    this.mainLogger.error(message);
    barLogger.updateChatBars();
  }
}

export const logger = new LogProvider();
