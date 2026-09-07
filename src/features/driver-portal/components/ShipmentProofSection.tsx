import { Icon } from '@/shared/components';
import { SignaturePad } from '@/shared/components/SignaturePad';
import { DRIVER_PORTAL_MESSAGES } from '@/features/driver-portal/constants';

import { EvidenceCamera } from './EvidenceCamera';

export interface ShipmentProofSectionProps {
  notesInput: string;
  onNotesChange: (val: string) => void;
  isDeliveredStep: boolean;
  signatureDataUrl: string | null;
  showSignaturePad: boolean;
  onShowSignaturePad: (show: boolean) => void;
  onSignatureConfirm: (dataUrl: string) => void;
  onSignatureRemove: () => void;
  photoFiles: File[];
  onPhotosChange: (files: File[]) => void;
}

export function ShipmentProofSection({
  notesInput,
  onNotesChange,
  isDeliveredStep,
  signatureDataUrl,
  showSignaturePad,
  onShowSignaturePad,
  onSignatureConfirm,
  onSignatureRemove,
  photoFiles,
  onPhotosChange,
}: ShipmentProofSectionProps) {
  return (
    <div className="mb-3 flex flex-col gap-2">
      <div>
        <label className="text-sm text-[var(--muted-foreground)] block mb-1">
          {DRIVER_PORTAL_MESSAGES.CARD.NOTES_LABEL}
        </label>
        <input
          className="field-input w-full p-2.5 rounded-lg border border-[var(--border)] bg-[var(--surface-strong)] text-[var(--foreground)] text-sm focus:border-[var(--primary)] outline-none"
          value={notesInput}
          onChange={(e) => onNotesChange(e.target.value)}
          placeholder={DRIVER_PORTAL_MESSAGES.CARD.NOTES_PLACEHOLDER}
        />
      </div>

      {isDeliveredStep && (
        <div className="flex flex-col gap-3">
          <label className="text-sm font-semibold text-[var(--foreground)] block">
            {DRIVER_PORTAL_MESSAGES.CARD.PROOF_LABEL}
            <span className="text-[var(--danger)] font-bold ml-1">(*)</span>
          </label>

          {/* Signature preview / trigger */}
          {signatureDataUrl ? (
            <div className="relative rounded-xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
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
                onClick={onSignatureRemove}
                className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-[var(--foreground)]/50 flex items-center justify-center text-inverse-foreground hover:bg-[var(--foreground)]/70 cursor-pointer"
                title="Xóa chữ ký"
              >
                <Icon name="X" size={12} />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => onShowSignaturePad(true)}
              className="flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl border-2 border-dashed border-[var(--border)] text-[var(--foreground)] text-sm font-medium hover:border-[var(--primary)] hover:text-[var(--primary)] transition-colors min-h-[44px] touch-manipulation cursor-pointer bg-[var(--surface-secondary)]"
            >
              <Icon name="PenLine" size={16} />
              <span>{DRIVER_PORTAL_MESSAGES.CARD.GET_SIGNATURE}</span>
            </button>
          )}

          {/* Multi-Photo Evidence Camera */}
          <EvidenceCamera
            photos={photoFiles}
            onChange={onPhotosChange}
            maxPhotos={4}
          />
        </div>
      )}

      {showSignaturePad && (
        <SignaturePad
          onConfirm={onSignatureConfirm}
          onCancel={() => onShowSignaturePad(false)}
        />
      )}
    </div>
  );
}
