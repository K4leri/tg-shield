// config.ts
import PostgresConcreteAdapter from './adapters/postgres-adapter.js'; 
import NullAdapter from './adapters/null-adapter.js'; 
import { PostgresSettings } from '../types/dbData.js'; 

class Database {
  private static instance: Database;
  private postgresAdapterAvailable: boolean;
  private postgresSettings: PostgresSettings;
  private adapter: PostgresConcreteAdapter | NullAdapter;


  private constructor() {
    this.postgresSettings = {
      user: process.env.POSTGRES_USER as string,
      host: process.env.POSTGRES_HOST as string,
      database: process.env.POSTGRES_DATABASE as string,
      password: process.env.POSTGRES_PASSWORD as string,
      port: parseInt(process.env.POSTGRES_PORT as string, 10),
    };

    //@ts-ignore
    this.postgresAdapterAvailable = (
      this.postgresSettings.user &&
      this.postgresSettings.host &&
      this.postgresSettings.database &&
      this.postgresSettings.password &&
      this.postgresSettings.port
    );

    if (this.postgresAdapterAvailable) {
      this.adapter = new PostgresConcreteAdapter(this.postgresSettings);
    } else {
      this.adapter = new NullAdapter();
    }
  }

  public static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }

  public getAdapter(): PostgresConcreteAdapter | NullAdapter {
    return this.adapter;
  }

  public isPostgresAdapterAvailable(): boolean {
    return this.postgresAdapterAvailable;
  }
}

class DatabaseAdapter {
  private adapter: PostgresConcreteAdapter | NullAdapter;

  constructor() {
    const database = Database.getInstance();
    this.adapter = database.getAdapter();
  }

  public getAdapter(): PostgresConcreteAdapter | NullAdapter {
    return this.adapter;
  }
}

const databaseAdapter = new DatabaseAdapter();
export const adapter = databaseAdapter.getAdapter();