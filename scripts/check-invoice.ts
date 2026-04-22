import { untypedDb as db } from '@/services/supabase/untyped';

async function checkInvoice() {
  const { data, error } = await db
    .from('weaving_invoices')
    .select('id, invoice_number, invoice_date, status, created_at')
    .eq('invoice_number', 'GC2604-003');

  if (error) {
    console.error('Lỗi:', error);
  } else {
    if (data && data.length > 0) {
      console.log('✅ Đã tìm thấy trên Database:', data);
    } else {
      console.log('❌ KHÔNG tìm thấy phiếu GC2604-003 trong cơ sở dữ liệu.');

      // Let's also print ALL invoices to see what is currently in there
      const { data: all } = await db
        .from('weaving_invoices')
        .select('invoice_number')
        .order('created_at', { ascending: false })
        .limit(5);
      console.log('⚠️ 5 phiếu được tạo gần đây nhất là:');
      console.table(all);
    }
  }
}

checkInvoice();
