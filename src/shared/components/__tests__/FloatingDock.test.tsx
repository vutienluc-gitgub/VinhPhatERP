import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { FloatingDock } from '@/shared/components/FloatingDock';
import type { DockSourceItem } from '@/shared/lib/navigation/floating-dock.utils';

const ITEMS: DockSourceItem[] = [
  { path: '/', label: 'Tổng quan', shortLabel: 'Home', icon: 'Home' },
  { path: '/orders', label: 'Đơn hàng', icon: 'ClipboardList' },
  { path: '/raw-fabric', label: 'Vải mộc', icon: 'Box', hasDot: true },
  {
    path: '/finished-fabric',
    label: 'Vải thành phẩm',
    icon: 'Layers',
    badge: 150,
  },
];

describe('FloatingDock', () => {
  it('render tab theo danh sách và nhãn shortLabel', () => {
    render(<FloatingDock items={ITEMS} onSelect={() => {}} />);

    expect(screen.getByRole('tab', { name: 'Home' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Đơn hàng' })).toBeInTheDocument();
  });

  it('gọi onSelect với id khi bấm tab', () => {
    const onSelect = vi.fn();
    render(<FloatingDock items={ITEMS} onSelect={onSelect} />);

    fireEvent.click(screen.getByRole('tab', { name: 'Đơn hàng' }));

    expect(onSelect).toHaveBeenCalledWith('/orders');
  });

  it('đánh dấu tab đang hoạt động bằng aria-current', () => {
    render(
      <FloatingDock items={ITEMS} activeId="/orders" onSelect={() => {}} />,
    );

    expect(screen.getByRole('tab', { name: 'Đơn hàng' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(screen.getByRole('tab', { name: 'Home' })).not.toHaveAttribute(
      'aria-current',
    );
  });

  it('rút gọn huy hiệu vượt ngưỡng và đưa vào aria-label', () => {
    render(<FloatingDock items={ITEMS} onSelect={() => {}} />);

    const tab = screen.getByRole('tab', {
      name: 'Vải thành phẩm, 99+ việc cần xử lý',
    });
    expect(tab).toBeInTheDocument();
    expect(tab).toHaveTextContent('99+');
  });

  it('render nút Menu với aria-haspopup và xử lý trigger', () => {
    const onTrigger = vi.fn();
    render(
      <FloatingDock
        items={ITEMS}
        onSelect={() => {}}
        action={{
          icon: 'LayoutGrid',
          label: 'Menu',
          ariaLabel: 'Menu, 5 việc cần xử lý',
          onTrigger,
        }}
      />,
    );

    const menu = screen.getByRole('tab', { name: 'Menu, 5 việc cần xử lý' });
    expect(menu).toHaveAttribute('aria-haspopup', 'dialog');

    fireEvent.click(menu);
    expect(onTrigger).toHaveBeenCalledTimes(1);
  });

  it('dùng nhãn điều hướng cho nav và trả về null khi rỗng', () => {
    const { rerender } = render(
      <FloatingDock items={ITEMS} onSelect={() => {}} />,
    );
    expect(
      screen.getByRole('tablist', { name: 'Điều hướng nhanh' }),
    ).toBeInTheDocument();

    rerender(<FloatingDock items={[]} onSelect={() => {}} />);
    expect(screen.queryByRole('tablist')).not.toBeInTheDocument();
  });
});
