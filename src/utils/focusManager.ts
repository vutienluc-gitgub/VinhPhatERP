/**
 * focusManager
 * Tiện ích quản lý focus cho các control, table, form.
 */

export function focusElementByIndex(elements: HTMLElement[], index: number) {
  if (elements[index]) {
    elements[index].focus();
  }
}

export function getFocusableElements(container: HTMLElement): HTMLElement[] {
  return Array.from(
    container.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
  ).filter(el => !el.hasAttribute('disabled') && !el.getAttribute('aria-hidden'));
}

export function moveFocus(elements: HTMLElement[], current: number, delta: number): number {
  const next = Math.max(0, Math.min(elements.length - 1, current + delta));
  focusElementByIndex(elements, next);
  return next;
}
