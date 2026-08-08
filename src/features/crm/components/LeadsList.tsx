import dayjs from 'dayjs';

import { DataTable } from '@/shared/components/DataTable';
import { PhoneContact } from '@/shared/components/PhoneContact';
import type { Column } from '@/shared/components/DataTable';
import type { CrmLead } from '@/domain/crm/crm.types';
import {
  LEAD_STATUS_MAP,
  LEAD_TYPE_MAP,
  CRM_LABELS,
} from '@/features/crm/crm.constants';

interface LeadsListProps {
  data: CrmLead[];
  total: number;
  page: number;
  isLoading: boolean;
  onPageChange: (page: number) => void;
  onSelectLead: (id: string) => void;
}

export function LeadsList({
  data,
  total,
  page,
  isLoading,
  onPageChange,
  onSelectLead,
}: LeadsListProps) {
  const columns: Column<CrmLead>[] = [
    {
      id: 'customer',
      header: CRM_LABELS.LIST_HEADER_CUSTOMER,
      cell: (item) => (
        <div>
          <div className="font-semibold text-foreground">
            {item.customer_name}
          </div>
          {item.company_name ? (
            <div className="text-sm text-muted-foreground">
              {item.company_name}
            </div>
          ) : null}
        </div>
      ),
    },
    {
      id: 'contact',
      header: CRM_LABELS.LIST_HEADER_CONTACT,
      cell: (item) => (
        <div className="text-sm">
          <div>
            <PhoneContact phone={item.phone} />
          </div>
          {item.email ? (
            <div className="text-muted-foreground">{item.email}</div>
          ) : null}
        </div>
      ),
    },
    {
      id: 'type',
      header: CRM_LABELS.LIST_HEADER_TYPE,
      cell: (item) => {
        const meta = LEAD_TYPE_MAP[item.type];
        if (!meta) return item.type;
        return (
          <span
            className={`text-xs px-2 py-1 rounded font-medium whitespace-nowrap ${meta.colorClass}`}
          >
            {meta.label}
          </span>
        );
      },
    },
    {
      id: 'details',
      header: CRM_LABELS.LIST_HEADER_DETAILS,
      cell: (item) => {
        if (item.type === 'RFQ' && item.rfq_detail) {
          return (
            <div className="text-sm text-muted-foreground max-w-[200px] truncate">
              {item.rfq_detail.quantity} {item.rfq_detail.unit ?? ''} -{' '}
              {item.rfq_detail.fabric_catalog?.name ?? ''}
            </div>
          );
        }
        if (item.type === 'SAMPLE' && item.sample_detail) {
          return (
            <div className="text-sm text-muted-foreground max-w-[200px] truncate">
              {item.sample_detail.fabric_catalog?.name ?? ''}
            </div>
          );
        }
        return (
          <span className="text-muted-foreground text-sm">
            {CRM_LABELS.EMPTY_TEXT}
          </span>
        );
      },
    },
    {
      id: 'status',
      header: CRM_LABELS.LIST_HEADER_STATUS,
      cell: (item) => {
        const meta = LEAD_STATUS_MAP[item.status];
        if (!meta) return item.status;
        return (
          <div className="flex items-center gap-1.5">
            <span>{meta.dot}</span>
            <span className="text-sm font-medium">{meta.label}</span>
          </div>
        );
      },
    },
    {
      id: 'created_at',
      header: CRM_LABELS.LIST_HEADER_CREATED,
      cell: (item) => (
        <div className="text-sm text-muted-foreground">
          {dayjs(item.created_at).format('DD/MM/YYYY HH:mm')}
        </div>
      ),
    },
  ];

  return (
    <DataTable
      data={data}
      columns={columns}
      isLoading={isLoading}
      rowKey={(item) => item.id}
      onRowClick={(item) => onSelectLead(item.id)}
      emptyStateTitle={CRM_LABELS.EMPTY_TITLE}
      emptyStateDescription={CRM_LABELS.EMPTY_DESC}
      pagination={{
        result: {
          data,
          total,
          page,
          pageSize: 20,
          totalPages: Math.ceil(total / 20),
        },
        onPageChange,
        itemLabel: CRM_LABELS.ITEM_LABEL,
      }}
      renderMobileCard={(item) => {
        const typeMeta = LEAD_TYPE_MAP[item.type];
        const statusMeta = LEAD_STATUS_MAP[item.status];
        return (
          <div className="bg-surface border border-border p-3 rounded-lg shadow-sm">
            <div className="flex justify-between items-start mb-2">
              <div>
                <div className="font-semibold">{item.customer_name}</div>
                <div className="text-xs text-muted-foreground">
                  <PhoneContact phone={item.phone} />
                </div>
              </div>
              {statusMeta ? (
                <div className="flex items-center gap-1">
                  <span className="text-xs">{statusMeta.dot}</span>
                  <span className="text-xs font-medium text-muted-foreground">
                    {statusMeta.label}
                  </span>
                </div>
              ) : null}
            </div>
            {typeMeta ? (
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${typeMeta.colorClass}`}
              >
                {typeMeta.label}
              </span>
            ) : null}
            <div className="mt-2 text-[10px] text-muted-subtle">
              {dayjs(item.created_at).format('DD/MM/YYYY HH:mm')}
            </div>
          </div>
        );
      }}
    />
  );
}
