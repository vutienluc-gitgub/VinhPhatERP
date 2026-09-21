import { createClient } from '@supabase/supabase-js';

const url = 'https://sxphijrofljxkccdwtub.supabase.co';
const key =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN4cGhpanJvZmxqeGtjY2R3dHViIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDUwOTU1OSwiZXhwIjoyMDkwMDg1NTU5fQ.DKems71L40cRKbHqQTxVWKSXgdYkBR525DWuX4ARyaU';
const adminDb = createClient(url, key);

async function cleanExps() {
  const { error } = await adminDb
    .from('expenses')
    .delete()
    .in('expense_number', ['PC2604-0019', 'PC2604-0020']);
  if (error) {
    console.error('Error deleting:', error);
  } else {
    console.log('Successfully deleted 0019 and 0020!');
  }

  const { data: inv } = await adminDb
    .from('weaving_invoices')
    .select('invoice_number, paid_amount')
    .eq('invoice_number', 'GC2604-001')
    .single();
  console.log('After cleanup, GC2604-001 status:', inv);
}
cleanExps();
