import { createClient } from '@supabase/supabase-js';

const url = 'https://sxphijrofljxkccdwtub.supabase.co';
const key =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN4cGhpanJvZmxqeGtjY2R3dHViIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDUwOTU1OSwiZXhwIjoyMDkwMDg1NTU5fQ.DKems71L40cRKbHqQTxVWKSXgdYkBR525DWuX4ARyaU';
const db = createClient(url, key);

async function testFetch() {
  const { data: inv } = await db
    .from('weaving_invoices')
    .select('id, invoice_number')
    .eq('invoice_number', 'GC2604-002')
    .single();
  if (inv) {
    const { data: fullInvoice, error } = await db
      .from('weaving_invoices')
      .select('*, suppliers(name, code), weaving_invoice_rolls(*)')
      .eq('id', inv.id)
      .single();

    console.log('Full Invoice keys:', Object.keys(fullInvoice || {}));
    if (fullInvoice && fullInvoice.weaving_invoice_rolls) {
      console.log(
        'Number of rolls fetched:',
        fullInvoice.weaving_invoice_rolls.length,
      );
    } else {
      console.log('FAILED to fetch rolls! Error:', error);
    }
  }
}
testFetch();
