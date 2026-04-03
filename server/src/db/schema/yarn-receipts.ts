import {
  pgTable, pgEnum, uuid, text, date, numeric,
  smallint, index
} from 'drizzle-orm/pg-core'
import { timestamptz } from './helpers.js'
import { suppliers } from './suppliers.js'
import { profiles } from './auth.js'
import { yarnCatalogs } from './yarn-catalogs.js'

export const docStatusEnum = pgEnum('doc_status', ['draft', 'confirmed', 'cancelled'])

export const yarnReceipts = pgTable('yarn_receipts', {
  id:            uuid('id').primaryKey().defaultRandom(),
  receiptNumber: text('receipt_number').notNull().unique(),
  supplierId:    uuid('supplier_id').notNull().references(() => suppliers.id),
  receiptDate:   date('receipt_date').notNull().defaultNow(),
  totalAmount:   numeric('total_amount', { precision: 18, scale: 2 }).notNull().default('0'),
  status:        docStatusEnum('status').notNull().default('draft'),
  notes:         text('notes'),
  createdBy:     uuid('created_by').references(() => profiles.id),
  createdAt:     timestamptz('created_at').notNull().defaultNow(),
  updatedAt:     timestamptz('updated_at').notNull().defaultNow(),
}, (t) => [
  index('idx_yarn_receipts_supplier').on(t.supplierId),
  index('idx_yarn_receipts_date').on(t.receiptDate),
  index('idx_yarn_receipts_status').on(t.status),
])

export const yarnReceiptItems = pgTable('yarn_receipt_items', {
  id:         uuid('id').primaryKey().defaultRandom(),
  receiptId:  uuid('receipt_id').notNull().references(() => yarnReceipts.id, { onDelete: 'cascade' }),
  yarnType:   text('yarn_type').notNull(),
  colorName:  text('color_name'),
  colorCode:  text('color_code'),
  unit:       text('unit').notNull().default('kg'),
  quantity:   numeric('quantity', { precision: 14, scale: 3 }).notNull(),
  unitPrice:  numeric('unit_price', { precision: 18, scale: 2 }).notNull().default('0'),
  lotNumber:     text('lot_number'),
  tensileStrength: text('tensile_strength'),
  composition:   text('composition'),
  origin:        text('origin'),
  notes:         text('notes'),
  sortOrder:     smallint('sort_order').notNull().default(0),
  yarnCatalogId: uuid('yarn_catalog_id').references(() => yarnCatalogs.id, { onDelete: 'set null' }),
}, (t) => [
  index('idx_yri_receipt').on(t.receiptId),
  index('idx_yri_catalog').on(t.yarnCatalogId),
])
