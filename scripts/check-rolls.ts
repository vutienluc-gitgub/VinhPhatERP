import { createClient } from '@supabase/supabase-js';

const url = 'https://sxphijrofljxkccdwtub.supabase.co';
const key =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN4cGhpanJvZmxqeGtjY2R3dHViIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDUwOTU1OSwiZXhwIjoyMDkwMDg1NTU5fQ.DKems71L40cRKbHqQTxVWKSXgdYkBR525DWuX4ARyaU';
const adminDb = createClient(url, key);

async function checkRolls() {
  const { data: inv } = await adminDb
    .from('weaving_invoices')
    .select('id, invoice_number')
    .eq('invoice_number', 'GC2604-002')
    .single();
  if (inv) {
    console.log('Invoice ID:', inv.id);
    const { data: rolls } = await adminDb
      .from('weaving_invoice_rolls')
      .select('*')
      .eq('invoice_id', inv.id);
    console.log('Tìm thấy', rolls?.length, 'cuộn cho GC2604-002');
    console.log('Chi tiết:', rolls);
  }
}
checkRolls();
