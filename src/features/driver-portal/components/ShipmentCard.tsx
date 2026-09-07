import { useState } from 'react';
import toast from 'react-hot-toast';

import { Icon } from '@/shared/components';
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
  type DriverShipment,
  type JourneyStatus,
} from '@/domain/logistics/driver-portal.types';
import type { DeliveryAttemptState } from '@/domain/logistics';
import { DRIVER_PORTAL_MESSAGES } from '@/features/driver-portal/constants';

import { JourneyStepButton } from './JourneyStepButton';
import { JourneyTimeline } from './JourneyTimeline';
import { ReportExceptionModal } from './ReportExceptionModal';
import { ShipmentCardHeader } from './ShipmentCardHeader';
import { ShipmentCardInfo } from './ShipmentCardInfo';
import { ShipmentProofSection } from './ShipmentProofSection';
import { ShipmentJourneyLogs } from './ShipmentJourneyLogs';

function mapJourneyToAttemptState(
  status?: JourneyStatus | null,
): DeliveryAttemptState {
  if (!status) return 'assigned';
  if (status === 'pending_pickup') return 'pending_pickup';
  if (status === 'picked_up') return 'picked_up';
  if (status === 'in_transit') return 'in_transit';
  if (status === 'arrived') return 'arrived';
  if (status === 'delivered_confirmed') return 'delivered';
  return 'assigned';
}

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
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [showSignaturePad, setShowSignaturePad] = useState(false);
  const [showExceptionModal, setShowExceptionModal] = useState(false);
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null);

  const { data: logs = [] } = useJourneyLogs(
    expanded ? shipment.id : undefined,
  );
  const mutation = useUpdateJourneyStatus();

  const currentJourneyIdx = shipment.journey_status
    ? JOURNEY_STATUS_ORDER.indexOf(shipment.journey_status)
    : -1;

  const nextStatus = JOURNEY_STATUS_ORDER[currentJourneyIdx + 1];
  const totalCost = (shipment.shipping_cost ?? 0) + (shipment.loading_fee ?? 0);

  async function handleAdvance(targetStatus: JourneyStatus) {
    try {
      if (
        targetStatus === 'delivered_confirmed' &&
        !signatureDataUrl &&
        photoFiles.length === 0
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
        } else if (photoFiles.length > 0 && photoFiles[0]) {
          photoUrl = await uploadDeliveryPhoto(photoFiles[0], shipment.id);
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
      setPhotoFiles([]);
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

  return (
    <div className="bg-[var(--surface)] rounded-xl border-2 border-[var(--border)] overflow-hidden mb-4">
      {/* Card header */}
      <ShipmentCardHeader
        shipmentNumber={shipment.shipment_number}
        customerName={shipment.customers?.name}
        customerPhone={shipment.customers?.phone}
        journeyStatus={shipment.journey_status}
        expanded={expanded}
        onToggle={() => setExpanded((v) => !v)}
      />

      {/* Expanded details */}
      {expanded && (
        <div className="px-4 pb-4">
          {/* Journey Timeline */}
          <JourneyTimeline
            currentState={mapJourneyToAttemptState(shipment.journey_status)}
            className="mb-3 px-1"
          />

          {/* Info row */}
          <ShipmentCardInfo
            shipmentDate={shipment.shipment_date}
            totalCost={totalCost}
            deliveryAddress={shipment.delivery_address}
            vehicleInfo={shipment.vehicle_info}
          />

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

          {/* Proof & Notes section */}
          {nextStatus && shipment.status !== 'delivered' && (
            <ShipmentProofSection
              notesInput={notesInput}
              onNotesChange={setNotesInput}
              isDeliveredStep={nextStatus === 'delivered_confirmed'}
              signatureDataUrl={signatureDataUrl}
              showSignaturePad={showSignaturePad}
              onShowSignaturePad={setShowSignaturePad}
              onSignatureConfirm={(dataUrl) => {
                setSignatureDataUrl(dataUrl);
                setShowSignaturePad(false);
              }}
              onSignatureRemove={() => setSignatureDataUrl(null)}
              photoFiles={photoFiles}
              onPhotosChange={setPhotoFiles}
            />
          )}

          {/* Journey log */}
          <ShipmentJourneyLogs logs={logs} />

          {/* Bottom Actions: Exception reporting and Chat button */}
          <div className="flex items-center gap-2 mt-4">
            <button
              type="button"
              className="flex items-center justify-center gap-1.5 py-3 px-3.5 rounded-xl border border-[var(--destructive)] text-[var(--destructive)] font-semibold text-xs bg-transparent cursor-pointer hover:bg-[var(--destructive-subtle)] transition-colors shrink-0 min-h-[44px] touch-manipulation"
              onClick={() => setShowExceptionModal(true)}
            >
              <Icon name="AlertTriangle" size={16} />
              <span>{DRIVER_PORTAL_MESSAGES.ACTIONS.REPORT_EXCEPTION}</span>
            </button>

            <button
              type="button"
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-[var(--primary)] text-[var(--primary)] font-semibold text-sm bg-transparent cursor-pointer hover:bg-[var(--surface-selected)] transition-colors min-h-[44px] touch-manipulation"
              onClick={() => onOpenChat(shipment)}
            >
              <Icon name="MessageCircle" size={18} />
              <span>{DRIVER_PORTAL_MESSAGES.ACTIONS.CONTACT_DISPATCH}</span>
            </button>
          </div>

          {/* Report Exception Modal */}
          {showExceptionModal && (
            <ReportExceptionModal
              open={showExceptionModal}
              onClose={() => setShowExceptionModal(false)}
              attemptId={shipment.id}
            />
          )}
        </div>
      )}
    </div>
  );
}
