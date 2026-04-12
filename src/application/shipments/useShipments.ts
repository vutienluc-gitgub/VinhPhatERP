import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  fetchShipmentDocument,
  fetchShipmentsPaginated,
  fetchShipmentsByOrder,
  fetchNextShipmentNumber,
  fetchAvailableFinishedRolls,
  createShipmentFull,
  confirmShipmentFull,
  markShipmentDelivered,
  assignDeliveryStaff,
  fetchDeliveryStaff,
  deleteShipmentFull,
} from '@/api/shipments.api';
import {
  mapShipmentFormToPayload,
  mapDeliveryConfirmToPayload,
} from '@/domain/shipments/ShipmentDomain';
import { useAuth } from '@/shared/hooks/useAuth';
import { useCompanySettings } from '@/shared/hooks/useCompanySettings';
import { exportShipmentToPdf } from '@/features/shipments/shipment-document';
import type {
  ShipmentsFormValues,
  DeliveryConfirmFormValues,
} from '@/features/shipments/shipments.module';
import type {
  ShipmentDocument,
  ShipmentsFilter,
  DeliveryStaffSummary,
} from '@/features/shipments/types';

export type { ShipmentDocument };

const QUERY_KEY = ['shipments'] as const;

/* ── List with filters ── */

export function useShipmentList(filters: ShipmentsFilter = {}, page = 1) {
  return useQuery({
    queryKey: [...QUERY_KEY, filters, page],
    queryFn: () => fetchShipmentsPaginated(filters, page),
  });
}

/* ── Single shipment detail ── */

export function useShipment(id: string | undefined) {
  return useQuery({
    queryKey: [...QUERY_KEY, id],
    enabled: !!id,
    queryFn: () => fetchShipmentDocument(id!),
  });
}

/* ── Auto-generate shipment number ── */

export function useNextShipmentNumber() {
  return useQuery({
    queryKey: [...QUERY_KEY, 'next-number'],
    queryFn: fetchNextShipmentNumber,
  });
}

/* ── Available finished rolls for picking ── */

export function useAvailableFinishedRolls(orderId?: string) {
  return useQuery({
    queryKey: ['finished-fabric-rolls', 'available', orderId],
    queryFn: () => fetchAvailableFinishedRolls(orderId),
  });
}

/* ── Create ── */

export function useCreateShipment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: ShipmentsFormValues) =>
      createShipmentFull(mapShipmentFormToPayload(values)),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      void queryClient.invalidateQueries({ queryKey: ['orders'] });
      void queryClient.invalidateQueries({
        queryKey: ['finished-fabric-rolls'],
      });
      void queryClient.invalidateQueries({ queryKey: ['reserve-rolls'] });
    },
  });
}

/* ── Confirm (preparing → shipped) ── */

export function useConfirmShipment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: confirmShipmentFull,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      void queryClient.invalidateQueries({ queryKey: ['orders'] });
      void queryClient.invalidateQueries({
        queryKey: ['finished-fabric-rolls'],
      });
      void queryClient.invalidateQueries({ queryKey: ['reserve-rolls'] });
    },
  });
}

/* ── Export PDF ── */

export function useExportShipmentPdf() {
  const { profile } = useAuth();
  const { data: settings } = useCompanySettings();

  return useMutation({
    mutationFn: async (shipmentId: string) => {
      const shipment = await fetchShipmentDocument(shipmentId);
      exportShipmentToPdf(shipment, {
        createdByName: profile?.full_name ?? undefined,
        companyName: settings?.company_name ?? undefined,
      });
      return shipment;
    },
  });
}

/* ── Mark delivered ── */

export function useMarkDelivered() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      shipmentId,
      values,
    }: {
      shipmentId: string;
      values: DeliveryConfirmFormValues;
    }) =>
      markShipmentDelivered(shipmentId, mapDeliveryConfirmToPayload(values)),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      void queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
}

/* ── Assign delivery staff ── */

export function useAssignDeliveryStaff() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      shipmentId,
      staffId,
      vehicleInfo,
    }: {
      shipmentId: string;
      staffId: string;
      vehicleInfo?: string;
    }) => assignDeliveryStaff(shipmentId, staffId, vehicleInfo),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}

/* ── Delivery staff list ── */

export function useDeliveryStaffList() {
  return useQuery<DeliveryStaffSummary[]>({
    queryKey: ['delivery-staff'],
    queryFn: fetchDeliveryStaff,
  });
}

/* ── Delete (preparing only) ── */

export function useDeleteShipment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteShipmentFull,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      void queryClient.invalidateQueries({
        queryKey: ['finished-fabric-rolls'],
      });
    },
  });
}

/* ── Shipments by order ── */

export function useOrderShipments(orderId: string | undefined) {
  return useQuery({
    queryKey: [...QUERY_KEY, 'by-order', orderId],
    enabled: !!orderId,
    queryFn: () => fetchShipmentsByOrder(orderId!),
  });
}
