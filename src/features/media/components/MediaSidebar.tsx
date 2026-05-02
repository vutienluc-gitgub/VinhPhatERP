/**
 * MediaSidebar — Left panel with folder tree and type filters
 *
 * Renders the folder hierarchy and file-type quick filters.
 */

import { useMemo } from 'react';
import toast from 'react-hot-toast';

import { Icon } from '@/shared/components/Icon';
import { MEDIA_LABELS } from '@/features/media/media.constants';
import type { MediaFolder, MediaFileType } from '@/features/media/media.types';
import {
  useRenameFolder,
  useDeleteFolder,
  useMoveFolder,
} from '@/features/media/useMedia';

interface MediaSidebarProps {
  folders: MediaFolder[];
  isLoading: boolean;
  activeFolderId: string | null;
  onFolderSelect: (folderId: string | null) => void;
  activeFileType: MediaFileType;
  onFileTypeChange: (type: MediaFileType) => void;
}

interface FolderNode {
  folder: MediaFolder;
  children: FolderNode[];
}

function buildTree(folders: MediaFolder[]): FolderNode[] {
  const nodeMap = new Map<string, FolderNode>();
  const roots: FolderNode[] = [];

  for (const f of folders) {
    nodeMap.set(f.id, { folder: f, children: [] });
  }

  for (const f of folders) {
    const node = nodeMap.get(f.id);
    if (!node) continue;

    if (f.parent_id && nodeMap.has(f.parent_id)) {
      nodeMap.get(f.parent_id)?.children.push(node);
    } else {
      roots.push(node);
    }
  }

  return roots;
}

const FILE_TYPE_FILTERS: {
  type: MediaFileType;
  label: string;
  icon: string;
}[] = [
  { type: 'all', label: MEDIA_LABELS.ALL_FILES, icon: 'LayoutGrid' },
  { type: 'image', label: MEDIA_LABELS.IMAGES, icon: 'Image' },
  { type: 'video', label: MEDIA_LABELS.VIDEOS, icon: 'Video' },
  { type: 'document', label: MEDIA_LABELS.DOCUMENTS, icon: 'FileText' },
  { type: 'other', label: MEDIA_LABELS.OTHERS, icon: 'File' },
];

function FolderTreeItem({
  node,
  depth,
  activeFolderId,
  onSelect,
}: {
  node: FolderNode;
  depth: number;
  activeFolderId: string | null;
  onSelect: (id: string | null) => void;
}) {
  const isActive = activeFolderId === node.folder.id;
  const renameFolder = useRenameFolder();
  const deleteFolder = useDeleteFolder();
  const moveFolder = useMoveFolder();

  const handleRename = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const newName = window.prompt(MEDIA_LABELS.RENAME, node.folder.name);
    if (!newName || newName === node.folder.name) return;

    try {
      await renameFolder.mutateAsync({
        folderId: node.folder.id,
        name: newName,
      });
      toast.success(MEDIA_LABELS.RENAME_FOLDER_SUCCESS);
    } catch (err) {
      const errObj = err as Record<string, unknown>;
      const message =
        typeof errObj?.message === 'string' ? errObj.message : String(err);
      toast.error(message);
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm(MEDIA_LABELS.DELETE_FOLDER_CONFIRM)) return;

    try {
      await deleteFolder.mutateAsync(node.folder.id);
      if (isActive) onSelect(null);
      toast.success(MEDIA_LABELS.FILE_DELETED);
    } catch (err) {
      const errObj = err as Record<string, unknown>;
      const message =
        typeof errObj?.message === 'string' ? errObj.message : String(err);
      toast.error(message);
    }
  };

  const handleMoveToRoot = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await moveFolder.mutateAsync({
        folderId: node.folder.id,
        parentId: null,
      });
      toast.success(MEDIA_LABELS.MOVE_SUCCESS);
    } catch (err) {
      const errObj = err as Record<string, unknown>;
      const message =
        typeof errObj?.message === 'string' ? errObj.message : String(err);
      toast.error(message);
    }
  };

  return (
    <>
      <div
        className={`media-folder-row${isActive ? ' is-active' : ''}`}
        style={{ paddingLeft: `${0.75 + depth * 1.25}rem` }}
        onClick={() => onSelect(node.folder.id)}
      >
        <div className="media-folder-content">
          <Icon name={isActive ? 'FolderOpen' : 'Folder'} size={16} />
          <span className="media-folder-name">{node.folder.name}</span>
        </div>
        <div className="media-folder-actions">
          {node.folder.parent_id && (
            <button
              type="button"
              className="media-folder-action-btn"
              onClick={handleMoveToRoot}
              title="Đưa ra Tất cả (Root)"
            >
              <Icon name="CornerLeftUp" size={12} />
            </button>
          )}
          <button
            type="button"
            className="media-folder-action-btn"
            onClick={handleRename}
            title={MEDIA_LABELS.RENAME}
          >
            <Icon name="Pencil" size={12} />
          </button>
          <button
            type="button"
            className="media-folder-action-btn danger"
            onClick={handleDelete}
            title="Xoá"
          >
            <Icon name="Trash2" size={12} />
          </button>
        </div>
      </div>
      {node.children.map((child) => (
        <FolderTreeItem
          key={child.folder.id}
          node={child}
          depth={depth + 1}
          activeFolderId={activeFolderId}
          onSelect={onSelect}
        />
      ))}
    </>
  );
}

export function MediaSidebar({
  folders,
  isLoading,
  activeFolderId,
  onFolderSelect,
  activeFileType,
  onFileTypeChange,
}: MediaSidebarProps) {
  const tree = useMemo(() => buildTree(folders), [folders]);

  return (
    <aside className="media-sidebar" id="media-sidebar">
      {/* Folder tree */}
      <div className="media-sidebar-section">
        <div className="media-sidebar-label">
          <Icon name="Folder" size={12} style={{ marginRight: 4 }} />
          {MEDIA_LABELS.ROOT_FOLDER}
        </div>

        <button
          type="button"
          className={`media-folder-item${activeFolderId === null ? ' is-active' : ''}`}
          onClick={() => onFolderSelect(null)}
        >
          <Icon name="Home" size={16} />
          <span>{MEDIA_LABELS.ALL_FILES}</span>
        </button>

        {isLoading ? (
          <div
            style={{
              padding: '0.5rem 0.75rem',
              color: 'var(--muted)',
              fontSize: '0.82rem',
            }}
          >
            Loading...
          </div>
        ) : (
          tree.map((node: FolderNode) => (
            <FolderTreeItem
              key={node.folder.id}
              node={node}
              depth={0}
              activeFolderId={activeFolderId}
              onSelect={onFolderSelect}
            />
          ))
        )}
      </div>

      {/* File type filters */}
      <div className="media-sidebar-section">
        <div className="media-sidebar-label">Loại file</div>
        <div className="media-type-filters">
          {FILE_TYPE_FILTERS.map((f) => (
            <button
              key={f.type}
              type="button"
              className={`media-folder-item${activeFileType === f.type ? ' is-active' : ''}`}
              onClick={() => onFileTypeChange(f.type)}
            >
              <Icon name={f.icon} size={16} />
              <span>{f.label}</span>
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
}
