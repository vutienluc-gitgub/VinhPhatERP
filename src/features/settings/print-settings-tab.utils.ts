export type PrintSubTabKey = 'config' | 'templates';

export const VALID_PRINT_SUB_TABS: readonly PrintSubTabKey[] = [
  'config',
  'templates',
] as const;

export function isValidPrintSubTab(
  val: string | null | undefined,
): val is PrintSubTabKey {
  return val === 'config' || val === 'templates';
}

export function resolvePrintSubTab(
  pathname: string,
  searchTab: string | null | undefined,
): PrintSubTabKey {
  if (isValidPrintSubTab(searchTab)) {
    return searchTab;
  }
  // When accessing via /settings/print or alias
  if (
    pathname.includes('/settings/print') &&
    !pathname.includes('/settings/print-templates')
  ) {
    return 'config';
  }
  if (pathname.includes('/settings/print-templates')) {
    return 'templates';
  }
  return 'config';
}
