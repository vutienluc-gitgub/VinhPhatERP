import { pgTable, pgEnum, uuid, text, index } from 'drizzle-orm/pg-core';

import { timestamptz } from './helpers.js';

export const supplierCategoryEnum = pgEnum('supplier_category', [
  'yarn',
  'dye',
  'weaving',
  'accessories',
  'other',
]);

export const suppliers = pgTable(
  'suppliers',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    code: text('code').notNull().unique(),
    name: text('name').notNull(),
    category: supplierCategoryEnum('category').notNull().default('other'),
    phone: text('phone'),
    email: text('email'),
    address: text('address'),
    taxCode: text('tax_code'),
    contactPerson: text('contact_person'),
    notes: text('notes'),
    status: text('status').notNull().default('active'), // reuses active_status enum in DB
    createdAt: timestamptz('created_at').notNull().defaultNow(),
    updatedAt: timestamptz('updated_at').notNull().defaultNow(),
  },
  (t) => [
    index('idx_suppliers_code').on(t.code),
    index('idx_suppliers_category').on(t.category),
  ],
);
