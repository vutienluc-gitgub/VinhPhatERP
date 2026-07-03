import { useState } from 'react';
import toast from 'react-hot-toast';

import { Icon, Button } from '@/shared/components';
import { useCreatePublicSampleRequest } from '@/application/settings/useFabricCatalog';
import type { InquiryCartItem } from '@/shared/inquiry-cart';
import type { FabricCatalog } from '@/domain/settings/fabric-catalog.types';
import { useInquiryCart } from '@/shared/inquiry-cart';
import { PUBLIC_PAGE_LABELS as LABELS } from '@/features/fabric-catalog/fabric-catalog.constants';

interface PublicSampleModalProps {
  isOpen: boolean;
  onClose: () => void;
  fabric: Partial<FabricCatalog>;
  activeColorName: string | null;
  isBatchRequest: boolean;
  inquiryCart: Record<string, InquiryCartItem>;
}

export function PublicSampleModal({
  isOpen,
  onClose,
  fabric,
  activeColorName,
  isBatchRequest,
  inquiryCart,
}: PublicSampleModalProps) {
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactAddress, setContactAddress] = useState('');
  const [companyName, setCompanyName] = useState('');

  const requestMutation = useCreatePublicSampleRequest();
  const { clearInquiryCart } = useInquiryCart();

  if (!isOpen) return null;

  const handleSubmitSampleRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactName.trim() || !contactPhone.trim() || !contactAddress.trim()) {
      toast.error('Vui lòng nhập đầy đủ các trường bắt buộc.');
      return;
    }
    const selectedVariants = isBatchRequest
      ? Object.values(inquiryCart).map((item: InquiryCartItem) => ({
          variant_code: item.code,
          color_name: item.color_name || 'Tất cả màu',
        }))
      : [
          {
            variant_code: fabric.code || '',
            color_name: activeColorName || 'Tất cả màu',
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
      onClose();

      // Clear forms
      setContactName('');
      setContactPhone('');
      setContactAddress('');
      setCompanyName('');

      if (isBatchRequest) {
        clearInquiryCart();
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(`Gửi yêu cầu thất bại: ${msg}`);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-3 animate-fade-in">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-slate-50">
          <h3 className="font-bold text-gray-900 flex items-center gap-2">
            <Icon name="Package" className="w-5 h-5 text-primary" />
            {LABELS.requestSampleTitle}
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-slate-200 text-slate-500"
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
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
            <span className="text-[10px] text-muted font-bold block mb-1">
              MẪU VẢI ĐĂNG KÝ:
            </span>
            {isBatchRequest ? (
              <div className="space-y-1">
                {Object.values(inquiryCart).map((item: InquiryCartItem) => (
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

          {/* Name */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 block">
              {LABELS.contactNameLabel} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-primary"
              placeholder="VD: Nguyễn Văn A"
            />
          </div>

          {/* Phone */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 block">
              {LABELS.contactPhoneLabel} <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              required
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
              className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-primary"
              placeholder="VD: 0989xxxxxx"
            />
          </div>

          {/* Address */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 block">
              {LABELS.contactAddressLabel}{' '}
              <span className="text-red-500">*</span>
            </label>
            <textarea
              required
              rows={2}
              value={contactAddress}
              onChange={(e) => setContactAddress(e.target.value)}
              className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-primary resize-none"
              placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành phố"
            />
          </div>

          {/* Company */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 block">
              {LABELS.companyNameLabel}
            </label>
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-primary"
              placeholder="VD: Thời trang Tấn Phát"
            />
          </div>

          <div className="pt-2">
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
