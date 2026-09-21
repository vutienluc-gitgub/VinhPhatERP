import { createClient } from '@supabase/supabase-js';

const url = 'https://sxphijrofljxkccdwtub.supabase.co';
const key =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN4cGhpanJvZmxqeGtjY2R3dHViIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDUwOTU1OSwiZXhwIjoyMDkwMDg1NTU5fQ.DKems71L40cRKbHqQTxVWKSXgdYkBR525DWuX4ARyaU';
const adminDb = createClient(url, key);

async function checkStatus() {
  const { data: inv } = await adminDb
    .from('weaving_invoices')
    .select('id, invoice_number, paid_amount')
    .eq('invoice_number', 'GC2604-001')
    .single();
  console.log('Invoice 001:', inv);

  const { data: allocs } = await adminDb
    .from('expense_allocations')
    .select('*');
  console.log('All Allocations:', allocs);

  const { data: exps } = await adminDb
    .from('expenses')
    .select('id, expense_number');
  console.log('All Expenses:', exps);
}
checkStatus();
