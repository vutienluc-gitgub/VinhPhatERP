/**
 * Delivery Stop Domain Types (Pure TypeScript - Domain Layer)
 * Represents a discrete delivery location and recipient in a route.
 */

export type DeliveryStopStatus =
  | 'pending'
  | 'in_progress'
  | 'delivered'
  | 'failed';

export interface TargetRollItem {
  itemId: string;
  rollCode: string;
  fabricCode?: string;
  color?: string;
  quantity: number;
  unit: string;
}

export interface DeliveryStop {
  id: string;
  tenantId: string;
  shipmentId: string;
  stopSequence: number;
  customerId: string;
  customerName?: string;
  deliveryAddress: string;
  contactPerson?: string;
  contactPhone?: string;
  targetItems: TargetRollItem[];
  status: DeliveryStopStatus;
  createdAt: string;
  updatedAt: string;
}
