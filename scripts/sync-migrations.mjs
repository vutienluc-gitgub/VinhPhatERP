import postgres from 'postgres';
import 'dotenv/config';

async function run() {
  const sql = postgres(process.env.DATABASE_URL);
  try {
    console.log('Syncing migration history...');
    
    // Insert 20260529000002
    await sql`
      INSERT INTO supabase_migrations.schema_migrations (version, name, statements)
      VALUES ('20260529000002', 'loom_mes_upgrade', '{}')
      ON CONFLICT (version) DO NOTHING;
    `;
    
    // Insert 20260529000004
    await sql`
      INSERT INTO supabase_migrations.schema_migrations (version, name, statements)
      VALUES ('20260529000004', 'create_loom_production_states', '{}')
      ON CONFLICT (version) DO NOTHING;
    `;

    console.log('Migration history synced successfully!');
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await sql.end();
  }
}

run();
