import 'dotenv/config';
import postgres from 'postgres';

async function checkTodayMessage() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error('DATABASE_URL is missing in environment.');
    process.exit(1);
  }

  const sql = postgres(dbUrl, { max: 1, connect_timeout: 10, ssl: 'require' });

  try {
    console.log('=== 1. TÌM KHÁCH HÀNG KH-010 (Monz brand) ===');
    const customers = await sql`
      SELECT id, code, name, salesperson_id, tenant_id
      FROM public.customers
      WHERE code = 'KH-010' OR name ILIKE '%Monz%'
      LIMIT 5;
    `;
    console.log('Khách hàng tìm thấy:', customers);

    if (customers.length === 0) {
      console.log('Không tìm thấy khách hàng KH-010.');
      return;
    }

    const customer = customers[0];

    console.log('\n=== 2. TÌM PHÒNG CHAT CỦA KHÁCH HÀNG NÀY ===');
    const rooms = await sql`
      SELECT id, entity_type, entity_id, status, created_at, updated_at
      FROM public.chat_rooms
      WHERE (entity_type = 'customer' AND entity_id = ${customer.id}::text)
         OR (entity_type = 'customer' AND entity_id = ${customer.code})
      ORDER BY created_at DESC;
    `;
    console.log('Phòng chat:', rooms);

    if (rooms.length === 0) {
      console.log('Không tìm thấy phòng chat.');
      return;
    }

    const room = rooms[0];

    console.log(
      '\n=== 3. DANH SÁCH THÀNH VIÊN TRONG PHÒNG (chat_room_participants) ===',
    );
    const participants = await sql`
      SELECT p.room_id, p.user_id, p.role, p.unread_count, p.last_read_at,
             u.email, pr.full_name, pr.role AS profile_role, pr.customer_id
      FROM public.chat_room_participants p
      LEFT JOIN auth.users u ON p.user_id = u.id
      LEFT JOIN public.profiles pr ON p.user_id = pr.id
      WHERE p.room_id = ${room.id}::uuid;
    `;
    console.log('Thành viên phòng:', participants);

    console.log(
      '\n=== 4. CÁC TIN NHẮN TRONG PHÒNG (ĐẶC BIỆT LÀ TIN NHẮN HÔM NAY) ===',
    );
    const messages = await sql`
      SELECT m.id, m.client_id, m.sender_id, m.content, m.status, m.created_at, m.read_at,
             pr.full_name AS sender_name, pr.role AS sender_role
      FROM public.chat_messages m
      LEFT JOIN public.profiles pr ON m.sender_id = pr.id
      WHERE m.room_id = ${room.id}::uuid
      ORDER BY m.created_at DESC
      LIMIT 10;
    `;
    console.log('10 tin nhắn gần nhất:', messages);

    // Kiểm tra tin nhắn "Dạ em đã nhận được thông tin ạ"
    const targetMsg = messages.find(
      (m) => m.content && m.content.includes('nhận được thông tin'),
    );
    if (targetMsg) {
      console.log('\n=== 5. KIỂM TRA TIN NHẮN CỤ THỂ ===');
      console.log('Tin nhắn mục tiêu:', targetMsg);

      // Kiểm tra xem thành viên khách hàng có quyền đọc tin nhắn này không (RLS & fn_can_access_chat_room)
      for (const p of participants) {
        const [{ allowed }] = await sql`
          SELECT public.fn_can_access_chat_room(${room.id}::uuid, ${p.user_id}::uuid) AS allowed;
        `;
        console.log(
          `- Quyền truy cập của ${p.full_name || p.email} (${p.role}): ${allowed ? 'HỢP LỆ (Xem được)' : 'BỊ CHẶN'}`,
        );
      }

      // Kiểm tra recipients notification
      const [{ recipients }] = await sql`
        SELECT public.fn_resolve_chat_notification_recipients(${targetMsg.id}::uuid) AS recipients;
      `;
      console.log('Danh sách nhận thông báo push:', recipients);
    }
  } catch (err) {
    console.error('Lỗi khi truy vấn:', err);
  } finally {
    await sql.end();
  }
}

checkTodayMessage();
