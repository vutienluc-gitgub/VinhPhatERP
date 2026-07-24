import { useState, useRef, useCallback } from 'react';

import { UploadState, ImagePipelineOptions } from './types';
import { processImage } from './pipeline';

type UploadManagerOptions = {
  /** Hàm thực hiện việc upload lên server và trả về URL ảnh */
  uploadFn: (file: File) => Promise<string>;
  pipelineOptions?: ImagePipelineOptions;
  onSuccess?: (url: string) => void;
  onError?: (error: string) => void;
};

export function useUploadManager({
  uploadFn,
  pipelineOptions,
  onSuccess,
  onError,
}: UploadManagerOptions) {
  const [state, setState] = useState<UploadState>({ status: 'idle' });
  const [currentFile, setCurrentFile] = useState<File | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);

  const startUpload = useCallback(
    async (file: File) => {
      setCurrentFile(file);
      abortControllerRef.current = new AbortController();

      try {
        // 1. Pipeline (Validate -> Compress)
        const processedFile = await processImage(
          file,
          pipelineOptions,
          (step, progress) => {
            if (abortControllerRef.current?.signal.aborted)
              throw new Error('Aborted');
            setState({
              status: step,
              ...(progress !== undefined ? { progress } : {}),
            } as UploadState);
          },
        );

        if (abortControllerRef.current?.signal.aborted)
          throw new Error('Aborted');

        // 2. Upload
        setState({ status: 'uploading', progress: 0 });

        // (Trong thực tế nếu uploadFn dùng XMLHttpRequest/Axios có thể truyền signal vào để abort thật sự)
        const url = await uploadFn(processedFile);

        if (abortControllerRef.current?.signal.aborted)
          throw new Error('Aborted');

        setState({ status: 'success', url });
        setCurrentFile(null);
        if (onSuccess) onSuccess(url);
      } catch (err: unknown) {
        if (err instanceof Error && err.message === 'Aborted') {
          setState({ status: 'idle' });
          setCurrentFile(null);
        } else {
          const errorMessage = err instanceof Error ? err.message : String(err);
          setState({ status: 'error', message: errorMessage });
          if (onError) onError(errorMessage);
        }
      }
    },
    [uploadFn, pipelineOptions, onSuccess, onError],
  );

  const retryUpload = useCallback(() => {
    if (currentFile) {
      startUpload(currentFile);
    }
  }, [currentFile, startUpload]);

  const cancelUpload = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  const reset = useCallback(() => {
    setState({ status: 'idle' });
    setCurrentFile(null);
    cancelUpload();
  }, [cancelUpload]);

  return {
    state,
    startUpload,
    retryUpload,
    cancelUpload,
    reset,
  };
}
