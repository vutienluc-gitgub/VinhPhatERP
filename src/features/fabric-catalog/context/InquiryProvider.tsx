import { useCallback, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

import { InquiryContext } from './InquiryContext';
import type {
  InquiryRequest,
  InquiryContextValue,
  InquiryIntent,
  LeadChannel,
  LeadSource,
} from './InquiryContext';

const DEFAULT_INQUIRY_REQUEST: InquiryRequest = {
  intent: null,
  leadChannel: 'website',
  leadSource: 'unknown',
  isBatchRequest: false,
};

export function InquiryProvider({ children }: { children: ReactNode }) {
  // RFQ state
  const [isInquiryOpen, setIsRFQOpen] = useState(false);
  const [inquiryRequest, setInquiryRequest] = useState<InquiryRequest>(
    DEFAULT_INQUIRY_REQUEST,
  );

  // Sample state
  const [isSampleOpen, setIsSampleOpen] = useState(false);
  const [sampleLeadChannel, setSampleLeadChannel] =
    useState<LeadChannel>('website');
  const [sampleLeadSource, setSampleLeadSource] =
    useState<LeadSource>('unknown');
  const [sampleIsBatch, setSampleIsBatch] = useState(false);

  const openInquiry = useCallback(
    (
      config: Partial<
        Pick<InquiryRequest, 'leadChannel' | 'leadSource' | 'isBatchRequest'>
      >,
    ) => {
      setInquiryRequest({
        intent: null, // Reset to Step 1
        leadChannel: config.leadChannel ?? 'website',
        leadSource: config.leadSource ?? 'unknown',
        isBatchRequest: config.isBatchRequest ?? false,
      });
      setIsRFQOpen(true);
    },
    [],
  );

  const closeInquiry = useCallback(() => {
    setIsRFQOpen(false);
    setInquiryRequest(DEFAULT_INQUIRY_REQUEST);
  }, []);

  const setInquiryIntent = useCallback((intent: InquiryIntent) => {
    setInquiryRequest((prev) => ({ ...prev, intent }));
  }, []);

  const openSample = useCallback(
    (config: {
      leadChannel?: LeadChannel;
      leadSource?: LeadSource;
      isBatch?: boolean;
    }) => {
      setSampleLeadChannel(config.leadChannel ?? 'website');
      setSampleLeadSource(config.leadSource ?? 'unknown');
      setSampleIsBatch(config.isBatch ?? false);
      setIsSampleOpen(true);
    },
    [],
  );

  const closeSample = useCallback(() => {
    setIsSampleOpen(false);
  }, []);

  const value = useMemo<InquiryContextValue>(
    () => ({
      isInquiryOpen,
      inquiryRequest,
      openInquiry,
      closeInquiry,
      setInquiryIntent,
      isSampleOpen,
      sampleLeadChannel,
      sampleLeadSource,
      sampleIsBatch,
      openSample,
      closeSample,
    }),
    [
      isInquiryOpen,
      inquiryRequest,
      openInquiry,
      closeInquiry,
      setInquiryIntent,
      isSampleOpen,
      sampleLeadChannel,
      sampleLeadSource,
      sampleIsBatch,
      openSample,
      closeSample,
    ],
  );

  return (
    <InquiryContext.Provider value={value}>{children}</InquiryContext.Provider>
  );
}
