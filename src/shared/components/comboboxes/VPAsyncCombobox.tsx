import React, { useState, useEffect, forwardRef, useRef } from 'react';

import { VPVirtualCombobox, VPVirtualComboboxProps } from './VPVirtualCombobox';
import { VPBaseComboboxRef } from './VPBaseCombobox';

export interface VPAsyncComboboxProps<T> extends Omit<
  VPVirtualComboboxProps<T>,
  'options' | 'searchFn' | 'loading'
> {
  fetcher: (keyword: string) => Promise<T[]>;
  debounceMs?: number;
  initialOptions?: T[];
}

export const VPAsyncCombobox = forwardRef(
  <T,>(
    {
      fetcher,
      debounceMs = 300,
      initialOptions = [],
      onSearchChange,
      ...rest
    }: VPAsyncComboboxProps<T>,
    ref: React.ForwardedRef<VPBaseComboboxRef>,
  ) => {
    const [options, setOptions] = useState<T[]>(initialOptions);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');

    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
      setLoading(true);

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(async () => {
        try {
          const results = await fetcher(search);
          setOptions(results);
        } catch (error) {
          console.error('VPAsyncCombobox fetch error:', error);
        } finally {
          setLoading(false);
        }
      }, debounceMs);

      return () => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
      };
    }, [search, fetcher, debounceMs]);

    const handleSearchChange = (val: string) => {
      setSearch(val);
      onSearchChange?.(val);
    };

    return (
      <VPVirtualCombobox<T>
        {...rest}
        ref={ref}
        options={options}
        loading={loading}
        onSearchChange={handleSearchChange}
        // Bypass local filtering because server handles it
        searchFn={() => true}
      />
    );
  },
) as <T>(
  props: VPAsyncComboboxProps<T> & {
    ref?: React.ForwardedRef<VPBaseComboboxRef>;
  },
) => ReturnType<typeof VPVirtualCombobox>;
