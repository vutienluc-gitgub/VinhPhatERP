/**
 * Media Manager — React Query Hooks
 *
 * Data fetching and mutations for folders and assets.
 * Uses React Query for caching, invalidation, and optimistic updates.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { useTenantData } from '@/shared/hooks/useTenant';
import { useAuth } from '@/shared/hooks/useAuth';

import { MEDIA_QUERY_KEYS } from './media.constants';
import type { MediaFilters, MediaFolderCreate } from './media.types';
import {
  fetchFolders,
  fetchAssets,
  createFolder,
  renameFolder,
  deleteFolder,
  softDeleteAsset,
  renameAsset,
  moveAsset,
} from './media.service';

// ─── Folders ───────────────────────────────────────

export function useMediaFolders() {
  const { id: tenantId } = useTenantData();

  return useQuery({
    queryKey: [MEDIA_QUERY_KEYS.FOLDERS, tenantId],
    queryFn: () => fetchFolders(tenantId),
    staleTime: 30_000,
  });
}

export function useCreateFolder() {
  const qc = useQueryClient();
  const { id: tenantId } = useTenantData();
  const { user } = useAuth();

  return useMutation({
    mutationFn: (payload: MediaFolderCreate) =>
      createFolder(tenantId, user?.id ?? '', payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [MEDIA_QUERY_KEYS.FOLDERS] });
    },
  });
}

export function useRenameFolder() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ folderId, name }: { folderId: string; name: string }) =>
      renameFolder(folderId, name),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [MEDIA_QUERY_KEYS.FOLDERS] });
    },
  });
}

export function useDeleteFolder() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (folderId: string) => deleteFolder(folderId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [MEDIA_QUERY_KEYS.FOLDERS] });
      qc.invalidateQueries({ queryKey: [MEDIA_QUERY_KEYS.ASSETS] });
    },
  });
}

// ─── Assets ────────────────────────────────────────

export function useMediaAssets(filters: MediaFilters) {
  const { id: tenantId } = useTenantData();

  return useQuery({
    queryKey: [MEDIA_QUERY_KEYS.ASSETS, tenantId, filters],
    queryFn: () => fetchAssets(tenantId, filters),
    staleTime: 15_000,
  });
}

export function useSoftDeleteAsset() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (assetId: string) => softDeleteAsset(assetId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [MEDIA_QUERY_KEYS.ASSETS] });
    },
  });
}

export function useRenameAsset() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ assetId, name }: { assetId: string; name: string }) =>
      renameAsset(assetId, name),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [MEDIA_QUERY_KEYS.ASSETS] });
    },
  });
}

export function useMoveAsset() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({
      assetId,
      folderId,
    }: {
      assetId: string;
      folderId: string | null;
    }) => moveAsset(assetId, folderId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [MEDIA_QUERY_KEYS.ASSETS] });
    },
  });
}
