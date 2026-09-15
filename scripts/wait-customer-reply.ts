import 'dotenv/config';
import postgres from 'postgres';

async function waitForCustomerReply() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error('DATABASE_URL is missing.');
    process.exit(1);
  }

  const sql = postgres(dbUrl, { max: 1, connect_timeout: 10, ssl: 'require' });

  try {
    const roomId = 'dd46feb3-3afa-45cc-a4f6-7420c583a90b';
    const adminMsgTime = '2026-09-14T10:22:45.000Z';

    console.log('[Listener] Đang chờ tin nhắn phản hồi từ Monz brand...');

    let found = false;
    for (let i = 0; i < 30; i++) {
      const messages = await sql`
        SELECT m.id, m.client_id, m.sender_id, m.content, m.status, m.created_at,
               pr.full_name AS sender_name, pr.role AS sender_role
        FROM public.chat_messages m
        LEFT JOIN public.profiles pr ON m.sender_id = pr.id
        WHERE m.room_id = ${roomId}::uuid
          AND m.created_at > ${adminMsgTime}::timestamptz
          AND m.sender_id <> '7724bad2-5156-4015-8d64-c83097b4e31d'::uuid
        ORDER BY m.created_at DESC
        LIMIT 1;
      `;

      if (messages.length > 0) {
        console.log('\n=============================================');
        console.log('DA NHAN DUOC TIN NHAN TU KHACH HANG:');
        console.log('Người gửi:', messages[0].sender_name);
        console.log('Vai trò:', messages[0].sender_role);
        console.log('Nội dung:', messages[0].content);
        console.log('Thời gian:', messages[0].created_at);
        console.log('=============================================\n');
        found = true;
        break;
      }

      await new Promise((r) => setTimeout(r, 2000));
    }

    if (!found) {
      console.log('[Listener] Chưa thấy tin nhắn mới trong vòng 60 giây.');
    }
  } catch (err) {
    console.error('[Listener] Lỗi:', err);
  } finally {
    await sql.end();
  }
}

waitForCustomerReply();
