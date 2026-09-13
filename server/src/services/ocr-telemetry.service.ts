/**
 * OCR Telemetry Service
 * Tracks scan operations, performance latency, auto-approval rates,
 * and error distribution for AI Yarn Weighing Slip OCR.
 */

export interface OcrScanTelemetryEvent {
  jobId: string;
  timestamp?: number;
  durationMs: number;
  visionDurationMs?: number;
  needsManualReview: boolean;
  reviewReasons: string[];
  supplierMatched: boolean;
  supplierConfidence?: number;
  isDuplicate: boolean;
  duplicateType?: 'IMAGE_HASH' | 'DOCUMENT_SIGNATURE';
  mathDiscrepancy: boolean;
  packageCount: number;
}

export interface OcrLatencyMetrics {
  avg: number;
  p50: number;
  p90: number;
  p95: number;
}

export interface OcrTelemetrySummary {
  totalScans: number;
  autoApprovedCount: number;
  autoApprovalRatePct: number;
  manualReviewCount: number;
  duplicateCount: number;
  mathDiscrepancyCount: number;
  latencyMs: OcrLatencyMetrics;
  reviewReasonDistribution: Record<string, number>;
  latestScans: Array<{
    jobId: string;
    timestamp: number;
    durationMs: number;
    status: 'AUTO_APPROVED' | 'NEEDS_REVIEW' | 'DUPLICATE';
    reasons: string[];
  }>;
}

const MAX_EVENT_HISTORY = 1000;

export class OcrTelemetryService {
  private events: OcrScanTelemetryEvent[] = [];
  private maxHistory: number;

  constructor(maxHistory: number = MAX_EVENT_HISTORY) {
    this.maxHistory = maxHistory;
  }

  /**
   * Records an OCR scan event into memory buffer.
   */
  recordScan(event: OcrScanTelemetryEvent): void {
    const fullEvent: OcrScanTelemetryEvent = {
      ...event,
      timestamp: event.timestamp ?? Date.now(),
    };

    if (this.events.length >= this.maxHistory) {
      this.events.shift();
    }

    this.events.push(fullEvent);
  }

  /**
   * Computes a summary of OCR operations.
   * @param timeframeMinutes Optional filter for events within the last N minutes.
   */
  getSummary(timeframeMinutes?: number): OcrTelemetrySummary {
    const now = Date.now();
    const filteredEvents = timeframeMinutes
      ? this.events.filter(
          (e) => now - (e.timestamp ?? 0) <= timeframeMinutes * 60 * 1000,
        )
      : this.events;

    const totalScans = filteredEvents.length;
    if (totalScans === 0) {
      return {
        totalScans: 0,
        autoApprovedCount: 0,
        autoApprovalRatePct: 0,
        manualReviewCount: 0,
        duplicateCount: 0,
        mathDiscrepancyCount: 0,
        latencyMs: { avg: 0, p50: 0, p90: 0, p95: 0 },
        reviewReasonDistribution: {},
        latestScans: [],
      };
    }

    let autoApprovedCount = 0;
    let manualReviewCount = 0;
    let duplicateCount = 0;
    let mathDiscrepancyCount = 0;
    const durations: number[] = [];
    const reasonDistribution: Record<string, number> = {};

    for (const evt of filteredEvents) {
      durations.push(evt.durationMs);

      if (evt.isDuplicate) {
        duplicateCount += 1;
      }
      if (evt.mathDiscrepancy) {
        mathDiscrepancyCount += 1;
      }

      if (!evt.needsManualReview && !evt.isDuplicate) {
        autoApprovedCount += 1;
      } else {
        manualReviewCount += 1;
      }

      for (const reason of evt.reviewReasons) {
        reasonDistribution[reason] = (reasonDistribution[reason] ?? 0) + 1;
      }
    }

    durations.sort((a, b) => a - b);
    const sumDuration = durations.reduce((acc, val) => acc + val, 0);
    const avgLatency = Math.round(sumDuration / totalScans);
    const p50 = this.getPercentile(durations, 50);
    const p90 = this.getPercentile(durations, 90);
    const p95 = this.getPercentile(durations, 95);

    const autoApprovalRatePct =
      Math.round((autoApprovedCount / totalScans) * 1000) / 10;

    const latestScans = filteredEvents
      .slice(-10)
      .reverse()
      .map((evt) => {
        let status: 'AUTO_APPROVED' | 'NEEDS_REVIEW' | 'DUPLICATE' =
          'AUTO_APPROVED';
        if (evt.isDuplicate) {
          status = 'DUPLICATE';
        } else if (evt.needsManualReview) {
          status = 'NEEDS_REVIEW';
        }
        return {
          jobId: evt.jobId,
          timestamp: evt.timestamp ?? now,
          durationMs: evt.durationMs,
          status,
          reasons: evt.reviewReasons,
        };
      });

    return {
      totalScans,
      autoApprovedCount,
      autoApprovalRatePct,
      manualReviewCount,
      duplicateCount,
      mathDiscrepancyCount,
      latencyMs: {
        avg: avgLatency,
        p50,
        p90,
        p95,
      },
      reviewReasonDistribution: reasonDistribution,
      latestScans,
    };
  }

  /**
   * Resets all recorded events (for tests or maintenance).
   */
  reset(): void {
    this.events = [];
  }

  private getPercentile(sorted: number[], percentile: number): number {
    if (sorted.length === 0) return 0;
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[Math.max(0, Math.min(index, sorted.length - 1))] ?? 0;
  }
}

export const ocrTelemetry = new OcrTelemetryService();
