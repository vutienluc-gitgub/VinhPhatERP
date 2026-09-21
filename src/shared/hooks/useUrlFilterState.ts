import { useState } from 'react';
export function useUrlFilterState<T>(initial: T) {
  const [filters, setFilters] = useState<T>(initial);
  return [filters, setFilters] as const;
}
