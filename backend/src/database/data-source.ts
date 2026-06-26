import 'dotenv/config';
import { DataSource } from 'typeorm';
import configuration from '../config/configuration';
import { buildTypeOrmOptions } from './typeorm.config';

/**
 * Stand-alone DataSource used by the TypeORM CLI for migrations and seeding.
 * Reads configuration from `backend/.env` (loaded via `dotenv/config`).
 */
const config = configuration();

export default new DataSource(buildTypeOrmOptions(config.database, config.env));
