import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

import { Avatar } from './Avatar';
import { getAvatarColorIndex, getInitials } from './avatar.utils';

describe('avatar.utils', () => {
  it('extracts initials accurately from Vietnamese and International full names', () => {
    expect(getInitials('Nguyễn Văn An')).toBe('NA');
    expect(getInitials('Trần Minh Đức')).toBe('TD');
    expect(getInitials('John Smith')).toBe('JS');
    expect(getInitials('Admin')).toBe('AD');
    expect(getInitials('Vũ Tiến Lực')).toBe('VL');
    expect(getInitials('')).toBe('VP');
    expect(getInitials(null)).toBe('VP');
    expect(getInitials(undefined, 'TX')).toBe('TX');
  });

  it('computes deterministic color index from UUID', () => {
    const uuid1 = '6c8cc401-487d-4468-8aa7-fe2997093767';
    const uuid2 = '9011468b-f6dc-49dc-b660-a3f8d391fec0';

    const index1 = getAvatarColorIndex(uuid1);
    const index2 = getAvatarColorIndex(uuid2);

    expect(index1).toBeGreaterThanOrEqual(0);
    expect(index1).toBeLessThan(6);
    expect(index2).toBeGreaterThanOrEqual(0);
    expect(index2).toBeLessThan(6);

    // Guaranteed determinism: same input produces same output
    expect(getAvatarColorIndex(uuid1)).toBe(index1);
    expect(getAvatarColorIndex(uuid2)).toBe(index2);
  });
});

describe('<Avatar />', () => {
  it('renders deterministic initials and color class when src is not provided', () => {
    const { container } = render(
      <Avatar
        userId="6c8cc401-487d-4468-8aa7-fe2997093767"
        name="Nguyễn Văn An"
        size="md"
      />,
    );

    expect(screen.getByText('NA')).toBeInTheDocument();
    const avatarEl = container.querySelector('.vp-avatar');
    expect(avatarEl).toHaveClass('vp-avatar--md');
    expect(avatarEl?.className).toMatch(/vp-avatar--color-\d/);
  });

  it('renders image when src is provided', () => {
    render(
      <Avatar
        userId="test-uuid"
        name="Trần Minh Đức"
        src="https://example.com/avatar.jpg"
      />,
    );

    const img = screen.getByRole('img', { name: 'Trần Minh Đức' });
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', 'https://example.com/avatar.jpg');
  });

  it('gracefully falls back to initials when image load fails', () => {
    render(
      <Avatar
        userId="test-uuid"
        name="Trần Minh Đức"
        src="https://example.com/broken.jpg"
      />,
    );

    const img = screen.getByRole('img', { name: 'Trần Minh Đức' });
    fireEvent.error(img);

    expect(screen.getByText('TD')).toBeInTheDocument();
  });
});
