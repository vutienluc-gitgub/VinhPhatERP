/**
 * MediaSidebar — Left panel with folder tree and type filters
 *
 * Renders the folder hierarchy and file-type quick filters.
 */

import { useMemo } from 'react';

import { Icon } from '@/shared/components/Icon';
import { MEDIA_LABELS } from '@/features/media/media.constants';
import type { MediaFolder, MediaFileType } from '@/features/media/media.types';

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
  onSelect: (id: string) => void;
}) {
  const isActive = activeFolderId === node.folder.id;

  return (
    <>
      <button
        type="button"
        className={`media-folder-item${isActive ? ' is-active' : ''}`}
        style={{ paddingLeft: `${0.75 + depth * 1.25}rem` }}
        onClick={() => onSelect(node.folder.id)}
      >
        <Icon name={isActive ? 'FolderOpen' : 'Folder'} size={16} />
        <span
          style={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {node.folder.name}
        </span>
      </button>
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
          tree.map((node) => (
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
