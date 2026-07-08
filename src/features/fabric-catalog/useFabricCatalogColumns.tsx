import { useMemo, type SyntheticEvent } from 'react';
import { Link } from 'react-router-dom';
import type { ColumnDef } from '@tanstack/react-table';

import { Badge, Button, Icon, ActionBar } from '@/shared/components';
import { FABRIC_CATALOG_STATUS_LABELS } from '@/schema/fabric-catalog.schema';

import {
  LABELS,
  PUBLIC_PAGE_LABELS,
  ROUTE_FABRIC_CATALOG,
} from './fabric-catalog.constants';
import { getStatusVariant } from './fabric-catalog.helpers';
import type { FabricCatalog } from './types';
import { FabricCategoryBadge } from './components/FabricCategoryBadge';
import { ThumbnailCell } from './components/ThumbnailCell';

type UseFabricCatalogColumnsProps = {
  onEdit: (catalog: FabricCatalog) => void;
  setQrCatalog: (catalog: FabricCatalog) => void;
  handleDelete: (catalog: FabricCatalog) => void;
  isDeleting: boolean;
};

export function useFabricCatalogColumns({
  onEdit,
  setQrCatalog,
  handleDelete,
  isDeleting,
}: UseFabricCatalogColumnsProps) {
  const iconBtnClass = 'w-8 h-8 rounded-md hover:bg-surface-subtle';

  return useMemo<ColumnDef<FabricCatalog>[]>(
    () => [
      {
        id: 'thumbnail',
        header: '',
        meta: { className: 'w-20' },
        cell: ({ row }) => <ThumbnailCell catalog={row.original} />,
      },
      {
        accessorKey: 'code',
        header: LABELS.CODE,
        cell: ({ row }) => (
          <Link
            to={`${ROUTE_FABRIC_CATALOG}/${row.original.id}`}
            className="font-bold text-primary hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            {row.original.code}
          </Link>
        ),
      },
      {
        id: 'category',
        header: LABELS.CATEGORY,
        cell: ({ row }) => (
          <FabricCategoryBadge category={row.original.category} />
        ),
      },
      {
        accessorKey: 'name',
        header: LABELS.NAME,
        cell: ({ row }) => (
          <Link
            to={`${ROUTE_FABRIC_CATALOG}/${row.original.id}`}
            className="font-medium hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            {row.original.name}
          </Link>
        ),
      },
      {
        accessorKey: 'composition',
        header: LABELS.COMPOSITION,
        cell: ({ row }) => {
          const tags = row.original.composition_tags;
          const fallback = row.original.composition;
          const displayValue =
            tags && tags.length > 0 ? tags.join(', ') : fallback;
          return (
            <span className="text-muted-foreground text-sm">
              {displayValue ?? LABELS.NA}
            </span>
          );
        },
      },
      {
        id: 'specs',
        header: LABELS.SPECS,
        enableSorting: false,
        cell: ({ row }) => {
          const c = row.original;
          return (
            <div className="flex flex-wrap gap-1.5 items-center">
              {c.target_width_cm ? (
                <Badge variant="gray" className="text-xs font-normal">
                  {LABELS.WIDTH}:{' '}
                  <span className="font-medium ml-1 text-foreground">
                    {c.target_width_cm} {PUBLIC_PAGE_LABELS.unitCm}
                  </span>
                </Badge>
              ) : null}
              {c.target_gsm ? (
                <Badge variant="gray" className="text-xs font-normal">
                  {LABELS.GSM}:{' '}
                  <span className="font-medium ml-1 text-foreground">
                    {c.target_gsm} {PUBLIC_PAGE_LABELS.unitGsm}
                  </span>
                </Badge>
              ) : null}
              {!c.target_width_cm && !c.target_gsm && (
                <span className="text-muted-foreground">{LABELS.NA}</span>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: 'unit',
        header: LABELS.UNIT,
        cell: ({ row }) => <span className="text-sm">{row.original.unit}</span>,
      },
      {
        accessorKey: 'status',
        header: LABELS.STATUS,
        cell: ({ row }) => {
          const c = row.original;
          return (
            <Badge variant={getStatusVariant(c.status)}>
              {FABRIC_CATALOG_STATUS_LABELS[c.status]}
            </Badge>
          );
        },
      },
      {
        id: 'actions',
        header: () => <div className="text-right">{LABELS.ACTIONS}</div>,
        meta: { className: 'text-right' },
        cell: ({ row }) => {
          const c = row.original;
          return (
            <div className="flex items-center justify-end gap-1 relative">
              {/* Desktop Quick Actions on Hover */}
              <div className="hidden md:flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity absolute right-12 bg-surface px-1 shadow-sm rounded-lg border border-border">
                <Button
                  variant="ghost"
                  size="icon"
                  className={iconBtnClass}
                  onClick={(e: SyntheticEvent) => {
                    e.stopPropagation();
                    onEdit(c);
                  }}
                  title={LABELS.EDIT}
                >
                  <Icon
                    name="Pencil"
                    size={14}
                    className="text-muted-foreground"
                  />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className={iconBtnClass}
                  onClick={(e: SyntheticEvent) => {
                    e.stopPropagation();
                    setQrCatalog(c);
                  }}
                  title={LABELS.PRINT_QR}
                >
                  <Icon
                    name="QrCode"
                    size={14}
                    className="text-muted-foreground"
                  />
                </Button>
              </div>

              {/* Common 3-dots Menu */}
              <ActionBar
                actions={[
                  {
                    icon: 'Pencil',
                    onClick: () => onEdit(c),
                    title: LABELS.EDIT,
                  },
                  {
                    icon: 'QrCode',
                    onClick: () => setQrCatalog(c),
                    title: LABELS.PRINT_QR,
                  },
                  {
                    icon: 'Trash2',
                    onClick: () => handleDelete(c),
                    title: LABELS.DELETE,
                    variant: 'danger',
                    disabled: isDeleting,
                  },
                ]}
              />
            </div>
          );
        },
      },
    ],
    [onEdit, setQrCatalog, handleDelete, isDeleting],
  );
}
