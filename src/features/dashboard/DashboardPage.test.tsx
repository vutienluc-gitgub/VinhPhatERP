import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { MemoryRouter } from 'react-router-dom';

import {
  useDashboardStats,
  usePendingTasks,
  useRecentOrders,
  useDashboardRevenue,
  useYarnSpending,
  useUpcomingDebts,
  useRecentTransactions,
} from '@/application/analytics';
import { formatCompactCurrency } from '@/shared/utils/format';

import { DashboardPage } from './DashboardPage';

// Mock the hooks
vi.mock('@/application/analytics', () => ({
  useDashboardStats: vi.fn(),
  usePendingTasks: vi.fn(),
  useRecentOrders: vi.fn(),
  useCustomerSources: vi.fn(),
  useDashboardRevenue: vi.fn(),
  useYarnSpending: vi.fn(),
  useUpcomingDebts: vi.fn(),
  useRecentTransactions: vi.fn(),
}));

vi.mock('@/shared/hooks/useAuth', () => ({
  useAuth: vi.fn(() => ({
    user: { id: 'test-user', user_metadata: { full_name: 'Test User' } },
  })),
}));

describe('DashboardPage', () => {
  const mockUseDashboardStats = useDashboardStats as Mock;
  const mockUsePendingTasks = usePendingTasks as Mock;
  const mockUseRecentOrders = useRecentOrders as Mock;
  const mockUseDashboardRevenue = useDashboardRevenue as Mock;
  const mockUseYarnSpending = useYarnSpending as Mock;
  const mockUseUpcomingDebts = useUpcomingDebts as Mock;
  const mockUseRecentTransactions = useRecentTransactions as Mock;

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

    mockUseDashboardRevenue.mockReturnValue({
      data: {
        data: Array.from({ length: 12 }, (_, i) => ({
          month: `2026-${String(i + 1).padStart(2, '0')}`,
          label: `Th${i + 1}`,
          value: (i + 1) * 1000000,
        })),
        total: 78000000,
        changePercent: 15,
      },
      isLoading: false,
    });

    mockUseYarnSpending.mockReturnValue({
      data: {
        total: 25000000,
        changePercent: -5,
        breakdown: [
          { label: 'NCC A', value: 15000000, color: '#FF6B35' },
          { label: 'NCC B', value: 10000000, color: '#F7C948' },
        ],
      },
      isLoading: false,
    });

    mockUseUpcomingDebts.mockReturnValue({
      data: [
        {
          id: '1',
          name: 'NCC Test',
          type: 'supplier',
          amount: 5000000,
          due_date: '2026-06-01',
        },
      ],
      isLoading: false,
    });

    mockUseRecentTransactions.mockReturnValue({
      data: [
        {
          id: '1',
          description: 'Thanh toán NCC',
          date: '2026-05-10',
          amount: 3000000,
          type: 'income',
          status: 'success',
        },
      ],
      isLoading: false,
    });
  });

  it('renders KPI values correctly with data', () => {
    render(
      <MemoryRouter
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <DashboardPage />
      </MemoryRouter>,
    );

    expect(screen.getAllByText('Đang xử lý').length).toBeGreaterThan(0);
    expect(screen.getAllByText('10').length).toBeGreaterThan(0);

    expect(screen.getAllByText('Trễ hạn').length).toBeGreaterThan(0);
    expect(screen.getAllByText('2').length).toBeGreaterThan(0);

    expect(screen.getAllByText('Tổng công nợ').length).toBeGreaterThan(0);
    expect(
      screen.getAllByText(formatCompactCurrency(50000000)).length,
    ).toBeGreaterThan(0);

    expect(screen.getAllByText('Thu 7 ngày qua').length).toBeGreaterThan(0);
    expect(
      screen.getAllByText(formatCompactCurrency(10000000)).length,
    ).toBeGreaterThan(0);

    expect(screen.getAllByText('Tỷ lệ chốt').length).toBeGreaterThan(0);
    expect(screen.getAllByText('65%').length).toBeGreaterThan(0);
  });

  it('renders v3 overview cards', () => {
    render(
      <MemoryRouter
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <DashboardPage />
      </MemoryRouter>,
    );

    expect(screen.getAllByText('Doanh thu bán hàng').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Chi phí nhập sợi').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Dòng tiền').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Công nợ sắp đến hạn').length).toBeGreaterThan(
      0,
    );
    expect(screen.getAllByText('Giao dịch gần đây').length).toBeGreaterThan(0);
  });

  it('renders fallbacks when loading', () => {
    mockUseDashboardStats.mockReturnValue({
      data: undefined,
      isLoading: true,
    });
    mockUseDashboardRevenue.mockReturnValue({
      data: undefined,
      isLoading: true,
    });
    mockUseYarnSpending.mockReturnValue({ data: undefined, isLoading: true });
    mockUseUpcomingDebts.mockReturnValue({ data: undefined, isLoading: true });
    mockUseRecentTransactions.mockReturnValue({
      data: undefined,
      isLoading: true,
    });

    const { container } = render(
      <MemoryRouter
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <DashboardPage />
      </MemoryRouter>,
    );

    // KPI cards + v3 overview cards should show loading state
    expect(
      container.querySelectorAll('.skeleton-block').length,
    ).toBeGreaterThan(0);
  });
});
