import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

import { formatQuantity } from '@/shared/value/core/formatter';
import { fetchPublicShipmentSummary } from '@/api/verify.api';
import type { PublicShipmentSummary } from '@/api/verify.api';

import {
  VERIFY_PAGE_MESSAGES as MSG,
  VERIFY_STATUS_LABELS,
  VERIFY_JOURNEY_LABELS,
  VERIFY_JOURNEY_ORDER,
} from './shipments.constants';

function formatDate(value: string | null | undefined): string {
  if (!value) return '—';
  const d = new Date(value);
  if (isNaN(d.getTime())) return value;
  return d.toLocaleDateString('vi-VN');
}

function formatDateTime(value: string | null | undefined): string {
  if (!value) return '—';
  const d = new Date(value);
  if (isNaN(d.getTime())) return value;
  // eslint-disable-next-line no-restricted-syntax
  return d.toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatQty(qty: number | null, unit: string | null): string {
  if (qty === null || qty === undefined) return '—';
  return `${formatQuantity(qty, 2)} ${unit ?? 'm'}`;
}

export function ShipmentVerifyPage() {
  const { shipmentNumber } = useParams<{ shipmentNumber: string }>();
  const [shipment, setShipment] = useState<PublicShipmentSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!shipmentNumber) return;
    setLoading(true);
    fetchPublicShipmentSummary(shipmentNumber)
      .then((data) => {
        setShipment(data);
        setLoading(false);
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : MSG.ERROR_GENERIC);
        setLoading(false);
      });
  }, [shipmentNumber]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f0f5fb]">
        <div className="text-[var(--text-secondary)] text-sm animate-pulse">
          {MSG.LOADING}
        </div>
      </div>
    );
  }

  if (error || !shipment) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#f0f5fb] gap-3 p-6">
        <div className="text-4xl">🔍</div>
        <h1 className="font-bold text-lg text-[var(--text-primary)]">
          {MSG.NOT_FOUND_TITLE}
        </h1>
        <p className="text-sm text-[var(--text-secondary)] text-center">
          {MSG.NOT_FOUND_DESC(shipmentNumber!)}
        </p>
      </div>
    );
  }

  const currentJourneyIdx = shipment.journey_status
    ? VERIFY_JOURNEY_ORDER.indexOf(shipment.journey_status)
    : -1;

  const isDelivered =
    shipment.status === 'delivered' ||
    shipment.journey_status === 'delivered_confirmed';

  return (
    <div className="min-h-screen bg-[#f0f5fb]">
      {/* Top accent */}
      <div className="h-1.5 bg-gradient-to-r from-[#0f3460] via-[#1a6bb5] to-[#3da5e0]" />

      <div className="max-w-md mx-auto px-4 py-6 flex flex-col gap-4">
        {/* Header card */}
        <div className="bg-white rounded-2xl shadow-sm border border-[#dce6f0] overflow-hidden">
          <div className="bg-[#0f3460] px-5 py-4">
            <div className="text-xs text-[#8eb8e5] font-semibold uppercase tracking-widest mb-1">
              {MSG.DOC_TITLE}
            </div>
            <div className="text-white text-2xl font-bold tracking-tight">
              {shipment.shipment_number}
            </div>
            <div className="text-[#b8d4f0] text-sm mt-1">
              {MSG.DELIVERY_DATE} {formatDate(shipment.shipment_date)}
            </div>
          </div>
          <div className="px-5 py-3 flex items-center justify-between">
            <span className="text-xs text-[var(--text-secondary)]">
              {MSG.STATUS_LBL}
            </span>
            <span
              className={`text-xs font-bold px-3 py-1 rounded-full ${
                isDelivered
                  ? 'bg-success-soft text-success'
                  : shipment.status === 'shipped'
                    ? 'bg-info-soft text-info'
                    : 'bg-surface-secondary text-muted'
              }`}
            >
              {VERIFY_STATUS_LABELS[shipment.status] ?? shipment.status}
            </span>
          </div>
        </div>

        {/* Customer info */}
        <div className="bg-white rounded-2xl shadow-sm border border-[#dce6f0] px-5 py-4 flex flex-col gap-2">
          <div className="text-xs font-bold uppercase text-[#0f3460] tracking-wider mb-1">
            {MSG.DELIVERY_INFO}
          </div>
          <div className="flex items-start gap-3 text-sm">
            <span className="text-lg leading-none">👤</span>
            <span className="text-[var(--text-primary)] font-medium">
              {shipment.customer_name ?? '—'}
            </span>
          </div>
          {shipment.delivery_address && (
            <div className="flex items-start gap-3 text-sm">
              <span className="text-lg leading-none">📍</span>
              <span className="text-[var(--text-secondary)]">
                {shipment.delivery_address}
              </span>
            </div>
          )}
        </div>

        {/* Items */}
        {shipment.items.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-[#dce6f0] overflow-hidden">
            <div className="px-5 py-3 border-b border-[#f0f5fb]">
              <span className="text-xs font-bold uppercase text-[#0f3460] tracking-wider">
                {MSG.ITEM_LIST(shipment.item_count)}
              </span>
            </div>
            <div className="divide-y divide-[#f0f5fb]">
              {shipment.items.map((item, idx) => (
                <div
                  key={idx}
                  className="px-5 py-3 flex items-center justify-between gap-3"
                >
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-medium text-[var(--text-primary)]">
                      {item.fabric_type ?? '—'}
                    </span>
                    <span className="text-xs text-[var(--text-secondary)]">
                      {item.color_name ?? '—'}
                    </span>
                  </div>
                  <span className="text-sm font-bold text-[#0f3460] whitespace-nowrap">
                    {formatQty(item.quantity, item.unit)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Journey timeline */}
        {shipment.journey_status && (
          <div className="bg-white rounded-2xl shadow-sm border border-[#dce6f0] px-5 py-4">
            <div className="text-xs font-bold uppercase text-[#0f3460] tracking-wider mb-3">
              {MSG.JOURNEY_TITLE}
            </div>
            <div className="flex flex-col gap-2">
              {VERIFY_JOURNEY_ORDER.map((step, idx) => {
                const isDone = idx <= currentJourneyIdx;
                const isCurrent = step === shipment.journey_status;
                const log = shipment.journey_logs.find(
                  (l) => l.status === step,
                );
                return (
                  <div key={step} className="flex items-center gap-3">
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                        isDone
                          ? 'bg-[#0f3460] text-white'
                          : 'bg-[#f0f5fb] text-[#8a9bb0] border border-[#dce6f0]'
                      }`}
                    >
                      {isDone ? '✓' : idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div
                        className={`text-sm ${isCurrent ? 'font-bold text-[#0f3460]' : isDone ? 'text-[var(--text-primary)]' : 'text-[var(--text-tertiary)]'}`}
                      >
                        {VERIFY_JOURNEY_LABELS[step] ?? step}
                      </div>
                      {log && (
                        <div className="text-xs text-[var(--text-tertiary)]">
                          {formatDateTime(log.created_at)}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Signature proof */}
        {shipment.customer_signature_url && (
          <div className="bg-white rounded-2xl shadow-sm border border-[#dce6f0] px-5 py-4">
            <div className="text-xs font-bold uppercase text-[#0f3460] tracking-wider mb-3">
              {MSG.SIGNATURE_TITLE}
            </div>
            <div className="border border-[#dce6f0] rounded-xl overflow-hidden bg-[#f8fbff]">
              <img
                src={shipment.customer_signature_url}
                alt={MSG.ALT_SIGNATURE}
                className="w-full max-h-32 object-contain"
              />
            </div>
            {shipment.signed_at && (
              <p className="text-xs text-[var(--text-tertiary)] mt-2 text-center">
                {MSG.SIGNED_AT} {formatDateTime(shipment.signed_at)}
              </p>
            )}
          </div>
        )}

        {/* Footer */}
        <p className="text-center text-[10px] text-[var(--text-tertiary)] pb-4">
          {MSG.FOOTER_TEXT}
          <br />
          {MSG.FOOTER_SUBTEXT}
        </p>
      </div>
    </div>
  );
}
