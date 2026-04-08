import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function createReservedWorkOrder() {
  // 1. Pick a customer (first one)
  const { data: customer, error: custErr } = await supabase
    .from('customers')
    .select('id')
    .limit(1)
    .single();
  if (custErr) throw custErr;
  const customerId = customer.id;

  // 2. Create a draft order
  const now = new Date();
  const orderNumber = `DH${now.getFullYear().toString().slice(-2)}${(now.getMonth() + 1).toString().padStart(2, '0')}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
  const { data: order, error: orderErr } = await supabase
    .from('orders')
    .insert({
      order_number: orderNumber,
      customer_id: customerId,
      order_date: now.toISOString().split('T')[0],
      status: 'draft',
      total_amount: 0,
      paid_amount: 0,
    })
    .select('id')
    .single();
  if (orderErr) throw orderErr;
  console.log('Created draft order', order.id);

  // 3. Confirm the order (set status to confirmed)
  const { error: confirmErr } = await supabase
    .from('orders')
    .update({ status: 'confirmed' })
    .eq('id', order.id);
  if (confirmErr) throw confirmErr;
  console.log('Order confirmed');

  // 4. Pick a BOM template (first one)
  const { data: bom, error: bomErr } = await supabase
    .from('bom_templates')
    .select('id, active_version')
    .limit(1)
    .single();
  if (bomErr) throw bomErr;

  // 5. Create a reserved work order linked to the order
  const workOrderNumber = `WO-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
  const { data: wo, error: woErr } = await supabase
    .from('work_orders')
    .insert({
      work_order_number: workOrderNumber,
      order_id: order.id,
      bom_template_id: bom.id,
      bom_version: bom.active_version || 1,
      target_quantity_m: 0,
      target_unit: 'm',
      status: 'draft',
    })
    .select('work_order_number')
    .single();
  if (woErr) throw woErr;
  console.log('Created reserved work order', wo.work_order_number);
}

createReservedWorkOrder().catch((e) => console.error('Error:', e));
