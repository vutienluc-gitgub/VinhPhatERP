import { useEffect, useState } from 'react';

import { Combobox } from '@/shared/components/Combobox';
import { ClearFilterButton } from '@/shared/components/ClearFilterButton';
import { Icon } from '@/shared/components/Icon';

import {
  QUALITY_GRADE_LABELS,
  QUALITY_GRADES,
  ROLL_STATUS_LABELS,
  ROLL_STATUSES,
} from './raw-fabric.module';
import {
  DEFAULT_FILTER_STATE,
  FilterState,
  isAnyFilterActive,
} from './helpers';
import type { RollStatus, QualityGrade } from './types';

export interface FilterBarProps {
  value: FilterState;
  onChange: (next: FilterState) => void;
  fabricTypeOptions: string[];
  resultCount?: number;
}

/**
 * FilterBar for Kho Vải Mộc.
 * - Loại vải: Combobox with allowInput (autocomplete, filters within 300ms via Combobox internals)
 * - Mã cuộn: plain input with 400ms debounce — auto-applies on stop typing, no blur needed
 * - Trạng thái / Chất lượng: Combobox dropdowns
 * - Xóa lọc: shown when isAnyFilterActive(value)
 * - Result count: shown when filter active and resultCount !== undefined
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 6.5
 */
export function FilterBar({
  value,
  onChange,
  fabricTypeOptions,
  resultCount,
}: FilterBarProps) {
  // Local state for roll code input — debounced before propagating
  const [rollCodeInput, setRollCodeInput] = useState(value.rollCode);

  // Sync local input when external value resets (e.g. clear filter)
  useEffect(() => {
    setRollCodeInput(value.rollCode);
  }, [value.rollCode]);

  // Debounce roll code: 400ms after user stops typing, auto-apply filter
  useEffect(() => {
    const timer = setTimeout(() => {
      if (rollCodeInput !== value.rollCode) {
        onChange({
          ...value,
          rollCode: rollCodeInput,
        });
      }
    }, 400);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rollCodeInput]);

  const fabricTypeComboOptions = fabricTypeOptions.map((ft) => ({
    value: ft,
    label: ft,
  }));

  const filterActive = isAnyFilterActive(value);

  function handleClear() {
    setRollCodeInput('');
    onChange(DEFAULT_FILTER_STATE);
  }

  return (
    <div className="space-y-3">
      {/* 4-column responsive grid — Requirements 6.5 */}
      <div className="filter-grid-premium">
        {/* Loại vải — Combobox with allowInput for autocomplete (Requirements 3.1, 3.2) */}
        <div className="filter-field">
          <label className="filter-label">Loại vải</label>
          <Combobox
            options={fabricTypeComboOptions}
            value={value.fabricType}
            onChange={(val) =>
              onChange({
                ...value,
                fabricType: val,
              })
            }
            placeholder="Tìm loại vải..."
            allowInput
          />
        </div>

        {/* Mã cuộn — debounced input, auto-applies on stop typing (Requirements 3.3) */}
        <div className="filter-field">
          <label className="filter-label">Mã cuộn</label>
          <div className="search-input-wrapper">
            <input
              className="field-input"
              type="text"
              placeholder="VD: BGR-001..."
              value={rollCodeInput}
              onChange={(e) => setRollCodeInput(e.target.value)}
            />
            <Icon name="Tag" size={16} className="search-input-icon" />
          </div>
        </div>

        {/* Trạng thái */}
        <div className="filter-field">
          <label className="filter-label">Trạng thái</label>
          <Combobox
            options={[
              {
                value: '',
                label: 'Tất cả trạng thái',
              },
              ...ROLL_STATUSES.map((s) => ({
                value: s,
                label: ROLL_STATUS_LABELS[s],
              })),
            ]}
            value={value.status}
            onChange={(val) =>
              onChange({
                ...value,
                status: (val as RollStatus) || '',
              })
            }
          />
        </div>

        {/* Chất lượng */}
        <div className="filter-field">
          <label className="filter-label">Chất lượng</label>
          <Combobox
            options={[
              {
                value: '',
                label: 'Tất cả loại',
              },
              ...QUALITY_GRADES.map((g) => ({
                value: g,
                label: QUALITY_GRADE_LABELS[g],
              })),
            ]}
            value={value.quality}
            onChange={(val) =>
              onChange({
                ...value,
                quality: (val as QualityGrade) || '',
              })
            }
          />
        </div>
      </div>

      {/* Clear button + result count (Requirements 3.4, 3.5, 3.6) */}
      {filterActive && (
        <div className="flex items-center gap-3 flex-wrap">
          <ClearFilterButton onClick={handleClear} label="Xóa lọc" />
          {resultCount !== undefined && (
            <span className="text-sm text-muted">
              Đang hiển thị {resultCount} cuộn
            </span>
          )}
        </div>
      )}
    </div>
  );
}
