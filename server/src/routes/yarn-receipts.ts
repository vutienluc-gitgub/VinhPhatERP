/**
 * Yarn Receipts Hono Router
 * Provides OCR Slip Scanning endpoint integrated with Python Vision microservice,
 * Deterministic Supplier Matcher, and Duplicate Document Guard.
 */

import { Hono } from 'hono';

import { YARN_SLIP_SCAN_MESSAGES } from '../constants/yarn-receipts.constants.js';
import { requireAuth } from '../middleware/auth.js';
import { duplicateGuard } from '../services/duplicate-guard.service.js';
import { ocrTelemetry } from '../services/ocr-telemetry.service.js';
import { supplierMatcher } from '../services/supplier-matcher.service.js';
import {
  QualityGateError,
  VisionRateLimitError,
  VisionServiceError,
  VisionTimeoutError,
  visionClient,
} from '../services/vision-client.service.js';

const router = new Hono();

/**
 * GET /api/v1/yarn-receipts/telemetry
 * Returns aggregated OCR scan performance, auto-approval rate, and error statistics.
 */
router.get('/telemetry', requireAuth, (c) => {
  const timeframeQuery = c.req.query('timeframeMinutes');
  const timeframeMinutes = timeframeQuery
    ? parseInt(timeframeQuery, 10)
    : undefined;
  const summary = ocrTelemetry.getSummary(
    Number.isFinite(timeframeMinutes) ? timeframeMinutes : undefined,
  );
  return c.json(summary, 200);
});

/**
 * POST /api/v1/yarn-receipts/scan
 * Ingests a yarn weighing slip image, executes vision extraction,
 * matches supplier, verifies math and duplicates, and produces audited draft data.
 */
router.post('/scan', requireAuth, async (c) => {
  const startTime = Date.now();
  const correlationId = c.req.header('X-Correlation-ID') || crypto.randomUUID();

  let body: Record<string, string | File>;
  try {
    body = await c.req.parseBody();
  } catch (_parseError) {
    return c.json(
      {
        error: 'InvalidRequestBody',
        message: YARN_SLIP_SCAN_MESSAGES.INVALID_MULTIPART,
      },
      400,
    );
  }

  const file = body['file'];
  if (!file || !(file instanceof File)) {
    return c.json(
      {
        error: 'MissingFile',
        message: YARN_SLIP_SCAN_MESSAGES.MISSING_FILE,
      },
      400,
    );
  }

  const arrayBuffer = await file.arrayBuffer();
  const imageBuffer = Buffer.from(arrayBuffer);

  if (imageBuffer.length === 0) {
    return c.json(
      {
        error: 'EmptyFile',
        message: YARN_SLIP_SCAN_MESSAGES.EMPTY_FILE,
      },
      400,
    );
  }

  try {
    // 1. Invoke Python Vision Microservice (:8000)
    const extraction = await visionClient.extractYarnSlip(
      imageBuffer,
      file.name,
      correlationId,
      file.type || 'image/jpeg',
    );

    // 2. Fetch active suppliers from DB for matching
    const activeSuppliers = await supplierMatcher.getActiveSuppliers();

    // 3. Run Deterministic Supplier Matcher
    const supplierMatch = supplierMatcher.matchSupplier(
      extraction.document.supplier_raw_name.value,
      activeSuppliers,
    );

    // 4. Run Duplicate Document Guard
    const duplicateCheck = await duplicateGuard.checkDuplicate({
      imageBytes: imageBuffer,
      supplierId: supplierMatch.matchedSupplierId,
      documentNumber: extraction.document.document_number.value,
      documentDate: extraction.document.document_date.value,
    });

    // 5. Aggregate review reasons and final audit status
    const combinedReasons = [...extraction.review_reasons];
    if (supplierMatch.ambiguous) {
      combinedReasons.push(YARN_SLIP_SCAN_MESSAGES.AMBIGUOUS_SUPPLIER);
    }
    if (duplicateCheck.isDuplicate && duplicateCheck.warningMessage) {
      combinedReasons.push(duplicateCheck.warningMessage);
    }

    const needsManualReview =
      extraction.needs_manual_review ||
      supplierMatch.ambiguous ||
      duplicateCheck.isDuplicate;

    const responsePayload = {
      job_id: correlationId,
      status: 'EXTRACTED',
      extraction,
      supplier_match: supplierMatch,
      duplicate_guard: duplicateCheck,
      suggested_receipt: {
        supplier_id: supplierMatch.matchedSupplierId,
        supplier_name: supplierMatch.matchedSupplierName,
        receipt_number: extraction.document.document_number.value,
        receipt_date: extraction.document.document_date.value,
        vehicle_info: extraction.document.vehicle_plate.value,
        notes: extraction.document.notes.value,
        yarn_type: extraction.summary.yarn_type.value,
        yarn_lot: extraction.summary.yarn_lot.value,
        gross_weight_kg: extraction.summary.gross_weight_kg.value,
        tare_weight_kg: extraction.summary.tare_weight_kg.value,
        declared_net_weight_kg: extraction.summary.declared_net_weight_kg.value,
        package_count: extraction.summary.package_count.value,
        cone_count: extraction.summary.cone_count.value,
        packages: extraction.packages,
      },
      validation: {
        passed: !needsManualReview,
        needs_manual_review: needsManualReview,
        reasons: combinedReasons,
      },
    };

    // 6. Record Telemetry & Persistent Hash Cache
    const durationMs = Date.now() - startTime;
    ocrTelemetry.recordScan({
      jobId: correlationId,
      durationMs,
      visionDurationMs: extraction.engine_telemetry?.processing_duration_ms,
      needsManualReview,
      reviewReasons: combinedReasons,
      supplierMatched: Boolean(supplierMatch.matchedSupplierId),
      supplierConfidence: supplierMatch.confidence,
      isDuplicate: duplicateCheck.isDuplicate,
      duplicateType: duplicateCheck.duplicateType,
      mathDiscrepancy: extraction.math_discrepancies.length > 0,
      packageCount: extraction.summary.package_count.value ?? 0,
    });

    duplicateGuard.recordImageHash(duplicateCheck.imageHash, {
      receiptNumber: extraction.document.document_number.value ?? undefined,
      supplierId: supplierMatch.matchedSupplierId ?? undefined,
    });

    return c.json(responsePayload, 200);
  } catch (error) {
    if (error instanceof QualityGateError) {
      return c.json(
        {
          error: error.name,
          message: error.message,
          details: error.details,
        },
        422,
      );
    }

    if (error instanceof VisionTimeoutError) {
      return c.json(
        {
          error: error.name,
          message: YARN_SLIP_SCAN_MESSAGES.VISION_TIMEOUT,
          details: error.details,
        },
        504,
      );
    }

    if (error instanceof VisionRateLimitError) {
      return c.json(
        {
          error: error.name,
          message: YARN_SLIP_SCAN_MESSAGES.VISION_RATE_LIMIT,
          details: error.details,
        },
        429,
      );
    }

    if (error instanceof VisionServiceError) {
      return c.json(
        {
          error: error.name,
          message: error.message,
          details: error.details,
        },
        error.statusCode as 500,
      );
    }

    console.error('[YarnReceiptsScanError]', error);
    return c.json(
      {
        error: 'InternalServerError',
        message: YARN_SLIP_SCAN_MESSAGES.INTERNAL_ERROR,
      },
      500,
    );
  }
});

export default router;
