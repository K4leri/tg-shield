// adapters/postgres-concrete-adapter.ts
import AbstractAdapter from './abstract-adapter.js';
import PostgresAdapter from '../postgres.js';
import postgres from 'postgres';
import { PostgresSettings } from '../../types/dbData.js';

class PostgresConcreteAdapter extends AbstractAdapter {
  private postgresAdapter: PostgresAdapter;

  constructor(settings: PostgresSettings) {
    super();
    this.postgresAdapter = new PostgresAdapter(settings);
  }

  get sql(): postgres.Sql<{}> {
    return this.postgresAdapter.sql;
  }
}

export default PostgresConcreteAdapter;