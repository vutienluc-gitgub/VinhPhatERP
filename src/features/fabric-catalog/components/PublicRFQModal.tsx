import { useState } from 'react';
import { z } from 'zod';
import toast from 'react-hot-toast';

import { Icon, Button } from '@/shared/components';
import { useCreatePublicRFQRequest } from '@/application/settings/useFabricCatalog';
import type { WishlistItem } from '@/shared/wishlist';
import type {
  FabricCatalog,
  FabricVariant,
} from '@/domain/settings/fabric-catalog.types';
import { useWishlist } from '@/shared/wishlist';
import { PUBLIC_PAGE_LABELS as LABELS } from '@/features/fabric-catalog/fabric-catalog.constants';

interface PublicRFQModalProps {
  isOpen: boolean;
  onClose: () => void;
  fabric: Partial<FabricCatalog>;
  variants?: FabricVariant[];
  activeColorName: string | null;
  isBatchRequest: boolean;
  wishlist: Record<string, WishlistItem>;
}

export function PublicRFQModal({
  isOpen,
  onClose,
  fabric,
  variants,
  activeColorName,
  isBatchRequest,
  wishlist,
}: PublicRFQModalProps) {
  const [rfqQty, setRfqQty] = useState<string>('100');
  const [rfqTargetPrice, setRfqTargetPrice] = useState<string>('');
  const [rfqDeliveryDate, setRfqDeliveryDate] = useState<string>('');
  const [rfqContactName, setRfqContactName] = useState('');
  const [rfqContactPhone, setRfqContactPhone] = useState('');
  const [rfqEmail, setRfqEmail] = useState('');
  const [rfqCompanyName, setRfqCompanyName] = useState('');

  const rfqMutation = useCreatePublicRFQRequest();
  const { clearWishlist } = useWishlist();

  if (!isOpen) return null;

  const handleSubmitRFQ = async (e: React.FormEvent) => {
    e.preventDefault();

    // Zod Validation Schema
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
      targetPrice: z
        .number()
        .positive(LABELS.validationTargetPricePositive)
        .optional()
        .nullable(),
      targetDeliveryDate: z.string().optional().nullable(),
    });
    const parsedQty = Number(rfqQty);
    const parsedTargetPrice = rfqTargetPrice ? Number(rfqTargetPrice) : null;

    const validationResult = rfqSchema.safeParse({
      quantity: parsedQty,
      contactName: rfqContactName,
      contactPhone: rfqContactPhone,
      contactEmail: rfqEmail,
      companyName: rfqCompanyName,
      targetPrice: parsedTargetPrice,
      targetDeliveryDate: rfqDeliveryDate || null,
    });

    if (!validationResult.success) {
      const firstError = validationResult.error.errors[0]?.message;
      toast.error(firstError || LABELS.validationNameRequired);
      return;
    }

    try {
      const activeVariant = variants?.find(
        (v) => v.color_name === activeColorName,
      );
      const variantId = activeVariant?.id || null;
      const unit = fabric.commercial?.minimum_order_unit || fabric.unit || 'kg';

      const rfqItems = isBatchRequest
        ? Object.values(wishlist).map((item) => ({
            fabric_catalog_id: item.id,
            variant_code: item.code,
            color_name: item.color_name || 'Tất cả màu',
            quantity: parsedQty,
            unit,
            target_price: parsedTargetPrice,
            target_delivery_date: rfqDeliveryDate || null,
          }))
        : [];

      await rfqMutation.mutateAsync({
        fabricCatalogId: isBatchRequest ? null : fabric.id || '',
        variantId: isBatchRequest ? null : variantId,
        quantity: parsedQty,
        unit,
        targetPrice: parsedTargetPrice,
        targetDeliveryDate: rfqDeliveryDate || null,
        contactName: rfqContactName.trim(),
        contactPhone: rfqContactPhone.trim(),
        contactEmail: rfqEmail.trim() || null,
        companyName: rfqCompanyName.trim() || null,
        rfqItems,
      });

      toast.success(LABELS.rfqSuccess);
      onClose();

      // Reset form states
      setRfqTargetPrice('');
      setRfqDeliveryDate('');
      setRfqEmail('');
      setRfqContactName('');
      setRfqContactPhone('');
      setRfqCompanyName('');

      if (isBatchRequest) {
        clearWishlist();
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(`Gửi yêu cầu báo giá thất bại: ${msg}`);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-3 animate-fade-in">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-slate-50">
          <h3 className="font-bold text-gray-900 flex items-center gap-2">
            <Icon name="FileText" className="w-5 h-5 text-primary" />
            {LABELS.rfqModalTitle}
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-slate-200 text-slate-500"
          >
            <Icon name="X" className="w-5 h-5" />
          </button>
        </div>

        <form
          onSubmit={handleSubmitRFQ}
          className="flex-1 overflow-y-auto p-4 space-y-4"
        >
          {/* Mẫu vải đang chọn */}
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
            <span className="text-[10px] text-muted font-bold block mb-1">
              MÃ VẢI YÊU CẦU:
            </span>
            {isBatchRequest ? (
              <div className="space-y-1">
                {Object.values(wishlist).map((item) => (
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

          <div className="grid grid-cols-2 gap-3">
            {/* Quantity */}
            <div className="col-span-2">
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
                    {fabric.commercial?.minimum_order_unit ||
                      fabric.unit ||
                      'kg'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Name */}
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
              placeholder="VD: Nguyễn Văn A"
            />
          </div>

          {/* Contact Phone */}
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
              placeholder="VD: 0989xxxxxx"
            />
          </div>

          {/* Contact Email */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 block">
              {LABELS.rfqEmailLabel}
            </label>
            <input
              type="email"
              value={rfqEmail}
              onChange={(e) => setRfqEmail(e.target.value)}
              className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-primary"
              placeholder="VD: khachhang@gmail.com"
            />
          </div>

          {/* Company Name */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 block">
              {LABELS.companyNameLabel}
            </label>
            <input
              type="text"
              value={rfqCompanyName}
              onChange={(e) => setRfqCompanyName(e.target.value)}
              className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-primary"
              placeholder="VD: Thời trang Tấn Phát"
            />
          </div>

          {/* Target Price */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 block">
              {LABELS.rfqTargetPriceLabel}
            </label>
            <input
              type="number"
              value={rfqTargetPrice}
              onChange={(e) => setRfqTargetPrice(e.target.value)}
              className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-primary"
              placeholder="VD: 80000"
            />
          </div>

          {/* Target Delivery Date */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 block">
              {LABELS.rfqDeliveryDateLabel}
            </label>
            <input
              type="date"
              value={rfqDeliveryDate}
              onChange={(e) => setRfqDeliveryDate(e.target.value)}
              className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-primary"
            />
          </div>

          <div className="pt-2">
            <Button
              type="submit"
              variant="primary"
              fullWidth
              disabled={rfqMutation.isPending}
            >
              {rfqMutation.isPending ? LABELS.requestPending : LABELS.rfqBtn}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
