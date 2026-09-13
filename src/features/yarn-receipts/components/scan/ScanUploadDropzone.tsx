import React, { useRef } from 'react';

import { SCAN_WORKSPACE_LABELS } from '@/features/yarn-receipts/yarn-slip-scan.constants';
import { Button } from '@/shared/components/Button';
import { Icon } from '@/shared/components/Icon';

export interface ScanUploadDropzoneProps {
  error: string | null;
  onFileSelect: (file: File) => void;
}

export function ScanUploadDropzone({
  error,
  onFileSelect,
}: ScanUploadDropzoneProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file) {
        onFileSelect(file);
      }
    }
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file) {
        onFileSelect(file);
      }
    }
  }

  function handleDragOver(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
  }

  return (
    <div className="space-y-6 py-4">
      {/* Hidden file and camera inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleInputChange}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleInputChange}
      />

      <div className="text-center max-w-xl mx-auto space-y-2">
        <h3 className="text-lg font-semibold text-foreground">
          {SCAN_WORKSPACE_LABELS.UPLOAD_HEADING}
        </h3>
        <p className="text-sm text-muted">
          {SCAN_WORKSPACE_LABELS.UPLOAD_SUBHEADING}
        </p>
      </div>

      {error && (
        <div className="p-3.5 rounded-lg border border-danger bg-danger-soft text-danger text-sm flex items-start gap-2">
          <Icon name="AlertTriangle" size={18} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onClick={() => fileInputRef.current?.click()}
        className="border-2 border-dashed border-default hover:border-[var(--primary)] rounded-xl p-8 sm:p-12 text-center cursor-pointer transition-colors bg-surface-secondary/50 flex flex-col items-center justify-center space-y-4"
      >
        <div className="w-14 h-14 rounded-full bg-surface flex items-center justify-center text-[var(--primary)] shadow-sm">
          <Icon name="UploadCloud" size={28} />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium text-foreground">
            {SCAN_WORKSPACE_LABELS.DROPZONE_PROMPT}
          </p>
          <p className="text-xs text-muted">
            {SCAN_WORKSPACE_LABELS.DROPZONE_HINT}
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <Button
          variant="primary"
          type="button"
          className="flex-1 py-3"
          leftIcon="Camera"
          onClick={() => cameraInputRef.current?.click()}
        >
          {SCAN_WORKSPACE_LABELS.BTN_TAKE_PHOTO}
        </Button>
        <Button
          variant="outline"
          type="button"
          className="flex-1 py-3"
          leftIcon="Image"
          onClick={() => fileInputRef.current?.click()}
        >
          {SCAN_WORKSPACE_LABELS.BTN_CHOOSE_FILE}
        </Button>
      </div>

      <div className="rounded-lg p-4 bg-surface-secondary border border-default space-y-2 text-xs text-muted">
        <p className="font-semibold text-foreground flex items-center gap-1.5">
          <Icon name="HelpCircle" size={14} />
          {SCAN_WORKSPACE_LABELS.TIPS_TITLE}
        </p>
        <ul className="list-disc list-inside space-y-1 pl-1">
          <li>{SCAN_WORKSPACE_LABELS.TIP_LIGHTING}</li>
          <li>{SCAN_WORKSPACE_LABELS.TIP_FOCUS}</li>
          <li>{SCAN_WORKSPACE_LABELS.TIP_FULL_FRAME}</li>
        </ul>
      </div>
    </div>
  );
}
