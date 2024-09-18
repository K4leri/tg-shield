// adapters/postgres.ts
import postgres from 'postgres';
import { PostgresSettings } from '../types/dbData.js';

class PostgresAdapter {
  public sql: postgres.Sql<{}>;

  constructor(settings: PostgresSettings) {
    this.sql = postgres({
      user: settings.user,
      host: settings.host,
      database: settings.database,
      password: settings.password,
      port: settings.port,
    });
  }
}

export default PostgresAdapter;