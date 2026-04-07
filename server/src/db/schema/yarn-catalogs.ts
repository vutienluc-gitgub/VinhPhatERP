import { pgTable, uuid, text, index } from 'drizzle-orm/pg-core'

import { timestamptz } from './helpers.js'

export const yarnCatalogs = pgTable('yarn_catalogs', {
  id:              uuid('id').primaryKey().defaultRandom(),
  code:            text('code').notNull().unique(),
  name:            text('name').notNull(),
  composition:     text('composition'),
  colorName:       text('color_name'),
  tensileStrength: text('tensile_strength'),
  origin:          text('origin'),
  unit:            text('unit').notNull().default('kg'),
  notes:           text('notes'),
  status:          text('status').notNull().default('active'),
  createdAt:       timestamptz('created_at').notNull().defaultNow(),
  updatedAt:       timestamptz('updated_at').notNull().defaultNow(),
}, (t) => [
  index('idx_yarn_catalogs_status').on(t.status),
  index('idx_yarn_catalogs_code').on(t.code),
])
