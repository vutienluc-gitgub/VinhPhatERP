import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { MemoryRouter } from 'react-router-dom';

import {
  useDashboardStats,
  usePendingTasks,
  useRecentOrders,
  useCustomerSources,
} from '@/application/analytics';
import { formatCurrency } from '@/shared/utils/format';

import { DashboardPage } from './DashboardPage';

// Mock the hooks
vi.mock('@/application/analytics', () => ({
  useDashboardStats: vi.fn(),
  usePendingTasks: vi.fn(),
  useRecentOrders: vi.fn(),
  useCustomerSources: vi.fn(),
}));

describe('DashboardPage', () => {
  const mockUseDashboardStats = useDashboardStats as Mock;
  const mockUsePendingTasks = usePendingTasks as Mock;
  const mockUseRecentOrders = useRecentOrders as Mock;
  const mockUseCustomerSources = useCustomerSources as Mock;

  beforeEach(() => {
    vi.clearAllMocks();

    mockUseDashboardStats.mockReturnValue({
      data: {
        draftOrders: 5,
        activeOrders: 10,
        overdueOrders: 2,
        totalDebt: 50000000,
        recentPayments: 10000000,
        pendingShipments: 3,
        expiringQuotations: 1,
        conversionRate: 65,
      },
      isLoading: false,
    });

    mockUsePendingTasks.mockReturnValue([
      {
        icon: 'TriangleAlert',
        text: 'Đơn hàng trễ hạn',
        count: 2,
        href: '/orders',
        isAlert: true,
      },
    ]);

    mockUseRecentOrders.mockReturnValue({
      data: [
        {
          id: '1',
          order_number: 'ORD-001',
          customer_name: 'Nguyen Van A',
          total_amount: 1000000,
          status: 'confirmed',
          created_at: '2023-01-01T00:00:00Z',
        },
      ],
      isLoading: false,
    });

    mockUseCustomerSources.mockReturnValue({
      data: [{ source: 'Facebook', count: 10, color: '#1877f2' }],
      isLoading: false,
    });
  });

  it('renders KPI values correctly with data', () => {
    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>,
    );

    // KpiCardPremium does not render label as a separate element that can be easily queried if there are duplicates,
    // but we can query by text since label is just a string.
    expect(screen.getAllByText('Đang xử lý').length).toBeGreaterThan(0);
    expect(screen.getAllByText('10').length).toBeGreaterThan(0);

    expect(screen.getAllByText('Trễ hạn').length).toBeGreaterThan(0);
    expect(screen.getAllByText('2').length).toBeGreaterThan(0);

    expect(screen.getAllByText('Tổng công nợ').length).toBeGreaterThan(0);
    expect(
      screen.getAllByText(`${formatCurrency(50000000)} đ`).length,
    ).toBeGreaterThan(0);

    expect(screen.getAllByText('Thu 7 ngày qua').length).toBeGreaterThan(0);
    expect(
      screen.getAllByText(`${formatCurrency(10000000)} đ`).length,
    ).toBeGreaterThan(0);

    expect(screen.getAllByText('Tỷ lệ chốt').length).toBeGreaterThan(0);
    expect(screen.getAllByText('65%').length).toBeGreaterThan(0);
  });

  it('renders fallbacks when loading', () => {
    mockUseDashboardStats.mockReturnValue({
      data: undefined,
      isLoading: true,
    });

    const { container } = render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>,
    );

    // KpiCardPremium renders .animate-pulse instead of text when loading
    expect(container.querySelectorAll('.animate-pulse').length).toBeGreaterThan(
      0,
    );

    // Other elements might still be rendered normally, or we check if skeletons are present
    expect(
      container.querySelectorAll('.kpi-card-premium.animate-pulse').length,
    ).toBe(8); // 8 KPI cards
  });
});
