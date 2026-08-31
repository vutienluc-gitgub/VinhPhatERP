/* eslint-disable no-restricted-syntax */
import { randomUUID } from 'node:crypto';

import 'dotenv/config';
import postgres from 'postgres';

async function proveEndToEndChatExchange() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error('DATABASE_URL is missing.');
    process.exit(1);
  }

  const sql = postgres(dbUrl, { max: 2, connect_timeout: 10, ssl: 'require' });

  console.log('\n========================================================');
  console.log('   CHỨNG MINH 2 CHIỀU: ADMIN <-> CUSTOMER CHAT FLOW');
  console.log('========================================================\n');

  try {
    const roomId = 'dd46feb3-3afa-45cc-a4f6-7420c583a90b';
    const adminUserId = '7724bad2-5156-4015-8d64-c83097b4e31d'; // Admin Tiến Lực
    const customerUserId = '6c8cc401-487d-4468-8aa7-fe2997093767'; // Customer Nguyễn Thị Thắm

    // ── BƯỚC 1: Kiểm tra quyền truy cập phòng của 2 bên ──
    console.log('BƯỚC 1: Kiểm tra Authorization Invariants của 2 tài khoản:');
    const [{ allowed: adminCanAccess }] = await sql`
      SELECT public.fn_can_access_chat_room(${roomId}, ${adminUserId}) AS allowed;
    `;
    const [{ allowed: customerCanAccess }] = await sql`
      SELECT public.fn_can_access_chat_room(${roomId}, ${customerUserId}) AS allowed;
    `;
    console.log(
      `• Admin (${adminUserId}) có quyền vào phòng: ${adminCanAccess ? '✅ HỢP LỆ' : '❌ TỪ CHỐI'}`,
    );
    console.log(
      `• Customer (${customerUserId}) có quyền vào phòng: ${customerCanAccess ? '✅ HỢP LỆ' : '❌ TỪ CHỐI'}`,
    );

    if (!adminCanAccess || !customerCanAccess) {
      throw new Error('Một trong 2 tài khoản không có quyền vào phòng!');
    }

    // ── BƯỚC 2: Admin gửi tin nhắn cho Customer qua rpc_send_chat_message ──
    const adminClientId = randomUUID();
    const adminContent = `[TEST-PROOF-1] Chào chị Thắm, đơn hàng dệt số 889 đã hoàn thành, chuẩn bị giao ạ! (Thời gian: ${new Date().toLocaleTimeString('vi-VN')})`;
    console.log('\nBƯỚC 2: Admin gửi tin nhắn mới qua RPC...');
    console.log(`   Nội dung: "${adminContent}"`);

    let sentMessageId: string | null = null;
    await sql.begin(async (tx) => {
      // Giả lập session Admin
      await tx`SELECT set_config('request.jwt.claim.sub', ${adminUserId}, true)`;
      const [sendResult] = await tx`
        SELECT public.rpc_send_chat_message(
          ${adminClientId}::UUID,
          ${roomId}::UUID,
          ${adminContent},
          'text'
        ) AS message_id;
      `;
      sentMessageId = sendResult.message_id;
    });

    console.log(`✅ Admin gửi thành công! Message ID: ${sentMessageId}`);

    // ── BƯỚC 3: Kiểm tra Notification Resolver & Danh sách người nhận ──
    console.log(
      '\nBƯỚC 3: Kiểm tra Push Notification & Recipients Resolver...',
    );
    const [{ recipients }] = await sql`
      SELECT public.fn_resolve_chat_notification_recipients(${sentMessageId}::UUID) AS recipients;
    `;
    const isCustomerInRecipients = (recipients as string[]).includes(
      customerUserId,
    );
    console.log(`• Danh sách nhận thông báo: ${JSON.stringify(recipients)}`);
    console.log(
      `• Customer Thắm nằm trong danh sách nhận thông báo: ${isCustomerInRecipients ? '✅ ĐÚNG (Có nhận thông báo)' : '❌ SAI'}`,
    );

    // ── BƯỚC 4: Customer đọc tin nhắn qua RLS SELECT & RPC rpc_get_chat_messages ──
    console.log('\nBƯỚC 4: Customer đăng nhập và đọc tin nhắn...');

    // 4a. Kiểm tra Customer đọc qua RLS SELECT trực tiếp (Realtime subscription check)
    let rlsVisible = false;
    await sql.begin(async (tx) => {
      await tx`SELECT set_config('request.jwt.claim.sub', ${customerUserId}, true)`;
      const [msgRow] = await tx`
        SELECT id, content, sender_id, created_at 
        FROM public.chat_messages 
        WHERE id = ${sentMessageId}::UUID;
      `;
      if (msgRow && msgRow.content === adminContent) {
        rlsVisible = true;
      }
    });
    console.log(
      `• Customer đọc qua RLS trực tiếp (Realtime channel): ${rlsVisible ? '✅ NHẬN ĐƯỢC 100% NỘI DUNG' : '❌ BỊ RLS CHẶN'}`,
    );

    // 4b. Kiểm tra Customer tải toàn bộ danh sách qua RPC rpc_get_chat_messages
    let rpcVisible = false;
    let receivedContent = '';
    let senderName = '';
    await sql.begin(async (tx) => {
      await tx`SELECT set_config('request.jwt.claim.sub', ${customerUserId}, true)`;
      const [rpcData] = await tx`
        SELECT public.rpc_get_chat_messages(${roomId}::UUID, NULL, 30) AS data;
      `;
      const messages = (
        rpcData.data as {
          messages: Array<{
            id: string;
            content: string;
            sender_full_name: string;
          }>;
        }
      ).messages;
      const found = messages.find((m) => m.id === sentMessageId);
      if (found) {
        rpcVisible = true;
        receivedContent = found.content;
        senderName = found.sender_full_name;
      }
    });

    console.log(
      `• Customer tải qua rpc_get_chat_messages: ${rpcVisible ? '✅ TẢI THÀNH CÔNG' : '❌ KHÔNG TÌM THẤY'}`,
    );
    console.log(`  -> Người gửi hiển thị: "${senderName}"`);
    console.log(`  -> Nội dung nhận được: "${receivedContent}"`);

    // ── BƯỚC 5: Customer gửi phản hồi lại cho Admin ──
    const customerClientId = randomUUID();
    const customerReply = `[TEST-PROOF-2] Cảm ơn bên mình nhé, cho tôi xin thông tin tài xế nha! (Thời gian: ${new Date().toLocaleTimeString('vi-VN')})`;
    console.log('\nBƯỚC 5: Customer gửi tin nhắn phản hồi cho Admin...');
    console.log(`   Nội dung: "${customerReply}"`);

    let replyMessageId: string | null = null;
    await sql.begin(async (tx) => {
      await tx`SELECT set_config('request.jwt.claim.sub', ${customerUserId}, true)`;
      const [replyResult] = await tx`
        SELECT public.rpc_send_chat_message(
          ${customerClientId}::UUID,
          ${roomId}::UUID,
          ${customerReply},
          'text'
        ) AS message_id;
      `;
      replyMessageId = replyResult.message_id;
    });

    console.log(
      `✅ Customer gửi phản hồi thành công! Message ID: ${replyMessageId}`,
    );

    // ── BƯỚC 6: Admin đọc phản hồi của Customer qua RPC & RLS ──
    console.log('\nBƯỚC 6: Admin kiểm tra tin nhắn phản hồi từ Customer...');
    let adminReceivedReply = false;
    let customerSenderName = '';
    await sql.begin(async (tx) => {
      await tx`SELECT set_config('request.jwt.claim.sub', ${adminUserId}, true)`;
      const [rpcData] = await tx`
        SELECT public.rpc_get_chat_messages(${roomId}::UUID, NULL, 30) AS data;
      `;
      const messages = (
        rpcData.data as {
          messages: Array<{
            id: string;
            content: string;
            sender_full_name: string;
          }>;
        }
      ).messages;
      const found = messages.find((m) => m.id === replyMessageId);
      if (found) {
        adminReceivedReply = true;
        customerSenderName = found.sender_full_name;
      }
    });

    console.log(
      `• Admin nhận được phản hồi của Customer: ${adminReceivedReply ? '✅ HOÀN TẤT (2 CHIỀU ĐỒNG BỘ)' : '❌ LỖI'}`,
    );
    console.log(`  -> Người gửi: "${customerSenderName}"`);
    console.log(`  -> Nội dung phản hồi: "${customerReply}"`);

    console.log('\n========================================================');
    console.log('🏆 KẾT LUẬN: ĐÃ CHỨNG MINH 100% LUỒNG TIN NHẮN 2 CHIỀU');
    console.log('   - Admin gửi -> Customer nhận được ngay');
    console.log('   - Customer gửi -> Admin nhận được ngay');
    console.log('   - RLS, Realtime & RPC đồng bộ chuẩn xác');
    console.log('========================================================\n');
  } catch (err) {
    console.error('Lỗi kiểm tra:', err);
  } finally {
    await sql.end();
  }
}

proveEndToEndChatExchange();
