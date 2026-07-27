import { format } from 'date-fns';
import { QRCodeSVG } from 'qrcode.react';

import type { PurchaseOrder } from '@/domain/purchase-orders';
import { formatValue } from '@/shared/value';
import { PO_CONSTANTS } from '@/features/procurement/purchase-orders/purchase-orders.constants';

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
      className="p-8 bg-white text-primary text-sm font-sans relative"
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
              {PO_CONSTANTS.TPL_COMPANY_NAME}
            </h2>
            <p className="text-xs text-muted m-0">
              {PO_CONSTANTS.TPL_COMPANY_ADDRESS}
            </p>
            <p className="text-xs text-muted m-0">
              {PO_CONSTANTS.TPL_COMPANY_CONTACT}
            </p>
          </div>
        </div>
        <div className="flex flex-col items-end">
          <QRCodeSVG value={poUrl} size={64} />
          <span className="text-[10px] text-muted-foreground mt-1">
            {PO_CONSTANTS.TPL_QR_HINT}
          </span>
        </div>
      </div>

      {/* Title */}
      <div className="text-center mb-8">
        <h1 className="font-bold text-2xl text-foreground m-0 uppercase">
          {PO_CONSTANTS.TPL_DOC_TITLE}
        </h1>
        <p className="text-muted font-semibold mt-1">
          {PO_CONSTANTS.COL_PO_CODE}: {po.po_code}
        </p>
      </div>

      {/* Info Sections */}
      <div className="grid grid-cols-2 gap-8 mb-6 border border-default p-4 rounded-xl">
        <div>
          <h3 className="font-bold text-foreground border-b border-default pb-1 mb-2 uppercase text-xs">
            {PO_CONSTANTS.TPL_SUPPLIER_SECTION}
          </h3>
          <p className="m-0">
            <span className="font-semibold">
              {PO_CONSTANTS.LABEL_SUPPLIER}:
            </span>{' '}
            {po.supplier_name_snapshot}
          </p>
          <p className="m-0 mt-1">
            <span className="font-semibold">
              {PO_CONSTANTS.LABEL_PAYMENT_TERMS}:
            </span>{' '}
            {po.payment_terms || 'N/A'}
          </p>
          <p className="m-0 mt-1">
            <span className="font-semibold">
              {PO_CONSTANTS.LABEL_INCOTERMS}:
            </span>{' '}
            {po.incoterms || 'N/A'}
          </p>
        </div>
        <div>
          <h3 className="font-bold text-foreground border-b border-default pb-1 mb-2 uppercase text-xs">
            {PO_CONSTANTS.TPL_ORDER_SECTION}
          </h3>
          <p className="m-0">
            <span className="font-semibold">
              {PO_CONSTANTS.LABEL_ORDER_DATE}:
            </span>{' '}
            {format(new Date(po.order_date), 'dd/MM/yyyy')}
          </p>
          <p className="m-0 mt-1">
            <span className="font-semibold">
              {PO_CONSTANTS.LABEL_EXPECTED_DATE}:
            </span>{' '}
            {po.expected_date
              ? format(new Date(po.expected_date), 'dd/MM/yyyy')
              : 'N/A'}
          </p>
          <p className="m-0 mt-1">
            <span className="font-semibold">{PO_CONSTANTS.LABEL_PIC}:</span>{' '}
            {creatorProfile?.name || 'N/A'}
          </p>
        </div>
      </div>

      {/* Materials Table */}
      <div className="mb-6">
        <table className="w-full border-collapse border border-default text-xs">
          <thead>
            <tr className="bg-gray-50">
              <th className="border border-default p-2 text-center w-10">
                {PO_CONSTANTS.TPL_COL_NO}
              </th>
              <th className="border border-default p-2 text-left">
                {PO_CONSTANTS.TPL_COL_CODE}
              </th>
              <th className="border border-default p-2 text-left">
                {PO_CONSTANTS.TPL_COL_NAME}
              </th>
              <th className="border border-default p-2 text-center w-16">
                {PO_CONSTANTS.COL_UOM}
              </th>
              <th className="border border-default p-2 text-right w-20">
                {PO_CONSTANTS.COL_QTY}
              </th>
              <th className="border border-default p-2 text-right w-24">
                {PO_CONSTANTS.COL_UNIT_PRICE}
              </th>
              <th className="border border-default p-2 text-right w-28">
                {PO_CONSTANTS.COL_LINE_TOTAL}
              </th>
            </tr>
          </thead>
          <tbody>
            {po.items?.map((item, index) => {
              const detail = getMaterialDetail(item.material_id);
              return (
                <tr key={item.id}>
                  <td className="border border-default p-2 text-center">
                    {index + 1}
                  </td>
                  <td className="border border-default p-2 font-mono">
                    {detail.code}
                  </td>
                  <td className="border border-default p-2">{detail.name}</td>
                  <td className="border border-default p-2 text-center uppercase">
                    {item.uom || 'kg'}
                  </td>
                  <td className="border border-default p-2 text-right">
                    {formatValue(item.ordered_qty)}
                  </td>
                  <td className="border border-default p-2 text-right">
                    {formatValue(item.unit_price)} {currency}
                  </td>
                  <td className="border border-default p-2 text-right font-medium">
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
          <p className="text-xs text-muted italic">
            * {PO_CONSTANTS.TPL_VAT_NOTE}
          </p>
        </div>
        <div className="w-5/12 border border-default rounded-xl p-3 bg-gray-50 text-xs">
          <div className="flex justify-between py-1 border-b border-default">
            <span>{PO_CONSTANTS.SUBTOTAL}:</span>
            <span className="font-semibold">
              {formatValue(po.total_amount - (po.shipping_fee ?? 0))} {currency}
            </span>
          </div>
          {(po.vat_rate ?? 0) > 0 && (
            <div className="flex justify-between py-1 border-b border-default">
              <span>
                {PO_CONSTANTS.VAT_RATE.replace('(%)', `(${po.vat_rate}%)`)}:
              </span>
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
            <div className="flex justify-between py-1 border-b border-default">
              <span>{PO_CONSTANTS.SHIPPING_FEE}:</span>
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
            {PO_CONSTANTS.TPL_SIGN_CREATOR}
          </span>
          <div className="h-0.5 w-32 bg-surface-secondary mx-auto mb-1"></div>
          <span className="text-xs text-muted">
            {creatorProfile?.name || 'N/A'}
          </span>
        </div>
        <div>
          <span className="font-bold text-xs uppercase block mb-12">
            {PO_CONSTANTS.TPL_SIGN_MANAGER}
          </span>
          <div className="h-0.5 w-32 bg-surface-secondary mx-auto mb-1"></div>
          <span className="text-xs text-muted">
            {PO_CONSTANTS.TPL_SIGN_INTERNAL_NOTE}
          </span>
        </div>
        <div>
          <span className="font-bold text-xs uppercase block mb-12">
            {PO_CONSTANTS.TPL_SIGN_DIRECTOR}
          </span>
          <div className="h-0.5 w-32 bg-surface-secondary mx-auto mb-1"></div>
          <span className="text-xs text-muted">
            {po.status === 'approved' || po.status === 'completed'
              ? PO_CONSTANTS.TPL_SIGN_APPROVED
              : PO_CONSTANTS.TPL_SIGN_PENDING}
          </span>
        </div>
      </div>

      {/* Footer info */}
      <div className="border-t border-default mt-20 pt-4 text-center text-[10px] text-muted-foreground">
        {PO_CONSTANTS.TPL_FOOTER_NOTE}
      </div>
    </div>
  );
}
