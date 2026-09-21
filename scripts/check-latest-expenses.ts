import { createClient } from '@supabase/supabase-js';

const url = 'https://sxphijrofljxkccdwtub.supabase.co';
const key =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN4cGhpanJvZmxqeGtjY2R3dHViIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDUwOTU1OSwiZXhwIjoyMDkwMDg1NTU5fQ.DKems71L40cRKbHqQTxVWKSXgdYkBR525DWuX4ARyaU';
const adminDb = createClient(url, key);

async function checkLatest() {
  console.log('=== KIỂM TRA PHIẾU CHI 0020 VÀ 0021 ===');
  const { data: exps } = await adminDb
    .from('expenses')
    .select('id, expense_number, amount')
    .in('expense_number', ['PC2604-0020', 'PC2604-0021']);

  console.log('Phiếu chi:', exps);

  if (exps && exps.length > 0) {
    const expIds = exps.map((e) => e.id);
    const { data: allocs } = await adminDb
      .from('expense_allocations')
      .select('*')
      .in('expense_id', expIds);
    console.log('Móc nối (Allocations):', allocs);

    if (allocs && allocs.length > 0) {
      const docIds = allocs.map((a) => a.document_id);
      const { data: invs } = await adminDb
        .from('weaving_invoices')
        .select('id, invoice_number, total_amount, paid_amount')
        .in('id', docIds);
      console.log('Tình trạng Phiếu Gia Công Đích:', invs);
    } else {
      console.log('LƯU Ý: KHÔNG CÓ BẤT KỲ MÓC NỐI NÀO (ALLOCATIONS TRỐNG)!');
    }
  }
}
checkLatest();
