import { Button } from '@/shared/components';
import { PageSizeSelect } from '@/shared/components/PageSizeSelect';
import type { PaginatedResult } from '@/shared/types/pagination';
import { TABLE_LABELS } from '@/shared/constants/ui.constants';

type PaginationProps<T> = {
  result: PaginatedResult<T> | undefined;
  onPageChange: (page: number) => void;
  /** Custom label for total count, e.g. "cuộn", "đơn hàng". Default: "mục" */
  itemLabel?: string;
  onPageSizeChange?: (size: number) => void;
};

function formatPaginationText(
  page: number,
  pageSize: number,
  total: number,
  itemLabel?: string,
): string {
  if (total === 0) return '';
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);
  const label = itemLabel || TABLE_LABELS.RECORDS;
  return `${TABLE_LABELS.SHOWING} ${from} - ${to} ${TABLE_LABELS.OF_TOTAL} ${total} ${label}`;
}

export function Pagination<T>({
  result,
  onPageChange,
  itemLabel,
  onPageSizeChange,
}: PaginationProps<T>) {
  if (!result || result.total === 0) return null;

  const { page, pageSize, total, totalPages } = result;

  return (
    <div className="pagination-bar flex items-center justify-between">
      <div className="flex items-center gap-6">
        <span className="text-sm text-muted">
          {formatPaginationText(page, pageSize, total, itemLabel)}
        </span>
        {onPageSizeChange && result.pageSize && (
          <PageSizeSelect
            value={result.pageSize}
            onValueChange={onPageSizeChange}
            options={[20, 50, 100]}
          />
        )}
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          className="w-8 h-8 rounded-lg"
          type="button"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          leftIcon="ChevronLeft"
        />
        <span className="text-sm font-medium px-2">
          {page} / {totalPages}
        </span>
        <Button
          variant="outline"
          size="icon"
          className="w-8 h-8 rounded-lg"
          type="button"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          leftIcon="ChevronRight"
        />
      </div>
    </div>
  );
}
