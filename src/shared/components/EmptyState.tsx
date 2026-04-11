import { Link } from 'react-router-dom';

import { Icon } from './Icon';
import type { IconName } from './Icon';

type EmptyStateProps = {
  title?: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
  actionClick?: () => void;
  icon?: IconName | string;
};

export function EmptyState({
  title = 'Chưa có dữ liệu',
  description,
  actionLabel,
  actionHref,
  actionClick,
  icon = '📂',
}: EmptyStateProps) {
  // Biểu thức regex đơn giản nhận diện tên Icon của Lucide (PascalCase)
  const isLucideIcon =
    typeof icon === 'string' && /^[A-Z][a-zA-Z]+$/.test(icon);

  return (
    <div
      style={{
        padding: '3rem 1.5rem',
        textAlign: 'center',
        backgroundColor: 'var(--surface)',
        borderRadius: 'var(--radius-sm)',
      }}
    >
      <div
        style={{
          fontSize: '3rem',
          marginBottom: '0.75rem',
          opacity: 0.9,
          display: 'flex',
          justifyContent: 'center',
        }}
      >
        {isLucideIcon ? <Icon name={icon as IconName} size={48} /> : icon}
      </div>
      <h3
        style={{
          margin: '0 0 0.5rem',
          fontWeight: 700,
        }}
      >
        {title}
      </h3>
      {description && (
        <p
          className="td-muted"
          style={{
            fontSize: '0.92rem',
            marginBottom: '1.5rem',
            maxWidth: '400px',
            marginLeft: 'auto',
            marginRight: 'auto',
          }}
        >
          {description}
        </p>
      )}

      {actionLabel &&
        (actionHref ? (
          <Link
            to={actionHref}
            className="primary-button"
            style={{
              display: 'inline-block',
              lineHeight: '1.2',
            }}
          >
            {actionLabel}
          </Link>
        ) : actionClick ? (
          <button
            type="button"
            className="primary-button"
            onClick={actionClick}
          >
            {actionLabel}
          </button>
        ) : null)}
    </div>
  );
}
