/**
 * Fabric Image — React Query Hooks
 *
 * Wraps upload/delete API in useMutation for easy form integration.
 */

import { useMutation } from '@tanstack/react-query';

import { uploadFabricImage, deleteFabricImage } from '@/api/fabric-image.api';

export function useUploadFabricImage() {
  return useMutation({
    mutationFn: uploadFabricImage,
  });
}

export function useDeleteFabricImage() {
  return useMutation({
    mutationFn: deleteFabricImage,
  });
}
