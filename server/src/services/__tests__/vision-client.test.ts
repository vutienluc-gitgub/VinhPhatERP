import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import {
  VisionClientService,
  QualityGateError,
  VisionTimeoutError,
  VisionRateLimitError,
  VisionServiceError,
} from '../vision-client.service.js';

describe('VisionClientService', () => {
  const client = new VisionClientService(
    'http://127.0.0.1:8000',
    'test-internal-key',
  );

  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('parses valid 200 extraction result from Python service', async () => {
    const mockExtractionResult = {
      document: {
        document_type: 'YARN_WEIGHING_SLIP',
        supplier_raw_name: {
          value: 'CÔNG TY CP DỆT MAY ĐÔNG NAM',
          confidence: 0.99,
        },
        document_number: { value: 'PC-001', confidence: 0.99 },
        document_date: { value: '2026-09-12', confidence: 0.99 },
        vehicle_plate: { value: '59C-123.45', confidence: 0.95 },
        customer_name: { value: 'VĨNH PHÁT', confidence: 0.95 },
        notes: { value: null, confidence: 0.8 },
      },
      summary: {
        yarn_type: { value: 'CVC 40/1', confidence: 0.98 },
        yarn_lot: { value: 'LOT-1', confidence: 0.95 },
        package_count: { value: 2, confidence: 0.99 },
        cone_count: { value: 48, confidence: 0.9 },
        gross_weight_kg: { value: 1050.0, confidence: 0.99 },
        tare_weight_kg: { value: 50.0, confidence: 0.99 },
        declared_net_weight_kg: { value: 1000.0, confidence: 0.99 },
        calculated_net_weight_kg: 1000.0,
      },
      packages: [],
      math_discrepancies: [],
      needs_manual_review: false,
      review_reasons: [],
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockExtractionResult,
    } as Response);

    const result = await client.extractYarnSlip(
      Buffer.from('fake-image-bytes'),
      'slip.jpg',
      'test-trace-id',
    );

    expect(result.document.supplier_raw_name.value).toBe(
      'CÔNG TY CP DỆT MAY ĐÔNG NAM',
    );
    expect(result.summary.declared_net_weight_kg.value).toBe(1000.0);
    expect(result.needs_manual_review).toBe(false);
  });

  it('maps HTTP 422 to QualityGateError with user guidance', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 422,
      json: async () => ({
        error: 'QualityGateRejectedException',
        message: 'Image failed Quality Gate 0: Ảnh bị mờ nét',
        details: {
          blur_score: 45.2,
          user_guidance:
            'Vui lòng chụp lại ảnh với đủ ánh sáng, giữ chắc tay để không bị nhòe nét cân.',
        },
      }),
    } as Response);

    await expect(
      client.extractYarnSlip(Buffer.from('blurred-image')),
    ).rejects.toThrow(QualityGateError);
  });

  it('maps HTTP 504 to VisionTimeoutError', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 504,
      json: async () => ({
        error: 'VisionProviderTimeoutException',
        message: 'Gemini API request timed out after 30s',
      }),
    } as Response);

    await expect(
      client.extractYarnSlip(Buffer.from('timeout-image')),
    ).rejects.toThrow(VisionTimeoutError);
  });

  it('maps HTTP 429 to VisionRateLimitError', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 429,
      json: async () => ({
        error: 'VisionProviderRateLimitException',
        message: 'Gemini API rate limit exceeded',
      }),
    } as Response);

    await expect(
      client.extractYarnSlip(Buffer.from('rate-limit-image')),
    ).rejects.toThrow(VisionRateLimitError);
  });

  it('throws VisionServiceError with 503 when network connection fails', async () => {
    global.fetch = vi
      .fn()
      .mockRejectedValue(new Error('ECONNREFUSED 127.0.0.1:8000'));

    await expect(client.extractYarnSlip(Buffer.from('image'))).rejects.toThrow(
      VisionServiceError,
    );
  });
});
