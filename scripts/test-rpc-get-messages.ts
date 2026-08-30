import 'dotenv/config';
import postgres from 'postgres';

async function testRpcGetMessages() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) process.exit(1);

  const sql = postgres(dbUrl, { max: 1, connect_timeout: 5, ssl: 'require' });

  try {
    const roomId = 'dd46feb3-3afa-45cc-a4f6-7420c583a90b';
    const customerUserId = '6c8cc401-487d-4468-8aa7-fe2997093767';

    // Test authorization function
    const [{ allowed }] = await sql`
      SELECT public.fn_can_access_chat_room(${roomId}, ${customerUserId}) AS allowed;
    `;
    console.log(`fn_can_access_chat_room result: ${allowed}`);

    await sql.begin(async (tx) => {
      await tx`SELECT set_config('request.jwt.claim.sub', ${customerUserId}, true)`;
      const [result] = await tx`
        SELECT public.rpc_get_chat_messages(${roomId}, NULL, 30) AS data;
      `;
      console.log('rpc_get_chat_messages query returned successfully:');
      const messages = (result.data as { messages: unknown[] })?.messages ?? [];
      console.log(`Messages count: ${messages.length}`);
    });
  } catch (err) {
    console.error('Test RPC error:', err);
  } finally {
    await sql.end();
  }
}

testRpcGetMessages();
