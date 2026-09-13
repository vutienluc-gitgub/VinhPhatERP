import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

import * as api from '@/api/yarn-receipts.api';
import type { YarnSlipScanResponse } from '@/api/yarn-receipts.api';
import { useYarnSlipScan } from '@/features/yarn-receipts/hooks/useYarnSlipScan';

describe('useYarnSlipScan', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    global.URL.createObjectURL = vi.fn(() => 'blob:http://localhost/mock-url');
    global.URL.revokeObjectURL = vi.fn();
  });

  const mockResponse: YarnSlipScanResponse = {
    job_id: 'test-trace-id',
    status: 'EXTRACTED',
    extraction: {
      document: {
        document_type: 'YARN_WEIGHING_SLIP',
        supplier_raw_name: {
          value: 'CÔNG TY CP DỆT MAY ĐÔNG NAM',
          confidence: 0.98,
        },
        document_number: { value: 'PC-2026-09-001', confidence: 0.99 },
        document_date: { value: '2026-09-12', confidence: 0.99 },
        vehicle_plate: { value: '59C-123.45', confidence: 0.92 },
        customer_name: { value: 'VĨNH PHÁT', confidence: 0.95 },
        notes: { value: 'Giao đợt 1', confidence: 0.85 },
      },
      summary: {
        yarn_type: { value: 'CVC 40/1', confidence: 0.96 },
        yarn_lot: { value: 'LOT-99', confidence: 0.94 },
        package_count: { value: 10, confidence: 0.98 },
        cone_count: { value: 240, confidence: 0.95 },
        gross_weight_kg: { value: 1050.0, confidence: 0.99 },
        tare_weight_kg: { value: 50.0, confidence: 0.99 },
        declared_net_weight_kg: { value: 1000.0, confidence: 0.99 },
        calculated_net_weight_kg: 1000.0,
      },
      packages: [],
      math_discrepancies: [],
      needs_manual_review: false,
      review_reasons: [],
    },
    supplier_match: {
      rawName: 'CÔNG TY CP DỆT MAY ĐÔNG NAM',
      matchedSupplierId: '00000000-0000-0000-0000-000000000001',
      matchedSupplierName: 'Công Ty Cổ Phần Dệt May Đông Nam',
      matchedSupplierCode: 'DONGNAM',
      confidence: 0.99,
      ambiguous: false,
      candidates: [],
    },
    duplicate_guard: {
      isDuplicate: false,
      imageHash: 'abcdef1234567890',
    },
    suggested_receipt: {
      supplier_id: '00000000-0000-0000-0000-000000000001',
      supplier_name: 'Công Ty Cổ Phần Dệt May Đông Nam',
      receipt_number: 'PC-2026-09-001',
      receipt_date: '2026-09-12',
      vehicle_info: '59C-123.45',
      notes: 'Giao đợt 1',
      yarn_type: 'CVC 40/1',
      yarn_lot: 'LOT-99',
      gross_weight_kg: 1050.0,
      tare_weight_kg: 50.0,
      declared_net_weight_kg: 1000.0,
      package_count: 10,
      cone_count: 240,
    },
    validation: {
      passed: true,
      needs_manual_review: false,
      reasons: [],
    },
  };

  it('initializes with default empty state', () => {
    const { result } = renderHook(() => useYarnSlipScan());

    expect(result.current.selectedFile).toBeNull();
    expect(result.current.previewUrl).toBeNull();
    expect(result.current.isScanning).toBe(false);
    expect(result.current.scanResponse).toBeNull();
    expect(result.current.error).toBeNull();
    expect(result.current.zoomLevel).toBe(1);
    expect(result.current.activeTab).toBe('data');
  });

  it('rejects unsupported file mime types', async () => {
    const { result } = renderHook(() => useYarnSlipScan());
    const invalidFile = new File(['text'], 'slip.txt', { type: 'text/plain' });

    await act(async () => {
      await result.current.handleFileSelect(invalidFile);
    });

    expect(result.current.error).toContain('Định dạng tệp không được hỗ trợ');
    expect(result.current.selectedFile).toBeNull();
  });

  it('handles successful scan flow and invokes callback', async () => {
    const onComplete = vi.fn();
    vi.spyOn(api, 'scanYarnSlip').mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useYarnSlipScan(onComplete));
    const validFile = new File(['fake-image'], 'slip.jpg', {
      type: 'image/jpeg',
    });

    await act(async () => {
      await result.current.handleFileSelect(validFile);
    });

    expect(result.current.error).toBeNull();
    expect(result.current.isScanning).toBe(false);
    expect(result.current.scanResponse).toEqual(mockResponse);
    expect(onComplete).toHaveBeenCalledWith(mockResponse);
  });

  it('handles scan error gracefully without crashing', async () => {
    vi.spyOn(api, 'scanYarnSlip').mockRejectedValue(
      new Error('Ảnh quá mờ nét không thể nhận diện'),
    );

    const { result } = renderHook(() => useYarnSlipScan());
    const validFile = new File(['fake-image'], 'slip.jpg', {
      type: 'image/jpeg',
    });

    await act(async () => {
      await result.current.handleFileSelect(validFile);
    });

    expect(result.current.isScanning).toBe(false);
    expect(result.current.error).toBe('Ảnh quá mờ nét không thể nhận diện');
    expect(result.current.scanResponse).toBeNull();
  });

  it('supports zoom level manipulation and reset', () => {
    const { result } = renderHook(() => useYarnSlipScan());

    act(() => {
      result.current.zoomIn();
    });
    expect(result.current.zoomLevel).toBe(1.25);

    act(() => {
      result.current.zoomOut();
    });
    expect(result.current.zoomLevel).toBe(1);

    act(() => {
      result.current.zoomIn();
      result.current.zoomIn();
      result.current.resetZoom();
    });
    expect(result.current.zoomLevel).toBe(1);
  });
});
