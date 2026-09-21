import React from 'react';
import { Button } from '@/shared/components/Button';
import { Badge } from '@/shared/components/Badge';
import { Edit2, Trash2, QrCode } from 'lucide-react';
import type { FabricCatalog } from '@/domain/settings/fabric-catalog.types';

export function useFabricCatalogColumns({
  onEdit,
  onDelete,
  onShowQR,
}: {
  onEdit: (catalog: FabricCatalog) => void;
  onDelete: (catalog: FabricCatalog) => void;
  onShowQR?: (catalog: FabricCatalog) => void;
}) {
  return [
    {
      header: 'Mã vải',
      accessorKey: 'code',
      className: 'font-semibold text-blue-600',
    },
    {
      header: 'Tên mẫu vải',
      accessorKey: 'name',
      className: 'font-medium',
    },
    {
      header: 'Thành phần',
      accessorKey: 'composition',
      cell: (row: FabricCatalog) => <span>{row.composition || '-'}</span>,
    },
    {
      header: 'Khổ / Định lượng',
      cell: (row: FabricCatalog) => (
        <span>{row.width ? `${row.width} cm` : ''} {row.weight ? `(${row.weight} gsm)` : ''}</span>
      ),
    },
    {
      header: 'Trạng thái',
      accessorKey: 'status',
      cell: (row: FabricCatalog) => (
        <Badge variant={row.status === 'active' ? 'success' : 'default'}>
          {row.status === 'active' ? 'Đang kinh doanh' : 'Tạm ngưng'}
        </Badge>
      ),
    },
    {
      header: 'Thao tác',
      cell: (row: FabricCatalog) => (
        <div className="flex items-center gap-1">
          {onShowQR && (
            <Button size="icon" variant="ghost" onClick={() => onShowQR(row)} title="Mã QR mẫu">
              <QrCode size={14} />
            </Button>
          )}
          <Button size="icon" variant="ghost" onClick={() => onEdit(row)} title="Chỉnh sửa">
            <Edit2 size={14} />
          </Button>
          <Button size="icon" variant="ghost" className="text-red-500" onClick={() => onDelete(row)} title="Xóa">
            <Trash2 size={14} />
          </Button>
        </div>
      ),
    },
  ];
}
