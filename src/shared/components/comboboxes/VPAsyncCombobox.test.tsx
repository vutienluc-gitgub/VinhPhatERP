import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

import { VPAsyncCombobox } from './VPAsyncCombobox';

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

describe('VPAsyncCombobox', () => {
  const mockFetcher = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const defaultProps = {
    getOptionValue: (opt: { id: string; name: string }) => opt.id,
    getOptionLabel: (opt: { id: string; name: string }) => opt.name,
    onChange: vi.fn(),
  };

  it('calls fetcher on mount with empty string', async () => {
    mockFetcher.mockResolvedValueOnce([{ id: '1', name: 'Test 1' }]);

    render(
      <VPAsyncCombobox
        {...defaultProps}
        fetcher={mockFetcher}
        debounceMs={0}
      />,
    );

    await waitFor(() => {
      expect(mockFetcher).toHaveBeenCalledWith('');
    });
  });

  it('debounces search input', async () => {
    mockFetcher.mockResolvedValue([{ id: '1', name: 'Test 1' }]);

    render(
      <VPAsyncCombobox
        {...defaultProps}
        fetcher={mockFetcher}
        debounceMs={0}
      />,
    );

    await waitFor(() => {
      expect(mockFetcher).toHaveBeenCalledTimes(1);
    });
    mockFetcher.mockClear();

    const trigger = screen.getByRole('combobox');
    fireEvent.click(trigger);

    const searchInput = await screen.findByPlaceholderText('Tìm kiếm...');

    // Type quickly
    fireEvent.change(searchInput, { target: { value: 'a' } });
    fireEvent.change(searchInput, { target: { value: 'ab' } });
    fireEvent.change(searchInput, { target: { value: 'abc' } });

    // Should not have been called yet
    expect(mockFetcher).not.toHaveBeenCalled();

    await waitFor(() => {
      expect(mockFetcher).toHaveBeenCalledTimes(1);
      expect(mockFetcher).toHaveBeenCalledWith('abc');
    });
  });
});
