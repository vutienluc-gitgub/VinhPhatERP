import React from 'react';

import type { FabricRollPackingItem } from '@/domain/inventory/packing-list.types';
import { FabricPackingCheckoffBar } from '@/features/finished-fabric/components/FabricPackingCheckoffBar';
import { FabricPackingStatsCards } from '@/features/finished-fabric/components/FabricPackingStatsCards';
import { FabricRollMatrixGrid } from '@/features/finished-fabric/components/FabricRollMatrixGrid';
import { FabricRollTableView } from '@/features/finished-fabric/components/FabricRollTableView';
import { FabricRollMatrixTable } from '@/shared/components/fabric-roll/FabricRollMatrixTable';
import {
  useFabricPackingList,
  type PackingListViewMode,
} from '@/features/finished-fabric/hooks/useFabricPackingList';
import { PACKING_LIST_TEXT } from '@/features/finished-fabric/packing-list.constants';
import { Icon } from '@/shared/components/Icon';
import { cn } from '@/shared/utils/cn';

export interface FabricRollPackingTableProps {
  rolls: FabricRollPackingItem[];
  title?: string;
  subtitle?: string;
  defaultViewMode?: PackingListViewMode;
  onPrint?: () => void;
  onRollClick?: (roll: FabricRollPackingItem) => void;
  interactive?: boolean;
}

export const FabricRollPackingTable: React.FC<FabricRollPackingTableProps> = ({
  rolls: initialRolls,
  title = PACKING_LIST_TEXT.TITLE,
  subtitle = PACKING_LIST_TEXT.SUBTITLE,
  defaultViewMode = 'grid',
  onPrint,
  onRollClick,
  interactive = true,
}) => {
  const {
    groupedSummary,
    overallSummary,
    availableColors,
    viewMode,
    setViewMode,
    searchQuery,
    setSearchQuery,
    selectedColor,
    setSelectedColor,
    scanInput,
    setScanInput,
    scanNotification,
    handleScan,
    handleResetCheckoff,
    handleExportCsv,
  } = useFabricPackingList({ initialRolls, defaultViewMode });

  if (initialRolls.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 rounded-xl border border-dashed border-border bg-surface text-center">
        <div className="w-12 h-12 rounded-full bg-surface-secondary text-muted flex items-center justify-center mb-3">
          <Icon name="Inbox" size={24} />
        </div>
        <h3 className="text-sm font-bold text-foreground">
          {PACKING_LIST_TEXT.EMPTY_TITLE}
        </h3>
        <p className="text-xs text-muted mt-1 max-w-sm">
          {PACKING_LIST_TEXT.EMPTY_SUBTITLE}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Top Header Card: Title + Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-border bg-surface">
        <div>
          <h2 className="text-base font-bold text-foreground flex items-center gap-2">
            <span>{title}</span>
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary">
              {overallSummary.total_rolls} cây
            </span>
          </h2>
          {subtitle && <p className="text-xs text-muted mt-0.5">{subtitle}</p>}
        </div>

        {/* Global actions: Mode toggle, Print, Export */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center rounded-lg border border-border p-0.5 bg-surface-secondary">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={cn(
                'flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold transition-all',
                viewMode === 'grid'
                  ? 'bg-surface text-foreground shadow-xs'
                  : 'text-muted hover:text-foreground',
              )}
              title={PACKING_LIST_TEXT.VIEW_GRID}
            >
              <Icon name="Grid" size={13} />
              <span className="hidden sm:inline">Lưới thẻ</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('matrix')}
              className={cn(
                'flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold transition-all',
                viewMode === 'matrix'
                  ? 'bg-surface text-foreground shadow-xs'
                  : 'text-muted hover:text-foreground',
              )}
              title={PACKING_LIST_TEXT.VIEW_A5_MATRIX}
            >
              <Icon name="LayoutGrid" size={13} />
              <span className="hidden sm:inline">Ma trận A5</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={cn(
                'flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold transition-all',
                viewMode === 'table'
                  ? 'bg-surface text-foreground shadow-xs'
                  : 'text-muted hover:text-foreground',
              )}
              title={PACKING_LIST_TEXT.VIEW_TABLE}
            >
              <Icon name="Table" size={13} />
              <span className="hidden sm:inline">Bảng</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => handleExportCsv(title)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-surface text-xs font-semibold text-foreground hover:bg-surface-secondary transition-colors"
          >
            <Icon name="Download" size={14} />
            <span className="hidden md:inline">
              {PACKING_LIST_TEXT.BTN_EXPORT_EXCEL}
            </span>
          </button>

          {onPrint && (
            <button
              type="button"
              onClick={onPrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors"
            >
              <Icon name="Printer" size={14} />
              <span>{PACKING_LIST_TEXT.BTN_PRINT}</span>
            </button>
          )}
        </div>
      </div>

      {/* Aggregate Stats Cards */}
      <FabricPackingStatsCards summary={overallSummary} />

      {/* Interactive Scan Check-off Bar */}
      {interactive && (
        <FabricPackingCheckoffBar
          totalRolls={overallSummary.total_rolls}
          checkedRolls={overallSummary.total_checked_rolls}
          totalWeight={overallSummary.total_weight_kg}
          checkedWeight={overallSummary.total_checked_weight_kg}
          percentage={overallSummary.checkoff_percentage}
          scanInput={scanInput}
          onScanInputChange={setScanInput}
          onScanSubmit={() => handleScan()}
          onReset={handleResetCheckoff}
          notification={scanNotification}
        />
      )}

      {/* Filter toolbar: Search & Color tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="relative flex-1 max-w-sm">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted">
            <Icon name="Search" size={14} />
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={PACKING_LIST_TEXT.SEARCH_PLACEHOLDER}
            className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-border bg-surface text-xs text-foreground placeholder:text-muted focus:outline-hidden focus:ring-1 focus:ring-primary transition-all"
          />
        </div>

        {availableColors.length > 1 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            <button
              type="button"
              onClick={() => setSelectedColor('all')}
              className={cn(
                'px-2.5 py-1 rounded-md text-xs font-semibold whitespace-nowrap transition-colors',
                selectedColor === 'all'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-surface border border-border text-muted hover:text-foreground',
              )}
            >
              Tất cả ({overallSummary.total_rolls})
            </button>
            {availableColors.map((color) => {
              const grp = groupedSummary.find((g) => g.color_name === color);
              const count = grp ? grp.total_rolls : 0;
              return (
                <button
                  key={color}
                  type="button"
                  onClick={() => setSelectedColor(color)}
                  className={cn(
                    'px-2.5 py-1 rounded-md text-xs font-semibold whitespace-nowrap transition-colors',
                    selectedColor === color
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-surface border border-border text-muted hover:text-foreground',
                  )}
                >
                  {color} ({count})
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Main Roll Content by Group */}
      <div className="flex flex-col gap-4">
        {groupedSummary.map((group) => (
          <div
            key={group.group_key}
            className="flex flex-col gap-2.5 p-3.5 rounded-xl border border-border/80 bg-surface/50"
          >
            {/* Group Header */}
            <div className="flex items-center justify-between text-xs pb-2 border-b border-border/60">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-primary" />
                <span className="font-bold text-foreground">
                  {group.color_name}
                </span>
                {group.lot_number && (
                  <span className="text-[11px] text-muted">
                    (Lô: {group.lot_number})
                  </span>
                )}
              </div>
              <div className="text-muted font-medium flex items-center gap-2 text-[11px]">
                <span>
                  <strong>{group.total_rolls}</strong> cây
                </span>
                <span>•</span>
                <span>
                  <strong>{group.total_weight_kg}</strong> kg
                </span>
                <span>•</span>
                <span>
                  TB: <strong>{group.average_weight_kg}</strong> kg/cây
                </span>
              </div>
            </div>

            {/* View Mode rendering */}
            {viewMode === 'matrix' ? (
              <FabricRollMatrixTable
                rolls={group.rolls}
                rollsPerRow={10}
                showSubtotal={true}
                interactive={interactive}
                onRollClick={onRollClick}
                onToggleCheck={(roll) => handleScan(roll.roll_code)}
              />
            ) : viewMode === 'grid' ? (
              <FabricRollMatrixGrid
                rolls={group.rolls}
                onRollClick={onRollClick}
                onToggleCheck={(roll) => handleScan(roll.roll_code)}
                interactive={interactive}
              />
            ) : (
              <FabricRollTableView
                rolls={group.rolls}
                onRollClick={onRollClick}
                onToggleCheck={(roll) => handleScan(roll.roll_code)}
                interactive={interactive}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
