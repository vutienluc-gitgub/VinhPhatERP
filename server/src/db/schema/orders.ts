import { sql } from 'drizzle-orm';
import {
  pgTable,
  pgEnum,
  uuid,
  text,
  date,
  numeric,
  smallint,
  index,
  unique,
} from 'drizzle-orm/pg-core';

import { profiles } from './auth.js';
import { customers } from './customers.js';
import { finishedFabricRolls } from './fabric.js';
import { timestamptz } from './helpers.js';
import { shippingRates } from './shipping-rates.js';

export const orderStatusEnum = pgEnum('order_status', [
  'draft',
  'confirmed',
  'in_progress',
  'completed',
  'cancelled',
]);

export const productionStageEnum = pgEnum('production_stage', [
  'warping',
  'weaving',
  'greige_check',
  'dyeing',
  'finishing',
  'final_check',
  'packing',
]);

export const stageStatusEnum = pgEnum('stage_status', [
  'pending',
  'in_progress',
  'done',
  'skipped',
]);

export const shipmentStatusEnum = pgEnum('shipment_status', [
  'preparing',
  'shipped',
  'delivered',
  'partially_returned',
  'returned',
]);

export const paymentMethodEnum = pgEnum('payment_method', [
  'cash',
  'bank_transfer',
  'check',
  'other',
]);

// Orders
export const orders = pgTable(
  'orders',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orderNumber: text('order_number').notNull().unique(),
    customerId: uuid('customer_id')
      .notNull()
      .references(() => customers.id),
    orderDate: date('order_date').notNull().defaultNow(),
    deliveryDate: date('delivery_date'),
    totalAmount: numeric('total_amount', {
      precision: 18,
      scale: 2,
    })
      .notNull()
      .default('0'),
    paidAmount: numeric('paid_amount', {
      precision: 18,
      scale: 2,
    })
      .notNull()
      .default('0'),
    status: orderStatusEnum('status').notNull().default('draft'),
    notes: text('notes'),
    confirmedBy: uuid('confirmed_by').references(() => profiles.id),
    confirmedAt: timestamptz('confirmed_at'),
    createdBy: uuid('created_by').references(() => profiles.id),
    createdAt: timestamptz('created_at').notNull().defaultNow(),
    updatedAt: timestamptz('updated_at').notNull().defaultNow(),
    sourceQuotationId: uuid('source_quotation_id'),
  },
  (t) => [
    index('idx_orders_customer').on(t.customerId),
    index('idx_orders_date').on(t.orderDate),
    index('idx_orders_status').on(t.status),
  ],
);

export const orderItems = pgTable(
  'order_items',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orderId: uuid('order_id')
      .notNull()
      .references(() => orders.id, { onDelete: 'cascade' }),
    fabricType: text('fabric_type').notNull(),
    colorName: text('color_name'),
    colorCode: text('color_code'),
    widthCm: numeric('width_cm', {
      precision: 7,
      scale: 2,
    }),
    quantity: numeric('quantity', {
      precision: 14,
      scale: 3,
    }).notNull(),
    unit: text('unit').notNull().default('m'),
    unitPrice: numeric('unit_price', {
      precision: 18,
      scale: 2,
    })
      .notNull()
      .default('0'),
    amount: numeric('amount', {
      precision: 18,
      scale: 2,
    })
      .generatedAlwaysAs(sql`quantity * unit_price`)
      .notNull(),
    notes: text('notes'),
    sortOrder: smallint('sort_order').notNull().default(0),
  },
  (t) => [index('idx_order_items_order').on(t.orderId)],
);

// Order Progress
export const orderProgress = pgTable(
  'order_progress',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orderId: uuid('order_id')
      .notNull()
      .references(() => orders.id, { onDelete: 'cascade' }),
    stage: productionStageEnum('stage').notNull(),
    status: stageStatusEnum('status').notNull().default('pending'),
    plannedDate: date('planned_date'),
    actualDate: date('actual_date'),
    notes: text('notes'),
    updatedBy: uuid('updated_by').references(() => profiles.id),
    createdAt: timestamptz('created_at').notNull().defaultNow(),
    updatedAt: timestamptz('updated_at').notNull().defaultNow(),
  },
  (t) => [
    unique('order_progress_order_stage_unique').on(t.orderId, t.stage),
    index('idx_order_progress_order').on(t.orderId),
    index('idx_order_progress_status').on(t.status),
  ],
);

// Shipments
export const shipments = pgTable(
  'shipments',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    shipmentNumber: text('shipment_number').notNull().unique(),
    orderId: uuid('order_id')
      .notNull()
      .references(() => orders.id),
    customerId: uuid('customer_id')
      .notNull()
      .references(() => customers.id),
    shipmentDate: date('shipment_date').notNull().defaultNow(),
    deliveryAddress: text('delivery_address'),
    carrier: text('carrier'),
    trackingNumber: text('tracking_number'),
    status: shipmentStatusEnum('status').notNull().default('preparing'),
    notes: text('notes'),
    // Delivery tracking
    deliveryStaffId: uuid('delivery_staff_id').references(() => profiles.id),
    shippingRateId: uuid('shipping_rate_id').references(() => shippingRates.id),
    shippingCost: numeric('shipping_cost', {
      precision: 14,
      scale: 0,
    })
      .notNull()
      .default('0'),
    loadingFee: numeric('loading_fee', {
      precision: 14,
      scale: 0,
    })
      .notNull()
      .default('0'),
    totalWeightKg: numeric('total_weight_kg', {
      precision: 14,
      scale: 3,
    }),
    totalMeters: numeric('total_meters', {
      precision: 14,
      scale: 3,
    }),
    vehicleInfo: text('vehicle_info'),
    preparedAt: timestamptz('prepared_at'),
    shippedAt: timestamptz('shipped_at'),
    deliveredAt: timestamptz('delivered_at'),
    deliveryProof: text('delivery_proof'),
    receiverName: text('receiver_name'),
    receiverPhone: text('receiver_phone'),
    createdBy: uuid('created_by').references(() => profiles.id),
    createdAt: timestamptz('created_at').notNull().defaultNow(),
    updatedAt: timestamptz('updated_at').notNull().defaultNow(),
  },
  (t) => [
    index('idx_shipments_order').on(t.orderId),
    index('idx_shipments_customer').on(t.customerId),
    index('idx_shipments_date').on(t.shipmentDate),
    index('idx_shipments_status').on(t.status),
    index('idx_shipments_delivery_staff').on(t.deliveryStaffId),
    index('idx_shipments_shipping_rate').on(t.shippingRateId),
  ],
);

export const shipmentItems = pgTable(
  'shipment_items',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    shipmentId: uuid('shipment_id')
      .notNull()
      .references(() => shipments.id, { onDelete: 'cascade' }),
    finishedRollId: uuid('finished_roll_id').references(
      () => finishedFabricRolls.id,
    ),
    fabricType: text('fabric_type').notNull(),
    colorName: text('color_name'),
    quantity: numeric('quantity', {
      precision: 14,
      scale: 3,
    }).notNull(),
    unit: text('unit').notNull().default('m'),
    notes: text('notes'),
    sortOrder: smallint('sort_order').notNull().default(0),
  },
  (t) => [index('idx_shipment_items_shipment').on(t.shipmentId)],
);

// Payments
export const payments = pgTable(
  'payments',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    paymentNumber: text('payment_number').notNull().unique(),
    orderId: uuid('order_id')
      .notNull()
      .references(() => orders.id),
    customerId: uuid('customer_id')
      .notNull()
      .references(() => customers.id),
    paymentDate: date('payment_date').notNull().defaultNow(),
    amount: numeric('amount', {
      precision: 18,
      scale: 2,
    }).notNull(),
    paymentMethod: paymentMethodEnum('payment_method')
      .notNull()
      .default('bank_transfer'),
    referenceNumber: text('reference_number'),
    notes: text('notes'),
    createdBy: uuid('created_by').references(() => profiles.id),
    createdAt: timestamptz('created_at').notNull().defaultNow(),
    updatedAt: timestamptz('updated_at').notNull().defaultNow(),
  },
  (t) => [
    index('idx_payments_order').on(t.orderId),
    index('idx_payments_customer').on(t.customerId),
    index('idx_payments_date').on(t.paymentDate),
  ],
);
