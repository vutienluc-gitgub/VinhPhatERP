import { render, screen } from '@testing-library/react';
import * as fc from 'fast-check';
import { describe, expect, it } from 'vitest';

import { ClearFilterButton } from './ClearFilterButton';

describe('ClearFilterButton', () => {
  // Property 2: ClearFilterButton rendering invariants
  it('Feature: shared-button-components, Property 2: ClearFilterButton rendering invariants', () => {
    fc.assert(
      fc.property(
        fc.option(fc.string({ minLength: 1 }), { nil: undefined }),
        (label) => {
          const props = label !== undefined ? { label } : {};
          const container = document.createElement('div');
          document.body.appendChild(container);
          const { unmount } = render(
            <ClearFilterButton onClick={() => undefined} {...props} />,
            { container },
          );
          const btn = container.querySelector('button');
          expect(btn).not.toBeNull();
          expect(btn!.getAttribute('type')).toBe('button');
          expect(btn!.className).toContain('btn-secondary');
          expect(btn!.className).toContain('text-danger');
          expect(btn!.className).toContain('border-danger/20');
          unmount();
          document.body.removeChild(container);
        },
      ),
      { numRuns: 100 },
    );
  });

  // Property 3: ClearFilterButton label round-trip
  it('Feature: shared-button-components, Property 3: ClearFilterButton label round-trip', () => {
    fc.assert(
      fc.property(fc.string({ minLength: 1 }), (label) => {
        const container = document.createElement('div');
        document.body.appendChild(container);
        const { unmount } = render(
          <ClearFilterButton onClick={() => undefined} label={label} />,
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

  it('renders default label when label prop is not provided', () => {
    render(<ClearFilterButton onClick={() => undefined} />);
    expect(screen.getByRole('button')).toHaveTextContent('Xoa loc');
  });

  it('renders custom label when label prop is provided', () => {
    render(<ClearFilterButton onClick={() => undefined} label="Reset" />);
    expect(screen.getByRole('button')).toHaveTextContent('Reset');
  });
});
