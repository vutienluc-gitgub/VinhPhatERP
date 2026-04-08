type Props = {
  status: string;
  lastSavedAt: number | null;
};

import { formatTime } from '@/shared/hooks/useAutoSave';

export default function SaveStatus({ status, lastSavedAt }: Props) {
  if (status === 'saving')
    return (
      <span
        style={{
          fontSize: '0.8rem',
          color: 'var(--muted)',
        }}
      >
        Đang lưu bản nháp...
      </span>
    );

  if (status === 'saved')
    return (
      <span
        style={{
          fontSize: '0.8rem',
          color: 'var(--success)',
        }}
      >
        Đã lưu lúc {formatTime(lastSavedAt)} ✓
      </span>
    );

  if (status === 'conflict')
    return (
      <span
        style={{
          fontSize: '0.8rem',
          color: 'var(--danger)',
        }}
      >
        Có thay đổi ở tab khác ⚠
      </span>
    );

  return null;
}
