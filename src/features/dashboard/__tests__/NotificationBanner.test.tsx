import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MemoryRouter } from 'react-router-dom';

import type { DashboardStats } from '@/application/analytics';
import { NotificationBanner } from '@/features/dashboard/NotificationBanner';
import {
  NOTIFICATION_LABELS,
  formatNotificationAriaLabel,
} from '@/features/dashboard/dashboard.constants';

describe('NotificationBanner', () => {
  const mockBaseStats: DashboardStats = {
    draftOrders: 0,
    activeOrders: 10,
    overdueOrders: 0,
    totalDebt: 50000000,
    recentPayments: 12000000,
    pendingShipments: 0,
    expiringQuotations: 0,
    conversionRate: 68.5,
  };

  const renderBanner = (props: {
    stats: DashboardStats | undefined;
    isLoading: boolean;
  }) =>
    render(
      <MemoryRouter
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <NotificationBanner stats={props.stats} isLoading={props.isLoading} />
      </MemoryRouter>,
    );

  it('renders loading skeleton with accessible role and label when isLoading is true', () => {
    const { container } = renderBanner({ stats: undefined, isLoading: true });

    const skeletonBanner = screen.getByRole('status', {
      name: NOTIFICATION_LABELS.SKELETON_LABEL,
    });
    expect(skeletonBanner).toBeInTheDocument();

    const skeletonItems = container.querySelectorAll('.notif-banner-skeleton');
    expect(skeletonItems.length).toBe(3);
  });

  it('returns null when stats is undefined and not loading', () => {
    const { container } = renderBanner({ stats: undefined, isLoading: false });
    expect(container.firstChild).toBeNull();
  });

  it('renders all clear status banner when all alert task counts are zero', () => {
    renderBanner({ stats: mockBaseStats, isLoading: false });

    const clearStatus = screen.getByRole('status');
    expect(clearStatus).toBeInTheDocument();
    expect(clearStatus).toHaveTextContent(NOTIFICATION_LABELS.ALL_CLEAR);
    expect(clearStatus).toHaveClass('notif-banner-clear');
  });

  it('renders notification items with accessible labels and links when tasks are pending', () => {
    const activeStats: DashboardStats = {
      ...mockBaseStats,
      overdueOrders: 3,
      pendingShipments: 2,
      draftOrders: 5,
      expiringQuotations: 1,
    };

    renderBanner({ stats: activeStats, isLoading: false });

    const bannerRegion = screen.getByRole('region', {
      name: NOTIFICATION_LABELS.REGION_LABEL,
    });
    expect(bannerRegion).toBeInTheDocument();

    // Verify overdue orders link
    const overdueLink = screen.getByRole('link', {
      name: formatNotificationAriaLabel(NOTIFICATION_LABELS.OVERDUE_ORDERS, 3),
    });
    expect(overdueLink).toHaveAttribute('href', '/orders');
    expect(overdueLink).toHaveTextContent('3');

    // Verify pending shipments link
    const shipmentsLink = screen.getByRole('link', {
      name: formatNotificationAriaLabel(
        NOTIFICATION_LABELS.PENDING_SHIPMENTS,
        2,
      ),
    });
    expect(shipmentsLink).toHaveAttribute('href', '/shipments');
    expect(shipmentsLink).toHaveTextContent('2');

    // Verify draft orders link
    const draftsLink = screen.getByRole('link', {
      name: formatNotificationAriaLabel(NOTIFICATION_LABELS.DRAFT_ORDERS, 5),
    });
    expect(draftsLink).toHaveAttribute('href', '/orders');
    expect(draftsLink).toHaveTextContent('5');

    // Verify expiring quotations link
    const quotesLink = screen.getByRole('link', {
      name: formatNotificationAriaLabel(
        NOTIFICATION_LABELS.EXPIRING_QUOTATIONS,
        1,
      ),
    });
    expect(quotesLink).toHaveAttribute('href', '/quotations');
    expect(quotesLink).toHaveTextContent('1');
  });

  it('formats aria-label correctly with helper', () => {
    const formatted = formatNotificationAriaLabel('Đơn hàng trễ hạn', 4);
    expect(formatted).toBe('Đơn hàng trễ hạn: 4 việc cần xử lý');
  });
});
