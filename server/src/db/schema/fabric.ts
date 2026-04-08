import {
  pgTable,
  pgEnum,
  uuid,
  text,
  date,
  numeric,
  char,
  index,
} from 'drizzle-orm/pg-core';

import { timestamptz } from './helpers.js';
import { yarnReceipts } from './yarn-receipts.js';

export const rollStatusEnum = pgEnum('roll_status', [
  'in_stock',
  'reserved',
  'in_process',
  'shipped',
  'damaged',
  'written_off',
]);

export const rawFabricRolls = pgTable(
  'raw_fabric_rolls',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    rollNumber: text('roll_number').notNull().unique(),
    yarnReceiptId: uuid('yarn_receipt_id').references(() => yarnReceipts.id),
    fabricType: text('fabric_type').notNull(),
    colorName: text('color_name'),
    colorCode: text('color_code'),
    widthCm: numeric('width_cm', {
      precision: 7,
      scale: 2,
    }),
    lengthM: numeric('length_m', {
      precision: 10,
      scale: 3,
    }),
    weightKg: numeric('weight_kg', {
      precision: 10,
      scale: 3,
    }),
    qualityGrade: char('quality_grade', { length: 1 }),
    status: rollStatusEnum('status').notNull().default('in_stock'),
    warehouseLocation: text('warehouse_location'),
    productionDate: date('production_date'),
    notes: text('notes'),
    createdAt: timestamptz('created_at').notNull().defaultNow(),
    updatedAt: timestamptz('updated_at').notNull().defaultNow(),
  },
  (t) => [
    index('idx_raw_rolls_status').on(t.status),
    index('idx_raw_rolls_fabric_type').on(t.fabricType),
    index('idx_raw_rolls_receipt').on(t.yarnReceiptId),
  ],
);

export const finishedFabricRolls = pgTable(
  'finished_fabric_rolls',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    rollNumber: text('roll_number').notNull().unique(),
    rawRollId: uuid('raw_roll_id')
      .notNull()
      .references(() => rawFabricRolls.id),
    fabricType: text('fabric_type').notNull(),
    colorName: text('color_name'),
    colorCode: text('color_code'),
    widthCm: numeric('width_cm', {
      precision: 7,
      scale: 2,
    }),
    lengthM: numeric('length_m', {
      precision: 10,
      scale: 3,
    }),
    weightKg: numeric('weight_kg', {
      precision: 10,
      scale: 3,
    }),
    qualityGrade: char('quality_grade', { length: 1 }),
    status: rollStatusEnum('status').notNull().default('in_stock'),
    warehouseLocation: text('warehouse_location'),
    lotNumber: text('lot_number'),
    productionDate: date('production_date'),
    notes: text('notes'),
    createdAt: timestamptz('created_at').notNull().defaultNow(),
    updatedAt: timestamptz('updated_at').notNull().defaultNow(),
  },
  (t) => [
    index('idx_finished_rolls_status').on(t.status),
    index('idx_finished_rolls_fabric_type').on(t.fabricType),
    index('idx_finished_rolls_raw_roll').on(t.rawRollId),
    index('idx_finished_rolls_lot_number').on(t.lotNumber),
  ],
);
