import { useState } from 'react';
import { z } from 'zod';
import toast from 'react-hot-toast';
import dayjs from 'dayjs';

import { Icon, Button } from '@/shared/components';
import { useCreatePublicRFQRequest } from '@/application/settings/useFabricCatalog';
import type { InquiryCartItem } from '@/shared/inquiry-cart';
import type {
  FabricCatalog,
  FabricVariant,
} from '@/domain/settings/fabric-catalog.types';
import { useInquiryCart } from '@/shared/inquiry-cart';
import {
  PUBLIC_PAGE_LABELS as LABELS,
  HOTLINE,
} from '@/features/fabric-catalog/fabric-catalog.constants';
import type {
  RFQIntent,
  RFQRequest,
} from '@/features/fabric-catalog/context/RFQContext';
import { useRFQ } from '@/features/fabric-catalog/hooks/useRFQ';
import { trackLeadEvent } from '@/shared/services/analytics';
import {
  generateRFQTicketPdf,
  type RFQTicketData,
} from '@/features/fabric-catalog/utils/pdf-generator';

interface PublicRFQModalProps {
  fabric: Partial<FabricCatalog>;
  variants?: FabricVariant[];
  activeColorName: string | null;
  inquiryCart: Record<string, InquiryCartItem>;
}

const RFQ_INTENT_CARDS: {
  id: RFQIntent;
  icon: string;
  title: string;
  description: string;
}[] = [
  {
    id: 'quote',
    icon: 'FileText',
    title: LABELS.rfqIntentQuote,
    description: LABELS.rfqIntentQuoteDesc,
  },
  {
    id: 'bulk_quote',
    icon: 'TrendingUp',
    title: LABELS.rfqIntentBulk,
    description: LABELS.rfqIntentBulkDesc,
  },
  {
    id: 'oem',
    icon: 'Factory',
    title: LABELS.rfqIntentOem,
    description: LABELS.rfqIntentOemDesc,
  },
  {
    id: 'processing',
    icon: 'Scissors',
    title: LABELS.rfqIntentProcessing,
    description: LABELS.rfqIntentProcessingDesc,
  },
];

const rfqSchema = z.object({
  quantity: z
    .number({ invalid_type_error: LABELS.validationQtyInvalid })
    .positive(LABELS.validationQtyPositive),
  contactName: z.string().trim().min(1, LABELS.validationNameRequired),
  contactPhone: z.string().trim().min(1, LABELS.validationPhoneRequired),
  contactEmail: z
    .string()
    .trim()
    .email(LABELS.validationEmailInvalid)
    .optional()
    .or(z.literal('')),
  companyName: z.string().trim().optional(),
});

export function PublicRFQModal({
  fabric,
  variants,
  activeColorName,
  inquiryCart,
}: PublicRFQModalProps) {
  const { isRFQOpen, rfqRequest, closeRFQ, setRFQIntent } = useRFQ();
  const [rfqQty, setRfqQty] = useState<string>('100');
  const [rfqContactName, setRfqContactName] = useState('');
  const [rfqContactPhone, setRfqContactPhone] = useState('');
  const [rfqEmail, setRfqEmail] = useState('');
  const [rfqCompanyName, setRfqCompanyName] = useState('');
  const [successLeadId, setSuccessLeadId] = useState<string | null>(null);
  const [rfqTicketData, setRfqTicketData] = useState<RFQTicketData | null>(
    null,
  );

  const rfqMutation = useCreatePublicRFQRequest();
  const { clearInquiryCart } = useInquiryCart();

  if (!isRFQOpen) return null;

  const currentStep = successLeadId
    ? 'success'
    : rfqRequest.intent
      ? 'form'
      : 'intent';

  const handleSelectIntent = (intent: RFQIntent) => {
    setRFQIntent(intent);
    trackLeadEvent('rfq_step1_select', {
      fabricCode: fabric.code,
      rfqType: intent,
      leadSource: rfqRequest.leadSource,
    });
  };

  const handleSubmitRFQ = async (e: React.FormEvent) => {
    e.preventDefault();

    const parsedQty = Number(rfqQty);
    const validationResult = rfqSchema.safeParse({
      quantity: parsedQty,
      contactName: rfqContactName,
      contactPhone: rfqContactPhone,
      contactEmail: rfqEmail,
      companyName: rfqCompanyName,
    });

    if (!validationResult.success) {
      const firstError = validationResult.error.errors[0]?.message;
      toast.error(firstError ?? LABELS.validationNameRequired);
      return;
    }

    try {
      const activeVariant = variants?.find(
        (v) => v.color_name === activeColorName,
      );
      const variantId = activeVariant?.id ?? null;
      const unit = fabric.commercial?.minimum_order_unit ?? fabric.unit ?? 'kg';

      const rfqItems = rfqRequest.isBatchRequest
        ? Object.values(inquiryCart).map((item) => ({
            fabric_catalog_id: item.id,
            variant_code: item.code,
            color_name: item.color_name ?? LABELS.rfqAllColors,
            quantity: parsedQty,
            unit,
          }))
        : [];

      const leadId = await rfqMutation.mutateAsync({
        fabricCatalogId: rfqRequest.isBatchRequest ? null : (fabric.id ?? ''),
        variantId: rfqRequest.isBatchRequest ? null : variantId,
        quantity: parsedQty,
        unit,
        contactName: rfqContactName.trim(),
        contactPhone: rfqContactPhone.trim(),
        contactEmail: rfqEmail.trim() || null,
        companyName: rfqCompanyName.trim() || null,
        rfqItems,
        leadChannel: rfqRequest.leadChannel,
        leadSource: rfqRequest.leadSource,
        rfqType: rfqRequest.intent ?? 'quote',
      });

      trackLeadEvent('rfq_submit_success', {
        fabricCode: fabric.code,
        rfqType: rfqRequest.intent ?? 'quote',
        leadSource: rfqRequest.leadSource,
        leadChannel: rfqRequest.leadChannel,
      });

      const shortId =
        typeof leadId === 'string'
          ? `RFQ-2026-${leadId.substring(0, 6).toUpperCase()}`
          : 'RFQ-2026';
      setSuccessLeadId(shortId);

      const intentMap: Record<string, string> = {
        quote: LABELS.rfqIntentQuote,
        bulk_quote: LABELS.rfqIntentBulk,
        oem: LABELS.rfqIntentOem,
        processing: LABELS.rfqIntentProcessing,
      };

      const ticketItems = rfqRequest.isBatchRequest
        ? Object.values(inquiryCart).map((item) => ({
            code: item.code,
            name: item.name,
            color: item.color_name || LABELS.rfqAllColors,
            qty: parsedQty,
            unit,
          }))
        : [
            {
              code: fabric.code || '',
              name: fabric.name || '',
              color: activeColorName || LABELS.rfqAllColors,
              qty: parsedQty,
              unit,
            },
          ];

      setRfqTicketData({
        leadId: shortId,
        contactName: rfqContactName.trim(),
        contactPhone: rfqContactPhone.trim(),
        contactEmail: rfqEmail.trim(),
        companyName: rfqCompanyName.trim(),
        requestType:
          intentMap[rfqRequest.intent || 'quote'] || 'Yêu cầu báo giá',
        date: dayjs().format('DD/MM/YYYY HH:mm'),
        items: ticketItems,
      });

      if (rfqRequest.isBatchRequest) {
        clearInquiryCart();
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(`${LABELS.rfqSubmitFailed} ${msg}`);
      trackLeadEvent('rfq_submit_failed', {
        fabricCode: fabric.code,
        leadSource: rfqRequest.leadSource,
      });
    }
  };

  const handleClose = () => {
    setSuccessLeadId(null);
    setRfqTicketData(null);
    setRfqQty('100');
    setRfqContactName('');
    setRfqContactPhone('');
    setRfqEmail('');
    setRfqCompanyName('');
    closeRFQ();
  };

  const zaloFallbackUrl = (() => {
    const msg = LABELS.rfqZaloFallbackMsg
      .replace('{code}', fabric.code ?? '')
      .replace('{name}', fabric.name ?? '')
      .replace('{color}', activeColorName ?? LABELS.rfqAllColors);
    return `https://zalo.me/${HOTLINE}?text=${encodeURIComponent(msg)}`;
  })();

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-3 animate-fade-in">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-slate-50">
          <h3 className="font-bold text-gray-900 flex items-center gap-2">
            <Icon name="FileText" className="w-5 h-5 text-primary" />
            {currentStep === 'success'
              ? LABELS.rfqSuccessTitle
              : LABELS.rfqModalTitle}
          </h3>
          <button
            onClick={handleClose}
            className="p-1 rounded-full hover:bg-slate-200 text-slate-500"
          >
            <Icon name="X" className="w-5 h-5" />
          </button>
        </div>

        {/* Step 1: Intent Selection (Cards) */}
        {currentStep === 'intent' && (
          <RFQIntentStep onSelectIntent={handleSelectIntent} />
        )}

        {/* Step 2: Contact Form + Zalo Fallback */}
        {currentStep === 'form' && (
          <RFQFormStep
            fabric={fabric}
            variants={variants}
            activeColorName={activeColorName}
            inquiryCart={inquiryCart}
            rfqRequest={rfqRequest}
            rfqQty={rfqQty}
            setRfqQty={setRfqQty}
            rfqContactName={rfqContactName}
            setRfqContactName={setRfqContactName}
            rfqContactPhone={rfqContactPhone}
            setRfqContactPhone={setRfqContactPhone}
            rfqEmail={rfqEmail}
            setRfqEmail={setRfqEmail}
            rfqCompanyName={rfqCompanyName}
            setRfqCompanyName={setRfqCompanyName}
            rfqMutation={rfqMutation}
            handleSubmitRFQ={handleSubmitRFQ}
            zaloFallbackUrl={zaloFallbackUrl}
          />
        )}

        {/* Step 3: Success State */}
        {currentStep === 'success' && (
          <RFQSuccessStep
            successLeadId={successLeadId}
            rfqTicketData={rfqTicketData}
            onClose={handleClose}
          />
        )}
      </div>
    </div>
  );
}

interface RFQIntentStepProps {
  onSelectIntent: (intent: RFQIntent) => void;
}

function RFQIntentStep({ onSelectIntent }: RFQIntentStepProps) {
  return (
    <div className="p-4 space-y-3 overflow-y-auto">
      <p className="text-sm font-semibold text-slate-700">
        {LABELS.rfqWhatDoYouNeed}
      </p>
      <div className="grid grid-cols-2 gap-3">
        {RFQ_INTENT_CARDS.map((card) => (
          <button
            key={card.id}
            onClick={() => onSelectIntent(card.id)}
            className="flex flex-col items-center text-center gap-2 p-4 rounded-xl border border-slate-200 hover:border-[#0068ff] hover:bg-[#0068ff]/5 transition-all group"
          >
            <div className="w-10 h-10 rounded-full bg-slate-100 group-hover:bg-[#0068ff]/10 flex items-center justify-center transition-colors">
              <Icon
                name={card.icon}
                className="w-5 h-5 text-slate-500 group-hover:text-[#0068ff] transition-colors"
              />
            </div>
            <span className="text-xs font-bold text-slate-800">
              {card.title}
            </span>
            <span className="text-[10px] text-slate-500 leading-snug">
              {card.description}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

interface RFQFormStepProps {
  fabric: Partial<FabricCatalog>;
  variants?: FabricVariant[];
  activeColorName: string | null;
  inquiryCart: Record<string, InquiryCartItem>;
  rfqRequest: RFQRequest;
  rfqQty: string;
  setRfqQty: (qty: string) => void;
  rfqContactName: string;
  setRfqContactName: (name: string) => void;
  rfqContactPhone: string;
  setRfqContactPhone: (phone: string) => void;
  rfqEmail: string;
  setRfqEmail: (email: string) => void;
  rfqCompanyName: string;
  setRfqCompanyName: (name: string) => void;
  rfqMutation: ReturnType<typeof useCreatePublicRFQRequest>;
  handleSubmitRFQ: (e: React.FormEvent) => void;
  zaloFallbackUrl: string;
}

function RFQFormStep({
  fabric,
  activeColorName,
  inquiryCart,
  rfqRequest,
  rfqQty,
  setRfqQty,
  rfqContactName,
  setRfqContactName,
  rfqContactPhone,
  setRfqContactPhone,
  rfqEmail,
  setRfqEmail,
  rfqCompanyName,
  setRfqCompanyName,
  rfqMutation,
  handleSubmitRFQ,
  zaloFallbackUrl,
}: RFQFormStepProps) {
  return (
    <form
      onSubmit={handleSubmitRFQ}
      className="flex-1 overflow-y-auto p-4 space-y-4"
    >
      <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
        <span className="text-[10px] text-muted font-bold block mb-1">
          {LABELS.rfqFabricRequested}
        </span>
        {rfqRequest.isBatchRequest ? (
          <div className="space-y-1">
            {Object.values(inquiryCart).map((item) => (
              <div
                key={item.id}
                className="text-xs font-semibold text-slate-800"
              >
                • {item.code} - {item.name}{' '}
                {item.color_name && `(${item.color_name})`}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-xs font-bold text-primary">
            {fabric.code} - {fabric.name}{' '}
            {activeColorName && `(Màu: ${activeColorName})`}
          </div>
        )}
      </div>

      <div>
        <label className="text-xs font-bold text-slate-700 block mb-1">
          {LABELS.requestedQty} <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <input
            type="number"
            required
            min="1"
            value={rfqQty}
            onChange={(e) => setRfqQty(e.target.value)}
            className="w-full text-sm border border-slate-200 rounded-xl pl-3 pr-12 py-2 focus:outline-none focus:border-primary bg-white"
          />
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <span className="text-xs font-bold text-slate-500">
              {fabric.commercial?.minimum_order_unit ?? fabric.unit ?? 'kg'}
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-xs font-bold text-slate-700 block">
          {LABELS.contactNameLabel} <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          required
          value={rfqContactName}
          onChange={(e) => setRfqContactName(e.target.value)}
          className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-primary"
          placeholder={LABELS.rfqPlaceholderName}
        />
      </div>

      <div className="space-y-1">
        <label className="text-xs font-bold text-slate-700 block">
          {LABELS.contactPhoneLabel} <span className="text-red-500">*</span>
        </label>
        <input
          type="tel"
          required
          value={rfqContactPhone}
          onChange={(e) => setRfqContactPhone(e.target.value)}
          className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-primary"
          placeholder={LABELS.rfqPlaceholderPhone}
        />
      </div>

      <div className="space-y-1">
        <label className="text-xs font-bold text-slate-700 block">
          {LABELS.rfqEmailLabel}
        </label>
        <input
          type="email"
          value={rfqEmail}
          onChange={(e) => setRfqEmail(e.target.value)}
          className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-primary"
          placeholder={LABELS.rfqPlaceholderEmail}
        />
      </div>

      <div className="space-y-1">
        <label className="text-xs font-bold text-slate-700 block">
          {LABELS.companyNameLabel}
        </label>
        <input
          type="text"
          value={rfqCompanyName}
          onChange={(e) => setRfqCompanyName(e.target.value)}
          className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-primary"
          placeholder={LABELS.rfqPlaceholderCompany}
        />
      </div>

      <div className="pt-2">
        <Button
          type="submit"
          variant="primary"
          fullWidth
          disabled={rfqMutation.isPending}
        >
          {rfqMutation.isPending ? LABELS.requestPending : LABELS.rfqSubmitBtn}
        </Button>
      </div>

      <div className="pt-1 text-center">
        <div className="flex items-center gap-2 justify-center">
          <div className="h-px flex-1 bg-slate-200" />
          <span className="text-[10px] text-slate-400 font-medium">
            {LABELS.orOption}
          </span>
          <div className="h-px flex-1 bg-slate-200" />
        </div>
        <a
          href={zaloFallbackUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs text-[#0068ff] font-semibold mt-2 hover:underline"
        >
          <Icon name="MessageCircle" className="w-4 h-4" />
          {LABELS.rfqZaloQuick}
        </a>
      </div>
    </form>
  );
}

interface RFQSuccessStepProps {
  successLeadId: string | null;
  rfqTicketData: RFQTicketData | null;
  onClose: () => void;
}

function RFQSuccessStep({
  successLeadId,
  rfqTicketData,
  onClose,
}: RFQSuccessStepProps) {
  return (
    <div className="p-6 text-center space-y-4">
      <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
        <Icon name="Check" className="w-8 h-8 text-emerald-600" />
      </div>
      <div>
        <p className="text-lg font-bold text-slate-900">
          {LABELS.rfqSuccessTitle}
        </p>
        <p className="text-xs text-slate-500 mt-1">
          {LABELS.rfqLeadId}{' '}
          <span className="font-mono font-bold text-primary">
            {successLeadId}
          </span>
        </p>
      </div>
      <div className="bg-slate-50 rounded-xl p-3 text-xs text-slate-600">
        <p className="font-semibold">
          {LABELS.rfqSuccessWait1}{' '}
          <span className="font-bold text-slate-900">
            {LABELS.rfqSuccessWait2}
          </span>{' '}
          {LABELS.rfqSuccessWait3}
        </p>
      </div>
      <div className="flex gap-2">
        <Button variant="secondary" fullWidth onClick={onClose}>
          {LABELS.rfqViewMore}
        </Button>
        <Button
          variant="outline"
          fullWidth
          disabled={!rfqTicketData}
          onClick={() => rfqTicketData && generateRFQTicketPdf(rfqTicketData)}
        >
          <Icon name="Download" className="w-4 h-4 mr-2" />
          Tải PDF
        </Button>
      </div>
    </div>
  );
}
