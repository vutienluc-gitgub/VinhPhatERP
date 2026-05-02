/**
 * Media Manager — Service Layer
 *
 * Handles direct upload to Supabase Storage, metadata CRUD via DB,
 * and signed URL generation. No business logic in UI components.
 */

import { supabase } from '@/services/supabase/client';
import { untypedDb } from '@/services/supabase/untyped';
import { safeUpsert } from '@/lib/db-guard';

import { MEDIA_BUCKETS, MEDIA_LIMITS, MIME_GROUPS } from './media.constants';
import type {
  MediaAsset,
  MediaFolder,
  MediaFolderCreate,
  MediaFilters,
  MediaFileType,
  UploadResult,
} from './media.types';

// ─── Helpers ───────────────────────────────────────

function getExtension(filename: string): string {
  const parts = filename.split('.');
  return parts.length > 1 ? `.${parts.pop()}` : '';
}

function resolveBucket(isPublic: boolean): string {
  return isPublic ? MEDIA_BUCKETS.PUBLIC : MEDIA_BUCKETS.SECURE;
}

export function resolveFileType(mimeType: string): MediaFileType {
  if (
    MIME_GROUPS.image.some((m) => mimeType.startsWith(m.split('/')[0] ?? ''))
  ) {
    return 'image';
  }
  for (const type of MIME_GROUPS.image) {
    if (mimeType === type) return 'image';
  }
  for (const type of MIME_GROUPS.video) {
    if (mimeType === type) return 'video';
  }
  for (const type of MIME_GROUPS.document) {
    if (mimeType === type) return 'document';
  }
  return 'other';
}

function buildMimeFilter(fileType: MediaFileType): string[] | null {
  switch (fileType) {
    case 'image':
      return [...MIME_GROUPS.image];
    case 'video':
      return [...MIME_GROUPS.video];
    case 'document':
      return [...MIME_GROUPS.document];
    case 'all':
    default:
      return null;
  }
}

// ─── Folder CRUD ───────────────────────────────────

export async function fetchFolders(tenantId: string): Promise<MediaFolder[]> {
  const { data, error } = await untypedDb
    .from('media_folders')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('name', { ascending: true });

  if (error) throw error;
  return (data ?? []) as MediaFolder[];
}

export async function createFolder(
  tenantId: string,
  userId: string,
  payload: MediaFolderCreate,
): Promise<MediaFolder> {
  const result = await safeUpsert({
    table: 'media_folders',
    data: {
      id: crypto.randomUUID(),
      tenant_id: tenantId,
      parent_id: payload.parent_id ?? null,
      name: payload.name.trim(),
      created_by: userId,
    },
    conflictKey: 'id',
  });
  return (Array.isArray(result) ? result[0] : result) as MediaFolder;
}

export async function renameFolder(
  folderId: string,
  name: string,
): Promise<void> {
  const { error } = await untypedDb
    .from('media_folders')
    .update({ name: name.trim() })
    .eq('id', folderId);

  if (error) throw error;
}

export async function deleteFolder(folderId: string): Promise<void> {
  const { error } = await untypedDb
    .from('media_folders')
    .delete()
    .eq('id', folderId);

  if (error) throw error;
}

// ─── Asset CRUD ────────────────────────────────────

export async function fetchAssets(
  tenantId: string,
  filters: MediaFilters,
): Promise<MediaAsset[]> {
  let query = untypedDb
    .from('media_assets')
    .select('*')
    .eq('tenant_id', tenantId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  // Folder filter
  if (filters.folderId !== undefined) {
    if (filters.folderId === null) {
      query = query.is('folder_id', null);
    } else {
      query = query.eq('folder_id', filters.folderId);
    }
  }

  // Search filter
  if (filters.search) {
    query = query.ilike('original_name', `%${filters.search}%`);
  }

  // MIME type filter
  const mimeList = filters.fileType ? buildMimeFilter(filters.fileType) : null;
  if (mimeList) {
    query = query.in('mime_type', mimeList);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as MediaAsset[];
}

export async function getAssetDetail(
  assetId: string,
): Promise<MediaAsset | null> {
  const { data, error } = await untypedDb
    .from('media_assets')
    .select('*')
    .eq('id', assetId)
    .maybeSingle();

  if (error) throw error;
  return data as MediaAsset | null;
}

// ─── Upload (Direct to Storage) ────────────────────

export async function uploadFile(
  file: File,
  tenantId: string,
  userId: string,
  folderId: string | null,
  isPublic: boolean = true,
): Promise<UploadResult> {
  // 1. Generate UUID-based file name to prevent collisions
  const ext = getExtension(file.name);
  const uuid = crypto.randomUUID();
  const fileName = `${uuid}${ext}`;
  const bucket = resolveBucket(isPublic);
  const storagePath = `${tenantId}/${fileName}`;

  // 2. Direct upload to Supabase Storage (from browser)
  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(storagePath, file, {
      cacheControl: '31536000', // 1 year cache for immutable files
      upsert: false, // Never overwrite
    });

  if (uploadError) throw uploadError;

  // 3. Get public URL (only for public bucket)
  let publicUrl: string | null = null;
  if (isPublic) {
    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(storagePath);
    publicUrl = urlData.publicUrl;
  }

  // 4. Save metadata to database (idempotent via safeUpsert)
  const assetId = uuid;
  const result = await safeUpsert({
    table: 'media_assets',
    data: {
      id: assetId,
      tenant_id: tenantId,
      folder_id: folderId,
      file_name: fileName,
      original_name: file.name,
      mime_type: file.type || 'application/octet-stream',
      size_bytes: file.size,
      storage_path: storagePath,
      bucket,
      public_url: publicUrl,
      is_public: isPublic,
      created_by: userId,
    },
    conflictKey: 'id',
  });

  const asset = (Array.isArray(result) ? result[0] : result) as MediaAsset;
  return { asset, publicUrl };
}

// ─── Download / Signed URL ─────────────────────────

export async function getSignedUrl(
  bucket: string,
  storagePath: string,
): Promise<string> {
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(storagePath, MEDIA_LIMITS.SIGNED_URL_EXPIRY_SECONDS);

  if (error) throw error;
  return data.signedUrl;
}

export function getDownloadUrl(asset: MediaAsset): string | Promise<string> {
  if (asset.is_public && asset.public_url) {
    return asset.public_url;
  }
  return getSignedUrl(asset.bucket, asset.storage_path);
}

// ─── Soft Delete ───────────────────────────────────

export async function softDeleteAsset(assetId: string): Promise<void> {
  const { error } = await untypedDb
    .from('media_assets')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', assetId);

  if (error) throw error;
}

// ─── Rename Asset ──────────────────────────────────

export async function renameAsset(
  assetId: string,
  newName: string,
): Promise<void> {
  const { error } = await untypedDb
    .from('media_assets')
    .update({ original_name: newName.trim() })
    .eq('id', assetId);

  if (error) throw error;
}

// ─── Move Asset to Folder ──────────────────────────

export async function moveAsset(
  assetId: string,
  targetFolderId: string | null,
): Promise<void> {
  const { error } = await untypedDb
    .from('media_assets')
    .update({ folder_id: targetFolderId })
    .eq('id', assetId);

  if (error) throw error;
}

// ─── Format Helpers ────────────────────────────────

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const size = bytes / Math.pow(k, i);
  return `${size.toFixed(i > 0 ? 1 : 0)} ${units[i]}`;
}
