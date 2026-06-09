import type { MouseEvent, ReactNode } from 'react';

import type { EntityType } from '@/shared/constants/entity.constants';
import { ENTITY_ROUTES } from '@/shared/constants/entity.constants';
import { useGlobalEntity } from '@/shared/contexts/GlobalEntityContext';
import { Icon } from '@/shared/components/Icon';

export interface EntityLinkProps {
  entityType: EntityType;
  entityId: string;
  label: ReactNode;
  showIcon?: boolean;
  className?: string;
}

export function EntityLink({
  entityType,
  entityId,
  label,
  showIcon = true,
  className = '',
}: EntityLinkProps) {
  const { openEntity } = useGlobalEntity();

  const routePath = ENTITY_ROUTES[entityType] ?? entityType;
  const href = `/${routePath}?previewId=${entityId}`;

  const handleClick = (e: MouseEvent<HTMLAnchorElement>) => {
    // If user is holding Ctrl/Cmd or Shift, let the browser handle it (open in new tab/window)
    if (e.ctrlKey || e.metaKey || e.shiftKey || e.button !== 0) {
      return;
    }

    e.preventDefault();
    openEntity(entityType, entityId);
  };

  return (
    <a
      href={href}
      onClick={handleClick}
      className={`inline-flex items-center gap-1 text-primary hover:text-primary-focus hover:underline font-medium transition-colors group ${className}`}
      title="Nhấn để xem chi tiết, chuột giữa để mở tab mới"
    >
      <span>{label || '—'}</span>
      {showIcon && (
        <Icon
          name="ExternalLink"
          size={12}
          className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground"
        />
      )}
    </a>
  );
}
