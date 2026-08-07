import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

import { Button, PrintPreviewBox } from '@/shared/components';
import { Icon } from '@/shared/components/Icon';
import { VPEntityPicker } from '@/shared/components';
import { K80PrintLayout } from '@/features/shipments/components/quick-print/K80PrintLayout';
import {
  K80_QUICK_PRINT_LABELS as LABELS,
  K80_QUICK_PRINT_MESSAGES as MESSAGES,
} from '@/features/shipments/components/quick-print/k80-quick-print.constants';

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
    handleProcess,
    handleExportExcel,
    handleShareZalo,
    isPending,
    isExportingImage,
    paperSize,
    setPaperSize,
  } = useK80QuickShipment();

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 pb-20">
      <div className="flex items-center gap-3">
        <Icon name="Printer" size={24} className="text-success" />
        <h1 className="text-2xl font-bold uppercase tracking-wide text-foreground">
          {LABELS.PAGE_TITLE}
        </h1>
      </div>

      <div className="flex flex-col xl:flex-row gap-6 items-start">
        {/* LEFT COLUMN: FORM */}
        <div className="w-full xl:flex-1 flex flex-col gap-6">
          <div className="bg-surface rounded-2xl shadow-sm border border-[var(--border)] p-4 sm:p-6 space-y-6">
            <h2 className="font-semibold text-lg border-b border-dashed border-[var(--border)] pb-2">
              {LABELS.GENERAL_INFO}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="form-field">
                <label>
                  {LABELS.CUSTOMER} <span className="text-danger">*</span>
                </label>
                <VPEntityPicker
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
                  className="flex flex-col gap-2 bg-[var(--surface-subtle)] p-3 rounded-xl border border-[var(--border)]"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm text-muted">
                      {LABELS.COLUMN} {idx + 1}
                    </span>
                    {columns.length > 1 && (
                      <button
                        type="button"
                        className="text-danger hover:text-danger p-1 rounded transition-colors"
                        onClick={() => removeColumn(col.id)}
                        title={LABELS.DELETE_COLUMN}
                      >
                        <Icon name="X" size={16} />
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    className="field-input font-bold text-center bg-surface focus:border-primary"
                    placeholder={LABELS.FABRIC_CODE}
                    value={col.fabricCode}
                    onChange={(e) =>
                      updateColumn(col.id, 'fabricCode', e.target.value)
                    }
                  />
                  <textarea
                    className="field-input font-mono text-sm resize-y bg-surface focus:border-primary"
                    rows={8}
                    placeholder={MESSAGES.PLACEHOLDER_WEIGHTS}
                    value={col.weightsText}
                    onChange={(e) =>
                      updateColumn(col.id, 'weightsText', e.target.value)
                    }
                  />
                </div>
              ))}
            </div>
            <p className="text-xs mt-2 bg-info/10 text-info p-3 rounded-lg flex items-start gap-2">
              <Icon name="Info" size={16} className="mt-0.5 shrink-0" />
              <span>{LABELS.TIP_EXCEL}</span>
            </p>
          </div>
        </div>

        {/* RIGHT COLUMN: ACTION & PREVIEW */}
        <div className="w-full xl:w-[450px] shrink-0 flex flex-col gap-6 xl:sticky xl:top-20">
          <div className="w-full bg-surface rounded-2xl shadow-sm border border-[var(--border)] p-6 flex flex-col gap-6">
            <div className="text-center">
              <h2 className="font-bold text-xl">{`${LABELS.PROCESS_AND_PRINT} ${paperSize}`}</h2>
              <p className="text-sm text-muted mt-1">{LABELS.CHECK_INFO}</p>
            </div>

            <label className="flex items-center gap-3 cursor-pointer p-4 bg-[var(--surface-subtle)] hover:bg-[var(--surface-hover)] rounded-xl border border-[var(--border)] transition-all">
              <input
                type="checkbox"
                className="rounded border-[var(--border)] text-primary focus:ring-primary w-5 h-5 shadow-sm"
                checked={saveToDb}
                onChange={(e) => setSaveToDb(e.target.checked)}
              />
              <span className="font-medium text-base">{LABELS.SAVE_TO_DB}</span>
            </label>

            <div className="flex gap-4 p-4 bg-[var(--surface-subtle)] rounded-xl border border-[var(--border)] w-full justify-center">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="paperSize"
                  value="K80"
                  checked={paperSize === 'K80'}
                  onChange={() => setPaperSize('K80')}
                  className="text-primary focus:ring-primary w-4 h-4"
                />
                <span className="font-medium">{LABELS.PAPER_SIZE_K80}</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="paperSize"
                  value="A5"
                  checked={paperSize === 'A5'}
                  onChange={() => setPaperSize('A5')}
                  className="text-primary focus:ring-primary w-4 h-4"
                />
                <span className="font-medium">{LABELS.PAPER_SIZE_A5}</span>
              </label>
            </div>

            <div className="flex flex-col w-full gap-3">
              <Button
                variant="primary"
                size="lg"
                className="w-full text-lg h-14 flex-1"
                onClick={handleProcess}
                disabled={isPending}
              >
                {isPending ? (
                  <span className="animate-pulse">{LABELS.PROCESSING}</span>
                ) : (
                  <>
                    <Icon name="Printer" size={20} className="mr-2" />
                    {saveToDb
                      ? `${LABELS.BTN_SAVE_PRINT_PREFIX} ${paperSize}`
                      : `${LABELS.BTN_PRINT_ONLY_PREFIX} ${paperSize} ${LABELS.BTN_PRINT_ONLY_SUFFIX}`}
                  </>
                )}
              </Button>

              <div className="flex w-full gap-3">
                <Button
                  variant="secondary"
                  size="lg"
                  className="flex-1 h-14 px-2 flex justify-center items-center gap-2 whitespace-nowrap overflow-hidden"
                  onClick={handleShareZalo}
                  disabled={
                    isPending ||
                    isExportingImage ||
                    columns.every((c) => c.weightsText.trim() === '')
                  }
                >
                  {isExportingImage ? (
                    <Icon name="Loader2" size={20} className="animate-spin" />
                  ) : (
                    <Icon name="Image" size={20} />
                  )}
                  {LABELS.BTN_SHARE_ZALO}
                </Button>

                <Button
                  variant="secondary"
                  size="lg"
                  className="flex-1 h-14 px-2 flex justify-center items-center gap-2 whitespace-nowrap overflow-hidden"
                  onClick={handleExportExcel}
                  disabled={
                    isPending ||
                    columns.every((c) => c.weightsText.trim() === '')
                  }
                >
                  <Icon name="FileSpreadsheet" size={20} />
                  {LABELS.BTN_EXPORT_EXCEL}
                </Button>
              </div>
            </div>
          </div>

          <PrintPreviewBox
            title={LABELS.PREVIEW_TITLE}
            zoomLevels={paperSize === 'A5' ? [0.5, 0.75, 1] : [0.75, 1, 1.25]}
            defaultZoom={paperSize === 'A5' ? 0.5 : 1}
            key={paperSize}
          >
            <K80PrintLayout data={printData} />
          </PrintPreviewBox>
        </div>
      </div>

      {mounted &&
        createPortal(
          <div className="hidden print:block">
            <K80PrintLayout data={printData} isPrintPortal={true} />
          </div>,
          document.body,
        )}
    </div>
  );
}
