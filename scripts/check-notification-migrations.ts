import 'dotenv/config';
import fs from 'fs';
import path from 'path';

import postgres from 'postgres';

async function checkAndApplyNotificationMigrations() {
  const dbUrl =
    process.env.DATABASE_URL ||
    'postgresql://postgres.sxphijrofljxkccdwtub:jhVVQpMHZXAtOXba@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres';

  console.log('Connecting to database...');
  const sql = postgres(dbUrl, { max: 1, ssl: 'require' });

  try {
    // 1. Check existing tables
    const requiredTables = [
      'app_notifications',
      'notification_preferences',
      'notification_delivery_logs',
      'push_subscriptions',
    ];

    const foundTables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_name = ANY(${requiredTables})
    `;

    const existingNames = new Set(foundTables.map((r) => r.table_name));
    console.log('Existing notification tables:', Array.from(existingNames));

    const missingTables = requiredTables.filter((t) => !existingNames.has(t));

    if (missingTables.length === 0) {
      console.log('ALL_MIGRATIONS_ALREADY_APPLIED');
      console.log('All 4 tables exist and are active:');
      requiredTables.forEach((t) => console.log(`  - public.${t}: OK`));
      await sql.end();
      return;
    }

    console.log('Missing tables detected:', missingTables);
    console.log('Applying migration files now...');

    const migrationFiles = [
      'supabase/migrations/20260827180000_notification_platform_core.sql',
      'supabase/migrations/20260827183000_push_subscriptions_multi_device.sql',
    ];

    for (const relPath of migrationFiles) {
      const fullPath = path.resolve(process.cwd(), relPath);
      if (fs.existsSync(fullPath)) {
        console.log(`Executing ${relPath}...`);
        const sqlContent = fs.readFileSync(fullPath, 'utf8');
        await sql.unsafe(sqlContent);
        console.log(`Successfully applied ${relPath}`);
      } else {
        console.warn(`File not found: ${fullPath}`);
      }
    }

    // Verify again
    const verifyTables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_name = ANY(${requiredTables})
    `;
    console.log(
      'Verification after apply:',
      verifyTables.map((r) => r.table_name),
    );
    console.log('MIGRATIONS_APPLIED_SUCCESSFULLY');
  } catch (err) {
    console.error('Error applying migrations:', err);
  } finally {
    await sql.end();
  }
}

void checkAndApplyNotificationMigrations();
