import { useCallback, useMemo, useState } from 'react';

import type {
  FabricRollPackingItem,
  PackingListFilter,
} from '@/domain/inventory/packing-list.types';
import {
  calculatePackingSummary,
  exportPackingListToCsvContent,
  filterPackingRolls,
  groupRollsByColorAndBatch,
  processRollCheckoff,
} from '@/domain/inventory/packing-list.utils';

export type PackingListViewMode = 'table' | 'grid';

export interface UseFabricPackingListProps {
  initialRolls: FabricRollPackingItem[];
  defaultViewMode?: PackingListViewMode;
}

export function useFabricPackingList({
  initialRolls,
  defaultViewMode = 'grid',
}: UseFabricPackingListProps) {
  const [rolls, setRolls] = useState<FabricRollPackingItem[]>(initialRolls);
  const [viewMode, setViewMode] =
    useState<PackingListViewMode>(defaultViewMode);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedColor, setSelectedColor] = useState<string>('all');
  const [selectedGrade, setSelectedGrade] = useState<string>('all');
  const [checkedStatus, setCheckedStatus] = useState<
    'all' | 'checked' | 'unchecked'
  >('all');
  const [scanInput, setScanInput] = useState('');
  const [scanNotification, setScanNotification] = useState<{
    text: string;
    type: 'success' | 'error' | 'warning';
  } | null>(null);

  // Sync state if initialRolls changes from parent
  const handleSetRolls = useCallback((newRolls: FabricRollPackingItem[]) => {
    setRolls(newRolls);
  }, []);

  const activeFilter = useMemo<PackingListFilter>(
    () => ({
      search_query: searchQuery,
      color_name: selectedColor !== 'all' ? selectedColor : undefined,
      grade: selectedGrade !== 'all' ? selectedGrade : undefined,
      checked_status: checkedStatus,
    }),
    [searchQuery, selectedColor, selectedGrade, checkedStatus],
  );

  const filteredRolls = useMemo(
    () => filterPackingRolls(rolls, activeFilter),
    [rolls, activeFilter],
  );

  const groupedSummary = useMemo(
    () => groupRollsByColorAndBatch(filteredRolls),
    [filteredRolls],
  );

  const overallSummary = useMemo(() => calculatePackingSummary(rolls), [rolls]);

  const availableColors = useMemo(() => {
    const set = new Set<string>();
    for (const r of rolls) {
      if (r.color_name?.trim()) set.add(r.color_name.trim());
    }
    return Array.from(set);
  }, [rolls]);

  const handleScan = useCallback(
    (codeToScan?: string) => {
      const code = (codeToScan ?? scanInput).trim();
      if (!code) return;

      const result = processRollCheckoff(rolls, code);
      if (result.success) {
        setRolls(result.updated_rolls);
        setScanNotification({ text: result.message, type: 'success' });
        setScanInput('');
      } else if (result.already_checked) {
        setScanNotification({ text: result.message, type: 'warning' });
      } else {
        setScanNotification({ text: result.message, type: 'error' });
      }
    },
    [rolls, scanInput],
  );

  const handleResetCheckoff = useCallback(() => {
    setRolls((prev) =>
      prev.map((r) => ({ ...r, checked: false, checked_at: null })),
    );
    setScanNotification(null);
  }, []);

  const handleExportCsv = useCallback(
    (customTitle?: string) => {
      const csv = exportPackingListToCsvContent(filteredRolls, customTitle);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `packing-list-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    },
    [filteredRolls],
  );

  return {
    rolls,
    setRolls: handleSetRolls,
    filteredRolls,
    groupedSummary,
    overallSummary,
    availableColors,
    viewMode,
    setViewMode,
    searchQuery,
    setSearchQuery,
    selectedColor,
    setSelectedColor,
    selectedGrade,
    setSelectedGrade,
    checkedStatus,
    setCheckedStatus,
    scanInput,
    setScanInput,
    scanNotification,
    handleScan,
    handleResetCheckoff,
    handleExportCsv,
  };
}
