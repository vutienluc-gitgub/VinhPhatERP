import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { useForm, type DeepPartial } from 'react-hook-form';
import { useQuery } from '@tanstack/react-query';

import type { CreateWorkOrderInput } from '@/schema/work-order.schema';

import {
  GreigePriceEstimator,
  type CostEstimationSnapshot,
} from './GreigePriceEstimator';

vi.mock('@tanstack/react-query', () => ({
  useQuery: vi.fn(),
}));

function Wrapper({
  defaultValues,
  onEstimationChange,
}: {
  defaultValues: DeepPartial<CreateWorkOrderInput>;
  onEstimationChange?: (snapshot: CostEstimationSnapshot | null) => void;
}) {
  const { control } = useForm<CreateWorkOrderInput>({ defaultValues });
  return (
    <GreigePriceEstimator
      control={control}
      onEstimationChange={onEstimationChange}
    />
  );
}

describe('GreigePriceEstimator', () => {
  const mockUseQuery = useQuery as Mock;

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseQuery.mockReturnValue({
      data: {
        'yarn-1': 50000,
        'yarn-2': 60000,
      },
      isLoading: false,
      isError: false,
    });
  });

  it('returns null if target_weight_kg or target_quantity is not set', () => {
    const { container } = render(
      <Wrapper defaultValues={{ target_weight_kg: 0, target_quantity: 0 }} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders cost estimation when data is provided', () => {
    render(
      <Wrapper
        defaultValues={{
          target_weight_kg: 100,
          target_quantity: 1000,
          target_unit: 'kg',
          weaving_unit_price: 2000,
          standard_loss_pct: 5,
          yarn_requirements: [
            { yarn_catalog_id: 'yarn-1', bom_ratio_pct: 50, required_kg: 50 },
            { yarn_catalog_id: 'yarn-2', bom_ratio_pct: 50, required_kg: 50 },
          ],
        }}
      />,
    );

    // directYarnCost = 50 * 50000 + 50 * 60000 = 5500000
    // derivedAvgPrice = 5500000 / 100 = 55000
    // processingCost = 2000 * 1000 = 2000000
    // wasteCost = 5500000 * 0.05 = 275000
    // totalCost = 5500000 + 2000000 = 7500000
    // profitMarginPct = 15
    // finalPrice = 7500000 * 1.15 = 8625000

    expect(screen.getByText('Dự toán Giá Thành Vải Mộc')).toBeInTheDocument();
    expect(screen.getByText((55000).toLocaleString())).toBeInTheDocument(); // Giá sợi TB
    expect(
      screen.getByText(`${(5500000).toLocaleString()} đ`),
    ).toBeInTheDocument(); // Chi phí Sợi
    expect(
      screen.getByText(`${(2000000).toLocaleString()} đ`),
    ).toBeInTheDocument(); // Giá công
    expect(
      screen.getByText(`${(275000).toLocaleString()} đ`),
    ).toBeInTheDocument(); // Hao hụt
    expect(
      screen.getByText(`${(7500000).toLocaleString()} đ`),
    ).toBeInTheDocument(); // Tổng Giá Vốn
    expect(
      screen.getByText(`${(8625000).toLocaleString()} đ`),
    ).toBeInTheDocument(); // Giá Bán Khuyến nghị
  });

  it('renders loading state when prices are fetching', () => {
    mockUseQuery.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
    });

    render(
      <Wrapper
        defaultValues={{
          target_weight_kg: 100,
          target_quantity: 1000,
          target_unit: 'kg',
          weaving_unit_price: 2000,
          standard_loss_pct: 5,
          yarn_requirements: [
            { yarn_catalog_id: 'yarn-1', bom_ratio_pct: 100, required_kg: 50 },
          ],
        }}
      />,
    );

    expect(screen.getByText('Đang tải giá sợi...')).toBeInTheDocument();
    expect(screen.getAllByText('Đang tải...').length).toBeGreaterThan(0);
  });

  it('renders error state when fetching fails', () => {
    mockUseQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
    });

    render(
      <Wrapper
        defaultValues={{
          target_weight_kg: 100,
          target_quantity: 1000,
          target_unit: 'kg',
          weaving_unit_price: 2000,
          standard_loss_pct: 5,
          yarn_requirements: [
            { yarn_catalog_id: 'yarn-1', bom_ratio_pct: 100, required_kg: 50 },
          ],
        }}
      />,
    );

    expect(
      screen.getByText(
        'Không thể tải giá sợi từ phiếu nhập. Vui lòng kiểm tra kết nối và thử lại.',
      ),
    ).toBeInTheDocument();
  });

  it('renders warning when no yarn requirements match confirmed receipts', () => {
    mockUseQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: false,
    });

    render(
      <Wrapper
        defaultValues={{
          target_weight_kg: 100,
          target_quantity: 1000,
          target_unit: 'kg',
          weaving_unit_price: 2000,
          standard_loss_pct: 5,
          yarn_requirements: [
            {
              yarn_catalog_id: 'yarn-missing',
              bom_ratio_pct: 100,
              required_kg: 50,
            },
          ],
        }}
      />,
    );

    expect(
      screen.getByText(
        'Chưa có phiếu nhập sợi (đã xác nhận) cho các loại sợi trong BOM này.',
      ),
    ).toBeInTheDocument();
  });

  it('calls onEstimationChange with snapshot when result changes', () => {
    const onEstimationChange = vi.fn();
    render(
      <Wrapper
        defaultValues={{
          target_weight_kg: 100,
          target_quantity: 1000,
          target_unit: 'kg',
          weaving_unit_price: 2000,
          standard_loss_pct: 5,
          yarn_requirements: [
            { yarn_catalog_id: 'yarn-1', bom_ratio_pct: 50, required_kg: 50 },
            { yarn_catalog_id: 'yarn-2', bom_ratio_pct: 50, required_kg: 50 },
          ],
        }}
        onEstimationChange={onEstimationChange}
      />,
    );

    // Initial render should trigger the callback
    expect(onEstimationChange).toHaveBeenCalledWith(
      expect.objectContaining({
        est_yarn_price: 55000,
        est_profit_margin_pct: 15,
        est_transport_cost: 0,
        est_additional_costs: [],
        est_total_cost: 7500000,
        suggested_price: 8625000,
      }),
    );
  });
});
