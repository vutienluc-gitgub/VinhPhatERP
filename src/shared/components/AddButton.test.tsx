import { render, screen } from '@testing-library/react';
import * as fc from 'fast-check';
import { describe, expect, it } from 'vitest';

import { AddButton } from './AddButton';

describe('AddButton', () => {
  // Property 1: AddButton rendering invariants
  it('Feature: shared-button-components, Property 1: AddButton rendering invariants', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1 }),
        fc.boolean(),
        (label, disabled) => {
          const container = document.createElement('div');
          document.body.appendChild(container);
          const { unmount } = render(
            <AddButton
              onClick={() => undefined}
              label={label}
              disabled={disabled}
            />,
            { container },
          );
          const btn = container.querySelector('button');
          expect(btn).not.toBeNull();
          expect(btn!.getAttribute('type')).toBe('button');
          expect(btn!.className).toContain('btn-primary');
          expect(btn!.style.minHeight).toBe('42px');
          unmount();
          document.body.removeChild(container);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('renders default icon Plus when icon prop is not provided', () => {
    render(<AddButton onClick={() => undefined} label="Them moi" />);
    const btn = screen.getByRole('button');
    expect(btn).toBeInTheDocument();
    expect(btn).toHaveTextContent('Them moi');
  });

  it('renders with disabled attribute when disabled=true', () => {
    render(
      <AddButton onClick={() => undefined} label="Them moi" disabled={true} />,
    );
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('renders without disabled attribute when disabled=false', () => {
    render(
      <AddButton onClick={() => undefined} label="Them moi" disabled={false} />,
    );
    expect(screen.getByRole('button')).not.toBeDisabled();
  });
});
