import React, { useState, useEffect, forwardRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';

import { cn } from '@/shared/utils/cn';
import { Icon } from '@/shared/components';

import {
  VPBaseComboboxGeneric,
  VPBaseComboboxProps,
  VPBaseComboboxRef,
} from './VPBaseCombobox';

export interface VPVirtualComboboxProps<T> extends Omit<
  VPBaseComboboxProps<T>,
  'renderList'
> {
  renderOption?: (
    option: T,
    isSelected: boolean,
    isFocused: boolean,
  ) => React.ReactNode;
  itemHeight?: number;
  overscan?: number;
}

export const VPVirtualCombobox = forwardRef(
  <T,>(
    props: VPVirtualComboboxProps<T>,
    ref: React.ForwardedRef<VPBaseComboboxRef>,
  ) => {
    const { itemHeight = 40, overscan = 5, renderOption, ...baseProps } = props;

    return (
      <VPBaseComboboxGeneric<T>
        {...baseProps}
        ref={ref}
        renderList={({
          filteredOptions,
          focusedIndex,
          onSelect,
          setFocusedIndex,
        }) => {
          return (
            <VirtualList<T>
              filteredOptions={filteredOptions}
              focusedIndex={focusedIndex}
              onSelect={onSelect}
              setFocusedIndex={setFocusedIndex}
              itemHeight={itemHeight}
              overscan={overscan}
              renderOption={renderOption}
              getOptionValue={baseProps.getOptionValue}
              getOptionLabel={baseProps.getOptionLabel}
              selectedValue={baseProps.value}
            />
          );
        }}
      />
    );
  },
) as <T>(
  props: VPVirtualComboboxProps<T> & {
    ref?: React.ForwardedRef<VPBaseComboboxRef>;
  },
) => ReturnType<typeof VPBaseComboboxGeneric>;

interface VirtualListProps<T> {
  filteredOptions: T[];
  focusedIndex: number;
  onSelect: (option: T) => void;
  setFocusedIndex: (index: number) => void;
  itemHeight: number;
  overscan: number;
  renderOption?: (
    option: T,
    isSelected: boolean,
    isFocused: boolean,
  ) => React.ReactNode;
  getOptionValue: (option: T) => string;
  getOptionLabel: (option: T) => string;
  selectedValue?: string;
}

function VirtualList<T>({
  filteredOptions,
  focusedIndex,
  onSelect,
  setFocusedIndex,
  itemHeight,
  overscan,
  renderOption,
  getOptionValue,
  getOptionLabel,
  selectedValue,
}: VirtualListProps<T>) {
  const [scrollElement, setScrollElement] = useState<HTMLDivElement | null>(
    null,
  );

  const rowVirtualizer = useVirtualizer({
    count: filteredOptions.length,
    getScrollElement: () => scrollElement,
    estimateSize: () => itemHeight,
    overscan,
  });

  // Scroll to focused item when using keyboard navigation
  useEffect(() => {
    if (
      focusedIndex >= 0 &&
      focusedIndex < filteredOptions.length &&
      scrollElement
    ) {
      rowVirtualizer.scrollToIndex(focusedIndex, { align: 'auto' });
    }
  }, [focusedIndex, scrollElement, rowVirtualizer, filteredOptions.length]);

  return (
    <div
      ref={setScrollElement}
      className="h-full w-full overflow-y-auto"
      style={{ maxHeight: '250px' }}
      role="presentation"
    >
      <div
        style={{
          height: `${rowVirtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
        role="presentation"
      >
        {rowVirtualizer.getVirtualItems().map((virtualRow) => {
          const opt = filteredOptions[virtualRow.index];
          if (!opt) return null;

          const isSelected = getOptionValue(opt) === selectedValue;
          const isFocused = virtualRow.index === focusedIndex;
          const id = `vp-combo-opt-${virtualRow.index}`;

          return (
            <div
              key={virtualRow.key}
              data-index={virtualRow.index}
              ref={rowVirtualizer.measureElement}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                transform: `translateY(${virtualRow.start}px)`,
              }}
              role="presentation"
            >
              <div
                id={id}
                role="option"
                aria-selected={isSelected}
                className={cn(
                  'relative flex w-full cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none',
                  isSelected && 'bg-surface-selected',
                  isFocused && !isSelected && 'bg-surface-hover',
                  !isSelected && !isFocused && 'hover:bg-surface-hover',
                )}
                onMouseEnter={() => setFocusedIndex(virtualRow.index)}
                onClick={() => onSelect(opt)}
              >
                {renderOption ? (
                  renderOption(opt, isSelected, isFocused)
                ) : (
                  <div className="flex w-full items-center justify-between">
                    <span className="truncate">{getOptionLabel(opt)}</span>
                    {isSelected && (
                      <Icon
                        name="Check"
                        className="h-4 w-4 shrink-0 text-foreground"
                      />
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
