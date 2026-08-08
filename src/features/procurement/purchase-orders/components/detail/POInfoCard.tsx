import dayjs from 'dayjs';

import { MoneyText } from '@/shared/value';
import { Icon } from '@/shared/components';
import type { PurchaseOrder } from '@/domain/purchase-orders';
import {
  purchaseOrderStatus,
  type POStatus,
} from '@/features/procurement/purchase-orders/po.status';

import { POSupplierPortalStatus } from './POSupplierPortalStatus';

interface POInfoCardProps {
  po: PurchaseOrder;
  creatorProfile: { name: string; email: string } | null | undefined;
}

export function POInfoCard({ po, creatorProfile }: POInfoCardProps) {
  return (
    <div className="bg-surface border border-border rounded-xl p-6 shadow-sm lg:col-span-2">
      <h3 className="font-semibold text-lg border-b border-border pb-3 mb-4 m-0">
        Thông tin chung
      </h3>
      <div className="grid grid-cols-2 gap-y-4 gap-x-6">
        <div className="flex flex-col">
          <span className="text-xs text-muted-foreground">Ngày đặt</span>
          <span className="font-medium text-sm mt-1">
            {dayjs(po.order_date).format('DD/MM/YYYY')}
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-xs text-muted-foreground">
            Ngày dự kiến giao
          </span>
          <span className="font-medium text-sm mt-1">
            {po.expected_date
              ? dayjs(po.expected_date).format('DD/MM/YYYY')
              : 'Chưa cập nhật'}
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-xs text-muted-foreground">Trạng thái</span>
          <span className="font-medium text-sm mt-1">
            {purchaseOrderStatus[po.status as POStatus]?.label || po.status}
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-xs text-muted-foreground">Người tạo</span>
          <span className="font-medium text-sm mt-1">
            {creatorProfile?.name ||
              creatorProfile?.email ||
              po.created_by ||
              'Hệ thống'}
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-xs text-muted-foreground">Điều khoản TT</span>
          <span className="font-medium text-sm mt-1">
            {po.payment_terms || 'Không có'}
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-xs text-muted-foreground">NCC Ref</span>
          <span className="font-medium text-sm mt-1">
            {po.supplier_ref || 'Không có'}
          </span>
        </div>

        <div className="col-span-2 mt-4 pt-4 border-t border-border space-y-2">
          {po.subtotal_amount !== undefined && po.subtotal_amount !== null && (
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Tạm tính:</span>
              <span className="font-medium">
                <MoneyText value={po.subtotal_amount} />
              </span>
            </div>
          )}
          {po.vat_amount !== undefined &&
            po.vat_amount !== null &&
            po.vat_amount > 0 && (
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">
                  Thuế VAT{po.vat_rate ? ` (${po.vat_rate}%)` : ''}:
                </span>
                <span className="font-medium">
                  <MoneyText value={po.vat_amount} />
                </span>
              </div>
            )}
          {po.shipping_fee !== undefined &&
            po.shipping_fee !== null &&
            po.shipping_fee > 0 && (
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Phí vận chuyển:</span>
                <span className="font-medium">
                  <MoneyText value={po.shipping_fee} />
                </span>
              </div>
            )}
          <div className="flex justify-between items-center pt-2">
            <span className="text-muted-foreground font-medium text-base">
              Tổng tiền:
            </span>
            <span className="font-bold text-foreground text-2xl bg-primary/10 px-4 py-1.5 rounded-lg">
              <MoneyText value={po.total_amount} />
            </span>
          </div>
        </div>

        {po.status === 'rejected' && po.rejection_reason && (
          <div className="col-span-2 mt-2 p-3 bg-red-50 border border-danger text-danger text-sm rounded-lg">
            <span className="font-bold">Lý do từ chối:</span>{' '}
            {po.rejection_reason}
          </div>
        )}

        {po.status === 'supplier_rejected' && po.supplier_rejection_reason && (
          <div className="col-span-2 mt-2 p-3 bg-red-50 border border-danger text-danger text-sm rounded-lg flex items-start gap-3">
            <div className="bg-danger text-inverse-foreground rounded-full p-1 shrink-0 mt-0.5">
              <Icon name="X" size={14} />
            </div>
            <div>
              <p className="font-bold text-danger-strong mb-0.5">
                NCC đã từ chối đơn hàng
              </p>
              <p className="text-danger-strong/80 text-xs mb-1">
                Lúc{' '}
                {po.confirmed_at
                  ? dayjs(po.confirmed_at).format('HH:mm - DD/MM/YYYY')
                  : ''}
              </p>
              <p className="font-medium">
                Lý do: {po.supplier_rejection_reason}
              </p>
            </div>
          </div>
        )}

        {po.confirmed_at && po.status !== 'supplier_rejected' && (
          <div className="col-span-2 mt-2 p-3 bg-success-soft border border-success/30 text-sm rounded-lg flex items-start gap-3">
            <div className="bg-success text-inverse-foreground rounded-full p-1 shrink-0 mt-0.5">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="font-bold text-success-strong mb-0.5">
                NCC đã xác nhận đơn hàng
              </p>
              <p className="text-success-strong/80 text-xs mb-1">
                Lúc {dayjs(po.confirmed_at).format('HH:mm - DD/MM/YYYY')}
              </p>
              <div className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-success/20 text-success-strong border border-success/30">
                Nguồn:{' '}
                {po.confirmation_method === 'portal'
                  ? 'Cổng thông tin NCC (Portal)'
                  : 'Manual (Thủ công)'}
              </div>
            </div>
          </div>
        )}
      </div>

      <POSupplierPortalStatus po={po} />
    </div>
  );
}
