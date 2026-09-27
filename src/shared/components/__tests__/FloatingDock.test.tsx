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

  it('render nút Menu qua actions với aria-haspopup và xử lý trigger', () => {
    const onTrigger = vi.fn();
    render(
      <FloatingDock
        items={ITEMS}
        onSelect={() => {}}
        actions={[
          {
            icon: 'LayoutGrid',
            label: 'Menu',
            ariaLabel: 'Menu, 5 việc cần xử lý',
            onTrigger,
          },
        ]}
      />,
    );

    const menu = screen.getByRole('tab', { name: 'Menu, 5 việc cần xử lý' });
    expect(menu).toHaveAttribute('aria-haspopup', 'dialog');

    fireEvent.click(menu);
    expect(onTrigger).toHaveBeenCalledTimes(1);
  });

  it('giữ Menu trong pill và tách "+" thành FAB nổi riêng', () => {
    const onQuickCreate = vi.fn();
    const onMenu = vi.fn();
    render(
      <FloatingDock
        items={ITEMS}
        onSelect={() => {}}
        actions={[{ icon: 'LayoutGrid', label: 'Menu', onTrigger: onMenu }]}
        fab={{
          icon: 'Plus',
          label: 'Tạo mới nhanh',
          onTrigger: onQuickCreate,
        }}
      />,
    );

    // Pill chỉ còn 4 tab + Menu; "+" không nằm trong tablist
    const tabs = screen.getAllByRole('tab');
    expect(tabs).toHaveLength(ITEMS.length + 1);
    expect(tabs[tabs.length - 1]).toHaveAccessibleName('Menu');

    const fab = screen.getByRole('button', { name: 'Tạo mới nhanh' });
    expect(fab).toHaveAttribute('aria-haspopup', 'dialog');
    expect(fab).not.toHaveAttribute('role', 'tab');

    fireEvent.click(fab);
    expect(onQuickCreate).toHaveBeenCalledTimes(1);
    expect(onMenu).not.toHaveBeenCalled();
  });

  it('không render FAB khi không truyền fab', () => {
    render(
      <FloatingDock
        items={ITEMS}
        onSelect={() => {}}
        actions={[{ icon: 'LayoutGrid', label: 'Menu', onTrigger: () => {} }]}
      />,
    );

    expect(screen.getAllByRole('tab')).toHaveLength(ITEMS.length + 1);
    expect(
      screen.queryByRole('button', { name: 'Tạo mới nhanh' }),
    ).not.toBeInTheDocument();
  });

  it('dock chỉ hiển thị icon, nhãn chữ không render ra giao diện', () => {
    render(
      <FloatingDock
        items={ITEMS}
        onSelect={() => {}}
        fab={{ icon: 'Plus', label: 'Tạo mới nhanh', onTrigger: () => {} }}
      />,
    );

    // Nhãn nằm trong aria-label, không phải text node hiển thị
    expect(screen.queryByText('Home')).not.toBeInTheDocument();
    expect(screen.queryByText('Tạo mới nhanh')).not.toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Tạo mới nhanh' }),
    ).toBeInTheDocument();
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
