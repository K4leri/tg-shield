import NullAdapter from "./adapters/null-adapter.js";
import PostgresConcreteAdapter from "./adapters/postgres-adapter.js";
import { MessageDB } from "../types/dbData.js";
import { Message } from "../types/message.js";

export async function logJoinRequest(adapter: PostgresConcreteAdapter | NullAdapter, chatId: number, userId: number) {
    if (adapter instanceof PostgresConcreteAdapter) {
      await adapter.sql`
        INSERT INTO telegram_join_requests 
        (chat_id, user_id, request_status) 
        VALUES (${chatId}, ${userId}, 'ban') 
        RETURNING *
      `;
    }
}


export async function logMessageJoin(
  adapter: PostgresConcreteAdapter | NullAdapter, 
  chatId: number, 
  userId: number, 
  messageId: number,
  status: string = "stay"
) {
  if (adapter instanceof PostgresConcreteAdapter) {
    await adapter.sql`
      INSERT INTO message (chat_id, user_id, message_id, status)
      VALUES (${chatId}, ${userId}, ${messageId}, ${status})
    `;
  }
}

export async function logMessagesOfJoin(adapter: PostgresConcreteAdapter | NullAdapter, messages: Message[]) {
  if (adapter instanceof PostgresConcreteAdapter) {
    await adapter.sql`
      INSERT INTO message ${ adapter.sql(messages) }
    `;
  }
}


export async function getAllMessagesToDelete(
  adapter: PostgresConcreteAdapter | NullAdapter, 
  chatId: number, 
  timestamp: number
) {
  if (adapter instanceof PostgresConcreteAdapter) {
    const result = await adapter.sql<MessageDB[]>`
      SELECT *
        FROM message
      WHERE chat_id = ${chatId}
        AND status = 'stay'
        AND created >= ${timestamp}
    `;


    if (result.length) {
      const ids = result.map((message) => message.id)
      await adapter.sql`
        UPDATE message
        SET status = 'ban'
        WHERE id IN ${adapter.sql(ids)}
      `;
    }

    return result;
  }
  return [];
}
