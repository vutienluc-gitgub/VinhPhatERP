import { type ColumnDef } from '@tanstack/react-table';

import { Badge, type DataTableColumn } from '@/shared/components';
import { WeightText, LengthText } from '@/shared/value';
import type { InventoryBreakdownRow, AgingRoll } from '@/application/inventory';
import { AGING_CONFIG, getAgingSeverity } from '@/domain/inventory';
import { INVENTORY_MESSAGES as MSG } from '@/features/inventory/inventory.constants';

export const useAgingColumns = (): DataTableColumn<AgingRoll>[] => [
  {
    header: MSG.COL_ROLL_CODE,
    cell: (r) => (
      <span className="font-bold text-primary">{r.roll_number}</span>
    ),
  },
  {
    header: MSG.COL_TYPE,
    cell: (r) => (
      <Badge variant="gray">
        {r.source === 'raw' ? MSG.VAL_RAW : MSG.VAL_FIN}
      </Badge>
    ),
  },
  {
    header: MSG.COL_FABRIC,
    cell: (r) => <span className="font-medium">{r.fabric_type}</span>,
  },
  {
    header: MSG.COL_COLOR,
    cell: (r) => r.color_name ?? '—',
    className: 'max-sm:hidden text-muted text-sm',
  },
  {
    header: MSG.COL_LOCATION,
    cell: (r) => r.warehouse_location ?? '—',
    className: 'max-sm:hidden text-muted text-sm',
  },
  {
    header: MSG.COL_AGE_DAYS,
    cell: (r) => (
      <span className="font-bold tabular-nums">
        {r.age_days} {MSG.DAYS}
      </span>
    ),
    className: 'text-right',
  },
  {
    header: MSG.COL_SEVERITY,
    cell: (r) => {
      const sev = getAgingSeverity(r.age_days);
      const cfg = AGING_CONFIG[sev];
      return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
    },
  },
];

export const useBreakdownColumns = (): ColumnDef<
  InventoryBreakdownRow,
  unknown
>[] => [
  {
    header: MSG.COL_FABRIC,
    id: 'fabric_type',
    accessorKey: 'fabric_type',
    cell: ({ row }) => (
      <span className="font-bold">{row.original.fabric_type ?? '—'}</span>
    ),
  },
  {
    header: MSG.COL_COLOR,
    id: 'color_name',
    accessorKey: 'color_name',
    cell: ({ row }) => row.original.color_name ?? '—',
    meta: { className: 'max-sm:hidden text-muted text-sm' },
  },
  {
    header: MSG.COL_QUALITY,
    id: 'quality_grade',
    accessorKey: 'quality_grade',
    cell: ({ row }) =>
      row.original.quality_grade ? (
        <span className={`grade-badge grade-${row.original.quality_grade}`}>
          {row.original.quality_grade}
        </span>
      ) : (
        <span className="text-muted">—</span>
      ),
  },
  {
    header: MSG.COL_ROLL_COUNT,
    id: 'roll_count',
    accessorKey: 'roll_count',
    cell: ({ row }) => row.original.roll_count ?? 0,
    meta: { className: 'text-right' },
  },
  {
    header: MSG.COL_LENGTH,
    id: 'total_length_m',
    accessorKey: 'total_length_m',
    cell: ({ row }) => <LengthText value={row.original.total_length_m ?? 0} />,
    meta: { className: 'text-right max-sm:hidden font-medium' },
  },
  {
    header: MSG.COL_WEIGHT,
    id: 'total_weight_kg',
    accessorKey: 'total_weight_kg',
    cell: ({ row }) => <WeightText value={row.original.total_weight_kg ?? 0} />,
    meta: { className: 'text-right' },
  },
];
