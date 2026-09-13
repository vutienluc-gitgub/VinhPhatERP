import { SCAN_WORKSPACE_LABELS } from '@/features/yarn-receipts/yarn-slip-scan.constants';
import { Button } from '@/shared/components/Button';
import { Icon } from '@/shared/components/Icon';

export interface ScanDocumentViewerProps {
  previewUrl: string | null;
  zoomLevel: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
  visible?: boolean;
}

export function ScanDocumentViewer({
  previewUrl,
  zoomLevel,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  visible = true,
}: ScanDocumentViewerProps) {
  return (
    <div className={`space-y-2 ${visible ? 'block' : 'hidden md:block'}`}>
      <div className="flex items-center justify-between text-xs text-muted">
        <span className="font-semibold text-foreground">
          {SCAN_WORKSPACE_LABELS.TAB_DOCUMENT_IMAGE}
        </span>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={onZoomOut}
            className="h-7 px-2"
            title={SCAN_WORKSPACE_LABELS.IMAGE_CONTROLS_ZOOM_OUT}
          >
            <Icon name="Minus" size={14} />
          </Button>
          <span className="font-mono text-xs px-1">
            {Math.round(zoomLevel * 100)}%
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={onZoomIn}
            className="h-7 px-2"
            title={SCAN_WORKSPACE_LABELS.IMAGE_CONTROLS_ZOOM_IN}
          >
            <Icon name="Plus" size={14} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onResetZoom}
            className="h-7 px-2 text-xs"
          >
            {SCAN_WORKSPACE_LABELS.IMAGE_CONTROLS_RESET}
          </Button>
        </div>
      </div>

      <div className="border border-default rounded-lg bg-surface-secondary/40 overflow-auto max-h-[480px] flex items-center justify-center p-2">
        {previewUrl && (
          <img
            src={previewUrl}
            alt="Yarn slip original preview"
            style={{
              transform: `scale(${zoomLevel})`,
              transformOrigin: 'top center',
            }}
            className="transition-transform duration-150 max-w-full rounded shadow-sm"
          />
        )}
      </div>
    </div>
  );
}
