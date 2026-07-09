import { renderHook } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';

import { useUrlFilterState } from './useUrlFilterState';

/**
 * Test wrapper that provides React Router context
 */
function createWrapper(initialUrl = '/') {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <MemoryRouter
        initialEntries={[initialUrl]}
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        {children}
      </MemoryRouter>
    );
  };
}

describe('useUrlFilterState with default values', () => {
  it('should apply default when param not in URL', () => {
    const { result } = renderHook(
      () => useUrlFilterState(['status'] as const, { status: 'active' }),
      { wrapper: createWrapper('/suppliers') },
    );

    expect(result.current.filters.status).toBe('active');
  });

  it('should not apply default when param is empty string', () => {
    const { result } = renderHook(
      () => useUrlFilterState(['status'] as const, { status: 'active' }),
      { wrapper: createWrapper('/suppliers?status=') },
    );

    // Empty string should be treated as undefined (user wants to see all)
    expect(result.current.filters.status).toBeUndefined();
  });

  it('should not apply default when param has value', () => {
    const { result } = renderHook(
      () => useUrlFilterState(['status'] as const, { status: 'active' }),
      { wrapper: createWrapper('/suppliers?status=inactive') },
    );

    expect(result.current.filters.status).toBe('inactive');
  });

  it('should apply defaults for multiple keys', () => {
    const { result } = renderHook(
      () =>
        useUrlFilterState(['status', 'category'] as const, {
          status: 'active',
          category: 'fabric',
        }),
      { wrapper: createWrapper('/suppliers') },
    );

    expect(result.current.filters.status).toBe('active');
    expect(result.current.filters.category).toBe('fabric');
  });

  it('should apply default only for missing keys', () => {
    const { result } = renderHook(
      () =>
        useUrlFilterState(['status', 'category'] as const, {
          status: 'active',
          category: 'fabric',
        }),
      { wrapper: createWrapper('/suppliers?status=inactive') },
    );

    // status is in URL, should use URL value
    expect(result.current.filters.status).toBe('inactive');
    // category is not in URL, should use default
    expect(result.current.filters.category).toBe('fabric');
  });

  it('should work without defaults parameter', () => {
    const { result } = renderHook(
      () => useUrlFilterState(['status'] as const),
      { wrapper: createWrapper('/suppliers') },
    );

    expect(result.current.filters.status).toBeUndefined();
  });

  it('should handle keys not in defaults object', () => {
    const { result } = renderHook(
      () =>
        useUrlFilterState(['status', 'search'] as const, { status: 'active' }),
      { wrapper: createWrapper('/suppliers') },
    );

    expect(result.current.filters.status).toBe('active');
    expect(result.current.filters.search).toBeUndefined();
  });

  it('should distinguish between empty string and missing param', () => {
    // Test case 1: param not in URL
    const { result: result1 } = renderHook(
      () => useUrlFilterState(['status'] as const, { status: 'active' }),
      { wrapper: createWrapper('/suppliers') },
    );
    expect(result1.current.filters.status).toBe('active');

    // Test case 2: param is empty string (?status=)
    const { result: result2 } = renderHook(
      () => useUrlFilterState(['status'] as const, { status: 'active' }),
      { wrapper: createWrapper('/suppliers?status=') },
    );
    expect(result2.current.filters.status).toBeUndefined();

    // Test case 3: param has value
    const { result: result3 } = renderHook(
      () => useUrlFilterState(['status'] as const, { status: 'active' }),
      { wrapper: createWrapper('/suppliers?status=inactive') },
    );
    expect(result3.current.filters.status).toBe('inactive');
  });

  it('should preserve other URL params when applying defaults', () => {
    const { result } = renderHook(
      () => useUrlFilterState(['status'] as const, { status: 'active' }),
      { wrapper: createWrapper('/suppliers?page=2&search=test') },
    );

    // Default should be applied for status
    expect(result.current.filters.status).toBe('active');
    // Other params should not be in filters (not in keys array)
    expect(result.current.filters.page).toBeUndefined();
    expect(result.current.filters.search).toBeUndefined();
  });

  it('should handle complex URL with multiple params', () => {
    const { result } = renderHook(
      () =>
        useUrlFilterState(['status', 'category', 'search'] as const, {
          status: 'active',
        }),
      {
        wrapper: createWrapper('/suppliers?search=fabric&page=1&category=yarn'),
      },
    );

    // search is in URL
    expect(result.current.filters.search).toBe('fabric');
    // category is in URL
    expect(result.current.filters.category).toBe('yarn');
    // status is not in URL, should use default
    expect(result.current.filters.status).toBe('active');
  });
});
