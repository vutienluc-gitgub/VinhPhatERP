/**
 * rpc-sync.ts — Entry point
 * Chạy: tsx scripts/rpc-sync.ts
 * Hoặc: tsx scripts/rpc-sync.ts --fix   (tự sinh migration)
 */

import 'dotenv/config';
import { parseRpcCalls } from './parse-rpc-calls';
import { getDbFunctions } from './query-db-functions';
import { compareRpc, formatIssues } from './check-rpc-sync';
import { generateMigration } from './generate-migration';

const AUTO_FIX = process.argv.includes('--fix');
const SRC_DIR =
  process.argv.find((a) => a.startsWith('--src='))?.split('=')[1] ?? './src';

async function main() {
  // eslint-disable-next-line no-restricted-syntax -- Allowed string emoji
  console.log('\n🔍 RPC Sync Check\n' + '─'.repeat(40));

  // 1. Parse toàn bộ source code
  // eslint-disable-next-line no-restricted-syntax -- Allowed string emoji
  console.log(`📂 Scanning: ${SRC_DIR}`);
  const calls = parseRpcCalls(SRC_DIR);
  console.log(`   Found ${calls.length} rpc() call(s)\n`);

  if (calls.length === 0) {
    // eslint-disable-next-line no-restricted-syntax -- Allowed string emoji
    console.log('✅ No rpc() calls found. Nothing to check.');
    process.exit(0);
  }

  // 2. Kết nối DB và lấy danh sách functions thực tế
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    // eslint-disable-next-line no-restricted-syntax -- Allowed string emoji
    console.error('❌ DATABASE_URL not set in .env');
    process.exit(1);
  }

  // eslint-disable-next-line no-restricted-syntax -- Allowed string emoji
  console.log('🗄️  Querying database...');
  let dbFunctions;
  try {
    dbFunctions = await getDbFunctions(dbUrl);
    console.log(
      `   Found ${dbFunctions.length} function(s) in public schema\n`,
    );
  } catch (err) {
    // eslint-disable-next-line no-restricted-syntax -- Allowed string emoji
    console.error('❌ Cannot connect to database:', (err as Error).message);
    process.exit(1);
  }

  // 3. So sánh
  const issues = compareRpc(calls, dbFunctions);

  if (issues.length === 0) {
    // eslint-disable-next-line no-restricted-syntax -- Allowed string emoji
    console.log('✅ All RPC functions are in sync with the database!\n');
    process.exit(0);
  }

  // 4. Hiển thị issues
  console.log(formatIssues(issues, calls));

  // 5. Auto-fix nếu có --fix flag
  if (AUTO_FIX) {
    // eslint-disable-next-line no-restricted-syntax -- Allowed string emoji
    console.log('\n🔧 Generating migrations...\n');
    for (const issue of issues) {
      const call = calls.find((c) => c.fnName === issue.fnName);
      if (call) {
        const filepath = generateMigration(call, issue);
        // eslint-disable-next-line no-restricted-syntax -- Allowed string emoji
        console.log(`   ✅ ${filepath}`);
      }
    }
    // eslint-disable-next-line no-restricted-syntax -- Allowed string emoji
    console.log('\n💡 Review the generated files in supabase/migrations/');
    console.log('   then run: supabase db push\n');
    process.exit(1); // vẫn exit(1) để block commit cho đến khi push migration
  } else {
    // eslint-disable-next-line no-restricted-syntax -- Allowed string emoji
    console.log('\n💡 Run with --fix to auto-generate SQL migrations\n');
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
