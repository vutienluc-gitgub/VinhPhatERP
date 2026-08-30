import { memo, useMemo, useState } from 'react';

import { getAvatarColorIndex, getInitials } from './avatar.utils';
import './avatar.css';

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export interface AvatarProps {
  userId?: string | null;
  name?: string | null;
  src?: string | null;
  size?: AvatarSize;
  className?: string;
  alt?: string;
  fallbackText?: string;
}

export const Avatar = memo(function Avatar({
  userId,
  name,
  src,
  size = 'md',
  className = '',
  alt,
  fallbackText,
}: AvatarProps) {
  const [imgError, setImgError] = useState(false);
  const [lastSrc, setLastSrc] = useState(src);

  if (src !== lastSrc) {
    setLastSrc(src);
    setImgError(false);
  }

  const initials = useMemo(
    () => getInitials(name, fallbackText),
    [name, fallbackText],
  );

  const colorIndex = useMemo(() => getAvatarColorIndex(userId), [userId]);

  const hasValidImage = Boolean(src && src.trim() !== '' && !imgError);

  const sizeClass = `vp-avatar--${size}`;
  const colorClass = `vp-avatar--color-${colorIndex}`;
  const accessibleLabel = alt || name || 'Avatar';

  return (
    <div
      className={`vp-avatar ${sizeClass} ${colorClass} ${className}`.trim()}
      title={name ?? undefined}
      {...(!hasValidImage && { role: 'img', 'aria-label': accessibleLabel })}
    >
      {hasValidImage ? (
        <img
          src={src ?? undefined}
          alt={accessibleLabel}
          className="vp-avatar-image"
          onError={() => setImgError(true)}
          loading="lazy"
        />
      ) : (
        <span className="vp-avatar-initials">{initials}</span>
      )}
    </div>
  );
});
