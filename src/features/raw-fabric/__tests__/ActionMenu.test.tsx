import { render, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { ActionMenu } from '@/features/raw-fabric/ActionMenu';

describe('ActionMenu - Mobile and Desktop Layouts', () => {
  it('renders Xuất Excel icon button directly on mobile layout without a dropdown', () => {
    render(
      <ActionMenu
        onNew={vi.fn()}
        onBulkNew={vi.fn()}
        onExport={vi.fn()}
        isExporting={false}
      />,
    );

    const mobileContainer = document.querySelector('.md\\:hidden');
    expect(mobileContainer).not.toBeNull();

    // Mobile layout directly renders the Xuất Excel icon button
    const mobileExportBtn = mobileContainer?.querySelector(
      'button[aria-label="Xuất Excel"]',
    );
    expect(mobileExportBtn).not.toBeNull();

    // Mobile layout directly renders the Nhập mẻ icon button
    const mobileBulkNewBtn = mobileContainer?.querySelector(
      'button[aria-label="Nhập mẻ"]',
    );
    expect(mobileBulkNewBtn).not.toBeNull();
  });

  it('triggers onExport when clicking Xuất Excel in mobile layout', () => {
    const handleExport = vi.fn();

    render(
      <ActionMenu
        onNew={vi.fn()}
        onBulkNew={vi.fn()}
        onExport={handleExport}
        isExporting={false}
      />,
    );

    const mobileContainer = document.querySelector('.md\\:hidden');
    const exportButton = mobileContainer?.querySelector(
      'button[aria-label="Xuất Excel"]',
    ) as HTMLElement;
    expect(exportButton).not.toBeNull();
    fireEvent.click(exportButton);

    expect(handleExport).toHaveBeenCalledTimes(1);
  });

  it('triggers onBulkNew when clicking Nhập mẻ in mobile layout', () => {
    const handleBulkNew = vi.fn();

    render(
      <ActionMenu
        onNew={vi.fn()}
        onBulkNew={handleBulkNew}
        onExport={vi.fn()}
        isExporting={false}
      />,
    );

    const mobileContainer = document.querySelector('.md\\:hidden');
    const bulkButton = mobileContainer?.querySelector(
      'button[aria-label="Nhập mẻ"]',
    ) as HTMLElement;
    expect(bulkButton).not.toBeNull();
    fireEvent.click(bulkButton);

    expect(handleBulkNew).toHaveBeenCalledTimes(1);
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

    const mobileContainer = document.querySelector('.md\\:hidden');
    const exportButton = mobileContainer?.querySelector(
      'button[aria-label="Xuất Excel"]',
    );
    expect(exportButton).toBeDisabled();

    const bulkButton = mobileContainer?.querySelector(
      'button[aria-label="Nhập mẻ"]',
    );
    expect(bulkButton).toBeDisabled();
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

    const desktopContainer = document.querySelector('.hidden.md\\:flex');
    expect(desktopContainer).not.toBeNull();

    const desktopExportBtn = desktopContainer?.querySelector(
      'button[aria-label="Xuất Excel"]',
    ) as HTMLElement;
    expect(desktopExportBtn).not.toBeNull();
    fireEvent.click(desktopExportBtn);
    expect(handleExport).toHaveBeenCalledTimes(1);
  });
});
