import { Icon } from '@/shared/components/Icon';
import { useOrderAuditLogs } from '@/application/orders';

import { ORDERS_AUDIT_LABELS, ORDERS_LIST_LABELS } from './orders.constants';

// ── Types ────────────────────────────────────────────────────────────────────

type OrderAuditLogViewerProps = {
  orderId: string;
};

type EventConfig = {
  label: string;
  icon: string;
  color: string;
  detail?: string;
};

type AuditPayload = Record<string, string | undefined>;

type AuditProfile = {
  full_name?: string;
  role?: string;
} | null;

// ── Constants ────────────────────────────────────────────────────────────────

const LABELS = {
  SECTION_TITLE: ORDERS_LIST_LABELS.AUDIT_LOG_TITLE,
  LOADING: ORDERS_AUDIT_LABELS.AUDIT_LOADING,
  ERROR: ORDERS_AUDIT_LABELS.AUDIT_ERROR,
  EMPTY: ORDERS_AUDIT_LABELS.AUDIT_EMPTY,
  COL_USER: ORDERS_AUDIT_LABELS.AUDIT_LBL_USER,
  COL_ACTION: ORDERS_AUDIT_LABELS.AUDIT_LBL_ACTION,
  COL_TIME: ORDERS_AUDIT_LABELS.AUDIT_LBL_TIME,
  COL_DETAILS: ORDERS_AUDIT_LABELS.AUDIT_LBL_DETAILS,
  DEFAULT_ACTOR: ORDERS_AUDIT_LABELS.AUDIT_DEFAULT_ACTOR,
} as const;

const EVENT_MAP: Record<string, EventConfig> = {
  ORDER_CREATED: {
    label: ORDERS_AUDIT_LABELS.AUDIT_EVENT_ORDER_CREATED,
    icon: 'FilePlus',
    color: 'text-success',
    detail: ORDERS_AUDIT_LABELS.AUDIT_EVENT_ORDER_CREATED_DETAIL,
  },
  ORDER_REQUEST_CREATED: {
    label: ORDERS_AUDIT_LABELS.AUDIT_EVENT_REQ_CREATED,
    icon: 'FilePlus',
    color: 'text-foreground',
    detail: ORDERS_AUDIT_LABELS.AUDIT_EVENT_REQ_CREATED_DETAIL,
  },
  ORDER_STATUS_CHANGED: {
    label: ORDERS_AUDIT_LABELS.AUDIT_EVENT_STATUS_CHANGED,
    icon: 'RefreshCw',
    color: 'text-warning',
  },
};

const DEFAULT_EVENT_CONFIG: EventConfig = {
  label: '',
  icon: 'Zap',
  color: 'text-muted-foreground',
};

const DATE_LOCALE = 'vi-VN';

// ── Helpers (business logic extracted from UI) ───────────────────────────────

function resolveEventConfig(eventType: string): EventConfig {
  const config = EVENT_MAP[eventType];
  if (config) return config;
  return { ...DEFAULT_EVENT_CONFIG, label: eventType };
}

function resolveDetailText(
  eventType: string,
  config: EventConfig,
  payload: AuditPayload,
): string {
  if (eventType === 'ORDER_STATUS_CHANGED') {
    const newStatus = payload.new_status ?? 'N/A';
    return `Trạng thái mới: ${newStatus}`;
  }
  return config.detail ?? '';
}

function resolveActorName(
  profile: AuditProfile,
  payload: AuditPayload,
): string {
  return profile?.full_name ?? payload.customer_name ?? LABELS.DEFAULT_ACTOR;
}

// ── Sub-components ───────────────────────────────────────────────────────────

function AuditLogSkeleton() {
  return (
    <div className="panel-card card-flush mt-6 p-5">
      <div className="flex items-center gap-2 mb-4">
        <div
          className="skeleton-block"
          style={{ width: 18, height: 18, borderRadius: '50%' }}
        />
        <div className="skeleton-block" style={{ width: 140 }} />
      </div>
      <div className="ml-3 pl-5 space-y-5">
        {[1, 2, 3].map((n) => (
          <div key={n} className="flex flex-col gap-2">
            <div className="skeleton-block" style={{ width: '60%' }} />
            <div className="skeleton-block" style={{ width: '40%' }} />
          </div>
        ))}
      </div>
    </div>
  );
}

function SectionHeader() {
  return (
    <h3 className="m-0 mb-4 flex items-center gap-2 relative z-10">
      <Icon name="Activity" size={18} className="text-muted-foreground" />{' '}
      {LABELS.SECTION_TITLE}
    </h3>
  );
}

type AuditLogEntryProps = {
  eventType: string;
  config: EventConfig;
  actorName: string;
  actorRole: string | undefined;
  detailText: string;
  createdAt: string;
};

function AuditLogEntry({
  config,
  actorName,
  actorRole,
  detailText,
  createdAt,
}: AuditLogEntryProps) {
  return (
    <div className="relative">
      <div
        className={`absolute -left-[30px] p-1 bg-surface rounded-full border border-border flex items-center justify-center ${config.color}`}
      >
        <Icon
          name={config.icon as Parameters<typeof Icon>[0]['name']}
          size={14}
        />
      </div>
      <div className="flex flex-col md:flex-row md:items-baseline md:justify-between mb-1 gap-1">
        <div className="font-semibold text-sm flex items-center gap-2">
          {config.label}
          <span className="text-xs font-normal text-muted-foreground bg-hover px-2 py-0.5 rounded-full">
            {actorName}
            {actorRole ? ` (${actorRole})` : ''}
          </span>
        </div>
        <div className="text-[11px] text-muted-foreground flex items-center gap-1 font-mono">
          <Icon name="Clock" size={12} />
          {/* eslint-disable-next-line no-restricted-syntax */}
          {new Date(createdAt).toLocaleString(DATE_LOCALE)}
        </div>
      </div>
      {detailText && (
        <div className="text-sm text-text pr-10">{detailText}</div>
      )}
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────────────────

export function OrderAuditLogViewer({ orderId }: OrderAuditLogViewerProps) {
  const { data: logs, isLoading, error } = useOrderAuditLogs(orderId);

  if (isLoading) {
    return <AuditLogSkeleton />;
  }

  if (error) {
    return (
      <div className="panel-card card-flush mt-6 p-5">
        <SectionHeader />
        <p className="text-danger text-sm">
          {error instanceof Error ? error.message : LABELS.ERROR}
        </p>
      </div>
    );
  }

  return (
    <div className="panel-card card-flush mt-6 p-5 relative overflow-hidden">
      <div className="absolute top-0 right-0 p-4 opacity-5">
        <Icon name="History" size={100} />
      </div>
      <SectionHeader />

      {!logs || logs.length === 0 ? (
        <div className="text-sm text-muted-foreground italic relative z-10">
          {LABELS.EMPTY}
        </div>
      ) : (
        <div className="relative border-l-2 border-border ml-3 pl-5 space-y-6 z-10">
          {logs.map((log) => {
            const config = resolveEventConfig(log.event_type);
            const payload = (log.payload ?? {}) as AuditPayload;
            const profile = log.profiles as AuditProfile;
            const detailText = resolveDetailText(
              log.event_type,
              config,
              payload,
            );

            return (
              <AuditLogEntry
                key={log.id}
                eventType={log.event_type}
                config={config}
                actorName={resolveActorName(profile, payload)}
                actorRole={profile?.role}
                detailText={detailText}
                createdAt={log.created_at}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
