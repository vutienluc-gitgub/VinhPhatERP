import { createClient } from '@supabase/supabase-js';

const url = 'https://sxphijrofljxkccdwtub.supabase.co';
const key =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN4cGhpanJvZmxqeGtjY2R3dHViIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDUwOTU1OSwiZXhwIjoyMDkwMDg1NTU5fQ.DKems71L40cRKbHqQTxVWKSXgdYkBR525DWuX4ARyaU';
const adminDb = createClient(url, key);

async function fixRollsTenant() {
  const { data: invs } = await adminDb
    .from('weaving_invoices')
    .select('id, tenant_id');
  if (invs) {
    for (const inv of invs) {
      if (inv.tenant_id) {
        const { error } = await adminDb
          .from('weaving_invoice_rolls')
          .update({ tenant_id: inv.tenant_id })
          .eq('invoice_id', inv.id)
          .is('tenant_id', null);
        if (error) console.error('Error for invoice_id', inv.id, error);
      }
    }
    console.log('Xong update tenant_id cho weaving_invoice_rolls!');
  }
}
fixRollsTenant();
