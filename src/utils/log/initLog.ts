// initLog.ts
import { logger } from "./logProvider.js";
import { ChatConfigFromJson } from "../../types/config.js";


const paramNameWidth = 40;
const paramValueWidth = 40;
const maxColumnWidth = 40;
const NO_DATA_MESSAGE = 'отсуствуют';

const formatWhiteList = (whiteList: number[]) => {
  const chunks = [];
  let currentChunk = '';
  for (const id of whiteList) {
    const idStr = id.toString();
    if (currentChunk.length + idStr.length + 2 > maxColumnWidth) {
      chunks.push(currentChunk);
      currentChunk = '';
    }
    currentChunk += idStr + ', ';
  }
  chunks.push(currentChunk.trim());
  return chunks;
};

const generateTableRow = (paramName: string, paramValue: string) => {
  return `| ${pad(paramName, paramNameWidth)} | ${pad(paramValue, paramValueWidth)} |`;
};

const generateTable = (whiteListChunks: string[]) => {
  const tableRows = [];
  tableRows.push(generateTableRow('Список супер админов без лимитов', whiteListChunks[0]));
  for (let i = 1; i < whiteListChunks.length; i++) {
    tableRows.push(`  | ${pad('', paramNameWidth)} | ${pad(whiteListChunks[i], paramValueWidth)} |`);
  }
  return tableRows.join('\n');
};

function pad(str: string, width: number) {
    if (str.length >= width) {
      return str.substring(0, width);
    } else {
      const spaces = width - str.length;
      return str + ' '.repeat(spaces);
    }
}

export function logChatConfig(chatConfig: ChatConfigFromJson, index: number) {
    const whiteListChunks = formatWhiteList(chatConfig.whiteListuserId);
  
    logger.table(`Запускаю ${chatConfig.chatId} со следующими параметрами для чата ${index}:
  
  +${'-'.repeat(paramNameWidth + 2)}+${'-'.repeat(paramValueWidth + 2)}+
  | ${pad('Параметр', paramNameWidth)} | ${pad('Значение', paramValueWidth)} |
  +${'-'.repeat(paramNameWidth + 2)}+${'-'.repeat(paramValueWidth + 2)}+
  | ${pad('Токенов', paramNameWidth)} | ${pad(chatConfig.rateLimiter.bucketSize.toString(), paramValueWidth)} |
  | ${pad('Восстанавливает', paramNameWidth)} | ${pad(chatConfig.rateLimiter.refillRate + ' шт раз в ' + chatConfig.rateLimiter.refillInterval + ' минут', paramValueWidth)} |
  | ${pad('Макс время агрессивного режима', paramNameWidth)} | ${pad(chatConfig.rateLimiter.stopAgressiveTimeout + ' минут', paramValueWidth)} |
  | ${pad('Период для отключения ручного режима', paramNameWidth)} | ${pad(chatConfig.hoursToOffManualMode + ' часов', paramValueWidth)} |
  | ${pad('Чат для отправки уведомления', paramNameWidth)} | ${pad(chatConfig.notificationChatId ? chatConfig.notificationChatId.toString() : NO_DATA_MESSAGE, paramValueWidth)} |
  ${chatConfig.whiteListuserId.length === 0 ? `| ${pad('Список супер админов без лимитов', paramNameWidth)} | ${pad(NO_DATA_MESSAGE, paramValueWidth)} |` : generateTable(whiteListChunks)}
  +${'-'.repeat(paramNameWidth + 2)}+${'-'.repeat(paramValueWidth + 2)}+
  `);
}
