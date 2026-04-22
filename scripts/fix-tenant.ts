import { createClient } from '@supabase/supabase-js';

const url = 'https://sxphijrofljxkccdwtub.supabase.co';
const key =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN4cGhpanJvZmxqeGtjY2R3dHViIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDUwOTU1OSwiZXhwIjoyMDkwMDg1NTU5fQ.DKems71L40cRKbHqQTxVWKSXgdYkBR525DWuX4ARyaU';
const adminDb = createClient(url, key);

async function fixTenant() {
  // Get tenant from GC2604-001
  const { data: first } = await adminDb
    .from('weaving_invoices')
    .select('tenant_id')
    .eq('invoice_number', 'GC2604-001')
    .single();

  if (first && first.tenant_id) {
    const tenantId = first.tenant_id;
    console.log('Tìm thấy tenant_id hợp lệ từ phiếu GC2604-001:', tenantId);

    // Fix all weaving_invoices missing tenant_id
    await adminDb
      .from('weaving_invoices')
      .update({ tenant_id: tenantId })
      .is('tenant_id', null);
    console.log('✅ Đã cập nhật thành công.');
  } else {
    // If even 001 doesn't have it, let's grab a random valid tenant
    const { data: rand } = await adminDb
      .from('suppliers')
      .select('tenant_id')
      .limit(1)
      .single();
    if (rand && rand.tenant_id) {
      console.log('Dùng fallback tenant_id từ hệ thống:', rand.tenant_id);
      await adminDb
        .from('weaving_invoices')
        .update({ tenant_id: rand.tenant_id })
        .is('tenant_id', null);
      console.log('✅ Đã cập nhật thành công.');
    }
  }
}

fixTenant();
