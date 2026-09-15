/* eslint-disable no-restricted-syntax, @typescript-eslint/no-explicit-any */
import crypto from 'crypto';

import 'dotenv/config';
import postgres from 'postgres';

/**
 * Gửi tin nhắn đóng vai Admin hoàn toàn qua RPC rpc_send_chat_message
 * Tuân thủ nghiêm ngặt Coding Standards:
 * - Không can thiệp trigger runtime
 * - Không dùng INSERT trực tiếp vào chat_messages
 * - Sử dụng RPC có kiểm tra quyền auth.uid(), vai trò, và tenant context
 */
async function sendAdminMessageViaRpc() {
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
    const content = '0';

    console.log(
      '[Admin] Đang thực thi RPC rpc_send_chat_message với danh tính Admin...',
    );

    let messageId: string | null = null;
    await sql.begin(async (tx) => {
      await tx`SELECT set_config('role', 'authenticated', true)`;
      await tx`SELECT set_config('request.jwt.claim.sub', ${adminId}, true)`;

      const [res] = await tx`
        SELECT public.rpc_send_chat_message(
          p_client_id := ${clientId}::uuid,
          p_room_id := ${roomId}::uuid,
          p_content := ${content},
          p_message_type := 'text'
        ) AS message_id;
      `;
      messageId = res.message_id;
    });

    console.log(
      `[Admin] Gửi tin nhắn thành công qua RPC! Message ID: ${messageId}`,
    );

    // Xác thực qua rpc_get_chat_messages
    await sql.begin(async (tx) => {
      await tx`SELECT set_config('role', 'authenticated', true)`;
      await tx`SELECT set_config('request.jwt.claim.sub', ${adminId}, true)`;

      const [data] = await tx`
        SELECT public.rpc_get_chat_messages(${roomId}::uuid, NULL, 3) AS res;
      `;
      const messages = (data.res as { messages: any[] }).messages;
      const latest = messages[messages.length - 1];
      console.log('[Admin] Tin nhắn hiển thị trong phòng:', {
        id: latest.id,
        sender: latest.sender_full_name,
        content: latest.content,
        created_at: latest.created_at,
      });
    });
  } catch (err) {
    console.error('[Admin] Lỗi khi gọi RPC:', err);
  } finally {
    await sql.end();
  }
}

sendAdminMessageViaRpc();
