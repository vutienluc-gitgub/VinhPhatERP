import { useUploadManager } from '@/shared/lib/image/upload-manager';
import { ImagePipelineOptions } from '@/shared/lib/image/types';
import { ImagePicker } from '@/shared/components/ImagePicker';
import { Button } from '@/shared/components/Button';

type AdvancedImageUploaderProps = {
  value: string | null | undefined;
  uploadFn: (file: File) => Promise<string>;
  onSuccess: (url: string) => void;
  onRemove: () => void;
  pipelineOptions?: ImagePipelineOptions;
  disabled?: boolean;
};

export function AdvancedImageUploader({
  value,
  uploadFn,
  onSuccess,
  onRemove,
  pipelineOptions,
  disabled,
}: AdvancedImageUploaderProps) {
  const { state, startUpload, retryUpload, cancelUpload, reset } =
    useUploadManager({
      uploadFn,
      pipelineOptions,
      onSuccess,
    });

  const handleSelect = (file: File) => {
    startUpload(file);
  };

  const handleRemove = () => {
    reset(); // Reset internal state
    onRemove(); // Notify parent
  };

  const isProcessing =
    state.status === 'uploading' ||
    state.status === 'compressing' ||
    state.status === 'validating';

  // Nếu upload xong trong session này thì dùng url vừa upload, ngược lại dùng value từ props
  const displayValue =
    state.status === 'success' && 'url' in state ? state.url : value;

  return (
    <div className="flex flex-col gap-2">
      <ImagePicker
        value={displayValue}
        onSelect={handleSelect}
        onRemove={handleRemove}
        state={state}
        disabled={disabled}
      />

      {/* Thêm các Action điều khiển */}
      {state.status === 'error' && (
        <Button variant="outline" onClick={retryUpload} leftIcon="RotateCcw">
          Thử lại
        </Button>
      )}

      {isProcessing && (
        <Button variant="danger" onClick={cancelUpload} leftIcon="X">
          Hủy Upload
        </Button>
      )}
    </div>
  );
}
