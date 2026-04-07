import {
  pgTable, pgEnum, uuid, text, date, numeric,
  index
} from 'drizzle-orm/pg-core'

import { profiles } from './auth.js'
import { timestamptz } from './helpers.js'

export const inventoryItemTypeEnum = pgEnum('inventory_item_type', [
  'yarn', 'raw_fabric', 'finished_fabric',
])
export const adjustmentTypeEnum = pgEnum('adjustment_type', [
  'increase', 'decrease', 'correction',
])

export const inventoryAdjustments = pgTable('inventory_adjustments', {
  id:             uuid('id').primaryKey().defaultRandom(),
  adjustmentDate: date('adjustment_date').notNull().defaultNow(),
  itemType:       inventoryItemTypeEnum('item_type').notNull(),
  referenceId:    uuid('reference_id'),
  adjustmentType: adjustmentTypeEnum('adjustment_type').notNull(),
  quantityDelta:  numeric('quantity_delta', { precision: 14, scale: 3 }).notNull(),
  reason:         text('reason').notNull(),
  notes:          text('notes'),
  createdBy:      uuid('created_by').references(() => profiles.id),
  createdAt:      timestamptz('created_at').notNull().defaultNow(),
}, (t) => [
  index('idx_inv_adj_date').on(t.adjustmentDate),
  index('idx_inv_adj_item_type').on(t.itemType),
])

export const settings = pgTable('settings', {
  id:          uuid('id').primaryKey().defaultRandom(),
  key:         text('key').notNull().unique(),
  value:       text('value'),
  description: text('description'),
  createdAt:   timestamptz('created_at').notNull().defaultNow(),
  updatedAt:   timestamptz('updated_at').notNull().defaultNow(),
})
