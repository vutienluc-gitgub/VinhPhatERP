import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import * as api from '@/api/yarn-receipts.api';
import type { YarnSlipScanResponse } from '@/api/yarn-receipts.api';
import { YarnSlipScanWorkspace } from '@/features/yarn-receipts/components/YarnSlipScanWorkspace';
import { SCAN_WORKSPACE_LABELS } from '@/features/yarn-receipts/yarn-slip-scan.constants';

describe('YarnSlipScanWorkspace', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.restoreAllMocks();
    global.URL.createObjectURL = vi.fn(() => 'blob:http://localhost/mock-url');
    global.URL.revokeObjectURL = vi.fn();

    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    let modalRoot = document.getElementById('modal-root');
    if (!modalRoot) {
      modalRoot = document.createElement('div');
      modalRoot.setAttribute('id', 'modal-root');
      document.body.appendChild(modalRoot);
    }
  });

  const renderWithClient = (ui: React.ReactElement) =>
    render(
      <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>,
    );

  const mockResponse: YarnSlipScanResponse = {
    job_id: 'test-trace-id-12345',
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

  it('renders initial upload screen with dropzone and action buttons', () => {
    renderWithClient(
      <YarnSlipScanWorkspace open={true} onClose={vi.fn()} onApply={vi.fn()} />,
    );

    expect(
      screen.getByText(SCAN_WORKSPACE_LABELS.UPLOAD_HEADING),
    ).toBeInTheDocument();
    expect(
      screen.getByText(SCAN_WORKSPACE_LABELS.DROPZONE_PROMPT),
    ).toBeInTheDocument();
    expect(
      screen.getByText(SCAN_WORKSPACE_LABELS.BTN_TAKE_PHOTO),
    ).toBeInTheDocument();
    expect(
      screen.getByText(SCAN_WORKSPACE_LABELS.BTN_CHOOSE_FILE),
    ).toBeInTheDocument();
  });

  it('renders audited data and handles apply when file is uploaded and processed', async () => {
    vi.spyOn(api, 'scanYarnSlip').mockResolvedValue(mockResponse);
    const onApply = vi.fn();
    const onClose = vi.fn();

    renderWithClient(
      <YarnSlipScanWorkspace open={true} onClose={onClose} onApply={onApply} />,
    );

    const fileInput = document.querySelector(
      'input[type="file"][accept="image/jpeg,image/png,image/webp"]',
    ) as HTMLInputElement;
    expect(fileInput).toBeInTheDocument();

    const file = new File(['fake-image'], 'phieu_can.jpg', {
      type: 'image/jpeg',
    });
    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(
        screen.getByText(SCAN_WORKSPACE_LABELS.STATUS_PASSED),
      ).toBeInTheDocument();
    });

    expect(screen.getByText('PC-2026-09-001')).toBeInTheDocument();
    expect(screen.getByText('CVC 40/1')).toBeInTheDocument();
    expect(screen.getByText('LOT-99')).toBeInTheDocument();

    const applyButton = screen.getByText(
      SCAN_WORKSPACE_LABELS.BTN_EDIT_IN_FORM,
    );
    fireEvent.click(applyButton);

    expect(onApply).toHaveBeenCalledWith(
      expect.objectContaining({
        receiptNumber: 'PC-2026-09-001',
        supplierId: '00000000-0000-0000-0000-000000000001',
        receiptDate: '2026-09-12',
      }),
    );
    expect(onClose).toHaveBeenCalled();
  });
});
