export function groupBy<T, K extends string | number>(array: T[], keyFn: (item: T) => K): Record<K, T[]> {
  return array.reduce((acc, item) => {
    const key = keyFn(item);
    acc[key] = acc[key] || [];
    acc[key].push(item);
    return acc;
  }, {} as Record<K, T[]>);
}

export function uniq<T>(array: T[]): T[] {
  return Array.from(new Set(array));
}


// Auto-generated missing exports
export const sumBy: any = (...args: any[]) => ({});
