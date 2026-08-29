import { untypedDb } from '@/services/supabase/untyped';
import type {
  DeliveryAttemptState,
  DeliveryAttempt,
  TelemetryLocation,
  DeliveryStop,
  DeliveryExceptionType,
  ExceptionResolutionAction,
  EPODEvidenceAsset,
  ReceiverIdentity,
} from '@/domain/logistics';

export interface TransitionAttemptParams {
  commandId?: string;
  attemptId: string;
  expectedState: DeliveryAttemptState;
  targetState: DeliveryAttemptState;
  telemetry?: Partial<TelemetryLocation>;
  notes?: string;
}

export interface TransitionAttemptResponse {
  ok: boolean;
  attempt_id: string;
  stop_id: string;
  previous_state: DeliveryAttemptState;
  current_state: DeliveryAttemptState;
  updated_at: string;
}

export interface SubmitEPODParams {
  commandId?: string;
  attemptId: string;
  expectedState?: DeliveryAttemptState;
  receiver: ReceiverIdentity;
  telemetry: {
    lat: number;
    lng: number;
    accuracy_meters?: number;
    device_id: string;
  };
  evidenceHash: string;
  previousEvidenceHash?: string | null;
  assets?: Array<Omit<EPODEvidenceAsset, 'id'>>;
}

export interface SubmitEPODResponse {
  ok: boolean;
  attempt_id: string;
  evidence_id: string;
  evidence_hash: string;
  status: string;
  submitted_at: string;
}

export interface ReportExceptionParams {
  commandId?: string;
  attemptId: string;
  exceptionType: DeliveryExceptionType;
  reasonDetail: string;
  resolutionAction?: ExceptionResolutionAction;
  resolutionNotes?: string;
  telemetry?: Partial<TelemetryLocation>;
}

export interface ReportExceptionResponse {
  ok: boolean;
  attempt_id: string;
  exception_id: string;
  exception_type: DeliveryExceptionType;
  status: string;
  reported_at: string;
}

interface RawDbAttempt {
  id: string;
  tenant_id: string;
  stop_id: string;
  attempt_number: number;
  driver_id: string | null;
  vehicle_plate: string | null;
  state: DeliveryAttemptState;
  correlation_id: string;
  started_at: string | null;
  completed_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

interface RawDbStop {
  id: string;
  tenant_id: string;
  shipment_id: string;
  stop_sequence: number;
  customer_id: string;
  customers?: { name?: string };
  delivery_address: string;
  contact_person?: string;
  contact_phone?: string;
  target_items?: DeliveryStop['targetItems'];
  status: DeliveryStop['status'];
  created_at: string;
  updated_at: string;
  delivery_attempts?: RawDbAttempt[];
}

/**
 * Fetch delivery stops and attempts for a specific shipment.
 */
export async function fetchShipmentDeliveryStops(
  shipmentId: string,
): Promise<Array<DeliveryStop & { attempts?: DeliveryAttempt[] }>> {
  const { data: stops, error } = await untypedDb
    .from('delivery_stops')
    .select('*, delivery_attempts(*)')
    .eq('shipment_id', shipmentId)
    .order('stop_sequence', { ascending: true });

  if (error) {
    throw new Error(`Lỗi khi lấy danh sách điểm giao: ${error.message}`);
  }

  const rawStops = (stops ?? []) as unknown as RawDbStop[];

  return rawStops.map((s) => ({
    id: s.id,
    tenantId: s.tenant_id,
    shipmentId: s.shipment_id,
    stopSequence: s.stop_sequence,
    customerId: s.customer_id,
    customerName: s.customers?.name,
    deliveryAddress: s.delivery_address,
    contactPerson: s.contact_person,
    contactPhone: s.contact_phone,
    targetItems: s.target_items ?? [],
    status: s.status,
    createdAt: s.created_at,
    updatedAt: s.updated_at,
    attempts: (s.delivery_attempts ?? []).map((a) => ({
      id: a.id,
      tenantId: a.tenant_id,
      stopId: a.stop_id,
      attemptNumber: a.attempt_number,
      driverId: a.driver_id,
      vehiclePlate: a.vehicle_plate,
      state: a.state,
      correlationId: a.correlation_id,
      startedAt: a.started_at,
      completedAt: a.completed_at,
      notes: a.notes,
      createdAt: a.created_at,
      updatedAt: a.updated_at,
    })),
  }));
}

/**
 * Executes state transition on a delivery attempt via atomic RPC.
 */
export async function transitionDeliveryAttempt(
  params: TransitionAttemptParams,
): Promise<TransitionAttemptResponse> {
  const commandId = params.commandId ?? crypto.randomUUID();

  const { data, error } = await untypedDb.rpc(
    'rpc_transition_delivery_attempt',
    {
      p_command_id: commandId,
      p_attempt_id: params.attemptId,
      p_expected_state: params.expectedState,
      p_target_state: params.targetState,
      p_telemetry: params.telemetry ?? null,
      p_notes: params.notes ?? null,
    },
  );

  if (error) {
    throw new Error(error.message);
  }

  return data as TransitionAttemptResponse;
}

/**
 * Submits legal ePOD evidence via atomic RPC.
 */
export async function submitDeliveryEPOD(
  params: SubmitEPODParams,
): Promise<SubmitEPODResponse> {
  const commandId = params.commandId ?? crypto.randomUUID();

  const { data, error } = await untypedDb.rpc('rpc_submit_delivery_epod', {
    p_command_id: commandId,
    p_attempt_id: params.attemptId,
    p_expected_state: params.expectedState ?? 'arrived',
    p_receiver: params.receiver,
    p_telemetry: params.telemetry,
    p_evidence_hash: params.evidenceHash,
    p_previous_evidence_hash: params.previousEvidenceHash ?? null,
    p_assets: params.assets ?? [],
  });

  if (error) {
    throw new Error(error.message);
  }

  return data as SubmitEPODResponse;
}

/**
 * Reports a delivery exception via atomic RPC.
 */
export async function reportDeliveryException(
  params: ReportExceptionParams,
): Promise<ReportExceptionResponse> {
  const commandId = params.commandId ?? crypto.randomUUID();

  const { data, error } = await untypedDb.rpc('rpc_report_delivery_exception', {
    p_command_id: commandId,
    p_attempt_id: params.attemptId,
    p_exception_type: params.exceptionType,
    p_reason_detail: params.reasonDetail,
    p_resolution_action: params.resolutionAction ?? null,
    p_resolution_notes: params.resolutionNotes ?? null,
    p_telemetry: params.telemetry ?? null,
  });

  if (error) {
    throw new Error(error.message);
  }

  return data as ReportExceptionResponse;
}
