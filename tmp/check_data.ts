
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

async function test() {
  const { data, error } = await supabase.rpc('get_column_info', { p_table: 'work_orders' })
  console.log('Columns:', data)
  console.log('Error:', error)
  
  // If rpc doesn't exist, try raw select on information_schema (might not be allowed via anon)
  // Let's just try to insert a dummy row or select target_unit
  const { data: selectData, error: selectError } = await supabase.from('work_orders').select('target_unit').limit(1)
  console.log('Select target_unit:', selectData)
  console.log('Select Error:', selectError)
}
test()
