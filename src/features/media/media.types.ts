/**
 * Media Manager — Domain Types
 *
 * Mirrors the `media_folders` and `media_assets` database tables.
 * Used across service, hooks, and UI layers.
 */

// ─── Folder ────────────────────────────────────────

export interface MediaFolder {
  id: string;
  tenant_id: string;
  parent_id: string | null;
  name: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface MediaFolderCreate {
  name: string;
  parent_id?: string | null;
}

// ─── Asset ─────────────────────────────────────────

export interface MediaAsset {
  id: string;
  tenant_id: string;
  folder_id: string | null;
  file_name: string;
  original_name: string;
  mime_type: string;
  size_bytes: number;
  storage_path: string;
  bucket: string;
  public_url: string | null;
  is_public: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

// ─── Filters ───────────────────────────────────────

export type MediaFileType = 'all' | 'image' | 'video' | 'document' | 'other';

export interface MediaFilters {
  folderId?: string | null;
  search?: string;
  fileType?: MediaFileType;
}

// ─── Upload ────────────────────────────────────────

export interface UploadResult {
  asset: MediaAsset;
  publicUrl: string | null;
}

export interface UploadProgress {
  fileName: string;
  progress: number; // 0-100
  status: 'pending' | 'uploading' | 'done' | 'error';
  error?: string;
}

// ─── View Mode ─────────────────────────────────────

export type MediaViewMode = 'grid' | 'list';

// ─── Context Menu Action ───────────────────────────

export type MediaContextAction =
  | 'download'
  | 'rename'
  | 'move'
  | 'delete'
  | 'copy-url'
  | 'details';
