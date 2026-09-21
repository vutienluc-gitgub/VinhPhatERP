import { createClient } from '@supabase/supabase-js';

const url = 'https://sxphijrofljxkccdwtub.supabase.co';
const key =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN4cGhpanJvZmxqeGtjY2R3dHViIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDUwOTU1OSwiZXhwIjoyMDkwMDg1NTU5fQ.DKems71L40cRKbHqQTxVWKSXgdYkBR525DWuX4ARyaU';
const adminDb = createClient(url, key);

async function check001() {
  const { data: inv } = await adminDb
    .from('weaving_invoices')
    .select('id, invoice_number, total_amount, paid_amount')
    .eq('invoice_number', 'GC2604-001')
    .single();
  console.log('=== THỰC TRẠNG PHIẾU GIA CÔNG 001 ===');
  console.log(inv);

  const { data: exps } = await adminDb
    .from('expenses')
    .select('expense_number')
    .in('expense_number', ['PC2604-0019', 'PC2604-0020', 'PC2604-0021']);
  console.log('Các phiếu chi rác còn lại trong Database:', exps);
}
check001();
