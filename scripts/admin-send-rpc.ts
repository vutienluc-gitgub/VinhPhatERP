/* eslint-disable no-restricted-syntax */
import crypto from 'crypto';

import 'dotenv/config';
import postgres from 'postgres';

async function sendAsAdmin() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error('DATABASE_URL is missing.');
    process.exit(1);
  }

  const sql = postgres(dbUrl, { max: 1, connect_timeout: 10, ssl: 'require' });

  try {
    const roomId = 'dd46feb3-3afa-45cc-a4f6-7420c583a90b';
    const adminId = '7724bad2-5156-4015-8d64-c83097b4e31d'; // Vũ Tiến Lực (Admin)
    const clientId = crypto.randomUUID();
    const content = '0'; // Tin nhắn thử thách theo yêu cầu

    console.log('----------------------------------------------------');
    console.log('ĐÓNG VAI ADMIN GỬI TIN NHẮN QUA RPC CHÍNH THỨC');
    console.log('Room ID:', roomId);
    console.log('Admin User ID:', adminId);
    console.log('Nội dung gửi:', `"${content}"`);
    console.log('Client ID (dedup):', clientId);
    console.log('----------------------------------------------------');

    let messageId: string | null = null;

    // Thực thi chuẩn xác RPC rpc_send_chat_message trong ngữ cảnh authenticated của Admin
    await sql.begin(async (tx) => {
      await tx`SELECT set_config('role', 'authenticated', true)`;
      await tx`SELECT set_config('request.jwt.claim.sub', ${adminId}, true)`;

      const [result] = await tx`
        SELECT public.rpc_send_chat_message(
          p_client_id := ${clientId}::uuid,
          p_room_id := ${roomId}::uuid,
          p_content := ${content},
          p_message_type := 'text'
        ) AS message_id;
      `;
      messageId = result.message_id;
    });

    console.log('✅ RPC rpc_send_chat_message thực thi THÀNH CÔNG!');
    console.log('Message ID tạo bởi RPC:', messageId);

    // Xác thực tin nhắn có trong phòng qua RPC rpc_get_chat_messages của Admin
    await sql.begin(async (tx) => {
      await tx`SELECT set_config('role', 'authenticated', true)`;
      await tx`SELECT set_config('request.jwt.claim.sub', ${adminId}, true)`;

      const [rpcData] = await tx`
        SELECT public.rpc_get_chat_messages(${roomId}::uuid, NULL, 5) AS data;
      `;
      const messages = (
        rpcData.data as {
          messages: Array<{
            id: string;
            sender_full_name: string;
            content: string;
            created_at: string;
          }>;
        }
      ).messages;
      const latest = messages[messages.length - 1];
      console.log('\n[Xác thực phòng qua rpc_get_chat_messages]:');
      console.log('ID:', latest?.id);
      console.log('Người gửi:', latest?.sender_full_name);
      console.log('Nội dung:', latest?.content);
      console.log('Thời gian tạo:', latest?.created_at);
    });

    console.log('\n====================================================');
    console.log('👉 ADMIN ĐÃ GỬI THÀNH CÔNG TIN NHẮN "0" QUA RPC!');
    console.log('👉 ĐANG CHỜ CUSTOMER (MONZ BRAND) TRẢ LỜI...');
    console.log('====================================================');
  } catch (err) {
    console.error('Lỗi khi gửi qua RPC:', err);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

sendAsAdmin();
