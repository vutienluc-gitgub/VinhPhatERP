// Shared types — dùng chung giữa Frontend (src/) và Server (server/src/)
// Import đường dẫn tương ứng với từng bên

export type UserRole = 'admin' | 'manager' | 'staff' | 'viewer';
export type ActiveStatus = 'active' | 'inactive';
export type DocStatus = 'draft' | 'confirmed' | 'cancelled';
export type OrderStatus =
  | 'draft'
  | 'confirmed'
  | 'in_progress'
  | 'completed'
  | 'cancelled';
export type ProductionStage =
  | 'warping'
  | 'weaving'
  | 'greige_check'
  | 'dyeing'
  | 'finishing'
  | 'final_check'
  | 'packing';
export type StageStatus = 'pending' | 'in_progress' | 'done' | 'skipped';
export type RollStatus =
  | 'in_stock'
  | 'reserved'
  | 'in_process'
  | 'shipped'
  | 'damaged'
  | 'written_off';
export type ShipmentStatus =
  | 'preparing'
  | 'shipped'
  | 'delivered'
  | 'partially_returned'
  | 'returned';
export type PaymentMethod = 'cash' | 'bank_transfer' | 'check' | 'other';
export type SupplierCategory = 'yarn' | 'dye' | 'accessories' | 'other';
export type InventoryItemType = 'yarn' | 'raw_fabric' | 'finished_fabric';
export type AdjustmentType = 'increase' | 'decrease' | 'correction';

// ────────────────────────────────────────────
// API response envelope
// ────────────────────────────────────────────
export interface ApiResponse<T> {
  data: T;
}
export interface ApiError {
  error: string;
}
export interface PaginatedResponse<T> {
  data: T[];
  total?: number;
  page: number;
  limit: number;
}

// ────────────────────────────────────────────
// Domain models (mirrors DB rows)
// ────────────────────────────────────────────
export interface Profile {
  id: string;
  fullName: string;
  role: UserRole;
  phone?: string;
  avatarUrl?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Customer {
  id: string;
  code: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  taxCode?: string;
  contactPerson?: string;
  notes?: string;
  status: ActiveStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Supplier {
  id: string;
  code: string;
  name: string;
  category: SupplierCategory;
  phone?: string;
  email?: string;
  address?: string;
  taxCode?: string;
  contactPerson?: string;
  notes?: string;
  status: ActiveStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerId: string;
  orderDate: string;
  deliveryDate?: string;
  totalAmount: string;
  paidAmount: string;
  status: OrderStatus;
  notes?: string;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  id: string;
  orderId: string;
  fabricType: string;
  colorName?: string;
  colorCode?: string;
  quantity: string;
  unit: string;
  unitPrice: string;
  notes?: string;
  sortOrder: number;
}

export interface OrderWithDetails extends Order {
  items: OrderItem[];
  progress: OrderProgress[];
}

export interface OrderProgress {
  id: string;
  orderId: string;
  stage: ProductionStage;
  status: StageStatus;
  plannedDate?: string;
  actualDate?: string;
  notes?: string;
  updatedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Payment {
  id: string;
  paymentNumber: string;
  orderId: string;
  customerId: string;
  paymentDate: string;
  amount: string;
  paymentMethod: PaymentMethod;
  referenceNumber?: string;
  notes?: string;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Shipment {
  id: string;
  shipmentNumber: string;
  orderId: string;
  customerId: string;
  shipmentDate: string;
  deliveryAddress?: string;
  carrier?: string;
  trackingNumber?: string;
  status: ShipmentStatus;
  notes?: string;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}
