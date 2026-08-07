import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

import { VPEntityPicker, EntityOption } from './VPEntityPicker';

// Mock ResizeObserver for TanStack Virtual
global.ResizeObserver = class ResizeObserver {
  callback: ResizeObserverCallback;
  constructor(callback: ResizeObserverCallback) {
    this.callback = callback;
  }
  observe(element: Element) {
    this.callback(
      [
        {
          target: element,
          contentRect: {
            width: 300,
            height: 300,
            top: 0,
            right: 300,
            bottom: 300,
            left: 0,
          },
          borderBoxSize: [{ blockSize: 300, inlineSize: 300 }],
          contentBoxSize: [{ blockSize: 300, inlineSize: 300 }],
          devicePixelContentBoxSize: [{ blockSize: 300, inlineSize: 300 }],
        },
      ] as unknown as ResizeObserverEntry[],
      this,
    );
  }
  unobserve() {}
  disconnect() {}
};

describe('VPEntityPicker', () => {
  const options: EntityOption[] = [
    { id: '1', name: 'John Doe', code: 'EMP-001', phone: '0123456789' },
    { id: '2', name: 'Jane Smith', code: 'EMP-002' },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders standard variant correctly', async () => {
    render(<VPEntityPicker options={options} onChange={() => {}} />);

    const trigger = screen.getByRole('combobox');
    fireEvent.click(trigger);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(
        screen.getByText('Mã: EMP-001 SĐT: 0123456789'),
      ).toBeInTheDocument();
    });
  });

  it('renders compact variant correctly', async () => {
    render(
      <VPEntityPicker
        options={options}
        variant="compact"
        onChange={() => {}}
      />,
    );

    const trigger = screen.getByRole('combobox');
    fireEvent.click(trigger);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.queryByText('Mã: EMP-001')).not.toBeInTheDocument();
    });
  });

  it('renders avatar variant correctly', async () => {
    render(
      <VPEntityPicker options={options} variant="avatar" onChange={() => {}} />,
    );

    const trigger = screen.getByRole('combobox');
    fireEvent.click(trigger);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('EMP-001 - 0123456789')).toBeInTheDocument();
    });
  });

  it('filters by multiple fields', async () => {
    render(<VPEntityPicker options={options} onChange={() => {}} />);

    const trigger = screen.getByRole('combobox');
    fireEvent.click(trigger);

    const searchInput = await screen.findByPlaceholderText('Tìm kiếm...');

    // Search by code
    fireEvent.change(searchInput, { target: { value: '002' } });

    expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
  });
});
