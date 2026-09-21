import { createClient } from '@supabase/supabase-js';

const url = 'https://sxphijrofljxkccdwtub.supabase.co';
const key =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN4cGhpanJvZmxqeGtjY2R3dHViIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDUwOTU1OSwiZXhwIjoyMDkwMDg1NTU5fQ.DKems71L40cRKbHqQTxVWKSXgdYkBR525DWuX4ARyaU';
const adminDb = createClient(url, key);

async function checkFinance() {
  const { data: supplier } = await adminDb
    .from('suppliers')
    .select('id, name')
    .eq('code', 'NCC-011')
    .single();
  console.log('Supplier:', supplier);

  if (supplier) {
    const { data: exp } = await adminDb
      .from('expenses')
      .select('*')
      .eq('supplier_id', supplier.id);
    console.log('Expenses:', exp);

    // Also check v_supplier_debt specifically
    const { data: debt } = await adminDb
      .from('v_supplier_debt')
      .select('*')
      .eq('supplier_id', supplier.id);
    console.log('Supplier Debt view:', debt);
  }
}

checkFinance();
