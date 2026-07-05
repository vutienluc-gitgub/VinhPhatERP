/**
 * Analytics Abstraction Layer for B2B Lead Funnel.
 *
 * All conversion tracking goes through this module.
 * Swap implementation (GA4 / Posthog / Mixpanel / Supabase)
 * without touching UI components.
 */

type LeadEventName =
  | 'sticky_cta_view'
  | 'sticky_cta_click_rfq'
  | 'sticky_cta_click_sample'
  | 'sticky_cta_click_call'
  | 'sticky_cta_click_order'
  | 'rfq_modal_open'
  | 'rfq_step1_select'
  | 'rfq_submit_success'
  | 'rfq_submit_failed'
  | 'sample_modal_open'
  | 'sample_submit_success'
  | 'sample_submit_failed'
  | 'inquiry_cart_add';

interface LeadEventPayload {
  fabricCode?: string;
  fabricName?: string;
  leadChannel?: string;
  leadSource?: string;
  rfqType?: string;
  [key: string]: unknown;
}

/**
 * Track a lead funnel event.
 *
 * Phase 1: Structured console log (dev).
 * Phase 2: Supabase events table or fabric_public_views.
 * Phase 3: GA4 / Posthog / Mixpanel SDK.
 */
export function trackLeadEvent(
  name: LeadEventName,
  payload?: LeadEventPayload,
): void {
  // Structured log — always available for debugging
  console.info(`[Analytics:Lead] ${name}`, {
    ...payload,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Gets or creates a UUID v4 session ID for anonymous view tracking.
 */
export function getOrCreateSessionId(): string {
  if (typeof window === 'undefined') return '';
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  let sid = localStorage.getItem('fabric_session_id');
  if (!sid || !uuidRegex.test(sid)) {
    sid =
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            const r = (Math.random() * 16) | 0;
            const v = c === 'x' ? r : (r & 0x3) | 0x8;
            return v.toString(16);
          });
    localStorage.setItem('fabric_session_id', sid);
  }
  return sid;
}
