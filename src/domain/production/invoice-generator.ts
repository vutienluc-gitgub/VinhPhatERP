export function generateWeavingRollPrefix(
  invoiceNumber?: string | null,
): string {
  return invoiceNumber ? `${invoiceNumber}-` : 'VP-';
}
