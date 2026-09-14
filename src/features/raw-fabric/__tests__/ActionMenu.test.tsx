import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { ActionMenu } from '@/features/raw-fabric/ActionMenu';

describe('ActionMenu - Mobile Dropdown Alignment', () => {
  it('positions mobile dropdown with left-0 to avoid overflowing off-screen to the left', () => {
    const handleNew = vi.fn();
    const handleBulkNew = vi.fn();
    const handleExport = vi.fn();

    render(
      <ActionMenu
        onNew={handleNew}
        onBulkNew={handleBulkNew}
        onExport={handleExport}
        isExporting={false}
      />,
    );

    // Open mobile dropdown
    const toggleButton = screen.getByRole('button', { name: 'Thêm hành động' });
    fireEvent.click(toggleButton);

    // Find the dropdown container inside the mobile section
    const mobileContainer = toggleButton.closest('.md\\:hidden');
    expect(mobileContainer).not.toBeNull();

    const dropdownContainer = mobileContainer?.querySelector('.absolute');
    expect(dropdownContainer).not.toBeNull();

    // The dropdown is anchored to the leftmost button on mobile, so it MUST align left-0
    // If it has right-0, it overflows off-screen to the left on mobile viewports.
    expect(dropdownContainer?.className).toContain('left-0');
    expect(dropdownContainer?.className).not.toContain('right-0');
  });

  it('triggers onExport when clicking Xuất Excel in mobile dropdown', () => {
    const handleNew = vi.fn();
    const handleBulkNew = vi.fn();
    const handleExport = vi.fn();

    render(
      <ActionMenu
        onNew={handleNew}
        onBulkNew={handleBulkNew}
        onExport={handleExport}
        isExporting={false}
      />,
    );

    // Open mobile dropdown
    const toggleButton = screen.getByRole('button', { name: 'Thêm hành động' });
    fireEvent.click(toggleButton);

    const mobileContainer = toggleButton.closest('.md\\:hidden');
    const exportButton = mobileContainer?.querySelector(
      'button:nth-child(2)',
    ) as HTMLElement;
    expect(exportButton).not.toBeNull();
    fireEvent.click(exportButton);

    expect(handleExport).toHaveBeenCalledTimes(1);
  });

  it('disables mobile buttons when isExporting is true', () => {
    render(
      <ActionMenu
        onNew={vi.fn()}
        onBulkNew={vi.fn()}
        onExport={vi.fn()}
        isExporting={true}
      />,
    );

    const toggleButton = screen.getByRole('button', { name: 'Thêm hành động' });
    expect(toggleButton).toBeDisabled();
  });

  it('triggers onExport when clicking desktop Xuất Excel button', () => {
    const handleExport = vi.fn();

    render(
      <ActionMenu
        onNew={vi.fn()}
        onBulkNew={vi.fn()}
        onExport={handleExport}
        isExporting={false}
      />,
    );

    const desktopContainer = screen
      .getByLabelText('Xuất Excel')
      .closest('.hidden.md\\:flex');
    expect(desktopContainer).not.toBeNull();

    const desktopExportBtn = screen.getByLabelText('Xuất Excel');
    fireEvent.click(desktopExportBtn);
    expect(handleExport).toHaveBeenCalledTimes(1);
  });
});
