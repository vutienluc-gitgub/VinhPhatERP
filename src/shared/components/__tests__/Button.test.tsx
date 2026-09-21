import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

import { Button } from '@/shared/components/Button';

describe('Button Component — Design System & Accessibility', () => {
  it('applies valid semantic token text-foreground and hover states on outline variant', () => {
    render(<Button variant="outline">Nút viền</Button>);
    const button = screen.getByRole('button', { name: 'Nút viền' });

    expect(button).toHaveClass('text-foreground');
    expect(button).not.toHaveClass('text-text');
    expect(button).toHaveClass('hover:bg-surface-subtle');
  });

  it('includes native disabled utility classes in base CVA', () => {
    render(<Button disabled>Nút khóa</Button>);
    const button = screen.getByRole('button', { name: 'Nút khóa' });

    expect(button).toHaveClass('disabled:pointer-events-none');
    expect(button).toHaveClass('disabled:opacity-50');
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-disabled', 'true');
  });

  it('renders default button with primary variant and md size', () => {
    render(<Button>Lưu đơn hàng</Button>);
    const button = screen.getByRole('button', { name: 'Lưu đơn hàng' });

    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute('type', 'button');
    expect(button).toHaveClass('btn-primary');
    expect(button).toHaveClass('min-h-[44px]');
  });

  it('renders all semantic variants correctly', () => {
    const variants = [
      { variant: 'secondary' as const, expectedClass: 'btn-secondary' },
      { variant: 'success' as const, expectedClass: 'btn-success' },
      { variant: 'warning' as const, expectedClass: 'btn-warning' },
      { variant: 'danger' as const, expectedClass: 'btn-danger' },
      { variant: 'info' as const, expectedClass: 'btn-info' },
      { variant: 'ghost' as const, expectedClass: 'text-muted-foreground' },
    ];

    variants.forEach(({ variant, expectedClass }) => {
      const { unmount } = render(<Button variant={variant}>{variant}</Button>);
      const btn = screen.getByRole('button', { name: variant });
      expect(btn).toHaveClass(expectedClass);
      unmount();
    });
  });

  it('renders sizes correctly with proper touch target requirements', () => {
    const { unmount, rerender } = render(<Button size="sm">Nhỏ</Button>);
    expect(screen.getByRole('button', { name: 'Nhỏ' })).toHaveClass(
      'min-h-[36px]',
    );

    rerender(<Button size="md">Vừa</Button>);
    expect(screen.getByRole('button', { name: 'Vừa' })).toHaveClass(
      'min-h-[44px]',
    );

    rerender(<Button size="lg">Lớn</Button>);
    expect(screen.getByRole('button', { name: 'Lớn' })).toHaveClass(
      'min-h-[52px]',
    );

    rerender(
      <Button size="icon" aria-label="Icon">
        X
      </Button>,
    );
    expect(screen.getByRole('button', { name: 'Icon' })).toHaveClass(
      'aspect-square',
    );
    unmount();
  });

  it('renders fullWidth prop correctly', () => {
    render(<Button fullWidth>Toàn màn hình</Button>);
    expect(screen.getByRole('button', { name: 'Toàn màn hình' })).toHaveClass(
      'w-full',
    );
  });

  it('handles isLoading state by showing spinner, setting aria-busy, and disabling interaction', async () => {
    const handleClick = vi.fn();
    render(
      <Button isLoading leftIcon="Plus" onClick={handleClick}>
        Đang xử lý
      </Button>,
    );

    const button = screen.getByRole('button', { name: 'Đang xử lý' });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-busy', 'true');
    expect(button).toHaveAttribute('aria-disabled', 'true');

    // Spinner exists
    const spinner = button.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
    expect(spinner).toHaveAttribute('aria-hidden', 'true');

    // Click should be blocked
    fireEvent.click(button);
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('renders leftIcon and rightIcon when not loading', () => {
    const { container } = render(
      <Button leftIcon="Plus" rightIcon="Trash2">
        Thêm mới
      </Button>,
    );

    const icons = container.querySelectorAll('svg');
    expect(icons.length).toBe(2);
  });

  it('supports asChild pattern with Radix Slot', () => {
    render(
      <Button asChild variant="outline">
        <a href="/test-link">Chuyển hướng</a>
      </Button>,
    );

    const link = screen.getByRole('link', { name: 'Chuyển hướng' });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/test-link');
    expect(link).toHaveClass('text-foreground');
    expect(link).not.toHaveAttribute('type');
  });
});
