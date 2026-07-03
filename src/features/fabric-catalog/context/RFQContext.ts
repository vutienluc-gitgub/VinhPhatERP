import { createContext } from 'react';

/**
 * RFQ Intent types — maps to Step 1 card selection.
 */
export type RFQIntent = 'quote' | 'bulk_quote' | 'oem' | 'processing';

/**
 * Lead channel — high-level acquisition channel.
 */
export type LeadChannel =
  | 'website'
  | 'portal'
  | 'qr'
  | 'sales'
  | 'campaign'
  | 'api';

/**
 * Lead source — specific touchpoint within a channel.
 */
export type LeadSource =
  | 'sticky_cta'
  | 'planner'
  | 'inquiry_cart'
  | 'product_card'
  | 'hero_banner'
  | 'search'
  | 'unknown';

export interface RFQRequest {
  intent: RFQIntent | null;
  leadChannel: LeadChannel;
  leadSource: LeadSource;
  isBatchRequest: boolean;
}

export interface RFQContextValue {
  // RFQ Modal
  isRFQOpen: boolean;
  rfqRequest: RFQRequest;
  openRFQ: (
    config: Partial<
      Pick<RFQRequest, 'leadChannel' | 'leadSource' | 'isBatchRequest'>
    >,
  ) => void;
  closeRFQ: () => void;
  setRFQIntent: (intent: RFQIntent) => void;

  // Sample Modal
  isSampleOpen: boolean;
  sampleLeadChannel: LeadChannel;
  sampleLeadSource: LeadSource;
  sampleIsBatch: boolean;
  openSample: (config: {
    leadChannel?: LeadChannel;
    leadSource?: LeadSource;
    isBatch?: boolean;
  }) => void;
  closeSample: () => void;
}

export const RFQContext = createContext<RFQContextValue | null>(null);
