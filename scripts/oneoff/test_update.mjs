import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY
);

async function test() {
  // 1. Get receipt NS-034
  const { data: receipts, error: fetchErr } = await supabase
    .from('yarn_receipts')
    .select('*')
    .eq('receipt_number', 'NS-034');
  
  if (fetchErr || !receipts || receipts.length === 0) {
    console.error('Fetch error:', fetchErr);
    return;
  }
  const receipt = receipts[0];
  console.log('Found receipt:', receipt.id);

  // 2. Try to update it using rpc_update_yarn_receipt
  const headerUpdate = {
    receipt_number: receipt.receipt_number,
    supplier_id: receipt.supplier_id,
    receipt_date: receipt.receipt_date,
    notes: receipt.notes,
    total_amount: receipt.total_amount,
    vehicle_info: receipt.vehicle_info,
    additional_fees: receipt.additional_fees,
    tenant_id: receipt.tenant_id
  };

  const { data: items, error: itemErr } = await supabase
    .from('yarn_receipt_items')
    .select('*')
    .eq('receipt_id', receipt.id);

  const itemsInsert = (items || []).map(item => ({
    yarn_type: item.yarn_type,
    color_name: item.color_name,
    unit: item.unit,
    quantity: item.quantity,
    unit_price: item.unit_price,
    lot_number: item.lot_number,
    grade: item.grade,
    tensile_strength: item.tensile_strength,
    composition: item.composition,
    origin: item.origin,
    yarn_catalog_id: item.yarn_catalog_id,
    sort_order: item.sort_order,
  }));

  const payload = {
    p_id: receipt.id,
    p_header: headerUpdate,
    p_items: itemsInsert,
    p_expected_updated_at: receipt.updated_at,
  };

  const { error: updateErr } = await supabase.rpc('rpc_update_yarn_receipt', payload);
  if (updateErr) {
    console.error('Update Error:', updateErr);
  } else {
    console.log('Update Success!');
  }
}
test();
