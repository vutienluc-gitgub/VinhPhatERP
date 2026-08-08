/**
 * UploaderDropzone — Drag & drop zone for file uploads
 *
 * Handles drag events natively (no react-dropzone dependency needed).
 * Falls back to a file input picker on click.
 */

import { useCallback, useRef, useState } from 'react';

import { Icon } from '@/shared/components/Icon';
import { MEDIA_LABELS, MEDIA_LIMITS } from '@/features/media/media.constants';
import type { UploadProgress } from '@/features/media/media.types';

interface UploaderDropzoneProps {
  onFilesSelected: (files: File[]) => void;
  isUploading: boolean;
  uploads: UploadProgress[];
}

export function UploaderDropzone({
  onFilesSelected,
  isUploading: _isUploading,
  uploads,
}: UploaderDropzoneProps) {
  // _isUploading reserved for future disabled-state rendering
  void _isUploading;
  const [isDragActive, setIsDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragActive(false);

      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) {
        onFilesSelected(files);
      }
    },
    [onFilesSelected],
  );

  const handleClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files ? Array.from(e.target.files) : [];
      if (files.length > 0) {
        onFilesSelected(files);
      }
      // Reset to allow re-selecting same file
      e.target.value = '';
    },
    [onFilesSelected],
  );

  return (
    <>
      <div
        className={`media-dropzone${isDragActive ? ' text-foreground bg-primary/10' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleClick();
          }
        }}
        id="media-dropzone"
      >
        <div className="media-dropzone-icon">
          <Icon name={isDragActive ? 'Download' : 'Upload'} size={40} />
        </div>
        <div className="media-dropzone-text">
          {isDragActive ? MEDIA_LABELS.DROP_ACTIVE : MEDIA_LABELS.DROP_HINT}
        </div>
        <div className="media-dropzone-hint">
          {`Max ${MEDIA_LIMITS.MAX_FILE_SIZE_MB}MB / file`}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          style={{ display: 'none' }}
          onChange={handleFileInput}
        />
      </div>

      {/* Upload progress list */}
      {uploads.length > 0 && (
        <div className="media-upload-progress" id="media-upload-progress">
          {uploads.map((u) => (
            <div key={u.fileName} className="media-upload-item">
              <span
                style={{
                  flex: '0 0 auto',
                  maxWidth: 160,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  color:
                    u.status === 'error'
                      ? 'var(--danger)'
                      : 'var(--foreground)',
                }}
              >
                {u.fileName}
              </span>
              <div className="media-upload-bar">
                <div
                  className={`media-upload-bar-fill${
                    u.status === 'error'
                      ? ' border-danger'
                      : u.status === 'done'
                        ? ' is-done'
                        : ''
                  }`}
                  style={{ width: `${u.progress}%` }}
                />
              </div>
              <span
                style={{
                  fontSize: '0.72rem',
                  color: 'var(--surface-subtle)',
                  whiteSpace: 'nowrap',
                }}
              >
                {u.status === 'done' && (
                  <Icon
                    name="CheckCircle"
                    size={14}
                    style={{ color: 'var(--success)' }}
                  />
                )}
                {u.status === 'error' && (
                  <span style={{ color: 'var(--danger)' }}>
                    {u.error ?? 'Error'}
                  </span>
                )}
                {u.status === 'uploading' && `${u.progress}%`}
              </span>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
