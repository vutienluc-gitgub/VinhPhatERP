import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  fetchDriverShipments,
  fetchJourneyLogs,
  updateJourneyStatus,
  uploadDeliveryPhoto,
  uploadSignatureBlob,
  saveDeliverySignature,
  fetchMyDriverEmployee,
} from '@/api/driver-portal.api';
import type { JourneyStatus } from '@/domain/logistics/driver-portal.types';

const QUERY_KEY = ['driver-shipments'] as const;

export { uploadDeliveryPhoto, uploadSignatureBlob, saveDeliverySignature };

/** Lay employee record lien ket voi profile cua tai xe */
export function useMyDriverEmployee(profileId: string | undefined) {
  return useQuery({
    queryKey: ['my-driver-employee', profileId],
    enabled: !!profileId,
    queryFn: () => fetchMyDriverEmployee(profileId!),
  });
}

export function useDriverShipments(employeeId: string | undefined) {
  return useQuery({
    queryKey: [...QUERY_KEY, employeeId],
    enabled: !!employeeId,
    queryFn: () => fetchDriverShipments(employeeId!),
  });
}

export function useJourneyLogs(shipmentId: string | undefined) {
  return useQuery({
    queryKey: ['journey-logs', shipmentId],
    enabled: !!shipmentId,
    queryFn: () => fetchJourneyLogs(shipmentId!),
  });
}

export function useUpdateJourneyStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      shipmentId,
      journeyStatus,
      notes,
      updatedBy,
      photoUrl,
    }: {
      shipmentId: string;
      journeyStatus: JourneyStatus;
      notes?: string;
      updatedBy?: string;
      photoUrl?: string;
    }) =>
      updateJourneyStatus(
        shipmentId,
        journeyStatus,
        notes ?? null,
        updatedBy ?? null,
        photoUrl ?? null,
      ),
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      void queryClient.invalidateQueries({
        queryKey: ['journey-logs', variables.shipmentId],
      });
    },
  });
}
