export type UploadState =
  | { status: 'idle' }
  | { status: 'validating' }
  | { status: 'compressing'; progress: number }
  | { status: 'uploading'; progress: number }
  | { status: 'success'; url: string }
  | { status: 'error'; message: string };

export type ImageValidationOptions = {
  maxSizeMB?: number;
  allowedTypes?: string[];
};

export type ImageCompressionOptions = {
  maxSizeMB?: number;
  maxWidthOrHeight?: number;
  useWebWorker?: boolean;
};

export type ImagePipelineOptions = {
  validation?: ImageValidationOptions;
  compression?: ImageCompressionOptions;
  skipCompression?: boolean;
};
