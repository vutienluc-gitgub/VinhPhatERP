import 'dotenv/config';
import postgres from 'postgres';
const url = process.env.DATABASE_URL.replace('6543', '5432');
const sql = postgres(url, { ssl: 'require', max: 1 });
sql`select 1 as x`
  .then(r => console.log('success'))
  .catch(e => console.error(e.message))
  .finally(() => sql.end());
