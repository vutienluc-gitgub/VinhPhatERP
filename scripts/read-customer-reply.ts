/* eslint-disable no-restricted-syntax */
import 'dotenv/config';

import postgres from 'postgres';

async function readCustomerReply() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error('DATABASE_URL is missing.');
    process.exit(1);
  }

  const sql = postgres(dbUrl, { max: 1, connect_timeout: 10, ssl: 'require' });

  try {
    const roomId = 'dd46feb3-3afa-45cc-a4f6-7420c583a90b';
    const adminId = '7724bad2-5156-4015-8d64-c83097b4e31d';
    const adminSentTime = '2026-09-14T10:34:15.016Z';

    console.log(
      '[Listener] Đang kiểm tra tin nhắn mới từ Customer (Monz brand)...',
    );

    // Truy vấn thông qua RPC rpc_get_chat_messages trong session Admin
    let messages: Array<{
      id: string;
      sender_id: string;
      sender_full_name: string;
      content: string;
      created_at: string;
    }> = [];

    await sql.begin(async (tx) => {
      await tx`SELECT set_config('role', 'authenticated', true)`;
      await tx`SELECT set_config('request.jwt.claim.sub', ${adminId}, true)`;

      const [rpcData] = await tx`
        SELECT public.rpc_get_chat_messages(${roomId}::uuid, NULL, 10) AS data;
      `;
      messages = (rpcData.data as { messages: typeof messages }).messages || [];
    });

    // Lọc tin nhắn của đối phương (Customer) gửi sau thời điểm Admin gửi "0"
    const customerReplies = messages.filter(
      (m) =>
        m.sender_id !== adminId &&
        new Date(m.created_at) > new Date(adminSentTime),
    );

    if (customerReplies.length > 0) {
      const latestReply = customerReplies[customerReplies.length - 1];
      console.log('\n====================================================');
      console.log('🎉 ĐÃ NHẬN ĐƯỢC PHẢN HỒI TỪ CUSTOMER (MONZ BRAND):');
      console.log('ID tin nhắn:', latestReply.id);
      console.log('Người gửi:', latestReply.sender_full_name);
      console.log('Nội dung:', latestReply.content);
      console.log('Thời gian:', latestReply.created_at);
      console.log('====================================================\n');
    } else {
      console.log(
        '[Listener] Chưa có tin nhắn mới từ Customer sau mốc ' + adminSentTime,
      );
    }
  } catch (err) {
    console.error('Lỗi khi đọc phản hồi:', err);
  } finally {
    await sql.end();
  }
}

readCustomerReply();
