import { ConfigService } from '@nestjs/config';
import 'dotenv/config';

export const databaseConfig = {
  type: 'postgres' as const,
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,

  extra : {
    max : Number(process.env.DB_POOL_MAX ?? 10),
    idleTimeoutMillis: Number(
      process.env.DB_IDLE_TIMEOUT_MS ?? 30000,
    ),
    connectionTimeoutMillis: Number(
      process.env.DB_CONNECTION_TIMEOUT_MS ?? 5000,
    ),
    statement_timeout: Number(
      process.env.DB_STATEMENT_TIMEOUT_MS ?? 5000,
    ),
  }

};