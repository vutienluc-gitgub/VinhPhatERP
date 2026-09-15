import 'dotenv/config';
import postgres from 'postgres';

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is missing');
  }

  console.log('[1] Connecting to PostgreSQL...');

  const sql = postgres(process.env.DATABASE_URL, {
    max: 1,
    ssl: 'require',
    connect_timeout: 10,
    idle_timeout: 5,
  });

  try {
    console.log('[2] Checking pg_cron availability...');

    const exts = await sql`
      SELECT
        name,
        default_version,
        installed_version,
        comment
      FROM pg_available_extensions
      WHERE name = 'pg_cron'
    `;

    console.log('[3] pg_cron:', exts);

    console.log('[4] Checking installed extension...');

    const installed = await sql`
      SELECT extname, extversion
      FROM pg_extension
      WHERE extname = 'pg_cron'
    `;

    console.log('[5] Installed pg_cron:', installed);

    console.log('[6] Checking cron jobs...');

    const jobs = await sql`
      SELECT jobid, jobname, schedule, command, active
      FROM cron.job
      ORDER BY jobid
    `;

    console.log('[7] Cron jobs:', jobs);

    console.log('[8] Executing fn_process_notification_outbox(10)...');

    const processed = await sql`
      SELECT * FROM public.fn_process_notification_outbox(10)
    `;

    console.log('[9] Processed outbox items:', processed);
  } finally {
    console.log('[10] Closing database connection...');
    await sql.end({ timeout: 5 });
    console.log('[11] Done.');
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('[FATAL]', error);
    process.exit(1);
  });
