import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

import type { CustomerGroup } from '@/domain/crm/customer-groups.types';

import { CustomerGroupSelector } from './CustomerGroupSelector';

const mockGroups: CustomerGroup[] = [
  {
    id: 'grp-1',
    tenant_id: 't-1',
    code: 'DAI_LY',
    name: 'Cửa hàng',
    description: null,
    status: 'active',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'grp-2',
    tenant_id: 't-1',
    code: 'VIP',
    name: 'Khách VIP',
    description: null,
    status: 'active',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'grp-3',
    tenant_id: 't-1',
    code: 'INACTIVE_GRP',
    name: 'Nhóm cũ ngừng hoạt động',
    description: null,
    status: 'inactive',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
];

describe('CustomerGroupSelector', () => {
  it('renders active groups and shows correct count badge', () => {
    render(
      <CustomerGroupSelector
        groups={mockGroups}
        selectedGroupIds={['grp-1']}
        onChange={vi.fn()}
      />,
    );

    expect(screen.getByText('Cửa hàng')).toBeInTheDocument();
    expect(screen.getByText('Khách VIP')).toBeInTheDocument();
    // Inactive unselected group should be hidden
    expect(
      screen.queryByText('Nhóm cũ ngừng hoạt động'),
    ).not.toBeInTheDocument();

    // Badge count
    expect(screen.getByText(/Đã chọn:\s*1/i)).toBeInTheDocument();
  });

  it('renders inactive group if it is present in selectedGroupIds (History Preservation)', () => {
    render(
      <CustomerGroupSelector
        groups={mockGroups}
        selectedGroupIds={['grp-3']}
        onChange={vi.fn()}
      />,
    );

    expect(screen.getByText('Nhóm cũ ngừng hoạt động')).toBeInTheDocument();
    expect(screen.getByText(/Đã chọn:\s*1/i)).toBeInTheDocument();
  });

  it('calls onChange with deduplicated array when selecting a group', () => {
    const handleChange = vi.fn();
    render(
      <CustomerGroupSelector
        groups={mockGroups}
        selectedGroupIds={['grp-1']}
        onChange={handleChange}
      />,
    );

    const vipButton = screen.getByRole('button', { name: /Khách VIP/i });
    expect(vipButton).toHaveAttribute('aria-pressed', 'false');

    fireEvent.click(vipButton);
    expect(handleChange).toHaveBeenCalledWith(['grp-1', 'grp-2']);
  });

  it('calls onChange removing id when deselecting a group', () => {
    const handleChange = vi.fn();
    render(
      <CustomerGroupSelector
        groups={mockGroups}
        selectedGroupIds={['grp-1', 'grp-2']}
        onChange={handleChange}
      />,
    );

    const storeButton = screen.getByRole('button', { name: /Cửa hàng/i });
    expect(storeButton).toHaveAttribute('aria-pressed', 'true');

    fireEvent.click(storeButton);
    expect(handleChange).toHaveBeenCalledWith(['grp-2']);
  });

  it('renders loading skeleton when isLoading is true', () => {
    const { container } = render(
      <CustomerGroupSelector
        groups={[]}
        selectedGroupIds={[]}
        onChange={vi.fn()}
        isLoading={true}
      />,
    );

    expect(container.querySelectorAll('.animate-pulse').length).toBeGreaterThan(
      0,
    );
  });

  it('renders error state and handles onRetry when isError is true', () => {
    const handleRetry = vi.fn();
    render(
      <CustomerGroupSelector
        groups={[]}
        selectedGroupIds={[]}
        onChange={vi.fn()}
        isError={true}
        onRetry={handleRetry}
      />,
    );

    expect(
      screen.getByText(/Không thể tải danh sách nhóm khách hàng/i),
    ).toBeInTheDocument();

    const retryBtn = screen.getByRole('button', { name: /Thử lại/i });
    fireEvent.click(retryBtn);
    expect(handleRetry).toHaveBeenCalled();
  });

  it('renders error state without button when onRetry is not provided', () => {
    render(
      <CustomerGroupSelector
        groups={[]}
        selectedGroupIds={[]}
        onChange={vi.fn()}
        isError={true}
      />,
    );

    expect(
      screen.getByText(/Không thể tải danh sách nhóm khách hàng/i),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /Thử lại/i }),
    ).not.toBeInTheDocument();
  });

  it('renders empty state when visible groups is empty', () => {
    render(
      <CustomerGroupSelector
        groups={[]}
        selectedGroupIds={[]}
        onChange={vi.fn()}
      />,
    );

    expect(
      screen.getByText(/Chưa có nhóm nào được định nghĩa trên hệ thống/i),
    ).toBeInTheDocument();
  });

  it('prevents interaction when disabled is true', () => {
    const handleChange = vi.fn();
    render(
      <CustomerGroupSelector
        groups={mockGroups}
        selectedGroupIds={[]}
        onChange={handleChange}
        disabled={true}
      />,
    );

    const storeButton = screen.getByRole('button', { name: /Cửa hàng/i });
    fireEvent.click(storeButton);
    expect(handleChange).not.toHaveBeenCalled();
  });
});
