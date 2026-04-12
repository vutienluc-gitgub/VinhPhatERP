import { formatPaginationText } from '@/features/raw-fabric/helpers';
import type { PaginatedResult } from '@/shared/types/pagination';

type PaginationProps<T> = {
  result: PaginatedResult<T> | undefined;
  onPageChange: (page: number) => void;
};

export function Pagination<T>({ result, onPageChange }: PaginationProps<T>) {
  if (!result || result.totalPages <= 1) return null;

  const { page, totalPages, total } = result;

  return (
    <div className="pagination-bar">
      <span className="text-sm">
        {formatPaginationText(page, totalPages, total)}
      </span>
      <div className="pagination-buttons">
        <button
          className="btn-secondary min-h-[44px] min-w-[44px]"
          type="button"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          ←
        </button>
        <button
          className="btn-secondary min-h-[44px] min-w-[44px]"
          type="button"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          →
        </button>
      </div>
    </div>
  );
}
