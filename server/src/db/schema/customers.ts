import {
  pgTable, pgEnum, uuid, text,
  timestamptz, index
} from 'drizzle-orm/pg-core'

export const activeStatusEnum = pgEnum('active_status', ['active', 'inactive'])
export const customerSourceEnum = pgEnum('customer_source', [
  'referral', 'exhibition', 'zalo', 'online', 'direct', 'cold_call', 'other',
])

export const customers = pgTable('customers', {
  id:            uuid('id').primaryKey().defaultRandom(),
  code:          text('code').notNull().unique(),
  name:          text('name').notNull(),
  phone:         text('phone'),
  email:         text('email'),
  address:       text('address'),
  taxCode:       text('tax_code'),
  contactPerson: text('contact_person'),
  source:        customerSourceEnum('source').default('other'),
  notes:         text('notes'),
  status:        activeStatusEnum('status').notNull().default('active'),
  createdAt:     timestamptz('created_at').notNull().defaultNow(),
  updatedAt:     timestamptz('updated_at').notNull().defaultNow(),
}, (t) => [
  index('idx_customers_code').on(t.code),
  index('idx_customers_status').on(t.status),
])
