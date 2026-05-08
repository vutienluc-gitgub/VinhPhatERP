import { Icon } from '@/shared/components/Icon';

const PROMO_MESSAGES = {
  TITLE: 'Nâng cấp tính năng AI',
  BTN_UPGRADE: 'Nâng cấp ngay',
};

export function SidebarPromo() {
  return (
    <div className="zircon-promo">
      <div className="zircon-promo-icon">
        <Icon name="Sparkles" size={24} />
      </div>
      <div className="zircon-promo-title">{PROMO_MESSAGES.TITLE}</div>
      <button type="button" className="zircon-promo-btn">
        {PROMO_MESSAGES.BTN_UPGRADE}
        <Icon name="ArrowUpRight" size={14} />
      </button>
    </div>
  );
}
