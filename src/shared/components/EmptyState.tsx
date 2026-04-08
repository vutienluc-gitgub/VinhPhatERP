import { Link } from 'react-router-dom';

type EmptyStateProps = {
  title?: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
  actionClick?: () => void;
  icon?: string;
};

export function EmptyState({
  title = 'Chưa có dữ liệu',
  description,
  actionLabel,
  actionHref,
  actionClick,
  icon = '📂',
}: EmptyStateProps) {
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
        }}
      >
        {icon}
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
