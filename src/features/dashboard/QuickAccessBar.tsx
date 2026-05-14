import { useNavigate } from 'react-router-dom';

import { Icon } from '@/shared/components';

import { QUICK_ACCESS_ITEMS, NOTIFICATION_LABELS } from './dashboard.constants';

export function QuickAccessBar() {
  const navigate = useNavigate();

  return (
    <div className="quick-access-bar">
      <h2 className="quick-access-title">
        {NOTIFICATION_LABELS.QUICK_ACCESS_TITLE}
      </h2>
      <div className="quick-access-grid">
        {QUICK_ACCESS_ITEMS.map((item) => (
          <button
            key={item.id}
            id={`quick-access-${item.id}`}
            type="button"
            className="quick-access-item"
            onClick={() => navigate(item.href)}
          >
            <span
              className="quick-access-icon"
              style={{
                background: item.bgColor,
                color: item.iconColor,
              }}
            >
              <Icon name={item.icon} size={22} />
            </span>
            <span className="quick-access-label">{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
