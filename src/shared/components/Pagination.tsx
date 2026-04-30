import { Button } from '@/shared/components';
import type { PaginatedResult } from '@/shared/types/pagination';

const PAGINATION_LABELS = {
  pageInfo: (page: number, totalPages: number, total: number) =>
    `Trang ${page} / ${totalPages} — ${total} mục`,
} as const;

type PaginationProps<T> = {
  result: PaginatedResult<T> | undefined;
  onPageChange: (page: number) => void;
  /** Custom label for total count, e.g. "cuộn", "đơn hàng". Default: "mục" */
  itemLabel?: string;
};

function formatPaginationText(
  page: number,
  totalPages: number,
  total: number,
  itemLabel?: string,
): string {
  if (itemLabel) {
    return `Trang ${page} / ${totalPages} — ${total} ${itemLabel}`;
  }
  return PAGINATION_LABELS.pageInfo(page, totalPages, total);
}

export function Pagination<T>({
  result,
  onPageChange,
  itemLabel,
}: PaginationProps<T>) {
  if (!result || result.totalPages <= 1) return null;

  const { page, totalPages, total } = result;

  return (
    <div className="pagination-bar">
      <span className="text-sm">
        {formatPaginationText(page, totalPages, total, itemLabel)}
      </span>
      <div className="pagination-buttons">
        <Button
          variant="secondary"
          className="min-h-[44px] min-w-[44px]"
          type="button"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          {' '}
          ←
        </Button>
        <Button
          variant="secondary"
          className="min-h-[44px] min-w-[44px]"
          type="button"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          {' '}
          →
        </Button>
      </div>
    </div>
  );
}
