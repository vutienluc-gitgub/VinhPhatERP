import { createClient } from '@supabase/supabase-js';

const url = 'https://sxphijrofljxkccdwtub.supabase.co';
const key =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN4cGhpanJvZmxqeGtjY2R3dHViIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDUwOTU1OSwiZXhwIjoyMDkwMDg1NTU5fQ.DKems71L40cRKbHqQTxVWKSXgdYkBR525DWuX4ARyaU';
const adminDb = createClient(url, key);

async function proveIt() {
  console.log('=== BẮT ĐẦU CHỨNG MINH KẾT NỐI (PROVE ALLOCATION) ===\n');

  // 1. Tìm Phiếu Weaving GC2604-001
  const { data: inv } = await adminDb
    .from('weaving_invoices')
    .select(
      'id, invoice_number, total_amount, paid_amount, payment_status, tenant_id',
    )
    .eq('invoice_number', 'GC2604-001')
    .single();
  console.log('1. Trước khi móc nối, Phiếu Gia Công hiện trạng:');
  console.log(inv);

  // 2. Tìm Phiếu chi PC2604-0019 (khoản chi 4177600) đã tạo hồi trưa
  const { data: exp } = await adminDb
    .from('expenses')
    .select('id, expense_number, amount')
    .eq('expense_number', 'PC2604-0019')
    .single();
  console.log('\n2. Phiếu chi trôi nổi (chưa móc nối):', exp);

  if (exp && inv) {
    console.log(
      '\n3. THỰC THI: Móc nối 2 phiếu lại với nhau vào bảng expense_allocations...',
    );
    const { error: allocErr } = await adminDb
      .from('expense_allocations')
      .insert({
        expense_id: exp.id,
        document_type: 'weaving_invoice',
        document_id: inv.id,
        allocated_amount: 4177600,
        tenant_id: inv.tenant_id,
      });

    if (allocErr) {
      console.error('Lỗi khi móc nối:', allocErr);
    } else {
      console.log(
        '✅ Đã chèn dữ liệu móc nối thành công! Đợi Database Trigger phản ứng...',
      );

      // 4. Kiểm tra lại Phiếu Gia Công
      const { data: invAfter } = await adminDb
        .from('weaving_invoices')
        .select('id, invoice_number, total_amount, paid_amount, payment_status')
        .eq('invoice_number', 'GC2604-001')
        .single();

      console.log(
        '\n4. Kết quả KỲ DIỆU: Tình trạng Phiếu Gia Công SAU KHI móc nối:',
      );
      console.log(invAfter);

      if (
        invAfter.paid_amount === 4177600 &&
        invAfter.payment_status === 'paid'
      ) {
        console.log(
          '\n🎉 HOÀN HẢO! Database Trigger (trg_update_document_paid_amount) đã tự động bơm tiền và chốt sổ (Paid) thành công!',
        );
      }
    }
  }
}

proveIt();
