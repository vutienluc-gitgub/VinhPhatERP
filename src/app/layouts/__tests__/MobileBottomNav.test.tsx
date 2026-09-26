import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

import type { BottomTabItem } from '@/app/layouts/MobileBottomNav';
import { MobileBottomNav } from '@/app/layouts/MobileBottomNav';
import * as haptics from '@/shared/lib/haptics';

vi.mock('@/shared/lib/haptics', () => ({
  triggerHapticFeedback: vi.fn(),
  HAPTIC_PATTERNS: {
    LIGHT: 10,
    MEDIUM: 20,
    SELECTION: 12,
    SUCCESS: [10, 30, 10],
    WARNING: [15, 40, 15],
  },
}));

const MOCK_TABS: BottomTabItem[] = [
  {
    path: '/',
    label: 'Tổng quan',
    shortLabel: 'Home',
    description: 'Home page',
    icon: 'Home',
  },
  {
    path: '/orders',
    label: 'Đơn hàng',
    shortLabel: 'Đơn hàng',
    description: 'Order list',
    icon: 'ClipboardList',
    badge: 3,
  },
  {
    path: '/raw-fabric',
    label: 'Vải mộc',
    shortLabel: 'Vải mộc',
    description: 'Raw fabric inventory',
    icon: 'Box',
    hasDot: true,
  },
];

function renderWithRouter(
  ui: React.ReactElement,
  { route = '/' }: { route?: string } = {},
) {
  return render(ui, {
    wrapper: ({ children }) => (
      <MemoryRouter initialEntries={[route]}>{children}</MemoryRouter>
    ),
  });
}

describe('MobileBottomNav', () => {
  it('renders all bottom tabs and the Menu button', () => {
    renderWithRouter(
      <MobileBottomNav
        bottomTabs={MOCK_TABS}
        isDrawerActive={false}
        onOpenMore={() => undefined}
      />,
    );

    // All tab labels visible
    for (const tab of MOCK_TABS) {
      expect(screen.getByText(tab.shortLabel)).toBeInTheDocument();
    }

    // Menu button exists
    expect(screen.getByText('Menu')).toBeInTheDocument();
  });

  it('has correct accessibility role=tablist on nav', () => {
    renderWithRouter(
      <MobileBottomNav
        bottomTabs={MOCK_TABS}
        isDrawerActive={false}
        onOpenMore={() => undefined}
      />,
    );

    expect(screen.getByRole('tablist')).toBeInTheDocument();
  });

  it('calls onOpenMore and triggers haptic feedback when Menu button is clicked', () => {
    const onOpenMore = vi.fn();
    renderWithRouter(
      <MobileBottomNav
        bottomTabs={MOCK_TABS}
        isDrawerActive={false}
        onOpenMore={onOpenMore}
      />,
    );

    const menuBtn = screen.getByRole('tab', { name: /Menu/ });
    fireEvent.click(menuBtn);
    expect(onOpenMore).toHaveBeenCalledTimes(1);
    expect(haptics.triggerHapticFeedback).toHaveBeenCalledWith(
      haptics.HAPTIC_PATTERNS.SELECTION,
    );
  });

  it('marks Menu button with aria-selected=true when drawer is active', () => {
    renderWithRouter(
      <MobileBottomNav
        bottomTabs={MOCK_TABS}
        isDrawerActive={true}
        onOpenMore={() => undefined}
      />,
    );

    const menuBtn = screen.getByRole('tab', { name: /Menu/ });
    expect(menuBtn).toHaveAttribute('aria-selected', 'true');
  });

  it('renders active indicator for active route', () => {
    const { container } = renderWithRouter(
      <MobileBottomNav
        bottomTabs={MOCK_TABS}
        isDrawerActive={false}
        onOpenMore={() => undefined}
      />,
      { route: '/' },
    );

    const indicators = container.querySelectorAll(
      '.mobile-nav-active-indicator',
    );
    expect(indicators.length).toBeGreaterThanOrEqual(1);
  });

  it('renders icons at 24px size', () => {
    const { container } = renderWithRouter(
      <MobileBottomNav
        bottomTabs={MOCK_TABS}
        isDrawerActive={false}
        onOpenMore={() => undefined}
      />,
    );

    const svgs = container.querySelectorAll('svg');
    for (const svg of svgs) {
      expect(svg.getAttribute('width')).toBe('24');
      expect(svg.getAttribute('height')).toBe('24');
    }
  });

  it('renders badge number on tab and formats numbers > 99 as 99+', () => {
    const tabsWithHighBadge: BottomTabItem[] = [
      {
        path: '/orders',
        label: 'Đơn hàng',
        shortLabel: 'Đơn hàng',
        description: 'Order list',
        badge: 150,
      },
    ];

    renderWithRouter(
      <MobileBottomNav
        bottomTabs={tabsWithHighBadge}
        isDrawerActive={false}
        onOpenMore={() => undefined}
      />,
    );

    expect(screen.getByText('99+')).toBeInTheDocument();
  });

  it('renders badge on Menu button when menuBadge is provided', () => {
    renderWithRouter(
      <MobileBottomNav
        bottomTabs={MOCK_TABS}
        isDrawerActive={false}
        onOpenMore={() => undefined}
        menuBadge={5}
      />,
    );

    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('renders dot indicator on tab when hasDot=true and badge is empty', () => {
    const { container } = renderWithRouter(
      <MobileBottomNav
        bottomTabs={MOCK_TABS}
        isDrawerActive={false}
        onOpenMore={() => undefined}
      />,
    );

    const dots = container.querySelectorAll('.mobile-nav-dot');
    expect(dots.length).toBeGreaterThanOrEqual(1);
  });

  it('triggers haptics when clicking a bottom navigation link', () => {
    renderWithRouter(
      <MobileBottomNav
        bottomTabs={MOCK_TABS}
        isDrawerActive={false}
        onOpenMore={() => undefined}
      />,
    );

    const homeTab = screen.getByRole('tab', { name: /Tổng quan/ });
    fireEvent.click(homeTab);
    expect(haptics.triggerHapticFeedback).toHaveBeenCalledWith(
      haptics.HAPTIC_PATTERNS.SELECTION,
    );
  });
});
