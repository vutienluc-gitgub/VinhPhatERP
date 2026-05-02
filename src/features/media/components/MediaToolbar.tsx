/**
 * MediaToolbar — Top action bar for Media Manager
 *
 * Contains: Title, Search, Upload button, New Folder, View Toggle
 */

import { useCallback, useRef } from 'react';

import { Icon } from '@/shared/components/Icon';
import { SearchInput } from '@/shared/components/SearchInput';
import { ViewToggle } from '@/shared/components/ViewToggle';
import type { ViewMode } from '@/shared/components/ViewToggle';
import { MEDIA_LABELS } from '@/features/media/media.constants';

interface MediaToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  onUploadClick: () => void;
  onNewFolderClick: () => void;
  isUploading: boolean;
}

export function MediaToolbar({
  search,
  onSearchChange,
  viewMode,
  onViewModeChange,
  onUploadClick,
  onNewFolderClick,
  isUploading,
}: MediaToolbarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUploadClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        onUploadClick();
      }
      // Reset so same file can be selected again
      e.target.value = '';
    },
    [onUploadClick],
  );

  return (
    <div className="media-toolbar" id="media-toolbar">
      <h1 className="media-toolbar-title">{MEDIA_LABELS.PAGE_TITLE}</h1>

      <div style={{ flex: 1, maxWidth: 320, minWidth: 160 }}>
        <SearchInput
          placeholder={MEDIA_LABELS.SEARCH_PLACEHOLDER}
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      <div className="media-toolbar-actions">
        <button
          type="button"
          className="btn-secondary"
          onClick={onNewFolderClick}
          id="media-new-folder-btn"
        >
          <Icon name="FolderPlus" size={16} />
          {MEDIA_LABELS.NEW_FOLDER}
        </button>

        <button
          type="button"
          className="btn-primary"
          onClick={handleUploadClick}
          disabled={isUploading}
          id="media-upload-btn"
        >
          <Icon name="Upload" size={16} />
          {isUploading ? 'Uploading...' : MEDIA_LABELS.UPLOAD}
        </button>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          style={{ display: 'none' }}
          onChange={handleFileSelect}
        />

        <ViewToggle value={viewMode} onChange={onViewModeChange} />
      </div>
    </div>
  );
}
