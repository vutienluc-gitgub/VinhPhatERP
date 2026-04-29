import { Icon, type IconName } from '@/shared/components/Icon';

interface PanelIconProps {
  name: IconName;
  /** Tailwind color prefix: 'blue', 'emerald', 'indigo', 'violet', etc. */
  color: string;
  size?: number;
}

/**
 * PanelIcon — icon wrapper dùng trong header của mỗi settings panel.
 * Tránh lặp className 13+ lần trong toàn bộ settings forms.
 *
 * @example
 * <PanelIcon name="Building2" color="blue" />
 */
export function PanelIcon({ name, color, size = 20 }: PanelIconProps) {
  return (
    <div
      className={`w-10 h-10 rounded-xl bg-${color}-500/10 text-${color}-600 flex items-center justify-center shrink-0`}
    >
      <Icon name={name} size={size} strokeWidth={1.5} />
    </div>
  );
}
