import { supabase } from '@/services/supabase/client'
import type { Shipment, ShipmentInsert, ShipmentUpdate, ShipmentItemInsert, ShipmentsFilter } from '@/models'

const TABLE = 'shipments'
const ITEMS_TABLE = 'shipment_items'

export async function fetchShipments(filters: ShipmentsFilter = {}): Promise<Shipment[]> {
  let query = supabase
    .from(TABLE)
    .select('*, orders(order_number), customers(name, code), shipment_items(*)')
    .order('shipment_date', { ascending: false })

  if (filters.status) query = query.eq('status', filters.status)
  if (filters.orderId) query = query.eq('order_id', filters.orderId)
  if (filters.search?.trim()) {
    query = query.ilike('shipment_number', `%${filters.search.trim()}%`)
  }

  const { data, error } = await query
  if (error) throw error
  return (data ?? []) as unknown as Shipment[]
}

export async function createShipment(
  header: ShipmentInsert,
  items: ShipmentItemInsert[],
): Promise<Shipment> {
  const { data, error: headerErr } = await supabase
    .from(TABLE)
    .insert(header)
    .select()
    .single()

  if (headerErr) throw headerErr

  const headerId = (data as Shipment).id
  const itemsWithShipmentId = items.map((item) => ({
    ...item,
    shipment_id: headerId,
  }))

  const { error: itemsErr } = await supabase
    .from(ITEMS_TABLE)
    .insert(itemsWithShipmentId)

  if (itemsErr) {
    await supabase.from(TABLE).delete().eq('id', headerId)
    throw itemsErr
  }

  return data as Shipment
}

export async function updateShipment(id: string, row: ShipmentUpdate): Promise<Shipment> {
  const { data, error } = await supabase
    .from(TABLE)
    .update(row)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data as Shipment
}

export async function deleteShipment(id: string): Promise<void> {
  const { error } = await supabase.from(TABLE).delete().eq('id', id)
  if (error) throw error
}
