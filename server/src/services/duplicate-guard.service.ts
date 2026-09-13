/**
 * Duplicate Document Guard (Tier 3 Business Validation)
 * Prevents double-entry and fraud via:
 * 1. Image SHA-256 hash check
 * 2. Document Signature query: (supplier_id, document_number, document_date)
 */

import crypto from 'node:crypto';

import { and, eq, or, ilike } from 'drizzle-orm';

import { YARN_SLIP_SCAN_MESSAGES } from '../constants/yarn-receipts.constants.js';
import { db } from '../db/client.js';
import { yarnReceipts } from '../db/schema/index.js';

export interface DuplicateCheckParams {
  imageBytes: Uint8Array | Buffer;
  supplierId?: string | null;
  documentNumber?: string | null;
  documentDate?: string | null;
}

export interface DuplicateCheckResult {
  isDuplicate: boolean;
  imageHash: string;
  duplicateType?: 'IMAGE_HASH' | 'DOCUMENT_SIGNATURE';
  existingReceiptId?: string;
  warningMessage?: string;
}

export interface ImageHashRecord {
  hash: string;
  recordedAt: number;
  receiptNumber?: string;
  supplierId?: string;
}

const DEFAULT_HASH_RETENTION_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
const MAX_HASH_CACHE_SIZE = 10000;

export class DuplicateGuardService {
  private imageHashCache = new Map<string, ImageHashRecord>();
  private retentionMs = DEFAULT_HASH_RETENTION_MS;

  constructor(retentionMs: number = DEFAULT_HASH_RETENTION_MS) {
    this.retentionMs = retentionMs;
  }

  /**
   * Computes SHA-256 hash of an image buffer.
   */
  computeImageHash(imageBytes: Uint8Array | Buffer): string {
    return crypto.createHash('sha256').update(imageBytes).digest('hex');
  }

  /**
   * Records an image hash into the history cache.
   */
  recordImageHash(
    hash: string,
    metadata?: { receiptNumber?: string; supplierId?: string },
  ): void {
    if (this.imageHashCache.size >= MAX_HASH_CACHE_SIZE) {
      // Evict oldest entry (first key in Map)
      const oldestKey = this.imageHashCache.keys().next().value;
      if (oldestKey) {
        this.imageHashCache.delete(oldestKey);
      }
    }

    this.imageHashCache.set(hash, {
      hash,
      recordedAt: Date.now(),
      receiptNumber: metadata?.receiptNumber,
      supplierId: metadata?.supplierId,
    });
  }

  /**
   * Checks database and cache for duplicates matching image hash or document signature.
   */
  async checkDuplicate(
    params: DuplicateCheckParams,
  ): Promise<DuplicateCheckResult> {
    const imageHash = this.computeImageHash(params.imageBytes);

    // 1. Check Image Hash Cache (Tier 1 fast check)
    const existingHashRecord = this.imageHashCache.get(imageHash);
    if (existingHashRecord) {
      const isExpired =
        Date.now() - existingHashRecord.recordedAt > this.retentionMs;
      if (isExpired) {
        this.imageHashCache.delete(imageHash);
      } else {
        return {
          isDuplicate: true,
          imageHash,
          duplicateType: 'IMAGE_HASH',
          warningMessage: YARN_SLIP_SCAN_MESSAGES.duplicateImageFound(
            existingHashRecord.receiptNumber,
          ),
        };
      }
    }

    const { supplierId, documentNumber, documentDate } = params;

    if (!supplierId || !documentNumber) {
      return {
        isDuplicate: false,
        imageHash,
      };
    }

    try {
      // 2. Check Document Signature: (supplier_id, receipt_number / notes, receipt_date)
      const conditions = [
        eq(yarnReceipts.supplierId, supplierId),
        or(
          eq(yarnReceipts.receiptNumber, documentNumber),
          ilike(yarnReceipts.receiptNumber, `%${documentNumber}%`),
          ilike(yarnReceipts.notes, `%${documentNumber}%`),
        ),
      ];

      if (documentDate) {
        conditions.push(eq(yarnReceipts.receiptDate, documentDate));
      }

      const [existing] = await db
        .select({
          id: yarnReceipts.id,
          receiptNumber: yarnReceipts.receiptNumber,
          receiptDate: yarnReceipts.receiptDate,
        })
        .from(yarnReceipts)
        .where(and(...conditions))
        .limit(1);

      if (existing) {
        return {
          isDuplicate: true,
          imageHash,
          duplicateType: 'DOCUMENT_SIGNATURE',
          existingReceiptId: existing.id,
          warningMessage: YARN_SLIP_SCAN_MESSAGES.duplicateFound(
            existing.receiptNumber,
            existing.receiptDate,
          ),
        };
      }

      return {
        isDuplicate: false,
        imageHash,
      };
    } catch (err) {
      console.warn(
        '[DuplicateGuard] Failed to check database duplicate signature:',
        err,
      );
      // Non-blocking degradation: return clean status with hash
      return {
        isDuplicate: false,
        imageHash,
      };
    }
  }

  /**
   * Resets the in-memory cache (for testing or cache invalidation).
   */
  clearImageHashes(): void {
    this.imageHashCache.clear();
  }

  /**
   * Returns current count of stored image hashes.
   */
  getImageHashCount(): number {
    return this.imageHashCache.size;
  }
}

export const duplicateGuard = new DuplicateGuardService();
