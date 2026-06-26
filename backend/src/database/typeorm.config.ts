import { join } from 'path';
import { DataSourceOptions } from 'typeorm';
import { DatabaseConfig } from '../config/configuration';

/**
 * Single source of truth for TypeORM connection options, shared by the runtime
 * Nest module (`TypeOrmModule.forRootAsync`) and the migration CLI data-source.
 *
 * `synchronize` is permanently `false` — the schema is owned by migrations
 * (constitution: "Schema via migrations only — never synchronize").
 */
export function buildTypeOrmOptions(db: DatabaseConfig, nodeEnv: string): DataSourceOptions {
  return {
    type: 'mysql',
    host: db.host,
    port: db.port,
    username: db.username,
    password: db.password,
    database: db.database,
    entities: [join(__dirname, '..', '**', '*.entity.{ts,js}')],
    migrations: [join(__dirname, 'migrations', '*.{ts,js}')],
    synchronize: false,
    logging: nodeEnv === 'development' ? ['error', 'warn', 'migration'] : ['error'],
    charset: 'utf8mb4',
    timezone: 'Z',
  };
}
