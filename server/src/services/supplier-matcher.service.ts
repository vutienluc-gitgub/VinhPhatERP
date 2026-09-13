/**
 * Deterministic Supplier Matcher (Tier 3 Business Validation)
 * Matches raw OCR supplier text against ERP supplier master data using:
 * 1. Normalization & Vietnamese diacritics removal
 * 2. Exact code and company alias matching
 * 3. Core brand isolation (stripping legal & generic industry noise)
 * 4. Token Set / Token Sort Ratio fuzzy matching
 * 5. Ambiguity detection & candidate ranking
 */

import { eq } from 'drizzle-orm';

import { db } from '../db/client.js';
import { suppliers } from '../db/schema/index.js';
import {
  normalizeSearchString,
  stripCompanyAffixes,
  tokenSetRatio,
  tokenSortRatio,
} from '../utils/string-similarity.js';

export interface SupplierOption {
  id: string;
  code: string;
  name: string;
}

export interface SupplierCandidate {
  id: string;
  code: string;
  name: string;
  score: number;
  matchType:
    | 'EXACT_CODE'
    | 'EXACT_NAME'
    | 'EXACT_CORE_BRAND'
    | 'FUZZY_BRAND'
    | 'FUZZY_FULL';
}

export interface SupplierMatchResult {
  rawName: string;
  matchedSupplierId: string | null;
  matchedSupplierName: string | null;
  matchedSupplierCode: string | null;
  confidence: number;
  ambiguous: boolean;
  candidates: SupplierCandidate[];
}

export class SupplierMatcherService {
  /**
   * Loads all active suppliers from the database for matching.
   */
  async getActiveSuppliers(): Promise<SupplierOption[]> {
    return await db
      .select({
        id: suppliers.id,
        code: suppliers.code,
        name: suppliers.name,
      })
      .from(suppliers)
      .where(eq(suppliers.status, 'active'));
  }

  /**
   * Evaluates raw OCR supplier name against active suppliers list.
   * Enforces the >= 92% confidence and >= 10% lead margin policy.
   */
  matchSupplier(
    rawName: string | null | undefined,
    suppliers: SupplierOption[],
  ): SupplierMatchResult {
    const raw = rawName?.trim() || '';

    if (!raw || suppliers.length === 0) {
      return {
        rawName: raw,
        matchedSupplierId: null,
        matchedSupplierName: null,
        matchedSupplierCode: null,
        confidence: 0,
        ambiguous: true,
        candidates: [],
      };
    }

    const normRaw = normalizeSearchString(raw);
    const brandRaw = stripCompanyAffixes(raw);
    const candidates: SupplierCandidate[] = [];

    for (const sup of suppliers) {
      const normSupName = normalizeSearchString(sup.name);
      const normSupCode = normalizeSearchString(sup.code);
      const brandSup = stripCompanyAffixes(sup.name);

      // 1. Exact Code Match (using word boundaries)
      if (
        normRaw === normSupCode ||
        new RegExp(`\\b${normSupCode}\\b`, 'i').test(normRaw)
      ) {
        candidates.push({
          id: sup.id,
          code: sup.code,
          name: sup.name,
          score: 1.0,
          matchType: 'EXACT_CODE',
        });
        continue;
      }

      // 2. Exact Full Name Match
      if (normRaw === normSupName) {
        candidates.push({
          id: sup.id,
          code: sup.code,
          name: sup.name,
          score: 1.0,
          matchType: 'EXACT_NAME',
        });
        continue;
      }

      // 3. Exact Core Brand Match
      if (brandRaw && brandSup && brandRaw === brandSup) {
        candidates.push({
          id: sup.id,
          code: sup.code,
          name: sup.name,
          score: 0.99,
          matchType: 'EXACT_CORE_BRAND',
        });
        continue;
      }

      // 4. Fuzzy Brand Scoring (prioritize brand name over generic company affixes)
      let bestScore = 0;
      let matchType: 'FUZZY_BRAND' | 'FUZZY_FULL' = 'FUZZY_FULL';

      if (brandRaw && brandSup) {
        const brandSortScore = tokenSortRatio(brandRaw, brandSup);
        const brandSetScore = tokenSetRatio(brandRaw, brandSup);
        const brandScore = Math.max(brandSortScore, brandSetScore);
        if (brandScore > bestScore) {
          bestScore = brandScore;
          matchType = 'FUZZY_BRAND';
        }
      }

      const fullScore = tokenSetRatio(raw, sup.name);
      if (fullScore > bestScore && (!brandRaw || !brandSup)) {
        bestScore = fullScore;
        matchType = 'FUZZY_FULL';
      }

      if (bestScore >= 0.5) {
        candidates.push({
          id: sup.id,
          code: sup.code,
          name: sup.name,
          score: Math.round(bestScore * 100) / 100,
          matchType,
        });
      }
    }

    // Sort descending by score
    candidates.sort((a, b) => b.score - a.score);

    const topCandidates = candidates.slice(0, 3);
    const first = topCandidates[0];
    const second = topCandidates[1];

    if (!first || first.score < 0.8) {
      return {
        rawName: raw,
        matchedSupplierId: null,
        matchedSupplierName: null,
        matchedSupplierCode: null,
        confidence: first ? first.score : 0,
        ambiguous: true,
        candidates: topCandidates,
      };
    }

    // If first candidate is an exact match (score >= 0.99)
    if (first.score >= 0.99) {
      const isSecondAlsoExact = second && second.score >= 0.99;
      if (!isSecondAlsoExact) {
        return {
          rawName: raw,
          matchedSupplierId: first.id,
          matchedSupplierName: first.name,
          matchedSupplierCode: first.code,
          confidence: first.score,
          ambiguous: false,
          candidates: topCandidates,
        };
      }
    }

    // Check margin between #1 and #2
    const margin = second ? first.score - second.score : 1.0;

    // High Confidence Rule: Score >= 0.92 AND Margin >= 0.10
    if (first.score >= 0.92 && margin >= 0.1) {
      return {
        rawName: raw,
        matchedSupplierId: first.id,
        matchedSupplierName: first.name,
        matchedSupplierCode: first.code,
        confidence: first.score,
        ambiguous: false,
        candidates: topCandidates,
      };
    }

    // Ambiguous Case: Top candidate score is between 80%-92% OR margin < 10%
    return {
      rawName: raw,
      matchedSupplierId: null,
      matchedSupplierName: null,
      matchedSupplierCode: null,
      confidence: first.score,
      ambiguous: true,
      candidates: topCandidates,
    };
  }
}

export const supplierMatcher = new SupplierMatcherService();
