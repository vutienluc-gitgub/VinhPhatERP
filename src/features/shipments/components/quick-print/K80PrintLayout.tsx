import React from 'react';

import { K80_PRINT_LAYOUT_LABELS as LABELS } from './k80-quick-print.constants';

export type K80ColumnData = {
  id: string;
  fabricCode: string;
  weights: number[];
  totalKg: number;
};

export type K80PrintData = {
  ticketNumber: string;
  date: string;
  exportTime: string;
  printTime: string;
  printedBy: string;
  customerName: string;
  columns: K80ColumnData[];
  maxRows: number;
  totalRolls: number;
  totalKg: number;
  paperSize?: 'K80' | 'A5';
};

type K80PrintLayoutProps = {
  data: K80PrintData;
  isPrintPortal?: boolean;
};

export const K80PrintLayout = React.forwardRef<
  HTMLDivElement,
  K80PrintLayoutProps
>(({ data, isPrintPortal }, ref) => {
  const isA5 = data.paperSize === 'A5';
  const containerWidth = isA5 ? '210mm' : '300px';

  return (
    <div
      ref={ref}
      className={`${isPrintPortal ? 'k80-print-container hidden print:flex' : 'k80-preview-container'} bg-white text-black p-2 font-mono mx-auto print-spacing-tight text-sm flex flex-col`}
      style={{
        width: containerWidth,
        maxWidth: '100%',
        ...(isA5 && { height: '148.5mm', overflow: 'hidden' }),
      }}
    >
      <style>
        {`
            @media print {
              html, body {
                height: auto !important;
                margin: 0 !important;
                padding: 0 !important;
                overflow: visible !important;
              }
              #root, #modal-root {
                display: none !important;
              }
              .k80-print-container {
                width: ${isA5 ? '210mm' : '80mm'} !important;
                ${isA5 ? 'height: 148.5mm !important; max-height: 148.5mm !important; overflow: hidden !important; box-sizing: border-box !important; page-break-inside: avoid !important; break-inside: avoid !important;' : ''}
                margin: 0;
                padding: ${isA5 ? '2mm 10mm' : '0'};
              }
              @page {
                ${isA5 ? '/* No size for A5 to avoid Chrome rotation */' : 'size: 80mm auto;'}
                margin: 0;
              }
            }
          `}
      </style>
      <div className="text-center mb-1">
        <h2 className="font-bold text-[16px] mb-0 tracking-[1px]">
          {LABELS.COMPANY_NAME}
        </h2>
        <div className="font-bold text-sm leading-none">
          {LABELS.SEPARATOR_LINE}
        </div>
        <h3 className="font-bold text-[16px] tracking-[1px]">
          {LABELS.RECEIPT_TITLE}
        </h3>
      </div>

      <div
        className={`print-section-tight grid ${isA5 ? 'grid-cols-2 gap-x-6' : 'grid-cols-1'} gap-y-1`}
      >
        <div className="flex justify-between items-baseline gap-2">
          <span className="text-[0.85em] shrink-0">{LABELS.TICKET_NO}</span>
          <span className="font-bold text-right">
            {data.ticketNumber || LABELS.EMPTY_VALUE}
          </span>
        </div>
        <div className="flex justify-between items-baseline gap-2">
          <span className="text-[0.85em] shrink-0">{LABELS.DATE}</span>
          <span className="font-bold text-right">
            {data.date || LABELS.EMPTY_VALUE}
          </span>
        </div>

        <div className="flex justify-between items-baseline gap-2">
          <span className="text-[0.85em] shrink-0">{LABELS.EXPORT_TIME}</span>
          <span className="font-bold text-right">
            {data.exportTime || LABELS.EMPTY_VALUE}
          </span>
        </div>
        <div className="flex justify-between items-baseline gap-2">
          <span className="text-[0.85em] shrink-0">{LABELS.PRINT_TIME}</span>
          <span className="font-bold text-right">
            {data.printTime || LABELS.EMPTY_VALUE}
          </span>
        </div>

        <div className="flex justify-between items-baseline gap-2">
          <span className="text-[0.85em] shrink-0">{LABELS.PRINTED_BY}</span>
          <span className="font-bold text-right">
            {data.printedBy || LABELS.EMPTY_VALUE}
          </span>
        </div>

        <div
          className={`flex items-baseline gap-2 ${isA5 ? 'col-span-2' : ''}`}
        >
          <span className="text-[0.85em] shrink-0">{LABELS.CUSTOMER}</span>
          <span className="font-bold">
            {data.customerName || LABELS.EMPTY_VALUE}
          </span>
        </div>
      </div>

      {data.columns.length > 0 ? (
        <>
          <table className="print-table-tight mb-2">
            <thead>
              <tr>
                {data.columns.map((col) => (
                  <th
                    key={col.id}
                    className="text-right border-b border-dashed border-black pb-1"
                    style={{ width: `${100 / data.columns.length}%` }}
                  >
                    {col.fabricCode || LABELS.EMPTY_DASH}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: data.maxRows }).map((_, rowIdx) => (
                <tr key={`row-${rowIdx}`}>
                  {data.columns.map((col) => (
                    <td
                      key={`cell-${col.id}-${rowIdx}`}
                      className="text-right pt-1"
                      style={{ fontVariantNumeric: 'tabular-nums' }}
                    >
                      {col.weights[rowIdx] !== undefined
                        ? col.weights[rowIdx].toFixed(1)
                        : ''}
                    </td>
                  ))}
                </tr>
              ))}
              <tr>
                <td colSpan={data.columns.length} className="pt-2">
                  <div className="border-t border-dashed border-black w-full" />
                </td>
              </tr>
              <tr>
                {data.columns.map((col) => (
                  <td
                    key={`roll-${col.id}`}
                    className="text-right font-medium pt-1"
                  >
                    {col.weights.length > 0
                      ? `${col.weights.length}${LABELS.ROLL_UNIT_ABBR}`
                      : ''}
                  </td>
                ))}
              </tr>
              <tr>
                {data.columns.map((col) => (
                  <td
                    key={`total-${col.id}`}
                    className="text-right font-bold text-[1.05em] pt-1"
                    style={{ fontVariantNumeric: 'tabular-nums' }}
                  >
                    {col.weights.length > 0 ? col.totalKg.toFixed(1) : ''}
                  </td>
                ))}
              </tr>
              <tr>
                <td colSpan={data.columns.length} className="pt-2">
                  <div className="border-t border-dashed border-black w-full" />
                </td>
              </tr>
            </tbody>
          </table>
        </>
      ) : (
        <div className="text-center italic text-muted my-4">
          {LABELS.NO_DATA}
        </div>
      )}

      <div className="mt-auto">
        <div className="print-section-tight border-t pt-2 mt-2 space-y-1">
          <div className="flex justify-between">
            <span>{LABELS.TOTAL_CODES}</span>
            <span className="font-bold">{data.columns.length}</span>
          </div>
          <div className="flex justify-between">
            <span>{LABELS.TOTAL_ROLLS}</span>
            <span className="font-bold">{data.totalRolls}</span>
          </div>
          <div className="flex justify-between">
            <span>{LABELS.TOTAL_KG}</span>
            <span className="font-bold">{data.totalKg.toFixed(1)}</span>
          </div>
        </div>

        <div className="flex justify-between mt-2 text-center">
          <div className="w-1/2">
            <div className="font-bold">{LABELS.SENDER}</div>
            <div className="text-[0.7em] mt-4">{LABELS.SIGN_INSTRUCTION}</div>
          </div>
          <div className="w-1/2">
            <div className="font-bold">{LABELS.RECEIVER}</div>
            <div className="text-[0.7em] mt-4">{LABELS.SIGN_INSTRUCTION}</div>
          </div>
        </div>
      </div>
    </div>
  );
});

K80PrintLayout.displayName = 'K80PrintLayout';
