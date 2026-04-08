import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

import * as schema from './schema/index.js';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('[DB] DATABASE_URL chưa được cấu hình trong .env');
}

const queryClient = postgres(connectionString);

export const db = drizzle(queryClient, { schema });
export type DB = typeof db;
