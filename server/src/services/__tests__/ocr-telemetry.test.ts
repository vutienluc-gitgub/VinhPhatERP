import { describe, it, expect, beforeEach } from 'vitest';

import { OcrTelemetryService } from '../ocr-telemetry.service.js';

describe('OcrTelemetryService', () => {
  let telemetry: OcrTelemetryService;

  beforeEach(() => {
    telemetry = new OcrTelemetryService(100);
  });

  it('returns zeroed summary when no events have been recorded', () => {
    const summary = telemetry.getSummary();
    expect(summary.totalScans).toBe(0);
    expect(summary.autoApprovedCount).toBe(0);
    expect(summary.autoApprovalRatePct).toBe(0);
    expect(summary.latencyMs.avg).toBe(0);
    expect(summary.latestScans).toHaveLength(0);
  });

  it('correctly tracks auto-approved and manual review scans', () => {
    // 1. Auto-approved scan
    telemetry.recordScan({
      jobId: 'job-1',
      durationMs: 400,
      needsManualReview: false,
      reviewReasons: [],
      supplierMatched: true,
      supplierConfidence: 0.98,
      isDuplicate: false,
      mathDiscrepancy: false,
      packageCount: 15,
    });

    // 2. Scan with math discrepancy
    telemetry.recordScan({
      jobId: 'job-2',
      durationMs: 600,
      needsManualReview: true,
      reviewReasons: ['MATH_NET_WEIGHT_MISMATCH'],
      supplierMatched: true,
      supplierConfidence: 0.95,
      isDuplicate: false,
      mathDiscrepancy: true,
      packageCount: 10,
    });

    // 3. Duplicate scan
    telemetry.recordScan({
      jobId: 'job-3',
      durationMs: 200,
      needsManualReview: true,
      reviewReasons: ['DUPLICATE_IMAGE_HASH'],
      supplierMatched: false,
      isDuplicate: true,
      duplicateType: 'IMAGE_HASH',
      mathDiscrepancy: false,
      packageCount: 0,
    });

    const summary = telemetry.getSummary();
    expect(summary.totalScans).toBe(3);
    expect(summary.autoApprovedCount).toBe(1);
    expect(summary.manualReviewCount).toBe(2);
    expect(summary.duplicateCount).toBe(1);
    expect(summary.mathDiscrepancyCount).toBe(1);
    expect(summary.autoApprovalRatePct).toBe(33.3);

    // Latencies: 200, 400, 600 -> avg = 400
    expect(summary.latencyMs.avg).toBe(400);
    expect(summary.latencyMs.p50).toBe(400);

    // Review reason distribution
    expect(summary.reviewReasonDistribution['MATH_NET_WEIGHT_MISMATCH']).toBe(
      1,
    );
    expect(summary.reviewReasonDistribution['DUPLICATE_IMAGE_HASH']).toBe(1);

    // Latest scans order (most recent first)
    expect(summary.latestScans).toHaveLength(3);
    expect(summary.latestScans[0].jobId).toBe('job-3');
    expect(summary.latestScans[0].status).toBe('DUPLICATE');
    expect(summary.latestScans[1].jobId).toBe('job-2');
    expect(summary.latestScans[1].status).toBe('NEEDS_REVIEW');
    expect(summary.latestScans[2].jobId).toBe('job-1');
    expect(summary.latestScans[2].status).toBe('AUTO_APPROVED');
  });

  it('filters summary by timeframe in minutes', () => {
    const now = Date.now();

    // Old scan (2 hours ago)
    telemetry.recordScan({
      jobId: 'old-job',
      timestamp: now - 120 * 60 * 1000,
      durationMs: 300,
      needsManualReview: false,
      reviewReasons: [],
      supplierMatched: true,
      isDuplicate: false,
      mathDiscrepancy: false,
      packageCount: 5,
    });

    // Recent scan (5 mins ago)
    telemetry.recordScan({
      jobId: 'recent-job',
      timestamp: now - 5 * 60 * 1000,
      durationMs: 350,
      needsManualReview: false,
      reviewReasons: [],
      supplierMatched: true,
      isDuplicate: false,
      mathDiscrepancy: false,
      packageCount: 5,
    });

    const allSummary = telemetry.getSummary();
    expect(allSummary.totalScans).toBe(2);

    const recentSummary = telemetry.getSummary(30); // within last 30 minutes
    expect(recentSummary.totalScans).toBe(1);
    expect(recentSummary.latestScans[0].jobId).toBe('recent-job');
  });

  it('caps buffer size to maxHistory', () => {
    const bounded = new OcrTelemetryService(3);
    for (let i = 1; i <= 5; i++) {
      bounded.recordScan({
        jobId: `job-${i}`,
        durationMs: 100 * i,
        needsManualReview: false,
        reviewReasons: [],
        supplierMatched: true,
        isDuplicate: false,
        mathDiscrepancy: false,
        packageCount: 1,
      });
    }

    const summary = bounded.getSummary();
    expect(summary.totalScans).toBe(3);
    // Jobs 1 and 2 should have been shifted out
    const jobIds = summary.latestScans.map((s) => s.jobId);
    expect(jobIds).toEqual(['job-5', 'job-4', 'job-3']);
  });
});
