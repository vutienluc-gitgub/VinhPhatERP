import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { Badge } from './Badge';

describe('Badge Component', () => {
  describe('Static Mode', () => {
    it('renders as a <span> element when onFilter is undefined', () => {
      render(<Badge variant="success">Hoạt động</Badge>);
      const badge = screen.getByText('Hoạt động');
      expect(badge.tagName.toLowerCase()).toBe('span');
    });

    it('does not have button-specific attributes when in static mode', () => {
      render(<Badge variant="gray">Static Tag</Badge>);
      const badge = screen.getByText('Static Tag');
      expect(badge.getAttribute('type')).toBeNull();
      expect(badge.getAttribute('role')).toBeNull();
    });

    it('renders with dot indicator when showDot is true', () => {
      const { container } = render(
        <Badge variant="success" showDot>
          Có chấm tròn
        </Badge>,
      );
      const dot = container.querySelector('.rounded-full.bg-current');
      expect(dot).not.toBeNull();
      expect(screen.getByText('Có chấm tròn')).toBeInTheDocument();
    });
  });

  describe('Filterable Mode (onFilter passed)', () => {
    it('renders as a <button> element with type="button"', () => {
      const handleFilter = vi.fn();
      render(
        <Badge variant="info" onFilter={handleFilter}>
          Lọc theo nguồn
        </Badge>,
      );
      const button = screen.getByRole('button', { name: 'Lọc theo nguồn' });
      expect(button.tagName.toLowerCase()).toBe('button');
      expect(button.getAttribute('type')).toBe('button');
    });

    it('sets default tooltip "Nhấn để lọc" when filterTooltip is not provided', () => {
      const handleFilter = vi.fn();
      render(
        <Badge variant="info" onFilter={handleFilter}>
          Facebook
        </Badge>,
      );
      const button = screen.getByRole('button', { name: 'Facebook' });
      expect(button).toHaveAttribute('title', 'Nhấn để lọc');
    });

    it('sets custom tooltip when filterTooltip is provided', () => {
      const handleFilter = vi.fn();
      render(
        <Badge
          variant="info"
          onFilter={handleFilter}
          filterTooltip="Lọc khách hàng từ Zalo"
        >
          Zalo
        </Badge>,
      );
      const button = screen.getByRole('button', { name: 'Zalo' });
      expect(button).toHaveAttribute('title', 'Lọc khách hàng từ Zalo');
    });

    it('calls onFilter when clicked and stops event propagation', () => {
      const handleFilter = vi.fn();
      const parentClickHandler = vi.fn();

      render(
        <div onClick={parentClickHandler}>
          <Badge variant="warning" onFilter={handleFilter}>
            Pending
          </Badge>
        </div>,
      );

      const button = screen.getByRole('button', { name: 'Pending' });
      fireEvent.click(button);

      expect(handleFilter).toHaveBeenCalledTimes(1);
      expect(parentClickHandler).not.toHaveBeenCalled();
    });

    it('supports keyboard activation via Enter and Space keydown events', () => {
      const handleFilter = vi.fn();

      render(
        <Badge variant="primary" onFilter={handleFilter}>
          Keyboard Target
        </Badge>,
      );

      const button = screen.getByRole('button', { name: 'Keyboard Target' });
      button.focus();
      expect(button).toHaveFocus();

      fireEvent.click(button);
      expect(handleFilter).toHaveBeenCalledTimes(1);
    });

    it('respects disabled attribute when disabled is passed to filterable badge', () => {
      const handleFilter = vi.fn();
      render(
        <Badge variant="gray" onFilter={handleFilter} disabled>
          Vô hiệu hóa
        </Badge>,
      );

      const button = screen.getByRole('button', { name: 'Vô hiệu hóa' });
      expect(button).toBeDisabled();

      fireEvent.click(button);
      expect(handleFilter).not.toHaveBeenCalled();
    });
  });
});
