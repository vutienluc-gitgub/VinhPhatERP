/**
 * MediaManagerPage — Main page orchestrating all Media Manager components
 *
 * Layout: Toolbar (top) → [ Sidebar (left) | Content (center) | Detail (right) ]
 * Content area switches between Grid and List views.
 * Dropzone appears when no files exist or when user drags files.
 */

import { useCallback, useMemo, useState } from 'react';

import type { ViewMode } from '@/shared/components/ViewToggle';

import type { MediaAsset, MediaFileType, MediaFilters } from './media.types';
import { useMediaFolders, useMediaAssets } from './useMedia';
import { useMediaUpload } from './useMediaUpload';
import { MediaToolbar } from './components/MediaToolbar';
import { MediaSidebar } from './components/MediaSidebar';
import { MediaGrid } from './components/MediaGrid';
import { MediaList } from './components/MediaList';
import { UploaderDropzone } from './components/UploaderDropzone';
import { FolderCreateDialog } from './components/FolderCreateDialog';
import { MediaDetailPanel } from './components/MediaDetailPanel';

import './media.css';

export function MediaManagerPage() {
  // ── State ──────────────────────────────────────
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [activeFolderId, setActiveFolderId] = useState<string | null>(null);
  const [activeFileType, setActiveFileType] = useState<MediaFileType>('all');
  const [search, setSearch] = useState('');
  const [selectedAsset, setSelectedAsset] = useState<MediaAsset | null>(null);
  const [showFolderDialog, setShowFolderDialog] = useState(false);
  const [showDropzone, setShowDropzone] = useState(false);

  // ── Queries ────────────────────────────────────
  const { data: folders = [], isLoading: foldersLoading } = useMediaFolders();

  const filters: MediaFilters = useMemo(
    () => ({
      folderId: activeFolderId,
      search: search || undefined,
      fileType: activeFileType !== 'all' ? activeFileType : undefined,
    }),
    [activeFolderId, search, activeFileType],
  );

  const { data: assets = [], isLoading: assetsLoading } =
    useMediaAssets(filters);

  // ── Upload ─────────────────────────────────────
  const { uploads, isUploading, handleUpload } = useMediaUpload(activeFolderId);

  // ── Handlers ───────────────────────────────────
  const handleFolderSelect = useCallback((folderId: string | null) => {
    setActiveFolderId(folderId);
    setSelectedAsset(null);
  }, []);

  const handleFileTypeChange = useCallback((type: MediaFileType) => {
    setActiveFileType(type);
    setSelectedAsset(null);
  }, []);

  const handleAssetSelect = useCallback((asset: MediaAsset) => {
    setSelectedAsset((prev) => (prev?.id === asset.id ? null : asset));
  }, []);

  const handleUploadClick = useCallback(() => {
    setShowDropzone((v) => !v);
  }, []);

  const handleFilesSelected = useCallback(
    (files: File[]) => {
      setShowDropzone(false);
      handleUpload(files);
    },
    [handleUpload],
  );

  const handleDetailClose = useCallback(() => {
    setSelectedAsset(null);
  }, []);

  // ── Render ─────────────────────────────────────
  const hasFiles = assets.length > 0 || assetsLoading;

  return (
    <div className="page-container">
      <div className="media-manager fade-up" id="media-manager">
        {/* Toolbar */}
        <MediaToolbar
          search={search}
          onSearchChange={setSearch}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          onUploadClick={handleUploadClick}
          onNewFolderClick={() => setShowFolderDialog(true)}
          isUploading={isUploading}
        />

        {/* Main layout */}
        <div className="media-layout">
          {/* Sidebar */}
          <MediaSidebar
            folders={folders}
            isLoading={foldersLoading}
            activeFolderId={activeFolderId}
            onFolderSelect={handleFolderSelect}
            activeFileType={activeFileType}
            onFileTypeChange={handleFileTypeChange}
          />

          {/* Content area */}
          <div className="media-content">
            {/* Dropzone (visible when toggled or no files) */}
            {(showDropzone || !hasFiles) && (
              <UploaderDropzone
                onFilesSelected={handleFilesSelected}
                isUploading={isUploading}
                uploads={uploads}
              />
            )}

            {/* Upload progress (when files are present) */}
            {uploads.length > 0 && hasFiles && !showDropzone && (
              <div className="media-upload-progress">
                {uploads.map((u) => (
                  <div key={u.fileName} className="media-upload-item">
                    <span
                      style={{
                        maxWidth: 160,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        color:
                          u.status === 'error'
                            ? 'var(--danger)'
                            : 'var(--text)',
                      }}
                    >
                      {u.fileName}
                    </span>
                    <div className="media-upload-bar">
                      <div
                        className={`media-upload-bar-fill${
                          u.status === 'error'
                            ? ' is-error'
                            : u.status === 'done'
                              ? ' is-done'
                              : ''
                        }`}
                        style={{ width: `${u.progress}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* File views */}
            {viewMode === 'grid' ? (
              <MediaGrid
                assets={assets}
                selectedId={selectedAsset?.id ?? null}
                onSelect={handleAssetSelect}
                isLoading={assetsLoading}
                onUploadClick={handleUploadClick}
              />
            ) : (
              <MediaList
                assets={assets}
                selectedId={selectedAsset?.id ?? null}
                onSelect={handleAssetSelect}
                isLoading={assetsLoading}
                onUploadClick={handleUploadClick}
              />
            )}
          </div>

          {/* Detail panel (desktop only) */}
          <MediaDetailPanel asset={selectedAsset} onClose={handleDetailClose} />
        </div>
      </div>

      {/* Folder creation dialog */}
      <FolderCreateDialog
        open={showFolderDialog}
        onClose={() => setShowFolderDialog(false)}
        parentId={activeFolderId}
      />
    </div>
  );
}
