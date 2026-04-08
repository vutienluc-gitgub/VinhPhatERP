import { timestamp } from 'drizzle-orm/pg-core';

/** Shorthand for `timestamp(name, { withTimezone: true })` — equivalent to PostgreSQL `timestamptz`. */
export const timestamptz = (name: string) =>
  timestamp(name, { withTimezone: true });
