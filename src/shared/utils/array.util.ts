export function sumBy<T>(
  arr: T[] | null | undefined,
  fn: (item: T) => number,
): number {
  if (!arr) return 0;
  let sum = 0;
  for (const item of arr) {
    if (item !== undefined && item !== null) sum += fn(item) || 0;
  }
  return sum;
}

export function maxBy<T>(
  arr: T[] | null | undefined,
  fn: (item: T) => number,
): T | undefined {
  if (!arr || arr.length === 0) return undefined;
  let maxItem = arr[0];
  if (maxItem === undefined) return undefined;
  let maxVal = fn(maxItem);
  for (let i = 1; i < arr.length; i++) {
    const curr = arr[i];
    if (curr === undefined) continue;
    const val = fn(curr);
    if (val > maxVal) {
      maxVal = val;
      maxItem = curr;
    }
  }
  return maxItem;
}

export function avgBy<T>(
  arr: T[] | null | undefined,
  fn: (item: T) => number,
): number {
  if (!arr || arr.length === 0) return 0;
  let sum = 0;
  for (const item of arr) {
    if (item !== undefined && item !== null) sum += fn(item) || 0;
  }
  return sum / arr.length;
}
