/**
 * Yarn Slip Form Pre-fill Adapter
 * Maps YarnSlipScanResponse from Vision & Business verification into YarnReceiptsFormValues.
 * Integrates Catalog Matcher for automated inventory tracking (v_yarn_availability).
 */

import type {
  YarnCatalogOption,
  YarnSlipScanResponse,
} from '@/api/yarn-receipts.api';
import { DEFAULT_YARN_TYPE } from '@/features/yarn-receipts/yarn-receipts.constants';
import type { YarnReceiptsFormValues } from '@/schema/yarn-receipt.schema';
import { emptyYarnReceiptItem } from '@/schema/yarn-receipt.schema';
import {
  normalizeSearchString,
  stringSimilarityRatio,
  tokenSetRatio,
} from '@/shared/utils/string-similarity.util';

export interface YarnCatalogMatchResult {
  matchedCatalogId: string | null;
  matchedCatalogName: string | null;
  matchedCatalogCode: string | null;
  confidence: number;
  ambiguous: boolean;
}

export interface MapScanOptions {
  catalogs?: YarnCatalogOption[];
  breakdownByPackages?: boolean;
}

/**
 * Matches extracted yarn_type text against active yarn catalog options.
 * Uses token-set ratio and normalized search comparison.
 */
export function matchYarnCatalog(
  rawYarnType: string | null | undefined,
  catalogs: YarnCatalogOption[],
): YarnCatalogMatchResult {
  if (!rawYarnType || !rawYarnType.trim() || catalogs.length === 0) {
    return {
      matchedCatalogId: null,
      matchedCatalogName: null,
      matchedCatalogCode: null,
      confidence: 0,
      ambiguous: true,
    };
  }

  const queryNorm = normalizeSearchString(rawYarnType);

  let bestMatch: YarnCatalogOption | null = null;
  let highestScore = 0;
  let secondScore = 0;

  for (const cat of catalogs) {
    const codeNorm = normalizeSearchString(cat.code);
    const nameNorm = normalizeSearchString(cat.name);

    // Exact matches
    if (queryNorm === codeNorm || queryNorm === nameNorm) {
      return {
        matchedCatalogId: cat.id,
        matchedCatalogName: cat.name,
        matchedCatalogCode: cat.code,
        confidence: 1.0,
        ambiguous: false,
      };
    }

    // Similarity on code & name
    const codeScore = stringSimilarityRatio(queryNorm, codeNorm);
    const nameScore = tokenSetRatio(queryNorm, nameNorm);
    const score = Math.max(codeScore, nameScore);

    if (score > highestScore) {
      secondScore = highestScore;
      highestScore = score;
      bestMatch = cat;
    } else if (score > secondScore) {
      secondScore = score;
    }
  }

  const roundedConfidence = Math.round(highestScore * 100) / 100;
  const isSeparated = highestScore - secondScore >= 0.12;

  if (highestScore >= 0.8 && isSeparated && bestMatch) {
    return {
      matchedCatalogId: bestMatch.id,
      matchedCatalogName: bestMatch.name,
      matchedCatalogCode: bestMatch.code,
      confidence: roundedConfidence,
      ambiguous: false,
    };
  }

  if (highestScore >= 0.65 && bestMatch) {
    return {
      matchedCatalogId: bestMatch.id,
      matchedCatalogName: bestMatch.name,
      matchedCatalogCode: bestMatch.code,
      confidence: roundedConfidence,
      ambiguous: true,
    };
  }

  return {
    matchedCatalogId: null,
    matchedCatalogName: null,
    matchedCatalogCode: null,
    confidence: roundedConfidence,
    ambiguous: true,
  };
}

export function mapScanResultToFormValues(
  scanResponse: YarnSlipScanResponse,
  options?: MapScanOptions,
): Partial<YarnReceiptsFormValues> {
  const suggestedReceipt = scanResponse.suggested_receipt;
  const rawYarnType = suggestedReceipt.yarn_type?.trim() || DEFAULT_YARN_TYPE;
  const lotNumber = suggestedReceipt.yarn_lot?.trim() || '';
  const totalNet = suggestedReceipt.declared_net_weight_kg || 0;
  const grossWeight = suggestedReceipt.gross_weight_kg || null;
  const boxCount = suggestedReceipt.package_count || null;
  const coneCount = suggestedReceipt.cone_count || null;

  const conesPerBox =
    boxCount && coneCount && boxCount > 0
      ? Math.round(coneCount / boxCount)
      : null;

  // Catalog match
  const catalogMatch = options?.catalogs
    ? matchYarnCatalog(rawYarnType, options.catalogs)
    : null;
  const resolvedCatalogId = catalogMatch?.matchedCatalogId || '';

  // Mode 1: Breakdown by individual packages if present and requested
  const packages = scanResponse.extraction.packages;
  if (options?.breakdownByPackages && packages && packages.length > 0) {
    const items = packages.map((pkg, idx) => ({
      ...emptyYarnReceiptItem,
      yarnType: rawYarnType,
      yarnCatalogId: resolvedCatalogId,
      lotNumber,
      quantity: pkg.net_kg,
      netWeight: pkg.net_kg,
      grossWeight: pkg.gross_kg ?? null,
      boxNo: pkg.package_code || String(pkg.package_index || idx + 1),
      boxCount: 1,
      conesPerBox: pkg.cone_count ?? conesPerBox,
      notes: pkg.notes || suggestedReceipt.notes || '',
    }));

    return {
      supplierId: suggestedReceipt.supplier_id || '',
      receiptNumber: suggestedReceipt.receipt_number || '',
      receiptDate:
        suggestedReceipt.receipt_date || new Date().toISOString().slice(0, 10),
      vehicleInfo: suggestedReceipt.vehicle_info || '',
      notes: suggestedReceipt.notes || '',
      items,
    };
  }

  // Mode 2: Aggregated summary row
  const primaryItem = {
    ...emptyYarnReceiptItem,
    yarnType: rawYarnType,
    yarnCatalogId: resolvedCatalogId,
    lotNumber,
    quantity: totalNet,
    netWeight: totalNet > 0 ? totalNet : null,
    grossWeight,
    boxCount,
    conesPerBox,
    notes: suggestedReceipt.notes || '',
  };

  return {
    supplierId: suggestedReceipt.supplier_id || '',
    receiptNumber: suggestedReceipt.receipt_number || '',
    receiptDate:
      suggestedReceipt.receipt_date || new Date().toISOString().slice(0, 10),
    vehicleInfo: suggestedReceipt.vehicle_info || '',
    notes: suggestedReceipt.notes || '',
    items: [primaryItem],
  };
}
