import postgres from 'postgres';

async function test(url: string) {
  console.log('Testing:', url);
  try {
    const sql = postgres(url, { max: 1, connect_timeout: 5, ssl: 'require' });
    const [{ now }] = await sql`SELECT now()`;
    console.log('✅ Success!', now);
    await sql.end();
  } catch (err: unknown) {
    console.log('❌ Failed:', err instanceof Error ? err.message : err);
  }
}

async function run() {
  const p1 =
    'postgresql://postgres.sxphijrofljxkccdwtub:jhVVQpMHZXAtOXba@aws-1-ap-northeast-1.pooler.supabase.com:5432/postgres';
  const p2 =
    'postgresql://postgres.sxphijrofljxkccdwtub:jhVVQpMHZXAtOXba@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres';
  const p3 =
    'postgresql://postgres.sxphijrofljxkccdwtub:jhVVQpMHZXAtOXba@aws-0-us-west-1.pooler.supabase.com:6543/postgres';
  const p4 =
    'postgresql://postgres.sxphijrofljxkccdwtub:jhVVQpMHZXAtOXba@aws-0-eu-central-1.pooler.supabase.com:6543/postgres';

  await test(p1);
  await test(p2);
  await test(p3);
  await test(p4);
  await test(p3);
}

run();
