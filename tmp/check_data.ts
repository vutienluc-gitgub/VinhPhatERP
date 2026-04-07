
import { createClient } from '@supabase/supabase-api'
import * as dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

async function checkData() {
  console.log('--- Order Progress ---')
  const { data: progress } = await supabase.from('order_progress').select('order_id, stage, status, orders(order_number)')
  console.table(progress?.map(p => ({
    order: p.orders?.order_number,
    stage: p.stage,
    status: p.status
  })).slice(0, 10))

  console.log('\n--- Work Orders In Progress ---')
  const { data: wos } = await supabase.from('work_orders').select('work_order_number, status, order_id, orders(order_number)').eq('status', 'in_progress')
  console.table(wos?.map(w => ({
    number: w.work_order_number,
    status: w.status,
    order: w.orders?.order_number
  })))
}

checkData()
