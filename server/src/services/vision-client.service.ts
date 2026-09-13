/**
 * Vision Client Service (TypeScript BFF -> Python Vision Microservice)
 * Handles secure communication with the internal Python Vision service running at :8000.
 */

export interface FieldValue<T> {
  value: T | null;
  confidence: number;
  raw_text?: string | null;
  provenance?: string | null;
}

export interface DocumentHeaderDTO {
  document_type: string;
  supplier_raw_name: FieldValue<string>;
  document_number: FieldValue<string>;
  document_date: FieldValue<string>;
  vehicle_plate: FieldValue<string>;
  customer_name: FieldValue<string>;
  notes: FieldValue<string>;
}

export interface SummaryDTO {
  yarn_type: FieldValue<string>;
  yarn_lot: FieldValue<string>;
  package_count: FieldValue<number>;
  cone_count: FieldValue<number>;
  gross_weight_kg: FieldValue<number>;
  tare_weight_kg: FieldValue<number>;
  declared_net_weight_kg: FieldValue<number>;
  calculated_net_weight_kg?: number | null;
}

export interface PackageItemDTO {
  package_index: number;
  package_code?: string | null;
  item_type: string;
  cone_count?: number | null;
  gross_kg?: number | null;
  tare_kg?: number | null;
  net_kg: number;
  confidence: number;
  is_outlier: boolean;
  notes?: string | null;
}

export interface MathDiscrepancy {
  level: string;
  rule_name: string;
  severity: 'ERROR' | 'WARNING';
  expected: number;
  actual: number;
  diff: number;
  tolerance: number;
  message_vi: string;
  debug_prompt: string;
}

export interface QualityMetricsDTO {
  blur_score: number;
  brightness_mean: number;
  deskew_angle_degrees: number;
  passed_gate_0: boolean;
  warnings: string[];
}

export interface EngineTelemetryDTO {
  engine: string;
  model_version?: string | null;
  processing_duration_ms: number;
  correction_attempts: number;
  quality_metrics?: QualityMetricsDTO | null;
}

export interface ExtractionResultDTO {
  document: DocumentHeaderDTO;
  summary: SummaryDTO;
  packages: PackageItemDTO[];
  math_discrepancies: MathDiscrepancy[];
  needs_manual_review: boolean;
  review_reasons: string[];
  engine_telemetry?: EngineTelemetryDTO | null;
}

export class VisionServiceError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly details: Record<string, unknown> = {},
  ) {
    super(message);
    this.name = 'VisionServiceError';
  }
}

export class QualityGateError extends VisionServiceError {
  constructor(message: string, details: Record<string, unknown> = {}) {
    super(message, 422, details);
    this.name = 'QualityGateError';
  }
}

export class VisionTimeoutError extends VisionServiceError {
  constructor(message: string, details: Record<string, unknown> = {}) {
    super(message, 504, details);
    this.name = 'VisionTimeoutError';
  }
}

export class VisionRateLimitError extends VisionServiceError {
  constructor(message: string, details: Record<string, unknown> = {}) {
    super(message, 429, details);
    this.name = 'VisionRateLimitError';
  }
}

export class VisionClientService {
  private readonly baseUrl: string;
  private readonly serviceKey: string;

  constructor(baseUrl?: string, serviceKey?: string) {
    this.baseUrl = (
      baseUrl ??
      process.env.INTERNAL_VISION_SERVICE_URL ??
      'http://127.0.0.1:8000'
    ).replace(/\/$/, '');
    this.serviceKey =
      serviceKey ??
      process.env.INTERNAL_VISION_SERVICE_KEY ??
      'dev-vinhphat-secret-key-change-in-prod';
  }

  /**
   * Sends image to Python Vision Microservice and returns parsed ExtractionResultDTO.
   */
  async extractYarnSlip(
    imageBytes: Uint8Array | Buffer,
    filename: string = 'yarn_slip.jpg',
    correlationId?: string,
    mimeType: string = 'image/jpeg',
  ): Promise<ExtractionResultDTO> {
    const traceId = correlationId || crypto.randomUUID();
    const endpoint = `${this.baseUrl}/internal/v1/vision/yarn-slip`;

    const blob = new Blob([imageBytes], { type: mimeType });
    const formData = new FormData();
    formData.append('file', blob, filename);

    let response: Response;
    try {
      response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'X-Internal-Service-Key': this.serviceKey,
          'X-Correlation-ID': traceId,
        },
        body: formData,
      });
    } catch (networkError) {
      throw new VisionServiceError(
        `Failed to connect to Vision Microservice at ${this.baseUrl}: ${
          networkError instanceof Error
            ? networkError.message
            : String(networkError)
        }`,
        503,
      );
    }

    if (!response.ok) {
      let errorData: {
        error?: string;
        message?: string;
        details?: Record<string, unknown>;
      } = {};
      try {
        errorData = (await response.json()) as {
          error?: string;
          message?: string;
          details?: Record<string, unknown>;
        };
      } catch {
        errorData = { message: await response.text() };
      }

      const errorMessage =
        errorData.message ||
        `Vision microservice returned HTTP ${response.status}`;
      const details = errorData.details || {};

      switch (response.status) {
        case 422:
          throw new QualityGateError(errorMessage, details);
        case 504:
          throw new VisionTimeoutError(errorMessage, details);
        case 429:
          throw new VisionRateLimitError(errorMessage, details);
        default:
          throw new VisionServiceError(errorMessage, response.status, details);
      }
    }

    const result = (await response.json()) as ExtractionResultDTO;
    return result;
  }
}

export const visionClient = new VisionClientService();
