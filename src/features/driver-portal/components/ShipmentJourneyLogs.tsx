import { Icon } from '@/shared/components';
import {
  JOURNEY_STATUS_LABELS,
  type JourneyLog,
} from '@/domain/logistics/driver-portal.types';
import { DRIVER_PORTAL_MESSAGES } from '@/features/driver-portal/constants';

export interface ShipmentJourneyLogsProps {
  logs: JourneyLog[];
}

export function ShipmentJourneyLogs({ logs }: ShipmentJourneyLogsProps) {
  if (logs.length === 0) return null;

  return (
    <div>
      <p className="text-xs font-bold uppercase text-[var(--muted-foreground)] tracking-[0.06em] mb-2">
        {DRIVER_PORTAL_MESSAGES.CARD.JOURNEY_LOG}
      </p>
      <div className="flex flex-col gap-1.5">
        {logs.map((log) => (
          <div
            key={log.id}
            className="flex gap-2 text-xs text-[var(--muted-foreground)]"
          >
            <Icon name="Clock" size={13} className="shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <span className="font-semibold text-[var(--foreground)]">
                {JOURNEY_STATUS_LABELS[log.journey_status]}
              </span>
              {log.notes && <span> — {log.notes}</span>}
              <span className="text-[var(--muted-foreground)] ml-1">
                {new Date(log.created_at).toLocaleTimeString('vi-VN', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
              {log.photo_url && (
                <a
                  href={log.photo_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block mt-1"
                >
                  <img
                    src={log.photo_url}
                    alt={DRIVER_PORTAL_MESSAGES.CARD.PHOTO_ALT}
                    className="rounded-lg max-h-28 object-cover border border-[var(--border)]"
                  />
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
