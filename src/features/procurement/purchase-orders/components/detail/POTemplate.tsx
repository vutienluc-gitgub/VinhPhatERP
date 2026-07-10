import { format } from 'date-fns';
import { QRCodeSVG } from 'qrcode.react';

import type { PurchaseOrder } from '@/domain/purchase-orders';
import { formatValue } from '@/shared/value';

interface POTemplateProps {
  po: PurchaseOrder;
  globalMaterials: { id: string; name: string; code: string; type: string }[];
  creatorProfile?: { name: string; email: string } | null;
}

export function POTemplate({
  po,
  globalMaterials,
  creatorProfile,
}: POTemplateProps) {
  const getMaterialDetail = (materialId: string) => {
    return (
      globalMaterials.find((m) => m.id === materialId) || {
        name: 'N/A',
        code: 'N/A',
        type: 'yarn',
      }
    );
  };

  const poUrl = `${window.location.origin}/purchase-orders/${po.id}`;
  const currency = po.currency || 'VND';

  return (
    <div
      id="po-print-template"
      className="p-8 bg-white text-gray-800 text-sm font-sans relative"
      style={{ width: '210mm', minHeight: '297mm', boxSizing: 'border-box' }}
    >
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #po-print-template, #po-print-template * {
            visibility: visible !important;
          }
          #po-print-template {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 210mm !important;
            height: 297mm !important;
            padding: 20mm !important;
            box-shadow: none !important;
          }
        }
      `}</style>
      {/* Header */}
      <div className="flex justify-between items-start border-b-2 border-primary pb-4 mb-6">
        <div className="flex gap-4 items-center">
          <div className="w-16 h-16 bg-primary rounded-xl flex items-center justify-center text-white font-bold text-2xl">
            VP
          </div>
          <div>
            <h2 className="font-bold text-lg text-primary m-0">
              CÔNG TY CỔ PHẦN DỆT MAY VĨNH PHÁT
            </h2>
            <p className="text-xs text-muted m-0">
              Địa chỉ: Lô A2, Đường số 3, KCN Hải Sơn, Đức Hòa, Long An
            </p>
            <p className="text-xs text-muted m-0">
              Điện thoại: +84 272 377 8888 | MST: 1234567890
            </p>
          </div>
        </div>
        <div className="flex flex-col items-end">
          <QRCodeSVG value={poUrl} size={64} />
          <span className="text-[10px] text-gray-400 mt-1">Quét xác thực</span>
        </div>
      </div>

      {/* Title */}
      <div className="text-center mb-8">
        <h1 className="font-bold text-2xl text-gray-900 m-0 uppercase">
          Đơn Đặt Hàng / Purchase Order
        </h1>
        <p className="text-gray-500 font-semibold mt-1">Mã PO: {po.po_code}</p>
      </div>

      {/* Info Sections */}
      <div className="grid grid-cols-2 gap-8 mb-6 border border-gray-200 p-4 rounded-xl">
        <div>
          <h3 className="font-bold text-gray-900 border-b border-gray-200 pb-1 mb-2 uppercase text-xs">
            Thông tin Nhà cung cấp / Supplier Info
          </h3>
          <p className="m-0">
            <span className="font-semibold">Nhà cung cấp:</span>{' '}
            {po.supplier_name_snapshot}
          </p>
          <p className="m-0 mt-1">
            <span className="font-semibold">Điều khoản TT:</span>{' '}
            {po.payment_terms || 'N/A'}
          </p>
          <p className="m-0 mt-1">
            <span className="font-semibold">Incoterms:</span>{' '}
            {po.incoterms || 'N/A'}
          </p>
        </div>
        <div>
          <h3 className="font-bold text-gray-900 border-b border-gray-200 pb-1 mb-2 uppercase text-xs">
            Thông tin Đơn hàng / Order Info
          </h3>
          <p className="m-0">
            <span className="font-semibold">Ngày đặt hàng:</span>{' '}
            {format(new Date(po.order_date), 'dd/MM/yyyy')}
          </p>
          <p className="m-0 mt-1">
            <span className="font-semibold">Ngày dự kiến giao:</span>{' '}
            {po.expected_date
              ? format(new Date(po.expected_date), 'dd/MM/yyyy')
              : 'N/A'}
          </p>
          <p className="m-0 mt-1">
            <span className="font-semibold">Người phụ trách:</span>{' '}
            {creatorProfile?.name || 'N/A'}
          </p>
        </div>
      </div>

      {/* Materials Table */}
      <div className="mb-6">
        <table className="w-full border-collapse border border-gray-200 text-xs">
          <thead>
            <tr className="bg-gray-50">
              <th className="border border-gray-200 p-2 text-center w-10">
                STT
              </th>
              <th className="border border-gray-200 p-2 text-left">
                Mã nguyên liệu
              </th>
              <th className="border border-gray-200 p-2 text-left">
                Tên nguyên liệu
              </th>
              <th className="border border-gray-200 p-2 text-center w-16">
                ĐVT
              </th>
              <th className="border border-gray-200 p-2 text-right w-24">
                Số lượng
              </th>
              <th className="border border-gray-200 p-2 text-right w-28">
                Đơn giá
              </th>
              <th className="border border-gray-200 p-2 text-right w-32">
                Thành tiền
              </th>
            </tr>
          </thead>
          <tbody>
            {po.items?.map((item, index) => {
              const detail = getMaterialDetail(item.material_id);
              return (
                <tr key={item.id}>
                  <td className="border border-gray-200 p-2 text-center">
                    {index + 1}
                  </td>
                  <td className="border border-gray-200 p-2 font-mono">
                    {detail.code}
                  </td>
                  <td className="border border-gray-200 p-2">{detail.name}</td>
                  <td className="border border-gray-200 p-2 text-center uppercase">
                    {item.uom || 'kg'}
                  </td>
                  <td className="border border-gray-200 p-2 text-right">
                    {formatValue(item.ordered_qty)}
                  </td>
                  <td className="border border-gray-200 p-2 text-right">
                    {formatValue(item.unit_price)} {currency}
                  </td>
                  <td className="border border-gray-200 p-2 text-right font-medium">
                    {formatValue(item.ordered_qty * item.unit_price)} {currency}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Summary calculations */}
      <div className="flex justify-between items-start mb-12">
        <div className="w-1/2">
          <p className="text-xs text-gray-500 italic">
            * Lưu ý: Giá trị trên chưa bao gồm các khoản thuế hoặc chiết khấu
            khác ngoại trừ đã nêu trên.
          </p>
        </div>
        <div className="w-5/12 border border-gray-200 rounded-xl p-3 bg-gray-50 text-xs">
          <div className="flex justify-between py-1 border-b border-gray-200">
            <span>Tiền hàng (Subtotal):</span>
            <span className="font-semibold">
              {formatValue(po.total_amount - (po.shipping_fee ?? 0))} {currency}
            </span>
          </div>
          {(po.vat_rate ?? 0) > 0 && (
            <div className="flex justify-between py-1 border-b border-gray-200">
              <span>Thuế VAT ({po.vat_rate}%):</span>
              <span className="font-semibold">
                {formatValue(
                  (po.total_amount - (po.shipping_fee ?? 0)) *
                    ((po.vat_rate ?? 0) / 100),
                )}{' '}
                {currency}
              </span>
            </div>
          )}
          {(po.shipping_fee ?? 0) > 0 && (
            <div className="flex justify-between py-1 border-b border-gray-200">
              <span>Phí vận chuyển:</span>
              <span className="font-semibold">
                {formatValue(po.shipping_fee ?? 0)} {currency}
              </span>
            </div>
          )}
          <div className="flex justify-between py-1.5 text-sm font-bold text-primary">
            <span>Tổng cộng (Total):</span>
            <span>
              {formatValue(po.total_amount)} {currency}
            </span>
          </div>
        </div>
      </div>

      {/* Signatures */}
      <div className="grid grid-cols-3 gap-4 text-center mt-8">
        <div>
          <span className="font-bold text-xs uppercase block mb-12">
            Người lập biểu
          </span>
          <div className="h-0.5 w-32 bg-gray-200 mx-auto mb-1"></div>
          <span className="text-xs text-gray-500">
            {creatorProfile?.name || 'N/A'}
          </span>
        </div>
        <div>
          <span className="font-bold text-xs uppercase block mb-12">
            Trưởng phòng mua hàng
          </span>
          <div className="h-0.5 w-32 bg-gray-200 mx-auto mb-1"></div>
          <span className="text-xs text-gray-500">Phê duyệt nội bộ</span>
        </div>
        <div>
          <span className="font-bold text-xs uppercase block mb-12">
            Ban Giám Đốc
          </span>
          <div className="h-0.5 w-32 bg-gray-200 mx-auto mb-1"></div>
          <span className="text-xs text-gray-500">
            {po.status === 'approved' || po.status === 'completed'
              ? 'Đã Duyệt Điện Tử'
              : 'Chờ ký duyệt'}
          </span>
        </div>
      </div>

      {/* Footer info */}
      <div className="border-t border-gray-200 mt-20 pt-4 text-center text-[10px] text-gray-400">
        Đơn đặt hàng điện tử này được tạo tự động bởi Hệ thống ERP VinhPhat -
        Version 2.0.0
      </div>
    </div>
  );
}
