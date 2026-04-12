/**
 * ShipmentDomain — business logic cho giao hang.
 * Pure TypeScript, khong phu thuoc React hay Supabase.
 *
 * Noi dung:
 * - Data mapping (form → DB payload)
 * - Shipping cost calculations
 * - Delivery validation
 * - Status guards
 */

import type { ShipmentStatus } from '@/schema/shipment.schema';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ShipmentItemPayload {
  finishedRollId: string | null;
  fabricType: string;
  quantity: number;
}

export interface ShipmentDbPayload {
  shipmentNumber: string;
  orderId: string;
  customerId: string;
  shipmentDate: string;
  deliveryAddress: string | null;
  deliveryStaffId: string | null;
  employeeId: string | null;
  shippingRateId: string | null;
  shippingCost: number;
  loadingFee: number;
  vehicleInfo: string | null;
  items: ShipmentItemPayload[];
}

// ─── Data Mapping ─────────────────────────────────────────────────────────────

/**
 * Map form values sang API payload.
 * Logic nay truoc day nam trong useShipments.ts dong 77-93.
 */
export function mapShipmentFormToPayload(values: {
  shipmentNumber: string;
  orderId: string;
  customerId: string;
  shipmentDate: string;
  deliveryAddress?: string;
  deliveryStaffId?: string;
  employeeId?: string;
  shippingRateId?: string;
  shippingCost: number;
  loadingFee: number;
  vehicleInfo?: string;
  items: Array<{
    finishedRollId?: string;
    fabricType: string;
    quantity: number;
  }>;
}): ShipmentDbPayload {
  return {
    shipmentNumber: values.shipmentNumber,
    orderId: values.orderId,
    customerId: values.customerId,
    shipmentDate: values.shipmentDate,
    deliveryAddress: values.deliveryAddress?.trim() || null,
    deliveryStaffId: values.deliveryStaffId?.trim() || null,
    employeeId: values.employeeId?.trim() || null,
    shippingRateId: values.shippingRateId?.trim() || null,
    shippingCost: values.shippingCost,
    loadingFee: values.loadingFee,
    vehicleInfo: values.vehicleInfo?.trim() || null,
    items: values.items.map((item) => ({
      finishedRollId: item.finishedRollId?.trim() || null,
      fabricType: item.fabricType,
      quantity: item.quantity,
    })),
  };
}

// ─── Calculations ─────────────────────────────────────────────────────────────

/**
 * Tinh tong so luong hang (meters/kg tuy don vi).
 */
export function calculateTotalQuantity(
  items: Array<{ quantity: number }>,
): number {
  return items.reduce((sum, i) => sum + i.quantity, 0);
}

/**
 * Tinh tong chi phi van chuyen.
 */
export function calculateTotalShippingCost(
  shippingCost: number,
  loadingFee: number,
): number {
  return shippingCost + loadingFee;
}

// ─── Delivery validation ──────────────────────────────────────────────────────

export interface DeliveryConfirmPayload {
  receiverName: string;
  receiverPhone: string | null;
  deliveryProof: string;
  notes: string | null;
}

/**
 * Map delivery confirm form sang payload.
 */
export function mapDeliveryConfirmToPayload(values: {
  receiverName: string;
  receiverPhone?: string;
  deliveryProof: string;
  notes?: string;
}): DeliveryConfirmPayload {
  return {
    receiverName: values.receiverName,
    receiverPhone: values.receiverPhone ?? null,
    deliveryProof: values.deliveryProof,
    notes: values.notes ?? null,
  };
}

// ─── Status Guards ────────────────────────────────────────────────────────────

export function isShipmentEditable(status: ShipmentStatus): boolean {
  return status === 'preparing';
}

export function canConfirmShipment(status: ShipmentStatus): boolean {
  return status === 'preparing';
}

export function canMarkDelivered(status: ShipmentStatus): boolean {
  return status === 'shipped';
}

export function isShipmentTerminal(status: ShipmentStatus): boolean {
  return status === 'delivered' || status === 'returned';
}
