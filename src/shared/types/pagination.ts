export type PaginationState = {
  page: number;
  pageSize: number;
};

export type PaginatedResult<T> = {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export const DEFAULT_PAGE_SIZE = 50;
