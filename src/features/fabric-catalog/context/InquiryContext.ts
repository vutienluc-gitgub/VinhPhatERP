import { createContext } from 'react';

/**
 * RFQ Intent types — maps to Step 1 card selection.
 */
export type InquiryIntent = 'quote' | 'bulk_quote' | 'oem' | 'processing';

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

export interface InquiryRequest {
  intent: InquiryIntent | null;
  leadChannel: LeadChannel;
  leadSource: LeadSource;
  isBatchRequest: boolean;
}

export interface InquiryContextValue {
  // RFQ Modal
  isInquiryOpen: boolean;
  inquiryRequest: InquiryRequest;
  openInquiry: (
    config: Partial<
      Pick<InquiryRequest, 'leadChannel' | 'leadSource' | 'isBatchRequest'>
    >,
  ) => void;
  closeInquiry: () => void;
  setInquiryIntent: (intent: InquiryIntent) => void;

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

export const InquiryContext = createContext<InquiryContextValue | null>(null);
