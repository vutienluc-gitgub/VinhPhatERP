import { useRef, useState } from 'react';
import ReactSignatureCanvas from 'react-signature-canvas';

import { Icon } from '@/shared/components/Icon';

type Props = {
  onConfirm: (pngDataUrl: string) => void;
  onCancel: () => void;
};

export function SignaturePad({ onConfirm, onCancel }: Props) {
  const padRef = useRef<ReactSignatureCanvas>(null);
  const [isEmpty, setIsEmpty] = useState(true);

  function handleClear() {
    padRef.current?.clear();
    setIsEmpty(true);
  }

  function handleConfirm() {
    if (!padRef.current || padRef.current.isEmpty()) return;
    const dataUrl = padRef.current.toDataURL('image/png');
    onConfirm(dataUrl);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full sm:max-w-sm bg-[var(--surface)] rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <div>
            <p className="font-bold text-[var(--text-primary)]">
              Chữ ký khách hàng
            </p>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">
              Mời khách ký tên xác nhận nhận hàng
            </p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="w-8 h-8 rounded-full bg-[var(--surface-alt)] flex items-center justify-center text-[var(--text-secondary)]"
          >
            <Icon name="X" size={16} />
          </button>
        </div>

        {/* Canvas area */}
        <div className="mx-5 mb-4">
          <div className="relative border-2 border-dashed border-[var(--border)] rounded-xl overflow-hidden bg-white">
            <ReactSignatureCanvas
              ref={padRef}
              penColor="#0f3460"
              canvasProps={{
                className: 'w-full',
                style: { height: 180, touchAction: 'none' },
              }}
              onBegin={() => setIsEmpty(false)}
            />
            {isEmpty && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <p className="text-[#c0cdd9] text-sm">Ký tên vào đây →</p>
              </div>
            )}
            {/* Signature line */}
            <div className="absolute bottom-8 left-8 right-8 border-b border-[#dce6f0] pointer-events-none" />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 px-5 pb-6">
          <button
            type="button"
            onClick={handleClear}
            className="flex-1 py-2.5 rounded-xl border border-[var(--border)] text-[var(--text-secondary)] text-sm font-medium flex items-center justify-center gap-2"
          >
            <Icon name="RotateCcw" size={15} />
            Xoá
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isEmpty}
            className="flex-2 flex-grow py-2.5 rounded-xl bg-[#0f3460] text-white text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-40"
          >
            <Icon name="Check" size={15} />
            Xác nhận chữ ký
          </button>
        </div>
      </div>
    </div>
  );
}
