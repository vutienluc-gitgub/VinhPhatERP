import type { OrderStatus } from '@/schema/order.schema';
import type {
  Order,
  OrderInsert,
  OrderUpdate,
  OrderItemInsert,
  OrdersFilter,
} from '@/features/orders/types';
import { supabase } from '@/services/supabase/client';
import type { Database } from '@/services/supabase/database.types';
import type { PaginatedResult } from '@/shared/types/pagination';
import { DEFAULT_PAGE_SIZE } from '@/shared/types/pagination';
import { orderResponseSchema } from '@/schema/order.schema';
import { untypedDb } from '@/services/supabase/untyped';

const HEADER_TABLE = 'orders';

type DbOrderStatus = Database['public']['Enums']['order_status'];

/* ── Fetch list with pagination ── */

export async function fetchOrdersPaginated(
  filters: OrdersFilter = {},
  page = 1,
): Promise<PaginatedResult<Order>> {
  const from = (page - 1) * DEFAULT_PAGE_SIZE;
  const to = from + DEFAULT_PAGE_SIZE - 1;

  let query = supabase
    .from(HEADER_TABLE)
    .select(
      '*, customers(name, code), quotations!source_quotation_id(quotation_number)',
      { count: 'exact' },
    )
    .order('order_date', { ascending: false })
    .range(from, to);

  if (filters.status) query = query.eq('status', filters.status);
  if (filters.customerId) query = query.eq('customer_id', filters.customerId);
  if (filters.search?.trim()) {
    const term = filters.search.trim();
    const { data: cus } = await supabase
      .from('customers')
      .select('id')
      .ilike('name', `%${term}%`);
    const cIds = cus?.map((c) => c.id) || [];
    if (cIds.length > 0) {
      query = query.or(
        `order_number.ilike.%${term}%,customer_id.in.(${cIds.join(',')})`,
      );
    } else {
      query = query.or(`order_number.ilike.%${term}%`);
    }
  }

  const { data, error, count } = await query;
  if (error) throw error;
  const total = count ?? 0;
  return {
    data: orderResponseSchema.array().parse(data ?? []) as Order[],
    total,
    page,
    pageSize: DEFAULT_PAGE_SIZE,
    totalPages: Math.ceil(total / DEFAULT_PAGE_SIZE),
  };
}

/* ── Fetch all (no pagination, for kanban etc.) ── */

export async function fetchOrders(
  filters: OrdersFilter = {},
): Promise<Order[]> {
  let query = supabase
    .from(HEADER_TABLE)
    .select('*, customers(name, code)')
    .order('order_date', { ascending: false });

  if (filters.status) query = query.eq('status', filters.status);
  if (filters.customerId) query = query.eq('customer_id', filters.customerId);
  if (filters.search?.trim()) {
    const term = filters.search.trim();
    const { data: cus } = await supabase
      .from('customers')
      .select('id')
      .ilike('name', `%${term}%`);
    const cIds = cus?.map((c) => c.id) || [];
    if (cIds.length > 0) {
      query = query.or(
        `order_number.ilike.%${term}%,customer_id.in.(${cIds.join(',')})`,
      );
    } else {
      query = query.or(`order_number.ilike.%${term}%`);
    }
  }

  const { data, error } = await query;
  if (error) throw error;
  return orderResponseSchema.array().parse(data ?? []) as Order[];
}

/* ── Single order by ID ── */

export async function fetchOrderById(id: string): Promise<Order> {
  const { data, error } = await supabase
    .from(HEADER_TABLE)
    .select(
      '*, customers(name, code), quotations!source_quotation_id(quotation_number), order_items(*)',
    )
    .eq('id', id)
    .single();
  if (error) throw error;
  return orderResponseSchema.parse(data) as Order;
}

/* ── Generate next order number ── */

export async function fetchNextOrderNumber(): Promise<string> {
  const { fetchNextDocNumber, monthlyPrefix } =
    await import('@/api/helpers/next-doc-number');
  return fetchNextDocNumber({
    table: 'orders',
    column: 'order_number',
    prefix: monthlyPrefix('DH'),
  });
}

/* ── Create order (header + items) ── */

export async function createOrder(
  header: OrderInsert,
  items: Omit<OrderItemInsert, 'order_id'>[],
): Promise<Order> {
  const { data, error } = await untypedDb.rpc('atomic_create_order', {
    p_header: header,
    p_items: items,
  });

  if (error) throw error;

  return data as unknown as Order;
}

/* ── Update order header ── */

export async function updateOrder(
  id: string,
  row: OrderUpdate,
): Promise<Order> {
  const { data, error } = await supabase
    .from(HEADER_TABLE)
    .update(row)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as Order;
}

/* ── Update order header + replace items ── */

export async function updateOrderWithItems(
  id: string,
  header: OrderUpdate,
  items: Omit<OrderItemInsert, 'order_id'>[],
): Promise<void> {
  const { error } = await supabase.rpc('update_order_with_items', {
    p_order_id: id,
    p_header_data: header,
    p_items_data: items,
  });
  if (error) throw error;
}

/* ── Delete order ── */

export async function deleteOrder(id: string): Promise<void> {
  const { error } = await supabase.from(HEADER_TABLE).delete().eq('id', id);
  if (error) throw error;
}

/* ── Update order status (used by Kanban) ── */

export async function updateOrderStatus(
  id: string,
  status: DbOrderStatus,
): Promise<void> {
  const { error } = await supabase
    .from(HEADER_TABLE)
    .update({ status })
    .eq('id', id);
  if (error) throw error;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    await supabase.from('business_audit_log').insert({
      entity_type: 'orders',
      entity_id: id,
      event_type: 'ORDER_STATUS_CHANGED',
      payload: {
        new_status: status,
        action: 'update_status',
      },
      user_id: user.id,
    });
  }
}

/* ── Confirm order: recalculate total, update status, create progress rows ── */

export async function confirmOrder(orderId: string): Promise<void> {
  const { error } = await supabase.rpc('confirm_order', {
    p_order_id: orderId,
  });
  if (error) throw error;
}

/* ── Create and confirm order ── */

export async function createAndConfirmOrder(
  header: OrderInsert,
  items: Omit<OrderItemInsert, 'order_id'>[],
): Promise<Order> {
  const order = await createOrder(
    {
      ...header,
      status: 'draft',
    },
    items,
  );
  await confirmOrder(order.id);
  return order;
}

/* ── Cancel order: release reserved rolls → cancel ── */

export async function cancelOrder(orderId: string): Promise<void> {
  const { error } = await untypedDb.rpc('atomic_cancel_order', {
    p_order_id: orderId,
  });
  if (error) throw error;
}

/* ── Complete order ── */

export async function completeOrder(orderId: string): Promise<void> {
  const { error } = await supabase
    .from(HEADER_TABLE)
    .update({ status: 'completed' as OrderStatus })
    .eq('id', orderId);
  if (error) throw error;
}

/* ── Edge Function: get session token ── */

export async function getAccessToken(): Promise<string> {
  const { data } = await supabase.auth.getSession();
  return data?.session?.access_token ?? '';
}

/* ── Edge Function: invoke create-order ── */

export async function invokeCreateOrderFunction<TResult>(
  payload: Record<string, unknown>,
  token: string,
): Promise<TResult> {
  const { data, error } = await supabase.functions.invoke<TResult>(
    'create-order',
    {
      body: payload,
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    },
  );
  if (error) throw error;
  return data as TResult;
}

/* ── Fetch Audit Logs for Order ── */

export async function fetchOrderAuditLogs(orderId: string) {
  const { data, error } = await supabase
    .from('business_audit_log')
    .select(
      `
      id,
      created_at,
      event_type,
      payload,
      user_id,
      profiles!business_audit_log_user_id_fkey(full_name, role)
    `,
    )
    .eq('entity_type', 'orders')
    .eq('entity_id', orderId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}
