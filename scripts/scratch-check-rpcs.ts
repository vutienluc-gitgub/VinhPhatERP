import 'dotenv/config';
import postgres from 'postgres';

async function main() {
  const dbUrl = process.env.DATABASE_URL!;
  const sql = postgres(dbUrl, { max: 1, ssl: 'require' });

  const fns = await sql`
    SELECT routine_name, specific_name, pg_get_function_identity_arguments(p.oid) as args
    FROM information_schema.routines r
    JOIN pg_proc p ON p.proname = r.routine_name
    WHERE routine_schema = 'public'
      AND routine_name LIKE 'rpc_%chat%'
  `;

  console.log('Chat RPC functions:', fns);
  await sql.end();
}

main().catch(console.error);
