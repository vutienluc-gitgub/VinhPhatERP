import type {
  InteractionDomain,
  InteractionIntent,
  AttentionType,
} from './types';

export interface SmartInteractionResult {
  intent: InteractionIntent;
  attention?: AttentionType;
}

/**
 * Intelligent Rule Engine for Data Interaction Language.
 * Separates business logic from UI components.
 */
export function evaluateInteraction<T = unknown>(
  domain: InteractionDomain,
  data: T,
): SmartInteractionResult {
  // Default fallback
  const result: SmartInteractionResult = { intent: 'default' };

  if (!data) return result;

  if (domain === 'purchase') {
    // Determine type by checking shape (duck typing)
    const record = data as Record<string, unknown>;

    // Purchase Order Rules
    if ('po_code' in record) {
      if (['cancelled', 'request_changes'].includes(record.status as string)) {
        result.intent = 'danger';
      } else if (
        ['completed', 'supplier_confirmed'].includes(record.status as string)
      ) {
        result.intent = 'success';
      } else if (
        ['pending_approval', 'submitted'].includes(record.status as string)
      ) {
        result.intent = 'warning';
      }

      // Attention Rules
      // Example: High value PO waiting for approval
      if (
        record.status === 'pending_approval' &&
        typeof record.total_amount === 'number' &&
        record.total_amount > 50000000
      ) {
        result.attention = 'glowWarning';
      }
    }

    // RFQ Rules
    if ('rfq_code' in record) {
      if (record.status === 'closed') {
        result.intent = 'default';
      } else if (record.status === 'published') {
        result.intent = 'info';
        // Add a gentle pulse for open RFQs
        result.attention = 'pulsePending';
      }
    }
  }

  return result;
}
