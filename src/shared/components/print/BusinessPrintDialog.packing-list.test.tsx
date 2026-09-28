import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { FabricRollPackingItem } from '@/domain/inventory/packing-list.types';
import { BusinessPrintDialog } from '@/shared/components/print/BusinessPrintDialog';
import { printPackingList } from '@/shared/services/print/packing-list';

vi.mock('@/shared/services/print/packing-list', async (importOriginal) => {
  const actual =
    await importOriginal<
      typeof import('@/shared/services/print/packing-list')
    >();
  return { ...actual, printPackingList: vi.fn() };
});

const rolls: FabricRollPackingItem[] = [
  {
    id: 'roll-1',
    roll_code: 'VP-MT-01',
    roll_sequence: 1,
    weight_kg: 23.5,
    fabric_type: 'Vảy cá',
    color_name: 'Muối Tiêu',
    grade: 'grade_a',
    checked: true,
  },
  {
    id: 'roll-2',
    roll_code: 'VP-MT-02',
    roll_sequence: 2,
    weight_kg: 24.5,
    fabric_type: 'Vảy cá',
    color_name: 'Muối Tiêu',
    grade: 'grade_a',
    checked: false,
  },
];

function renderDialog() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <BusinessPrintDialog
        isOpen
        onClose={vi.fn()}
        documentType="packing_list"
        documentId="PKL-2026-09-27"
        customTitle="Bảng kê danh sách cây vải (Packing List)"
        packingRolls={rolls}
      />
    </QueryClientProvider>,
  );
}

describe('BusinessPrintDialog — packing_list via Print Registry', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('renders the packing_list template resolved from the print registry', async () => {
    renderDialog();

    await waitFor(() => {
      expect(screen.getByText(/Bảng kê danh sách cây vải/)).toBeInTheDocument();
    });

    expect(screen.getByText(/Loại:/).textContent).toContain('packing_list');
    expect(screen.getByText(/Số chứng từ:/).textContent).toContain(
      'PKL-2026-09-27',
    );
    expect(screen.getByText(/Mẫu in đang áp dụng:/).textContent).toContain(
      'Bảng Kê Cây Vải A5 Ngang',
    );
    expect(screen.getByText('In Ngay (Print)')).toBeInTheDocument();
  });

  it('previews the actual rolls through the shared matrix preview', async () => {
    renderDialog();

    await waitFor(() => {
      expect(
        screen.getByRole('cell', { name: /Cây VP-MT-01, 23\.5 kg/ }),
      ).toBeInTheDocument();
    });
    expect(
      screen.getByRole('cell', { name: /Cây VP-MT-02, 24\.5 kg/ }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Tổng xuất:/)).toBeInTheDocument();
    expect(screen.getByText('Đơn vị nhận hàng:')).toBeInTheDocument();
  });

  it('prints the rolls for the packing_list document type when executing print', async () => {
    renderDialog();

    const printButton = await screen.findByText('In Ngay (Print)');
    fireEvent.click(printButton);

    await waitFor(() => {
      expect(printPackingList).toHaveBeenCalledTimes(1);
    });
    expect(printPackingList).toHaveBeenCalledWith(
      rolls,
      expect.objectContaining({ documentNumber: 'PKL-2026-09-27' }),
    );
  });
});
