import {
  pgTable,
  uuid,
  text,
  integer,
  boolean,
  jsonb,
  index,
} from 'drizzle-orm/pg-core';

import { profiles } from './auth.js';
import { timestamptz } from './helpers.js';
import { suppliers } from './suppliers.js';
import { yarnReceipts } from './yarn-receipts.js';

export const ocrJobs = pgTable(
  'ocr_jobs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    documentType: text('document_type').notNull().default('YARN_WEIGHING_SLIP'),
    status: text('status').notNull().default('EXTRACTED'),

    // Anti-Fraud & File Reference
    imageHash: text('image_hash').notNull(),
    originalImageUrl: text('original_image_url'),
    fileName: text('file_name'),

    // Telemetry & Diagnostics
    correlationId: text('correlation_id').notNull(),
    engine: text('engine').notNull().default('gemini-2.5-flash'),
    durationMs: integer('duration_ms'),
    visionDurationMs: integer('vision_duration_ms'),

    // Provenance Data
    rawExtractionJson: jsonb('raw_extraction_json').notNull(),
    suggestedReceiptJson: jsonb('suggested_receipt_json'),

    // Audit Flags
    needsManualReview: boolean('needs_manual_review').notNull().default(false),
    reviewReasons: jsonb('review_reasons').default([]),
    mathDiscrepancy: boolean('math_discrepancy').notNull().default(false),
    isDuplicate: boolean('is_duplicate').notNull().default(false),
    duplicateType: text('duplicate_type'),

    // Linkages
    createdReceiptId: uuid('created_receipt_id').references(
      () => yarnReceipts.id,
      {
        onDelete: 'set null',
      },
    ),
    supplierId: uuid('supplier_id').references(() => suppliers.id, {
      onDelete: 'set null',
    }),
    tenantId: uuid('tenant_id'),
    createdBy: uuid('created_by').references(() => profiles.id),
    createdAt: timestamptz('created_at').notNull().defaultNow(),
  },
  (t) => [
    index('idx_ocr_jobs_image_hash').on(t.imageHash),
    index('idx_ocr_jobs_status').on(t.status),
    index('idx_ocr_jobs_tenant_created').on(t.tenantId, t.createdAt),
    index('idx_ocr_jobs_receipt').on(t.createdReceiptId),
  ],
);
