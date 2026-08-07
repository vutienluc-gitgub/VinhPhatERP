import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

import { VPVirtualCombobox } from './VPVirtualCombobox';

// Mock ResizeObserver for TanStack Virtual
global.ResizeObserver = class ResizeObserver {
  callback: ResizeObserverCallback;
  constructor(callback: ResizeObserverCallback) {
    this.callback = callback;
  }
  observe(element: Element) {
    // Immediately trigger with a fake size so virtualizer renders items
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

describe('VPVirtualCombobox', () => {
  interface MyOption {
    id: string;
    name: string;
    code: string;
  }

  const options: MyOption[] = [
    { id: 'r1', name: 'Roll 1', code: 'R001' },
    { id: 'r2', name: 'Roll 2', code: 'R002' },
    { id: 'r3', name: 'Roll 3', code: 'R003' },
  ];

  const defaultProps = {
    options,
    getOptionValue: (opt: MyOption) => opt.id,
    getOptionLabel: (opt: MyOption) => opt.name,
    onChange: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders correctly with placeholder', () => {
    render(
      <VPVirtualCombobox {...defaultProps} placeholder="Select a roll..." />,
    );

    expect(screen.getByText('Select a roll...')).toBeInTheDocument();
  });

  it('renders selected value', () => {
    render(<VPVirtualCombobox {...defaultProps} value="r2" />);

    expect(screen.getByText('Roll 2')).toBeInTheDocument();
  });

  it('opens popover when clicked', async () => {
    render(
      <VPVirtualCombobox {...defaultProps} placeholder="Select a roll..." />,
    );

    const trigger = screen.getByRole('combobox');
    fireEvent.click(trigger);

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Tìm kiếm...')).toBeInTheDocument();
    });

    // Options should be rendered
    expect(screen.getByText('Roll 1')).toBeInTheDocument();
    expect(screen.getByText('Roll 2')).toBeInTheDocument();
  });

  it('filters options when typing in search input', async () => {
    render(<VPVirtualCombobox {...defaultProps} />);

    const trigger = screen.getByRole('combobox');
    fireEvent.click(trigger);

    const searchInput = await screen.findByPlaceholderText('Tìm kiếm...');
    fireEvent.change(searchInput, { target: { value: 'Roll 3' } });

    expect(screen.getAllByText('Roll 3').length).toBeGreaterThan(0);
    expect(screen.queryByText('Roll 1')).not.toBeInTheDocument();
    expect(screen.queryByText('Roll 2')).not.toBeInTheDocument();
  });

  it('calls onChange when an option is selected', async () => {
    const onChangeMock = vi.fn();
    render(<VPVirtualCombobox {...defaultProps} onChange={onChangeMock} />);

    const trigger = screen.getByRole('combobox');
    fireEvent.click(trigger);

    await screen.findByPlaceholderText('Tìm kiếm...');

    // Trigger might not have Roll 2 initially, but let's be safe
    const roll2Options = screen.getAllByText('Roll 2');
    fireEvent.click(roll2Options[roll2Options.length - 1]!);

    expect(onChangeMock).toHaveBeenCalledWith('r2');
  });

  it('handles empty options without crashing', async () => {
    render(
      <VPVirtualCombobox
        {...defaultProps}
        options={[]}
        emptyText="No results found"
      />,
    );

    const trigger = screen.getByRole('combobox');
    fireEvent.click(trigger);

    await waitFor(() => {
      expect(screen.getByText('No results found')).toBeInTheDocument();
    });
  });

  it('deselects value if the same option is clicked again', async () => {
    const onChangeMock = vi.fn();
    render(
      <VPVirtualCombobox
        {...defaultProps}
        value="r2"
        onChange={onChangeMock}
      />,
    );

    const trigger = screen.getByRole('combobox');
    fireEvent.click(trigger);

    await screen.findByPlaceholderText('Tìm kiếm...');

    const roll2Options = screen.getAllByText('Roll 2');
    fireEvent.click(roll2Options[roll2Options.length - 1]!);

    expect(onChangeMock).toHaveBeenCalledWith('');
  });
});
