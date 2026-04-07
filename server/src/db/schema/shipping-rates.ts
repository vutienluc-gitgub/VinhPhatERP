import {
  pgTable, uuid, text, numeric, boolean,
  index
} from 'drizzle-orm/pg-core'

import { profiles } from './auth.js'
import { timestamptz } from './helpers.js'

// Shipping Rates — Bảng giá cước vận chuyển
export const shippingRates = pgTable('shipping_rates', {
  id:              uuid('id').primaryKey().defaultRandom(),
  name:            text('name').notNull(),
  destinationArea: text('destination_area').notNull(),
  ratePerTrip:     numeric('rate_per_trip', { precision: 14, scale: 0 }),
  ratePerMeter:    numeric('rate_per_meter', { precision: 14, scale: 3 }),
  ratePerKg:       numeric('rate_per_kg', { precision: 14, scale: 3 }),
  loadingFee:      numeric('loading_fee', { precision: 14, scale: 0 }).notNull().default('0'),
  minCharge:       numeric('min_charge', { precision: 14, scale: 0 }).notNull().default('0'),
  isActive:        boolean('is_active').notNull().default(true),
  notes:           text('notes'),
  createdBy:       uuid('created_by').references(() => profiles.id),
  createdAt:       timestamptz('created_at').notNull().defaultNow(),
  updatedAt:       timestamptz('updated_at').notNull().defaultNow(),
}, (t) => [
  index('idx_shipping_rates_active').on(t.isActive),
  index('idx_shipping_rates_area').on(t.destinationArea),
])
