import { Icon, type IconName } from '@/shared/components/Icon';

export interface KpiCardProps {
  type: 'rolls' | 'length' | 'weight';
  value: number;
  footerLabel: string;
  colorVariant: 'primary' | 'success' | 'info';
  onClick?: () => void;
}

const TYPE_CONFIG: Record<
  KpiCardProps['type'],
  { label: string; icon: IconName; unit?: string }
> = {
  rolls: {
    label: 'Tổng số cuộn',
    icon: 'Package',
  },
  length: {
    label: 'Tổng chiều dài',
    icon: 'Ruler',
    unit: 'm',
  },
  weight: {
    label: 'Tổng khối lượng',
    icon: 'Weight',
    unit: 'kg',
  },
};

/**
 * KPI Card cho màn hình Kho Vải Mộc.
 *
 * - colorVariant: primary (cuộn) | success (chiều dài) | info (khối lượng)
 * - type='length' + value=0 → màu neutral + tooltip "Chưa có dữ liệu chiều dài"
 * - type='length' + value>0 → màu success
 * - onClick: click card để apply filter tương ứng
 *
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5
 */
export function KpiCard({
  type,
  value,
  footerLabel,
  colorVariant,
  onClick,
}: KpiCardProps) {
  const config = TYPE_CONFIG[type];

  // Khi type='length' và value=0 → dùng màu neutral
  const isLengthEmpty = type === 'length' && value === 0;
  const effectiveVariant = isLengthEmpty ? 'neutral' : colorVariant;

  const formattedValue = value.toLocaleString('vi-VN', {
    maximumFractionDigits: 1,
  });

  return (
    <div
      className={`kpi-card-premium kpi-${effectiveVariant}${onClick ? ' cursor-pointer' : ''}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') onClick();
            }
          : undefined
      }
      title={isLengthEmpty ? 'Chưa có dữ liệu chiều dài' : undefined}
    >
      <div className="kpi-overlay" />
      <div className="kpi-content">
        <div className="kpi-info">
          <p className="kpi-label">{config.label}</p>
          <div className="flex items-baseline gap-1">
            <p className="kpi-value">{formattedValue}</p>
            {config.unit && (
              <span className="text-lg font-bold opacity-80 uppercase">
                {config.unit}
              </span>
            )}
          </div>
        </div>
        <div className="kpi-icon-box">
          <Icon name={config.icon} size={32} />
        </div>
      </div>
      <div className="kpi-footer text-xs opacity-80 italic">{footerLabel}</div>
    </div>
  );
}
