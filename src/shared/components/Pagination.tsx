import type { PaginatedResult } from '@/shared/types/pagination'

type PaginationProps<T> = {
  result: PaginatedResult<T> | undefined
  onPageChange: (page: number) => void
}

export function Pagination<T>({ result, onPageChange }: PaginationProps<T>) {
  if (!result || result.totalPages <= 1) return null

  const { page, totalPages, total } = result
  const from = (page - 1) * result.pageSize + 1
  const to = Math.min(page * result.pageSize, total)

  return (
    <div className="pagination-bar">
      <span className="pagination-info">
        {from}–{to} / {total}
      </span>
      <div className="pagination-buttons">
        <button
          className="btn-secondary"
          type="button"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          ←
        </button>
        <span className="pagination-current">
          {page} / {totalPages}
        </span>
        <button
          className="btn-secondary"
          type="button"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          →
        </button>
      </div>
    </div>
  )
}
