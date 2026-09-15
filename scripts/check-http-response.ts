import 'dotenv/config';
import postgres from 'postgres';

async function check() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error('DATABASE_URL is missing.');
    process.exit(1);
  }

  const sql = postgres(dbUrl, { max: 1, connect_timeout: 10, ssl: 'require' });

  try {
    console.log('=== LỊCH SỬ GỌI HTTP TỪ POSTGRES PG_NET ===');
    const responses = await sql`
      SELECT id, status_code, content_type, error_msg, created
      FROM net._http_response
      ORDER BY id DESC
      LIMIT 5;
    `;
    console.log('Lịch sử phản hồi từ net._http_response:');
    console.table(responses);

    console.log('=== DỮ LIỆU NOTIFICATION OUTBOX ===');
    const outboxRows = await sql`
      SELECT id, event_type, status, attempts, next_retry_at, created_at, left(payload::text, 100) as payload_snippet
      FROM public.notification_outbox
      ORDER BY created_at DESC
      LIMIT 5;
    `;
    console.table(outboxRows);
  } catch (err) {
    console.error('Lỗi khi đọc net._http_response:', err);
  } finally {
    await sql.end();
  }
}

check();
