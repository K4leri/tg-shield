export interface MessageDB {
    id: number;
    chatId: number;
    userId: number;
    messageId: number;
    status: string;
    created: Date;
}

export interface PostgresSettings {
    user: string;
    host: string;
    database: string;
    password: string;
    port: number;
}