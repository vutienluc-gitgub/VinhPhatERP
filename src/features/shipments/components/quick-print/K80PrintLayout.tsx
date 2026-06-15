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
};

type K80PrintLayoutProps = {
  data: K80PrintData;
};

export const K80PrintLayout = React.forwardRef<
  HTMLDivElement,
  K80PrintLayoutProps
>(({ data }, ref) => {
  return (
    <div
      ref={ref}
      className="k80-print-container bg-white text-black p-4 text-sm font-mono mx-auto"
      style={{ width: '300px', maxWidth: '300px' }} // Approx 80mm
    >
      <style>
        {`
            @media print {
              body * {
                visibility: hidden;
              }
              .k80-print-container, .k80-print-container * {
                visibility: visible;
              }
              .k80-print-container {
                position: absolute;
                left: 0;
                top: 0;
                width: 80mm !important;
                margin: 0;
                padding: 0;
              }
              @page {
                size: 80mm auto;
                margin: 0;
              }
            }
          `}
      </style>
      <div className="text-center mb-4">
        <h2 className="font-bold text-[16px] mb-1 tracking-[1px]">
          {LABELS.COMPANY_NAME}
        </h2>
        <div className="font-bold text-sm">=================</div>
        <h3 className="font-bold text-[16px] tracking-[1px] mt-1">
          {LABELS.RECEIPT_TITLE}
        </h3>
      </div>

      <div className="border-b border-dashed border-black pb-2 mb-2 space-y-1">
        <div className="flex justify-between">
          <span>{LABELS.TICKET_NO}</span>
          <span>{data.ticketNumber || LABELS.EMPTY_VALUE}</span>
        </div>
        <div className="flex justify-between">
          <span>{LABELS.DATE}</span>
          <span>{data.date || LABELS.EMPTY_VALUE}</span>
        </div>
        <div className="flex justify-between">
          <span>{LABELS.EXPORT_TIME}</span>
          <span>{data.exportTime || LABELS.EMPTY_VALUE}</span>
        </div>
      </div>

      <div className="border-b border-dashed border-black pb-2 mb-2 space-y-1">
        <div className="flex justify-between">
          <span>{LABELS.PRINT_TIME}</span>
          <span>{data.printTime || LABELS.EMPTY_VALUE}</span>
        </div>
        <div className="flex justify-between">
          <span>{LABELS.PRINTED_BY}</span>
          <span>{data.printedBy || LABELS.EMPTY_VALUE}</span>
        </div>
      </div>

      <div className="border-b border-dashed border-black pb-2 mb-2">
        <div className="font-bold">{LABELS.CUSTOMER}</div>
        <div>{data.customerName || LABELS.EMPTY_VALUE}</div>
      </div>

      {data.columns.length > 0 ? (
        <>
          <table className="w-full mb-2">
            <thead>
              <tr>
                {data.columns.map((col) => (
                  <th
                    key={col.id}
                    className="text-center border-b border-dashed border-black pb-1"
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
                    {col.weights.length > 0 ? `${col.weights.length}C` : ''}
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
        <div className="text-center italic text-gray-500 my-4">
          {LABELS.NO_DATA}
        </div>
      )}

      <div className="border-t border-dashed border-black pt-2 mb-4 space-y-1">
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

      <div className="flex justify-between mt-8 text-center">
        <div className="w-1/2">
          <div className="font-bold">{LABELS.SENDER}</div>
          <div className="text-xs mt-12">{LABELS.SIGN_INSTRUCTION}</div>
        </div>
        <div className="w-1/2">
          <div className="font-bold">{LABELS.RECEIVER}</div>
          <div className="text-xs mt-12">{LABELS.SIGN_INSTRUCTION}</div>
        </div>
      </div>
    </div>
  );
});

K80PrintLayout.displayName = 'K80PrintLayout';
