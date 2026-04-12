import { render, screen } from '@testing-library/react';
import * as fc from 'fast-check';
import { describe, expect, it } from 'vitest';

import { CancelButton } from './CancelButton';

describe('CancelButton', () => {
  // Property 4: CancelButton rendering invariants
  it('Feature: shared-button-components, Property 4: CancelButton rendering invariants', () => {
    fc.assert(
      fc.property(
        fc.option(fc.string({ minLength: 1 }), { nil: undefined }),
        fc.boolean(),
        (label, disabled) => {
          const props = label !== undefined ? { label } : {};
          const container = document.createElement('div');
          document.body.appendChild(container);
          const { unmount } = render(
            <CancelButton
              onClick={() => undefined}
              disabled={disabled}
              {...props}
            />,
            { container },
          );
          const btn = container.querySelector('button');
          expect(btn).not.toBeNull();
          expect(btn!.getAttribute('type')).toBe('button');
          expect(btn!.className).toContain('btn-secondary');
          unmount();
          document.body.removeChild(container);
        },
      ),
      { numRuns: 100 },
    );
  });

  // Property 5: CancelButton label round-trip
  it('Feature: shared-button-components, Property 5: CancelButton label round-trip', () => {
    fc.assert(
      fc.property(fc.string({ minLength: 1 }), (label) => {
        const container = document.createElement('div');
        document.body.appendChild(container);
        const { unmount } = render(
          <CancelButton onClick={() => undefined} label={label} />,
          { container },
        );
        const btn = container.querySelector('button');
        expect(btn).not.toBeNull();
        expect(btn!.textContent).toContain(label);
        unmount();
        document.body.removeChild(container);
      }),
      { numRuns: 100 },
    );
  });

  it('renders default label Huy when label prop is not provided', () => {
    render(<CancelButton onClick={() => undefined} />);
    expect(screen.getByRole('button')).toHaveTextContent('Hủy');
  });

  it('renders with disabled attribute when disabled=true', () => {
    render(<CancelButton onClick={() => undefined} disabled={true} />);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('renders without disabled attribute when disabled=false', () => {
    render(<CancelButton onClick={() => undefined} disabled={false} />);
    expect(screen.getByRole('button')).not.toBeDisabled();
  });
});
