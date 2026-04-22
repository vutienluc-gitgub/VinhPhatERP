import { createClient } from '@supabase/supabase-js';

const url = 'https://sxphijrofljxkccdwtub.supabase.co';
const key =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN4cGhpanJvZmxqeGtjY2R3dHViIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDUwOTU1OSwiZXhwIjoyMDkwMDg1NTU5fQ.DKems71L40cRKbHqQTxVWKSXgdYkBR525DWuX4ARyaU';
const adminDb = createClient(url, key);

async function checkInvoice() {
  const { data, error } = await adminDb
    .from('weaving_invoices')
    .select('id, invoice_number, invoice_date, status, created_at, tenant_id')
    .ilike('invoice_number', 'GC26%');

  if (error) {
    console.error('Lỗi:', error);
  } else {
    // Exact check for GC2604-003
    const exists = data.find((d) => d.invoice_number === 'GC2604-003');
    if (exists) {
      console.log('✅ Đã tìm thấy trên Database:', exists);
    } else {
      console.log('❌ KHÔNG tìm thấy phiếu GC2604-003 trong cơ sở dữ liệu.');
    }

    console.log(`\n⚠️ Hiện tại có tổng cộng ${data.length} phiếu GC26...`);
    if (data.length > 0) {
      console.log('Dưới đây là danh sách toàn bộ các phiếu đã lưu:');
      console.table(
        data.map((d) => ({
          invoice_number: d.invoice_number,
          status: d.status,
          date: d.invoice_date,
        })),
      );
    }
  }
}

checkInvoice();
