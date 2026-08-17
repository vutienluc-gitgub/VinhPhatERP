import { describe, it, expect, vi, beforeAll } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

import { CONCURRENCY_UI_LABELS } from '@/shared/constants/concurrency.constants';
import { ConcurrencyConflictModal } from '@/shared/components/ConcurrencyConflictModal';

describe('ConcurrencyConflictModal', () => {
  beforeAll(() => {
    let modalRoot = document.getElementById('modal-root');
    if (!modalRoot) {
      modalRoot = document.createElement('div');
      modalRoot.setAttribute('id', 'modal-root');
      document.body.appendChild(modalRoot);
    }
  });

  it('renders correctly for CONCURRENCY_CONFLICT', () => {
    const handleClose = vi.fn();
    const handleReload = vi.fn();

    render(
      <ConcurrencyConflictModal
        open={true}
        onClose={handleClose}
        onReload={handleReload}
        errorType="CONCURRENCY_CONFLICT"
      />,
    );

    expect(
      screen.getByText(CONCURRENCY_UI_LABELS.CONFLICT_TITLE),
    ).toBeInTheDocument();
    expect(
      screen.getByText(CONCURRENCY_UI_LABELS.CONFLICT_DEFAULT_DESC),
    ).toBeInTheDocument();
    expect(
      screen.getByText(CONCURRENCY_UI_LABELS.RELOAD_ACTION),
    ).toBeInTheDocument();
    expect(
      screen.getByText(CONCURRENCY_UI_LABELS.DISMISS_ACTION),
    ).toBeInTheDocument();
  });

  it('renders custom title and message when provided', () => {
    const handleClose = vi.fn();

    render(
      <ConcurrencyConflictModal
        open={true}
        onClose={handleClose}
        title="Custom Conflict Title"
        message="Custom message explanation"
      />,
    );

    expect(screen.getByText('Custom Conflict Title')).toBeInTheDocument();
    expect(screen.getByText('Custom message explanation')).toBeInTheDocument();
  });

  it('calls onReload and onClose when reload button is clicked', async () => {
    const handleClose = vi.fn();
    const handleReload = vi.fn().mockResolvedValue(undefined);

    render(
      <ConcurrencyConflictModal
        open={true}
        onClose={handleClose}
        onReload={handleReload}
      />,
    );

    const reloadBtn = screen.getByText(CONCURRENCY_UI_LABELS.RELOAD_ACTION);
    fireEvent.click(reloadBtn);

    expect(handleReload).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when dismiss button is clicked', () => {
    const handleClose = vi.fn();

    render(<ConcurrencyConflictModal open={true} onClose={handleClose} />);

    const dismissBtn = screen.getByText(CONCURRENCY_UI_LABELS.DISMISS_ACTION);
    fireEvent.click(dismissBtn);

    expect(handleClose).toHaveBeenCalledTimes(1);
  });
});
