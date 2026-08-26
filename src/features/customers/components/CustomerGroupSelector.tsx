import { useMemo } from 'react';

import type { CustomerGroup } from '@/domain/crm/customer-groups.types';
import { CUSTOMER_FORM_LABELS } from '@/features/customers/customers.constants';
import { Button, Icon } from '@/shared/components';

export type CustomerGroupSelectorProps = {
  groups: CustomerGroup[];
  selectedGroupIds: string[];
  onChange: (groupIds: string[]) => void;
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
  disabled?: boolean;
};

export function CustomerGroupSelector({
  groups,
  selectedGroupIds,
  onChange,
  isLoading = false,
  isError = false,
  onRetry,
  disabled = false,
}: CustomerGroupSelectorProps) {
  // Business Rule: Chỉ hiển thị các nhóm active HOẶC nhóm inactive đã được gán trước đó
  const visibleGroups = useMemo(() => {
    return groups.filter(
      (group) =>
        group.status === 'active' || selectedGroupIds.includes(group.id),
    );
  }, [groups, selectedGroupIds]);

  const handleToggle = (id: string) => {
    if (disabled) return;
    if (selectedGroupIds.includes(id)) {
      onChange(selectedGroupIds.filter((item) => item !== id));
    } else {
      onChange(Array.from(new Set([...selectedGroupIds, id])));
    }
  };

  const selectedCount = selectedGroupIds.length;

  return (
    <div className="form-field">
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
          {CUSTOMER_FORM_LABELS.groupsLabel}
        </span>
        {selectedCount > 0 && (
          <span className="text-[11px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
            {CUSTOMER_FORM_LABELS.selectedCountPrefix}: {selectedCount}
          </span>
        )}
      </div>

      {isLoading ? (
        <div className="flex flex-wrap gap-2 p-3.5 bg-surface-secondary rounded-xl border border-default min-h-[90px] content-start">
          <div className="h-8 w-24 bg-surface rounded-lg animate-pulse border border-default" />
          <div className="h-8 w-32 bg-surface rounded-lg animate-pulse border border-default" />
          <div className="h-8 w-28 bg-surface rounded-lg animate-pulse border border-default" />
        </div>
      ) : isError ? (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 bg-danger-soft/30 rounded-xl border border-danger/30 min-h-[90px]">
          <div className="flex items-center gap-2 text-xs text-danger">
            <Icon name="alert-triangle" className="h-4 w-4 shrink-0" />
            <span>{CUSTOMER_FORM_LABELS.groupsLoadError}</span>
          </div>
          {onRetry && (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={onRetry}
              disabled={disabled}
              className="text-xs shrink-0"
            >
              {CUSTOMER_FORM_LABELS.groupRetryBtn}
            </Button>
          )}
        </div>
      ) : visibleGroups.length === 0 ? (
        <div className="p-3.5 bg-surface-secondary rounded-xl border border-default min-h-[90px] flex items-center justify-center">
          <span className="text-xs text-muted-foreground italic">
            {CUSTOMER_FORM_LABELS.noGroups}
          </span>
        </div>
      ) : (
        <div
          className={`flex flex-wrap gap-2 p-3.5 bg-surface-secondary rounded-xl border border-default h-full min-h-[90px] content-start ${
            disabled ? 'opacity-60 pointer-events-none' : ''
          }`}
        >
          {visibleGroups.map((g) => {
            const isSelected = selectedGroupIds.includes(g.id);
            return (
              <button
                key={g.id}
                type="button"
                aria-pressed={isSelected}
                disabled={disabled}
                onClick={() => handleToggle(g.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold transition-all min-h-[36px] touch-manipulation cursor-pointer ${
                  isSelected
                    ? 'bg-primary/10 border-primary text-foreground'
                    : 'bg-surface border-default text-muted-foreground hover:bg-surface-secondary'
                }`}
              >
                <span className="font-mono text-sm leading-none">
                  {isSelected ? '✓' : '+'}
                </span>
                <span>{g.name}</span>
                <span className="text-[10px] opacity-60 font-mono">
                  ({g.code})
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
