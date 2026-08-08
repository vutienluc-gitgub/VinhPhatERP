type Props = {
  status: string;
  lastSavedAt: number | null;
};

import { formatTime } from '@/shared/hooks/useAutoSave';
import { Icon } from '@/shared/components/Icon';

export default function SaveStatus({ status, lastSavedAt }: Props) {
  if (status === 'saving')
    return (
      <span className="text-[0.8rem] text-[var(--surface-subtle)]">
        Đang lưu bản nháp...
      </span>
    );

  if (status === 'saved')
    return (
      <span className="text-[0.8rem] text-[var(--success)] flex items-center">
        Đã lưu lúc {formatTime(lastSavedAt)}{' '}
        <Icon name="Check" size={12} className="ml-1" />
      </span>
    );

  if (status === 'conflict')
    return (
      <span className="text-[0.8rem] text-[var(--danger)] flex items-center">
        Có thay đổi ở tab khác{' '}
        <Icon name="AlertTriangle" size={12} className="ml-1" />
      </span>
    );

  return null;
}
