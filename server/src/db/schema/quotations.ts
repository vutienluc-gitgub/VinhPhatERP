import { sql } from 'drizzle-orm'
import {
  pgTable, pgEnum, uuid, text, date, numeric,
  smallint, index, check, type AnyPgColumn
} from 'drizzle-orm/pg-core'
import { timestamptz } from './helpers.js'
import { customers } from './customers.js'
import { profiles } from './auth.js'
import { orders } from './orders.js'

export const quotationStatusEnum = pgEnum('quotation_status', [
  'draft', 'sent', 'confirmed', 'rejected', 'expired', 'converted',
])

export const quotations = pgTable('quotations', {
  id:                 uuid('id').primaryKey().defaultRandom(),
  quotationNumber:    text('quotation_number').notNull().unique(),
  customerId:         uuid('customer_id').notNull().references(() => customers.id),
  quotationDate:      date('quotation_date').notNull().defaultNow(),
  validUntil:         date('valid_until'),
  subtotal:           numeric('subtotal', { precision: 18, scale: 2 }).notNull().default('0'),
  discountType:       text('discount_type').notNull().default('percent'),
  discountValue:      numeric('discount_value', { precision: 18, scale: 2 }).notNull().default('0'),
  discountAmount:     numeric('discount_amount', { precision: 18, scale: 2 }).notNull().default('0'),
  totalBeforeVat:     numeric('total_before_vat', { precision: 18, scale: 2 }).notNull().default('0'),
  vatRate:            numeric('vat_rate', { precision: 5, scale: 2 }).notNull().default('10'),
  vatAmount:          numeric('vat_amount', { precision: 18, scale: 2 }).notNull().default('0'),
  totalAmount:        numeric('total_amount', { precision: 18, scale: 2 }).notNull().default('0'),
  status:             quotationStatusEnum('status').notNull().default('draft'),
  revision:           smallint('revision').notNull().default(1),
  parentQuotationId:  uuid('parent_quotation_id').references((): AnyPgColumn => quotations.id),
  convertedOrderId:   uuid('converted_order_id').references(() => orders.id),
  deliveryTerms:      text('delivery_terms'),
  paymentTerms:       text('payment_terms'),
  notes:              text('notes'),
  createdBy:          uuid('created_by').references(() => profiles.id),
  confirmedAt:        timestamptz('confirmed_at'),
  createdAt:          timestamptz('created_at').notNull().defaultNow(),
  updatedAt:          timestamptz('updated_at').notNull().defaultNow(),
}, (t) => [
  index('idx_quotations_customer').on(t.customerId),
  index('idx_quotations_date').on(t.quotationDate),
  index('idx_quotations_status').on(t.status),
  index('idx_quotations_valid_until').on(t.validUntil),
  index('idx_quotations_parent').on(t.parentQuotationId),
  check('chk_discount_type', sql`discount_type IN ('percent', 'amount')`),
])

export const quotationItems = pgTable('quotation_items', {
  id:           uuid('id').primaryKey().defaultRandom(),
  quotationId:  uuid('quotation_id').notNull().references(() => quotations.id, { onDelete: 'cascade' }),
  fabricType:   text('fabric_type').notNull(),
  colorName:    text('color_name'),
  colorCode:    text('color_code'),
  widthCm:      numeric('width_cm', { precision: 7, scale: 2 }),
  quantity:     numeric('quantity', { precision: 14, scale: 3 }).notNull(),
  unit:         text('unit').notNull().default('m'),
  unitPrice:    numeric('unit_price', { precision: 18, scale: 2 }).notNull().default('0'),
  amount:       numeric('amount', { precision: 18, scale: 2 }).generatedAlwaysAs(sql`quantity * unit_price`).notNull(),
  leadTimeDays: smallint('lead_time_days'),
  notes:        text('notes'),
  sortOrder:    smallint('sort_order').notNull().default(0),
}, (t) => [
  index('idx_quotation_items_quotation').on(t.quotationId),
])
