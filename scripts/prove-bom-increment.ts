import * as dotenv from 'dotenv';

import { untypedDb } from '@/services/supabase/untyped';
dotenv.config({ path: '.env.local' });

async function proveBomAutoIncrement() {
  console.log('\n=============================================');
  console.log('🚀 KIỂM CHỨNG CƠ CHẾ AUTO-INCREMENT BẰNG UNTYPED TRÊN DB');
  console.log('=============================================\n');

  // 1. Lấy mã BOM đầu tiên đang tồn tại trong Database
  const { data: firstBom } = await untypedDb
    .from('bom_templates')
    .select('code, tenant_id')
    .limit(1)
    .single();

  if (!firstBom) {
    console.log('Chưa có BOM nào trong DB để kiểm tra.');
    return;
  }

  // Để an toàn, chúng ta giả lập base code giống y hệt mã gốc
  // (Tức là chắc chắn mã gốc đang tồn tại)
  // Nếu baseCode đã có hậu tố, ta cứ dùng luôn làm giả thiết xấu nhất
  const baseCode = firstBom.code || 'BOM-TEST-XXX';
  const tenantId = firstBom.tenant_id;

  console.log(`[+] Mã gốc đã khóa trên hệ thống: "${baseCode}"\n`);

  let finalCode = baseCode;
  let counter = 1;
  let exists = true;

  // 2. Chạy vòng lặp chuẩn y như code API hiện tại
  while (exists) {
    console.log(`[?] Đang dùng untypedDb dò tìm mã: ${finalCode}`);
    const { data: existing, error } = await untypedDb
      .from('bom_templates')
      .select('id')
      .eq('tenant_id', tenantId)
      .eq('code', finalCode)
      .maybeSingle();

    if (error) {
      console.log('LỖI DB:', error);
      return;
    }

    if (!existing) {
      console.log(
        `✅ KẾT QUẢ: Mã "${finalCode}" TRỐNG. HOÀN TOÀN AN TOÀN ĐỂ INSERT!`,
      );
      exists = false;
      break;
    }

    console.log(
      `❌ BỊ TRÙNG! Mã "${finalCode}" đang được dùng. Đẩy hậu tố lên...`,
    );
    counter++;
    finalCode = `${baseCode}-${counter.toString().padStart(2, '0')}`;
  }

  console.log('\n=============================================');
  console.log('🎉 Bài test kết thúc tốt đẹp!');
}

proveBomAutoIncrement();
