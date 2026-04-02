import { useQuery } from '@tanstack/react-query'

import { supabase } from '@/services/supabase/client'

export type TraceRawRoll = {
  id: string
  roll_number: string
  fabric_type: string
  color_name: string | null
  width_cm: number | null
  length_m: number | null
  weight_kg: number | null
  quality_grade: string | null
  status: string
  lot_number: string | null
  warehouse_location: string | null
  weaving_partner: { id: string; name: string; code: string } | null
}

export type TraceYarnReceipt = {
  id: string
  receipt_number: string
  receipt_date: string
  total_amount: number
  status: string
  supplier: { id: string; name: string; code: string } | null
  items_count: number
}

export type TraceChainData = {
  rawRoll: TraceRawRoll | null
  yarnReceipt: TraceYarnReceipt | null
}

export function useTraceChain(rawRollId: string | null) {
  return useQuery({
    queryKey: ['trace-chain', rawRollId],
    enabled: !!rawRollId,
    queryFn: async (): Promise<TraceChainData> => {
      const result: TraceChainData = { rawRoll: null, yarnReceipt: null }

      // 1. Fetch raw roll with weaving partner
      const { data: rawData, error: rawError } = await supabase
        .from('raw_fabric_rolls')
        .select('id, roll_number, fabric_type, color_name, width_cm, length_m, weight_kg, quality_grade, status, lot_number, warehouse_location, weaving_partner_id, yarn_receipt_id, suppliers!weaving_partner_id(id, name, code)')
        .eq('id', rawRollId!)
        .single()

      if (rawError || !rawData) return result

      const raw = rawData as Record<string, unknown>
      const weavingPartner = raw.suppliers as { id: string; name: string; code: string } | null

      result.rawRoll = {
        id: raw.id as string,
        roll_number: raw.roll_number as string,
        fabric_type: raw.fabric_type as string,
        color_name: raw.color_name as string | null,
        width_cm: raw.width_cm as number | null,
        length_m: raw.length_m as number | null,
        weight_kg: raw.weight_kg as number | null,
        quality_grade: raw.quality_grade as string | null,
        status: raw.status as string,
        lot_number: raw.lot_number as string | null,
        warehouse_location: raw.warehouse_location as string | null,
        weaving_partner: weavingPartner,
      }

      // 2. Fetch yarn receipt with supplier
      const yarnReceiptId = raw.yarn_receipt_id as string | null
      if (!yarnReceiptId) return result

      const { data: receiptData, error: receiptError } = await supabase
        .from('yarn_receipts')
        .select('id, receipt_number, receipt_date, total_amount, status, suppliers(id, name, code), yarn_receipt_items(id)')
        .eq('id', yarnReceiptId)
        .single()

      if (receiptError || !receiptData) return result

      const receipt = receiptData as Record<string, unknown>
      const supplier = receipt.suppliers as { id: string; name: string; code: string } | null
      const items = receipt.yarn_receipt_items as { id: string }[] | null

      result.yarnReceipt = {
        id: receipt.id as string,
        receipt_number: receipt.receipt_number as string,
        receipt_date: receipt.receipt_date as string,
        total_amount: receipt.total_amount as number,
        status: receipt.status as string,
        supplier,
        items_count: items?.length ?? 0,
      }

      return result
    },
  })
}
