/* eslint-disable no-restricted-syntax */
import 'dotenv/config';

import postgres from 'postgres';

async function check() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error('DATABASE_URL is missing.');
    process.exit(1);
  }

  const sql = postgres(dbUrl, { max: 1, connect_timeout: 10, ssl: 'require' });
  const msgId = 'b6864f9f-7ea7-47fb-9b77-4a3ad988ea97';
  const customerUserId = '6c8cc401-487d-4468-8aa7-fe2997093767'; // Nguyễn Thị Thắm (Monz brand)
  const roomId = 'dd46feb3-3afa-45cc-a4f6-7420c583a90b';

  try {
    console.log('=== 1. KIỂM TRA RECIPIENTS ĐƯỢC RESOLVE TỪ TIN NHẮN "0" ===');
    const [{ recipients }] = await sql`
      SELECT public.fn_resolve_chat_notification_recipients(${msgId}::uuid) AS recipients;
    `;
    console.log('Recipients:', recipients);
    const hasCustomer =
      Array.isArray(recipients) && recipients.includes(customerUserId);
    console.log(
      'Customer Thắm có trong danh sách nhận thông báo:',
      hasCustomer ? '✅ CÓ' : '❌ KHÔNG',
    );

    console.log('\n=== 2. KIỂM TRA UNREAD_COUNT CỦA CUSTOMER TRONG PHÒNG ===');
    const [part] = await sql`
      SELECT user_id, role, unread_count, last_read_at 
      FROM public.chat_room_participants 
      WHERE room_id = ${roomId}::uuid AND user_id = ${customerUserId}::uuid;
    `;
    console.log('Participant customer:', part);

    console.log('\n=== 3. CÁC CỘT TRONG BẢNG PUSH_SUBSCRIPTIONS ===');
    const cols = await sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'push_subscriptions';
    `;
    console.log(
      'Columns:',
      cols.map((c) => c.column_name),
    );

    console.log(
      '\n=== 4. CÁC SUBSCRIPTION CỦA CUSTOMER TRONG PUSH_SUBSCRIPTIONS ===',
    );
    const subs = await sql`
      SELECT * 
      FROM public.push_subscriptions 
      WHERE user_id = ${customerUserId}::uuid;
    `;
    console.log('Customer subscriptions count:', subs.length);
    console.log('Customer subscriptions data:', subs);

    console.log(
      '\n=== 5. KIỂM TRA TOÀN BỘ SUBSCRIPTION TRONG BẢNG PUSH_SUBSCRIPTIONS ===',
    );
    const allSubs = await sql`
      SELECT id, user_id, platform, browser, endpoint, revoked_at, created_at 
      FROM public.push_subscriptions 
      LIMIT 5;
    `;
    console.log('Tổng số subscription mẫu:', allSubs);

    console.log('\n=== 6. KIỂM TRA CÓ TIN NHẮN MỚI TỪ CUSTOMER CHƯA ===');
    const newMsgs = await sql`
      SELECT id, sender_id, content, created_at
      FROM public.chat_messages
      WHERE room_id = ${roomId}::uuid
      ORDER BY created_at DESC
      LIMIT 5;
    `;
    console.log('5 tin nhắn gần nhất trong phòng:', newMsgs);
  } catch (err) {
    console.error('Lỗi khi kiểm tra:', err);
  } finally {
    await sql.end();
  }
}

check();
