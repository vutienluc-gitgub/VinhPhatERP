import { useState } from 'react';
import toast from 'react-hot-toast';

import { Icon, Button } from '@/shared/components';
import { useCreatePublicSampleRequest } from '@/application/settings/useFabricCatalog';
import type { InquiryCartItem } from '@/shared/inquiry-cart';
import type { FabricCatalog } from '@/domain/settings/fabric-catalog.types';
import { useInquiryCart } from '@/shared/inquiry-cart';
import { useInquiry } from '@/features/fabric-catalog/hooks/useInquiry';
import { PUBLIC_PAGE_LABELS as LABELS } from '@/features/fabric-catalog/fabric-catalog.constants';

interface PublicSampleModalProps {
  fabric: Partial<FabricCatalog>;
  activeColorName: string | null;
  inquiryCart: Record<string, InquiryCartItem>;
}

export function PublicSampleModal({
  fabric,
  activeColorName,
  inquiryCart,
}: PublicSampleModalProps) {
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactAddress, setContactAddress] = useState('');
  const [companyName, setCompanyName] = useState('');

  const requestMutation = useCreatePublicSampleRequest();
  const { clearInquiryCart } = useInquiryCart();
  const { isSampleOpen, closeSample, sampleIsBatch } = useInquiry();

  if (!isSampleOpen) return null;

  const handleSubmitSampleRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactName.trim() || !contactPhone.trim() || !contactAddress.trim()) {
      toast.error(LABELS.validationMissingFields);
      return;
    }
    const selectedVariants = sampleIsBatch
      ? Object.values(inquiryCart).map((item: InquiryCartItem) => ({
          variant_code: item.code,
          color_name: item.color_name || LABELS.rfqAllColors,
        }))
      : [
          {
            variant_code: fabric.code || '',
            color_name: activeColorName || LABELS.rfqAllColors,
          },
        ];

    try {
      await requestMutation.mutateAsync({
        fabricCatalogId: fabric.id || '',
        contactName: contactName.trim(),
        contactPhone: contactPhone.trim(),
        contactAddress: contactAddress.trim(),
        companyName: companyName.trim() || undefined,
        selectedVariants,
      });

      toast.success(LABELS.requestSuccess);
      closeSample();

      // Clear forms
      setContactName('');
      setContactPhone('');
      setContactAddress('');
      setCompanyName('');

      if (sampleIsBatch) {
        clearInquiryCart();
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(`${LABELS.sampleSubmitFailed} ${msg}`);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-3 animate-fade-in">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-4 border-b border-default flex justify-between items-center bg-slate-50">
          <h3 className="font-bold text-foreground flex items-center gap-2">
            <Icon name="Package" className="w-5 h-5 text-primary" />
            {LABELS.requestSampleTitle}
          </h3>
          <button
            onClick={closeSample}
            className="p-1 rounded-full hover:bg-surface-secondary text-muted"
          >
            <Icon name="X" className="w-5 h-5" />
          </button>
        </div>

        <form
          onSubmit={handleSubmitSampleRequest}
          className="flex-1 overflow-y-auto p-4 space-y-4"
        >
          <p className="text-xs text-muted leading-relaxed">
            {LABELS.requestSampleDesc}
          </p>

          {/* Mẫu vải đang chọn */}
          <div className="bg-slate-50 p-3 rounded-xl border border-default">
            <span className="text-[10px] text-muted font-bold block mb-1">
              {LABELS.rfqFabricRequested}
            </span>
            {sampleIsBatch ? (
              <div className="space-y-1">
                {Object.values(inquiryCart).map((item: InquiryCartItem) => (
                  <div
                    key={item.id}
                    className="text-xs font-semibold text-primary"
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

          {/* Name */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-secondary block">
              {LABELS.contactNameLabel} <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              required
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              className="w-full text-sm border border-default rounded-xl px-3 py-2 focus:outline-none focus:border-primary"
              placeholder={LABELS.rfqPlaceholderName}
            />
          </div>

          {/* Phone */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-secondary block">
              {LABELS.contactPhoneLabel} <span className="text-danger">*</span>
            </label>
            <input
              type="tel"
              required
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
              className="w-full text-sm border border-default rounded-xl px-3 py-2 focus:outline-none focus:border-primary"
              placeholder="VD: 0989xxxxxx"
            />
          </div>

          {/* Address */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-secondary block">
              {LABELS.contactAddressLabel}{' '}
              <span className="text-danger">*</span>
            </label>
            <textarea
              required
              rows={2}
              value={contactAddress}
              onChange={(e) => setContactAddress(e.target.value)}
              className="w-full text-sm border border-default rounded-xl px-3 py-2 focus:outline-none focus:border-primary resize-none"
              placeholder={LABELS.samplePlaceholderAddress}
            />
          </div>

          {/* Company */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-secondary block">
              {LABELS.companyNameLabel}
            </label>
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="w-full text-sm border border-default rounded-xl px-3 py-2 focus:outline-none focus:border-primary"
              placeholder="VD: Thời trang Tấn Phát"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={closeSample}>
              Hủy
            </Button>
            <Button
              type="submit"
              variant="primary"
              fullWidth
              disabled={requestMutation.isPending}
            >
              {requestMutation.isPending
                ? LABELS.requestPending
                : LABELS.submitRequest}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
