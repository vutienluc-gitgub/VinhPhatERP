import { useState } from 'react';

import { Button } from '@/shared/components';
import { Icon } from '@/shared/components/Icon';
import { Combobox } from '@/shared/components/Combobox';
import { K80PrintLayout } from '@/features/shipments/components/quick-print/K80PrintLayout';
import { K80_QUICK_PRINT_LABELS as LABELS } from '@/features/shipments/components/quick-print/k80-quick-print.constants';

import { useK80QuickShipment } from './useK80QuickShipment';

export function K80QuickShipmentPage() {
  const {
    ticketNumber,
    setTicketNumber,
    date,
    setDate,
    customerId,
    setCustomerId,
    saveToDb,
    setSaveToDb,
    columns,
    customerComboOptions,
    addColumn,
    removeColumn,
    updateColumn,
    printData,
    printRef,
    handleProcess,
    isPending,
  } = useK80QuickShipment();

  const [zoom, setZoom] = useState(1);

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 pb-20">
      <div className="flex items-center gap-3">
        <Icon name="Printer" size={24} className="text-emerald-500" />
        <h1 className="text-2xl font-bold uppercase tracking-wide text-slate-800">
          {LABELS.PAGE_TITLE}
        </h1>
      </div>

      <div className="flex flex-col gap-6 items-start">
        {/* TOP: FORM */}
        <div className="w-full flex flex-col gap-4">
          <div className="bg-surface rounded-2xl shadow-sm border border-[var(--border)] p-4 sm:p-6 space-y-6">
            <h2 className="font-semibold text-lg border-b border-dashed border-[var(--border)] pb-2">
              {LABELS.GENERAL_INFO}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="form-field">
                <label>
                  {LABELS.CUSTOMER} <span className="text-red-500">*</span>
                </label>
                <Combobox
                  options={customerComboOptions}
                  value={customerId}
                  onChange={setCustomerId}
                  placeholder={LABELS.SELECT_CUSTOMER}
                />
              </div>
              <div className="form-field">
                <label>{LABELS.SHIP_DATE}</label>
                <input
                  type="date"
                  className="field-input"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>
              <div className="form-field">
                <label>{LABELS.TICKET_NUMBER}</label>
                <input
                  type="text"
                  className="field-input"
                  value={ticketNumber}
                  onChange={(e) => setTicketNumber(e.target.value)}
                  placeholder={LABELS.AUTO}
                />
              </div>
            </div>
          </div>

          <div className="bg-surface rounded-2xl shadow-sm border border-[var(--border)] p-4 sm:p-6">
            <div className="flex items-center justify-between border-b border-dashed border-[var(--border)] pb-2 mb-4">
              <h2 className="font-semibold text-lg">{LABELS.PRODUCT_DATA}</h2>
              <Button
                variant="secondary"
                onClick={addColumn}
                disabled={columns.length >= 5}
              >
                <Icon name="Plus" size={16} className="mr-2" />
                {LABELS.ADD_COLUMN}
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 pb-4">
              {columns.map((col, idx) => (
                <div
                  key={col.id}
                  className="flex flex-col gap-2 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-200 dark:border-slate-700"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm text-[var(--text-secondary)]">
                      {LABELS.COLUMN} {idx + 1}
                    </span>
                    {columns.length > 1 && (
                      <button
                        type="button"
                        className="text-red-500 hover:text-red-600 p-1 rounded transition-colors"
                        onClick={() => removeColumn(col.id)}
                        title={LABELS.DELETE_COLUMN}
                      >
                        <Icon name="X" size={16} />
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    className="field-input font-bold text-center bg-white dark:bg-slate-900 border-slate-300 focus:border-emerald-500"
                    placeholder={LABELS.FABRIC_CODE}
                    value={col.fabricCode}
                    onChange={(e) =>
                      updateColumn(col.id, 'fabricCode', e.target.value)
                    }
                  />
                  <textarea
                    className="field-input font-mono text-sm resize-y bg-white dark:bg-slate-900 border-slate-300 focus:border-emerald-500"
                    rows={8}
                    placeholder="24.5&#10;25.2&#10;24.8"
                    value={col.weightsText}
                    onChange={(e) =>
                      updateColumn(col.id, 'weightsText', e.target.value)
                    }
                  />
                </div>
              ))}
            </div>
            <p className="text-xs text-[var(--text-tertiary)] mt-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-300 p-3 rounded-lg flex items-start gap-2">
              <Icon name="Info" size={16} className="mt-0.5 shrink-0" />
              <span>{LABELS.TIP_EXCEL}</span>
            </p>
          </div>
        </div>

        {/* BOTTOM: ACTION & PREVIEW */}
        <div className="w-full flex flex-col items-center gap-6 mt-4">
          <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-700 p-6 flex flex-col gap-6">
            <div className="text-center">
              <h2 className="font-bold text-xl text-slate-800 dark:text-white">
                {LABELS.PROCESS_AND_PRINT}
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                {LABELS.CHECK_INFO}
              </p>
            </div>

            <label className="flex items-center gap-3 cursor-pointer p-4 bg-indigo-50/50 hover:bg-indigo-50 dark:bg-indigo-900/10 dark:hover:bg-indigo-900/20 rounded-xl border border-indigo-100/50 hover:border-indigo-200 dark:border-indigo-800/30 transition-all">
              <input
                type="checkbox"
                className="rounded border-indigo-300 text-indigo-600 focus:ring-indigo-600 w-5 h-5 shadow-sm"
                checked={saveToDb}
                onChange={(e) => setSaveToDb(e.target.checked)}
              />
              <span className="font-medium text-base text-indigo-900 dark:text-indigo-200">
                {LABELS.SAVE_TO_DB}
              </span>
            </label>

            <Button
              variant="primary"
              size="lg"
              className="w-full text-lg h-14 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 shadow-emerald-500/25 border-transparent text-white"
              onClick={handleProcess}
              disabled={isPending}
            >
              {isPending ? (
                <span className="animate-pulse">{LABELS.PROCESSING}</span>
              ) : (
                <>
                  <Icon name="Printer" size={20} className="mr-2" />
                  {saveToDb ? LABELS.BTN_SAVE_PRINT : LABELS.BTN_PRINT_ONLY}
                </>
              )}
            </Button>
          </div>

          <div className="w-full max-w-md flex flex-col items-center gap-4">
            <div className="flex items-center justify-between w-full">
              <h3 className="font-medium text-sm text-slate-500 uppercase tracking-widest">
                {LABELS.PREVIEW_TITLE}
              </h3>
              <div className="flex gap-1 bg-slate-200 dark:bg-slate-700 p-1 rounded-lg">
                {[1, 1.25, 1.5].map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setZoom(level)}
                    className={`px-3 py-1 text-xs font-bold rounded shadow-sm transition-colors ${zoom === level ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}
                  >
                    {level * 100}%
                  </button>
                ))}
              </div>
            </div>
            <div className="bg-slate-100 dark:bg-slate-900 p-8 rounded-3xl w-full flex justify-center shadow-inner border border-slate-200 dark:border-slate-800 overflow-hidden">
              <div
                className="shadow-2xl border border-slate-300 dark:border-slate-600 transform transition-transform"
                style={{
                  transform: `scale(${zoom})`,
                  transformOrigin: 'top center',
                }}
              >
                <K80PrintLayout ref={printRef} data={printData} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
