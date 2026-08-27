import { memo } from 'react';

import { CHAT_LABELS } from '@/schema/chat.schema';
import { Icon } from '@/shared/components/Icon';

interface Props {
  previewUrl: string | null;
  previewFile: { url: string; name: string; type: string } | null;
  isUploading: boolean;
  onClear: () => void;
}

export const ChatUploadPreview = memo(function ChatUploadPreview({
  previewUrl,
  previewFile,
  isUploading,
  onClear,
}: Props) {
  if (previewUrl) {
    return (
      <div className="chat-image-preview">
        <img src={previewUrl} alt="Preview" className="chat-preview-thumb" />
        {isUploading && (
          <span className="chat-preview-uploading">{CHAT_LABELS.LOADING}</span>
        )}
        {!isUploading && (
          <button
            type="button"
            className="chat-preview-close"
            onClick={onClear}
            aria-label={CHAT_LABELS.CANCEL}
          >
            <Icon name="X" size={12} />
          </button>
        )}
      </div>
    );
  }

  if (previewFile) {
    return (
      <div className="chat-file-preview">
        <div className="chat-file-preview-icon">
          <Icon name="FileText" size={24} />
        </div>
        <div className="chat-file-preview-info">
          <span className="chat-file-preview-name">{previewFile.name}</span>
          {isUploading && (
            <span className="chat-preview-uploading">
              {CHAT_LABELS.LOADING}
            </span>
          )}
        </div>
        {!isUploading && (
          <button
            type="button"
            className="chat-preview-close"
            onClick={onClear}
            aria-label={CHAT_LABELS.CANCEL}
          >
            <Icon name="X" size={12} />
          </button>
        )}
      </div>
    );
  }

  return null;
});
