import { useCallback, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

import { RFQContext } from './RFQContext';
import type {
  RFQRequest,
  RFQContextValue,
  RFQIntent,
  LeadChannel,
  LeadSource,
} from './RFQContext';

const DEFAULT_RFQ_REQUEST: RFQRequest = {
  intent: null,
  leadChannel: 'website',
  leadSource: 'unknown',
  isBatchRequest: false,
};

export function RFQProvider({ children }: { children: ReactNode }) {
  // RFQ state
  const [isRFQOpen, setIsRFQOpen] = useState(false);
  const [rfqRequest, setRFQRequest] = useState<RFQRequest>(DEFAULT_RFQ_REQUEST);

  // Sample state
  const [isSampleOpen, setIsSampleOpen] = useState(false);
  const [sampleLeadChannel, setSampleLeadChannel] =
    useState<LeadChannel>('website');
  const [sampleLeadSource, setSampleLeadSource] =
    useState<LeadSource>('unknown');
  const [sampleIsBatch, setSampleIsBatch] = useState(false);

  const openRFQ = useCallback(
    (
      config: Partial<
        Pick<RFQRequest, 'leadChannel' | 'leadSource' | 'isBatchRequest'>
      >,
    ) => {
      setRFQRequest({
        intent: null, // Reset to Step 1
        leadChannel: config.leadChannel ?? 'website',
        leadSource: config.leadSource ?? 'unknown',
        isBatchRequest: config.isBatchRequest ?? false,
      });
      setIsRFQOpen(true);
    },
    [],
  );

  const closeRFQ = useCallback(() => {
    setIsRFQOpen(false);
    setRFQRequest(DEFAULT_RFQ_REQUEST);
  }, []);

  const setRFQIntent = useCallback((intent: RFQIntent) => {
    setRFQRequest((prev) => ({ ...prev, intent }));
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

  const value = useMemo<RFQContextValue>(
    () => ({
      isRFQOpen,
      rfqRequest,
      openRFQ,
      closeRFQ,
      setRFQIntent,
      isSampleOpen,
      sampleLeadChannel,
      sampleLeadSource,
      sampleIsBatch,
      openSample,
      closeSample,
    }),
    [
      isRFQOpen,
      rfqRequest,
      openRFQ,
      closeRFQ,
      setRFQIntent,
      isSampleOpen,
      sampleLeadChannel,
      sampleLeadSource,
      sampleIsBatch,
      openSample,
      closeSample,
    ],
  );

  return <RFQContext.Provider value={value}>{children}</RFQContext.Provider>;
}
