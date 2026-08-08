import { useMemo } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import type { CellContext } from '@tanstack/react-table';

import { Badge } from '@/shared/components';
import type { ColorRow } from '@/schema/color.schema';
import { getColorHex } from '@/schema/color.schema';
import {
  COLOR_CATALOG_MESSAGES as MSG,
  getColorGroupVariant,
} from '@/features/color-catalog/color-catalog.constants';

export const useColorColumns = (): ColumnDef<ColorRow, unknown>[] => {
  return useMemo(
    () => [
      {
        id: 'code',
        header: MSG.COL_CODE,
        accessorKey: 'code',
        cell: (info: CellContext<ColorRow, unknown>) => {
          const code = info.getValue() as string;
          return (
            <div className="flex items-center gap-3">
              <span
                title={getColorHex(code)}
                className="inline-block w-4 h-4 rounded-full border-[1.5px] border-border shrink-0"
                style={{ background: getColorHex(code) }}
              />
              <span className="font-mono text-xs font-bold text-foreground">
                {code}
              </span>
            </div>
          );
        },
      },
      {
        id: 'name',
        header: MSG.COL_NAME,
        accessorKey: 'name',
        cell: (info: CellContext<ColorRow, unknown>) => (
          <span className="font-medium">{info.getValue() as string}</span>
        ),
      },
      {
        id: 'group',
        header: MSG.COL_TREND,
        accessorKey: 'color_group',
        cell: (info: CellContext<ColorRow, unknown>) => {
          const group = info.getValue() as string;
          if (!group) return <span className="text-muted-foreground">—</span>;

          return (
            <Badge
              variant={getColorGroupVariant(group)}
              className="text-[10px]"
            >
              {group}
            </Badge>
          );
        },
      },
    ],
    [],
  );
};
