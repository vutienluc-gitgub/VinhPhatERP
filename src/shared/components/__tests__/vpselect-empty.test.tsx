import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { VPSelect } from '@/shared/components/VPSelect';

describe('VPSelect with an empty-string option', () => {
  it('opens and lists options without throwing when the value is empty', () => {
    const onValueChange = vi.fn();
    render(
      <VPSelect
        options={[
          { value: '', label: 'Tất cả' },
          { value: 'pending', label: 'Chờ' },
        ]}
        value=""
        onValueChange={onValueChange}
      />,
    );

    fireEvent.click(screen.getByRole('combobox'));
    expect(screen.getByText('Tất cả')).toBeInTheDocument();
    expect(screen.getByText('Chờ')).toBeInTheDocument();
  });
});
