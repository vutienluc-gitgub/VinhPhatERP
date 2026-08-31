import * as fs from 'fs';

import 'dotenv/config';
import postgres from 'postgres';

const sql = postgres(process.env.DATABASE_URL!, { ssl: 'require' });

async function main() {
  const tables = await sql`
    SELECT tablename, rowsecurity 
    FROM pg_tables 
    WHERE schemaname = 'public'
    ORDER BY tablename;
  `;

  const policies = await sql`
    SELECT tablename, policyname, permissive, roles, cmd, qual, with_check
    FROM pg_policies
    WHERE schemaname = 'public'
    ORDER BY tablename, policyname;
  `;

  const rpcs = await sql`
    SELECT 
      p.proname,
      pg_get_function_arguments(p.oid) as args,
      p.prosecdef as is_security_definer,
      pg_get_userbyid(p.proowner) as owner,
      d.description
    FROM pg_proc p
    LEFT JOIN pg_description d ON d.objoid = p.oid
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
    ORDER BY p.proname;
  `;

  const columns = await sql`
    SELECT table_name, column_name, data_type, is_nullable
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name IN (
        'profiles', 'customers', 'suppliers', 'orders', 'order_items',
        'shipments', 'shipment_items', 'quotations', 'quotation_items',
        'payments', 'contracts', 'order_requests', 'customer_debts',
        'chat_rooms', 'chat_messages', 'chat_room_participants',
        'app_notifications'
      )
    ORDER BY table_name, ordinal_position;
  `;

  const output = {
    tables,
    policies,
    rpcs: rpcs.filter(
      (r) => r.proname.startsWith('rpc_') || r.proname.startsWith('fn_'),
    ),
    columns,
  };

  fs.writeFileSync(
    'scripts/audit_output.json',
    JSON.stringify(output, null, 2),
  );
  console.log(
    `Audit complete: ${tables.length} tables, ${policies.length} policies, ${output.rpcs.length} RPCs/functions`,
  );
  await sql.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
