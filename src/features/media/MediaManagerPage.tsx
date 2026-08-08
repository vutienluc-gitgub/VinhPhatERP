import { useCallback, useMemo, useState } from 'react';
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  closestCorners,
} from '@dnd-kit/core';
import type { DragStartEvent, DragEndEvent } from '@dnd-kit/core';
import toast from 'react-hot-toast';

import type { ViewMode } from '@/shared/components/ViewToggle';
import { Icon } from '@/shared/components/Icon';

import type { MediaAsset, MediaFileType, MediaFilters } from './media.types';
import { useMediaFolders, useMediaAssets, useMoveAsset } from './useMedia';
import { useMediaUpload } from './useMediaUpload';
import { MediaToolbar } from './components/MediaToolbar';
import { MediaSidebar } from './components/MediaSidebar';
import { MediaGrid } from './components/MediaGrid';
import { MediaList } from './components/MediaList';
import { UploaderDropzone } from './components/UploaderDropzone';
import { FolderCreateDialog } from './components/FolderCreateDialog';
import { MediaDetailPanel } from './components/MediaDetailPanel';
import { MEDIA_LABELS } from './media.constants';

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
  const [activeDragAsset, setActiveDragAsset] = useState<MediaAsset | null>(
    null,
  );

  // ── Queries & Mutations ────────────────────────
  const { data: folders = [], isLoading: foldersLoading } = useMediaFolders();
  const moveAsset = useMoveAsset();

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

  // ── Drag & Drop ────────────────────────────────
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const { active } = event;
      const asset = assets.find((a) => a.id === active.id);
      if (asset) setActiveDragAsset(asset);
    },
    [assets],
  );

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      setActiveDragAsset(null);
      const { over } = event;

      if (!over || !activeDragAsset) return;

      const overId = String(over.id);
      if (!overId.startsWith('folder_')) return;

      const targetFolderId =
        overId === 'folder_root' ? null : overId.replace('folder_', '');

      // Do nothing if dragging into the current folder
      if (activeDragAsset.folder_id === targetFolderId) return;
      if (activeDragAsset.folder_id === null && targetFolderId === null) return;

      try {
        await moveAsset.mutateAsync({
          assetId: activeDragAsset.id,
          folderId: targetFolderId,
        });
        toast.success(MEDIA_LABELS.MOVE_SUCCESS);
      } catch (err) {
        const errObj = err as Record<string, unknown>;
        toast.error(
          typeof errObj?.message === 'string' ? errObj.message : String(err),
        );
      }
    },
    [activeDragAsset, moveAsset],
  );

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
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
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
            <MediaDetailPanel
              asset={selectedAsset}
              onClose={handleDetailClose}
            />
          </div>
        </div>

        <DragOverlay
          dropAnimation={{
            duration: 250,
            easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)',
          }}
        >
          {activeDragAsset ? (
            <div className="rounded-lg bg-surface border border-primary p-2 text-xs shadow-xl rotate-3 opacity-95 w-[180px] cursor-grabbing flex items-center gap-2">
              <Icon
                name={
                  activeDragAsset.mime_type.startsWith('image/')
                    ? 'Image'
                    : 'File'
                }
                size={16}
                className="text-foreground"
              />
              <div className="font-medium text-text truncate">
                {activeDragAsset.original_name}
              </div>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Folder creation dialog */}
      <FolderCreateDialog
        open={showFolderDialog}
        onClose={() => setShowFolderDialog(false)}
        parentId={activeFolderId}
      />
    </div>
  );
}
