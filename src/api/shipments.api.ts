import type {
  Shipment,
  ShipmentDocument,
  ShipmentsFilter,
  ShipmentStatus,
  DeliveryStaffSummary,
} from '@/features/shipments/types';
import { supabase } from '@/services/supabase/client';
import type { Database } from '@/services/supabase/database.types';
import { DEFAULT_PAGE_SIZE } from '@/shared/types/pagination';
import type { PaginatedResult } from '@/shared/types/pagination';
import { untypedDb } from '@/services/supabase/untyped';
import { shipmentResponseSchema } from '@/schema/shipment.schema';

const HEADER_TABLE = 'shipments';

type FinishedRollAvailabilityRow = Pick<
  Database['public']['Tables']['finished_fabric_rolls']['Row'],
  'id' | 'fabric_type' | 'color_name'
>;
type FinishedRollDocumentRow = Pick<
  Database['public']['Tables']['finished_fabric_rolls']['Row'],
  'id' | 'roll_number' | 'color_name' | 'length_m' | 'warehouse_location'
>;

/* ── Internal helpers ── */

async function fetchReservableRolls(
  rollIds: string[],
): Promise<Map<string, FinishedRollAvailabilityRow>> {
  const uniqueRollIds = Array.from(new Set(rollIds));
  if (uniqueRollIds.length === 0) return new Map();

  const { data, error } = await supabase
    .from('finished_fabric_rolls')
    .select('id, fabric_type, color_name')
    .in('status', ['in_stock', 'reserved'])
    .in('id', uniqueRollIds);

  if (error) throw error;

  const rows = (data ?? []) as FinishedRollAvailabilityRow[];
  if (rows.length !== uniqueRollIds.length) {
    throw new Error(
      'Một hoặc nhiều cuộn thành phẩm không còn sẵn sàng để xuất.',
    );
  }

  return new Map(rows.map((row) => [row.id, row]));
}

/* ── Fetch shipment document (for PDF export + detail view) ── */

export async function fetchShipmentDocument(
  shipmentId: string,
): Promise<ShipmentDocument> {
  const { data, error } = await supabase
    .from(HEADER_TABLE)
    .select(
      '*, orders(order_number), customers(name, code, address, phone, contact_person), shipment_items(*)',
    )
    .eq('id', shipmentId)
    .single();

  if (error) throw error;

  const shipment = data as unknown as ShipmentDocument;
  const shipmentItems = shipment.shipment_items ?? [];
  const rollIds = Array.from(
    new Set(
      shipmentItems
        .map((item) => item.finished_roll_id)
        .filter((rollId): rollId is string => !!rollId),
    ),
  );

  if (rollIds.length === 0) {
    return {
      ...shipment,
      shipment_items: shipmentItems.map((item) => ({
        ...item,
        roll_number: null,
        roll_length_m: null,
        warehouse_location: null,
      })),
    };
  }

  const { data: rolls, error: rollError } = await supabase
    .from('finished_fabric_rolls')
    .select('id, roll_number, color_name, length_m, warehouse_location')
    .in('id', rollIds);

  if (rollError) throw rollError;

  const rollMap = new Map(
    ((rolls ?? []) as FinishedRollDocumentRow[]).map((roll) => [roll.id, roll]),
  );

  return {
    ...shipment,
    shipment_items: shipmentItems.map((item) => {
      const roll = item.finished_roll_id
        ? rollMap.get(item.finished_roll_id)
        : undefined;
      return {
        ...item,
        color_name: item.color_name ?? roll?.color_name ?? null,
        roll_number: roll?.roll_number ?? null,
        roll_length_m: roll?.length_m ?? null,
        warehouse_location: roll?.warehouse_location ?? null,
      };
    }),
  };
}

/* ── List with filters + pagination ── */

export async function fetchShipmentsPaginated(
  filters: ShipmentsFilter = {},
  page = 1,
): Promise<PaginatedResult<Shipment>> {
  const from = (page - 1) * DEFAULT_PAGE_SIZE;
  const to = from + DEFAULT_PAGE_SIZE - 1;

  let query = supabase
    .from(HEADER_TABLE)
    .select(
      '*, orders(order_number), customers(name, code, address), delivery_staff:employees!shipments_delivery_staff_id_fkey(full_name:name, phone)',
      { count: 'exact' },
    )
    .order('shipment_date', { ascending: false })
    .range(from, to);

  if (filters.status) query = query.eq('status', filters.status);
  if (filters.orderId) query = query.eq('order_id', filters.orderId);
  if (filters.deliveryStaffId)
    query = query.eq('delivery_staff_id', filters.deliveryStaffId);
  if (filters.search?.trim()) {
    query = query.ilike('shipment_number', `%${filters.search.trim()}%`);
  }

  const { data, error, count } = await query;
  if (error) throw error;
  const total = count ?? 0;
  return {
    data: shipmentResponseSchema.array().parse(data ?? []) as Shipment[],
    total,
    page,
    pageSize: DEFAULT_PAGE_SIZE,
    totalPages: Math.ceil(total / DEFAULT_PAGE_SIZE),
  };
}

/* ── Fetch shipments by order ── */

export async function fetchShipmentsByOrder(
  orderId: string,
): Promise<Shipment[]> {
  const { data, error } = await supabase
    .from(HEADER_TABLE)
    .select('*, shipment_items(*)')
    .eq('order_id', orderId)
    .order('shipment_date', { ascending: false });
  if (error) throw error;
  return shipmentResponseSchema.array().parse(data ?? []) as Shipment[];
}

/* ── Generate next shipment number ── */

export async function fetchNextShipmentNumber(): Promise<string> {
  const { fetchNextDocNumber, monthlyPrefix } =
    await import('@/api/helpers/next-doc-number');
  return fetchNextDocNumber({
    table: 'shipments',
    column: 'shipment_number',
    prefix: monthlyPrefix('XK'),
  });
}

/* ── Available finished rolls for picking ── */

export async function fetchAvailableFinishedRolls(orderId?: string) {
  const { data: inStock, error: e1 } = await supabase
    .from('finished_fabric_rolls')
    .select(
      'id, roll_number, fabric_type, color_name, length_m, weight_kg, status',
    )
    .eq('status', 'in_stock')
    .order('roll_number');
  if (e1) throw e1;

  if (!orderId) return inStock ?? [];

  const { data: reserved, error: e2 } = await supabase
    .from('finished_fabric_rolls')
    .select(
      'id, roll_number, fabric_type, color_name, length_m, weight_kg, status',
    )
    .eq('status', 'reserved')
    .eq('reserved_for_order_id', orderId)
    .order('roll_number');
  if (e2) throw e2;

  return [...(reserved ?? []), ...(inStock ?? [])];
}

/* ── Create shipment ── */

export type ShipmentCreateInput = {
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
  items: {
    finishedRollId: string | null;
    fabricType: string;
    quantity: number;
  }[];
};

export async function createShipmentFull(
  input: ShipmentCreateInput,
): Promise<Shipment> {
  const selectedRollIds = input.items
    .map((item) => item.finishedRollId?.trim())
    .filter((id): id is string => !!id);
  const selectedRollMap = await fetchReservableRolls(selectedRollIds);

  const headerInsert = {
    shipment_number: input.shipmentNumber.trim(),
    order_id: input.orderId,
    customer_id: input.customerId,
    shipment_date: input.shipmentDate,
    delivery_address: input.deliveryAddress,
    delivery_staff_id: input.deliveryStaffId,
    employee_id: input.employeeId,
    shipping_rate_id: input.shippingRateId,
    shipping_cost: input.shippingCost,
    loading_fee: input.loadingFee,
    vehicle_info: input.vehicleInfo,
  };

  const itemsInsert = input.items.map((item, idx) => {
    const finishedRollId = item.finishedRollId?.trim() || null;
    const selectedRoll = finishedRollId
      ? selectedRollMap.get(finishedRollId)
      : undefined;
    return {
      finished_roll_id: finishedRollId,
      fabric_type: selectedRoll?.fabric_type ?? item.fabricType.trim(),
      color_name: selectedRoll?.color_name ?? null,
      quantity: item.quantity,
      unit: 'kg',
      sort_order: idx,
    };
  });

  const { data, error } = await untypedDb.rpc('rpc_create_shipment', {
    p_header: headerInsert,
    p_items: itemsInsert,
    p_reserve_roll_ids: selectedRollIds,
  });

  if (error) {
    if (error.message?.includes('ROLL_NOT_AVAILABLE'))
      throw new Error(
        'Mot hoac nhieu cuon thanh pham khong con san sang de xuat.',
      );
    throw error;
  }
  return data as unknown as Shipment;
}

/* ── Confirm shipment (preparing → shipped) ── */

export async function confirmShipmentFull(
  shipmentId: string,
): Promise<ShipmentDocument> {
  const { error } = await untypedDb.rpc('rpc_confirm_shipment', {
    p_shipment_id: shipmentId,
  });

  if (error) {
    if (error.message?.includes('SHIPMENT_NOT_PREPARING'))
      throw new Error('Phieu xuat khong o trang thai chuan bi.');
    throw error;
  }

  return fetchShipmentDocument(shipmentId);
}

/* ── Mark delivered ── */

export type DeliveryConfirmInput = {
  receiverName: string;
  receiverPhone: string | null;
  deliveryProof: string;
  notes: string | null;
  driverCommission: number | null;
  accountId: string | null;
  employeeId: string | null;
};

export async function markShipmentDelivered(
  shipmentId: string,
  values: DeliveryConfirmInput,
): Promise<void> {
  const { error } = await supabase
    .from(HEADER_TABLE)
    .update({
      status: 'delivered' as ShipmentStatus,
      delivered_at: new Date().toISOString(),
      receiver_name: values.receiverName.trim(),
      receiver_phone: values.receiverPhone?.trim() || null,
      delivery_proof: values.deliveryProof.trim(),
      notes: values.notes?.trim() || null,
    })
    .eq('id', shipmentId)
    .eq('status', 'shipped');
  if (error) throw error;

  // Auto-create expense record for driver commission if provided
  const commission = values.driverCommission ?? 0;
  if (commission > 0 && values.employeeId) {
    const { fetchNextDocNumber, monthlyPrefix } =
      await import('@/api/helpers/next-doc-number');
    const expenseNumber = await fetchNextDocNumber({
      table: 'expenses',
      column: 'expense_number',
      prefix: monthlyPrefix('PC'),
    });

    const { error: expError } = await untypedDb.rpc('rpc_create_expense', {
      p_data: {
        expense_number: expenseNumber,
        category: 'logistics',
        amount: commission,
        expense_date: new Date().toISOString().slice(0, 10),
        account_id: values.accountId || null,
        supplier_id: null,
        employee_id: values.employeeId,
        description: `Thu lào giao hàng — phiếu xuất #${shipmentId.slice(0, 8)}`,
        reference_number: shipmentId,
        notes: null,
      },
    });
    if (expError) throw expError;
  }
}

/* ── Assign delivery staff ── */

export async function assignDeliveryStaff(
  shipmentId: string,
  staffId: string,
  vehicleInfo?: string,
): Promise<void> {
  const { error } = await supabase
    .from(HEADER_TABLE)
    .update({
      delivery_staff_id: staffId,
      vehicle_info: vehicleInfo?.trim() || null,
    })
    .eq('id', shipmentId);
  if (error) throw error;
}

/* ── List delivery staff ── */

export async function fetchDeliveryStaff(): Promise<DeliveryStaffSummary[]> {
  const { data, error } = await supabase
    .from('employees')
    .select('id, full_name:name, phone')
    .eq('role', 'driver')
    .eq('status', 'active')
    .order('name');
  if (error) throw error;
  return (data ?? []) as DeliveryStaffSummary[];
}

/* ── Delete shipment (preparing only) ── */

export async function deleteShipmentFull(shipmentId: string): Promise<void> {
  const { error } = await untypedDb.rpc('rpc_delete_shipment', {
    p_shipment_id: shipmentId,
  });

  if (error) {
    if (error.message?.includes('SHIPMENT_NOT_PREPARING'))
      throw new Error('Chi co the xoa phieu xuat o trang thai chuan bi.');
    throw error;
  }
}
/* ── Create shipment from finished fabric rolls (calls atomic RPC) ── */

export async function createShipmentFromFinishedFabric(input: {
  customerId: string;
  shipmentDate: string;
  rollIds: string[];
}): Promise<string> {
  const { data, error } = await untypedDb.rpc(
    'create_shipment_from_finished_fabric',
    {
      p_customer_id: input.customerId,
      p_roll_ids: input.rollIds,
      p_shipment_date: input.shipmentDate,
    },
  );

  if (error) {
    if (error.message?.includes('NO_ROLLS_SELECTED')) {
      throw new Error('Vui lòng chọn ít nhất một cuộn vải để xuất kho.');
    }
    throw error;
  }

  // RPC returns SETOF TABLE, so data is an array of records
  const rows = data as Array<{ shipment_id: string }> | null;
  const result = rows?.[0];
  if (!result?.shipment_id) {
    throw new Error('Không nhận được mã phiếu xuất từ hệ thống');
  }

  return result.shipment_id;
}
