import type {
  CostEstimation,
  CreateCostEstimationInput,
} from '@/schema/cost-estimation.schema';
import { untypedDb } from '@/services/supabase/untyped';
import { supabase } from '@/services/supabase/client';
import { getTenantId } from '@/services/supabase/tenant';
import { safeUpsertOne } from '@/lib/db-guard';

const TABLE = 'cost_estimations';

/* ── Fetch latest estimation for a reference ── */

export async function fetchCostEstimation(
  referenceType: string,
  referenceId: string,
): Promise<CostEstimation | null> {
  const { data, error } = await untypedDb
    .from(TABLE)
    .select('*')
    .eq('reference_type', referenceType)
    .eq('reference_id', referenceId)
    .order('version', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return (data as CostEstimation) ?? null;
}

/* ── Fetch all estimation versions for a reference ── */

export async function fetchCostEstimationHistory(
  referenceType: string,
  referenceId: string,
): Promise<CostEstimation[]> {
  const { data, error } = await untypedDb
    .from(TABLE)
    .select('*')
    .eq('reference_type', referenceType)
    .eq('reference_id', referenceId)
    .order('version', { ascending: false });

  if (error) throw error;
  return (data || []) as CostEstimation[];
}

/* ── Create or update (next version) estimation ── */

export async function saveCostEstimation(
  input: CreateCostEstimationInput,
): Promise<CostEstimation> {
  const tenantId = await getTenantId();
  const auth = await supabase.auth.getUser();
  const userId = auth.data.user?.id ?? null;

  // Determine next version number
  const { data: existing } = await untypedDb
    .from(TABLE)
    .select('version')
    .eq('tenant_id', tenantId)
    .eq('reference_type', input.reference_type)
    .eq('reference_id', input.reference_id)
    .order('version', { ascending: false })
    .limit(1)
    .maybeSingle();

  const nextVersion = existing
    ? (existing as { version: number }).version + 1
    : 1;

  const inserted = await safeUpsertOne({
    table: TABLE,
    data: {
      tenant_id: tenantId,
      reference_type: input.reference_type,
      reference_id: input.reference_id,
      version: nextVersion,
      target_width_cm: input.target_width_cm ?? null,
      target_gsm: input.target_gsm ?? null,
      est_yarn_price: input.est_yarn_price,
      est_profit_margin_pct: input.est_profit_margin_pct,
      est_transport_cost: input.est_transport_cost,
      est_additional_costs: input.est_additional_costs,
      est_total_cost: input.est_total_cost,
      suggested_price: input.suggested_price,
      created_by: userId,
    },
    conflictKey: 'id',
  });
  return inserted as unknown as CostEstimation;
}
