import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

import type { NavigationItem } from '@/app/router/routes';
import { MobileBottomNav } from '@/app/layouts/MobileBottomNav';

const MOCK_TABS: NavigationItem[] = [
  {
    path: '/',
    label: 'Dashboard',
    shortLabel: 'Home',
    description: 'Home page',
    icon: 'Home',
  },
  {
    path: '/orders',
    label: 'Orders',
    shortLabel: 'Orders',
    description: 'Order list',
    icon: 'ClipboardList',
  },
  {
    path: '/raw-fabric',
    label: 'Raw Fabric',
    shortLabel: 'Raw',
    description: 'Raw fabric inventory',
    icon: 'Box',
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

  it('calls onOpenMore when Menu button is clicked', () => {
    const onOpenMore = vi.fn();
    renderWithRouter(
      <MobileBottomNav
        bottomTabs={MOCK_TABS}
        isDrawerActive={false}
        onOpenMore={onOpenMore}
      />,
    );

    fireEvent.click(screen.getByLabelText('Menu'));
    expect(onOpenMore).toHaveBeenCalledTimes(1);
  });

  it('marks Menu button with aria-selected=true when drawer is active', () => {
    renderWithRouter(
      <MobileBottomNav
        bottomTabs={MOCK_TABS}
        isDrawerActive={true}
        onOpenMore={() => undefined}
      />,
    );

    const menuBtn = screen.getByLabelText('Menu');
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

    // The active link should contain the indicator span
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
});
