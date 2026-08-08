import { useState, useRef } from 'react';
import toast from 'react-hot-toast';

import { Icon } from '@/shared/components';
import { toTelHref, normalizePhone } from '@/shared/utils/phone';
import { SignaturePad } from '@/shared/components/SignaturePad';
import { MoneyText } from '@/shared/value';
import {
  useJourneyLogs,
  useUpdateJourneyStatus,
  uploadDeliveryPhoto,
  uploadSignatureBlob,
  saveDeliverySignature,
} from '@/application/shipments';
import {
  JOURNEY_STATUS_LABELS,
  JOURNEY_STATUS_ORDER,
} from '@/features/driver-portal/types';
import type {
  DriverShipment,
  JourneyStatus,
} from '@/features/driver-portal/types';
import { DRIVER_PORTAL_MESSAGES } from '@/features/driver-portal/constants';

import { JourneyStepButton } from './JourneyStepButton';

export function ShipmentCard({
  shipment,
  employeeId,
  onOpenChat,
}: {
  shipment: DriverShipment;
  employeeId: string;
  onOpenChat: (shipment: DriverShipment) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [notesInput, setNotesInput] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showSignaturePad, setShowSignaturePad] = useState(false);
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const { data: logs = [] } = useJourneyLogs(
    expanded ? shipment.id : undefined,
  );
  const mutation = useUpdateJourneyStatus();

  const currentJourneyIdx = shipment.journey_status
    ? JOURNEY_STATUS_ORDER.indexOf(shipment.journey_status)
    : -1;

  const nextStatus = JOURNEY_STATUS_ORDER[currentJourneyIdx + 1];

  function handlePhotoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  }

  async function handleSignatureConfirm(dataUrl: string) {
    setSignatureDataUrl(dataUrl);
    setShowSignaturePad(false);
  }

  async function handleAdvance(targetStatus: JourneyStatus) {
    try {
      if (
        targetStatus === 'delivered_confirmed' &&
        !signatureDataUrl &&
        !photoFile
      ) {
        toast.error(DRIVER_PORTAL_MESSAGES.ERROR.PROOF_REQUIRED);
        return;
      }

      setIsUploading(true);
      let photoUrl: string | undefined;

      if (targetStatus === 'delivered_confirmed') {
        if (signatureDataUrl) {
          const sigUrl = await uploadSignatureBlob(
            signatureDataUrl,
            shipment.id,
          );
          await saveDeliverySignature(shipment.id, sigUrl);
          photoUrl = sigUrl;
        } else if (photoFile) {
          photoUrl = await uploadDeliveryPhoto(photoFile, shipment.id);
        }
      }

      await mutation.mutateAsync({
        shipmentId: shipment.id,
        journeyStatus: targetStatus,
        notes: notesInput.trim() || undefined,
        updatedBy: employeeId,
        photoUrl,
      });
      setNotesInput('');
      setPhotoFile(null);
      setPhotoPreview(null);
      setSignatureDataUrl(null);
      toast.success(`Đã cập nhật: ${JOURNEY_STATUS_LABELS[targetStatus]}`);
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : DRIVER_PORTAL_MESSAGES.ERROR.GENERIC,
      );
    } finally {
      setIsUploading(false);
    }
  }

  const totalCost = (shipment.shipping_cost ?? 0) + (shipment.loading_fee ?? 0);

  return (
    <div className="bg-[var(--surface)] rounded-xl border-2 border-[var(--border)] overflow-hidden mb-4">
      {/* Card header */}
      <div
        onClick={() => setExpanded((v) => !v)}
        className="flex items-center justify-between w-full p-4 bg-transparent cursor-pointer gap-3 hover:bg-[var(--surface-hover)] transition-colors"
      >
        <div className="flex items-start gap-3 w-full">
          <div className="w-10 h-10 rounded-xl bg-[var(--surface-selected)] flex items-center justify-center shrink-0">
            <Icon name="Truck" size={20} className="text-[var(--primary)]" />
          </div>
          <div className="text-left flex-1">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-bold text-base text-[var(--foreground)]">
                  {shipment.shipment_number}
                </p>
                <p className="text-sm text-[var(--surface-subtle)] mt-0.5">
                  {shipment.customers?.name ??
                    DRIVER_PORTAL_MESSAGES.CARD.DEFAULT_CUSTOMER}
                </p>
              </div>
              {shipment.customers?.phone && (
                <a
                  href={toTelHref(normalizePhone(shipment.customers.phone))}
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-[rgba(var(--success-rgb),0.1)] text-[var(--success)] hover:bg-[rgba(var(--success-rgb),0.2)] transition-colors shrink-0"
                  aria-label={`Gọi ${shipment.customers.phone}`}
                >
                  <Icon name="Phone" size={18} />
                </a>
              )}
            </div>
            {shipment.journey_status && (
              <span className="inline-block mt-1 text-xs font-semibold text-[var(--primary)] bg-[var(--surface-selected)] px-2 py-0.5 rounded-full">
                {JOURNEY_STATUS_LABELS[shipment.journey_status]}
              </span>
            )}
          </div>
        </div>
        <Icon
          name={expanded ? 'ChevronUp' : 'ChevronDown'}
          size={18}
          className="text-[var(--muted-foreground)] shrink-0"
        />
      </div>

      {/* Details */}
      {expanded && (
        <div className="px-4 pb-4">
          {/* Info row */}
          <div className="grid grid-cols-2 gap-2 p-3 bg-[var(--surface-subtle)] rounded-xl mb-4 text-sm">
            <div>
              <p className="text-[var(--muted-foreground)]">
                {DRIVER_PORTAL_MESSAGES.CARD.DELIVERY_DATE}
              </p>
              <p className="font-semibold">{shipment.shipment_date}</p>
            </div>
            <div>
              <p className="text-[var(--muted-foreground)]">
                {DRIVER_PORTAL_MESSAGES.CARD.SHIPPING_COST}
              </p>
              <p className="font-semibold text-foreground">
                {totalCost ? (
                  <MoneyText value={totalCost} suffix="đ" />
                ) : (
                  DRIVER_PORTAL_MESSAGES.CARD.FREE_SHIPPING
                )}
              </p>
            </div>
            {shipment.delivery_address && (
              <div className="col-span-full mt-2">
                <p className="text-[var(--muted-foreground)]">
                  {DRIVER_PORTAL_MESSAGES.CARD.DELIVERY_ADDRESS}
                </p>
                <div className="flex items-start justify-between gap-2 mt-0.5">
                  <p className="font-medium flex-1">
                    {shipment.delivery_address}
                  </p>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(shipment.delivery_address)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--surface-selected)] text-[var(--primary)] text-xs font-semibold hover:bg-[var(--surface-hover)] transition-colors shrink-0"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Icon name="MapPin" size={14} />
                    {DRIVER_PORTAL_MESSAGES.ACTIONS.OPEN_MAP}
                  </a>
                </div>
              </div>
            )}
            {shipment.vehicle_info && (
              <div>
                <p className="text-[var(--muted-foreground)]">
                  {DRIVER_PORTAL_MESSAGES.CARD.VEHICLE}
                </p>
                <p className="font-medium">{shipment.vehicle_info}</p>
              </div>
            )}
          </div>

          {/* Journey steps */}
          <p className="text-xs font-bold uppercase text-[var(--muted-foreground)] tracking-[0.06em] mb-2">
            {DRIVER_PORTAL_MESSAGES.CARD.JOURNEY_UPDATE}
          </p>
          <div className="flex flex-col gap-2 mb-4">
            {JOURNEY_STATUS_ORDER.map((step, idx) => {
              const isDone = currentJourneyIdx >= idx;
              const isNext =
                step === nextStatus && shipment.status !== 'delivered';
              return (
                <JourneyStepButton
                  key={step}
                  status={step}
                  label={JOURNEY_STATUS_LABELS[step]}
                  isActive={isNext}
                  isDone={isDone}
                  disabled={
                    mutation.isPending ||
                    isUploading ||
                    shipment.status === 'delivered'
                  }
                  onClick={() => {
                    if (isNext) void handleAdvance(step);
                  }}
                />
              );
            })}
          </div>

          {nextStatus && shipment.status !== 'delivered' && (
            <div className="mb-3 flex flex-col gap-2">
              <div>
                <label className="text-sm text-[var(--surface-subtle)] block mb-1">
                  {DRIVER_PORTAL_MESSAGES.CARD.NOTES_LABEL}
                </label>
                <input
                  className="field-input w-full p-2.5 rounded-lg border border-[var(--border)] bg-[var(--surface-strong)] text-[var(--foreground)] text-sm focus:border-[var(--primary)] outline-none"
                  value={notesInput}
                  onChange={(e) => setNotesInput(e.target.value)}
                  placeholder={DRIVER_PORTAL_MESSAGES.CARD.NOTES_PLACEHOLDER}
                />
              </div>

              {nextStatus === 'delivered_confirmed' && (
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold text-[var(--surface-subtle)] block">
                    {DRIVER_PORTAL_MESSAGES.CARD.PROOF_LABEL}
                    <span className="text-[var(--danger)] font-bold ml-1">
                      (*)
                    </span>
                  </label>

                  {/* Signature */}
                  {signatureDataUrl ? (
                    <div className="relative rounded-xl border border-[var(--border)] bg-surface overflow-hidden">
                      <img
                        src={signatureDataUrl}
                        alt={DRIVER_PORTAL_MESSAGES.CARD.SIGNATURE_ALT}
                        className="w-full max-h-24 object-contain"
                      />
                      <div className="absolute top-1 left-2 text-[10px] text-[var(--muted-foreground)] font-semibold uppercase">
                        {DRIVER_PORTAL_MESSAGES.CARD.SIGNATURE_TAG}
                      </div>
                      <button
                        type="button"
                        onClick={() => setSignatureDataUrl(null)}
                        className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-foreground/50 flex items-center justify-center text-inverse-foreground hover:bg-black/70"
                      >
                        <Icon name="X" size={12} />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowSignaturePad(true)}
                      className="flex items-center gap-2 w-full py-2.5 px-4 rounded-xl border-2 border-dashed border-[var(--border)] text-[var(--surface-subtle)] text-sm hover:border-[var(--primary)] hover:text-[var(--primary)] transition-colors"
                    >
                      <Icon name="PenLine" size={16} />
                      {DRIVER_PORTAL_MESSAGES.CARD.GET_SIGNATURE}
                    </button>
                  )}

                  {/* Photo proof */}
                  <input
                    ref={photoInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={handlePhotoSelect}
                  />
                  {photoPreview ? (
                    <div className="relative w-full rounded-xl overflow-hidden border border-[var(--border)]">
                      <img
                        src={photoPreview}
                        alt={DRIVER_PORTAL_MESSAGES.CARD.PHOTO_ALT}
                        className="w-full max-h-32 object-cover"
                      />
                      <div className="absolute top-1 left-2 text-[10px] text-[var(--muted-foreground)] font-semibold uppercase drop-shadow-md">
                        {DRIVER_PORTAL_MESSAGES.CARD.PHOTO_TAG}
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setPhotoFile(null);
                          setPhotoPreview(null);
                        }}
                        className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-foreground/50 flex items-center justify-center text-inverse-foreground hover:bg-black/70"
                      >
                        <Icon name="X" size={12} />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => photoInputRef.current?.click()}
                      className="flex items-center gap-2 w-full py-2.5 px-4 rounded-xl border-2 border-dashed border-[var(--border)] text-[var(--surface-subtle)] text-sm hover:border-[var(--primary)] hover:text-[var(--primary)] transition-colors"
                    >
                      <Icon name="Camera" size={16} />
                      {DRIVER_PORTAL_MESSAGES.CARD.TAKE_PHOTO}
                    </button>
                  )}
                </div>
              )}

              {showSignaturePad && (
                <SignaturePad
                  onConfirm={handleSignatureConfirm}
                  onCancel={() => setShowSignaturePad(false)}
                />
              )}
            </div>
          )}

          {/* Journey log */}
          {logs.length > 0 && (
            <div>
              <p className="text-xs font-bold uppercase text-[var(--muted-foreground)] tracking-[0.06em] mb-2">
                {DRIVER_PORTAL_MESSAGES.CARD.JOURNEY_LOG}
              </p>
              <div className="flex flex-col gap-1">
                {logs.map((log) => (
                  <div
                    key={log.id}
                    className="flex gap-2 text-xs text-[var(--surface-subtle)]"
                  >
                    <Icon name="Clock" size={13} className="shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <span className="font-semibold text-[var(--foreground)]">
                        {JOURNEY_STATUS_LABELS[log.journey_status]}
                      </span>
                      {log.notes && <span> — {log.notes}</span>}
                      <span className="text-[var(--muted-foreground)] ml-1">
                        {new Date(log.created_at).toLocaleTimeString('vi-VN', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                      {log.photo_url && (
                        <a
                          href={log.photo_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block mt-1"
                        >
                          <img
                            src={log.photo_url}
                            alt={DRIVER_PORTAL_MESSAGES.CARD.PHOTO_ALT}
                            className="rounded-lg max-h-28 object-cover border border-[var(--border)]"
                          />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Chat button */}
          <button
            type="button"
            className="flex items-center justify-center gap-2 w-full py-3 mt-3 rounded-xl border-2 border-[var(--primary)] text-[var(--primary)] font-semibold text-sm bg-transparent cursor-pointer hover:bg-[var(--surface-selected)] transition-colors"
            onClick={() => onOpenChat(shipment)}
          >
            <Icon name="MessageCircle" size={18} />
            {DRIVER_PORTAL_MESSAGES.ACTIONS.CONTACT_DISPATCH}
          </button>
        </div>
      )}
    </div>
  );
}
