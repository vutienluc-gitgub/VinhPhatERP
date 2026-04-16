import { untypedDb } from '@/services/supabase/untyped';
import { supabase } from '@/services/supabase/client';
import type {
  DriverShipment,
  JourneyLog,
  JourneyStatus,
} from '@/features/driver-portal/types';

type EmployeeSummary = { id: string; name: string; code: string; role: string };

/** Tim employee lien ket voi profile (profiles.employee_id -> employees.id) */
export async function fetchMyDriverEmployee(
  profileId: string,
): Promise<EmployeeSummary | null> {
  // 1. Lay employee_id tu profiles (untypedDb vi column moi chua duoc gen types)
  const { data: profile, error: profileError } = await untypedDb
    .from('profiles')
    .select('employee_id')
    .eq('id', profileId)
    .single();

  if (profileError) throw profileError;

  const employeeId = (profile as { employee_id: string | null } | null)
    ?.employee_id;
  if (!employeeId) return null;

  // 2. Lay employee record
  const { data: employee, error: empError } = await supabase
    .from('employees')
    .select('id, name, code, role')
    .eq('id', employeeId)
    .single();

  if (empError) {
    if (empError.code === 'PGRST116') return null; // not found
    throw empError;
  }

  return employee as EmployeeSummary;
}

/** Lay danh sach phieu xuat duoc phan cong cho tai xe (theo employee_id) */
export async function fetchDriverShipments(
  employeeId: string,
): Promise<DriverShipment[]> {
  const { data, error } = await supabase
    .from('shipments')
    .select(
      'id, shipment_number, shipment_date, status, journey_status, delivery_address, vehicle_info, shipping_cost, loading_fee, customers(name, address), orders(order_number)',
    )
    .eq('delivery_staff_id', employeeId)
    .in('status', ['shipped', 'delivered'])
    .order('shipment_date', { ascending: false });

  if (error) throw error;
  return (data ?? []) as unknown as DriverShipment[];
}

/** Lay lich su cap nhat hanh trinh cua mot phieu xuat */
export async function fetchJourneyLogs(
  shipmentId: string,
): Promise<JourneyLog[]> {
  const { data, error } = await untypedDb
    .from('shipment_journey_logs')
    .select('*')
    .eq('shipment_id', shipmentId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return (data ?? []) as JourneyLog[];
}

/** Cap nhat moc hanh trinh atomic */
export async function updateJourneyStatus(
  shipmentId: string,
  journeyStatus: JourneyStatus,
  notes: string | null,
  updatedBy: string | null,
): Promise<void> {
  const { error } = await untypedDb.rpc('atomic_update_shipment_journey', {
    p_shipment_id: shipmentId,
    p_journey_status: journeyStatus,
    p_notes: notes,
    p_updated_by: updatedBy,
  });
  if (error) {
    if (error.message?.includes('SHIPMENT_NOT_IN_TRANSIT'))
      throw new Error(
        'Phieu xuat phai o trang thai "Dang giao" moi cap nhat hanh trinh.',
      );
    if (error.message?.includes('SHIPMENT_NOT_FOUND'))
      throw new Error('Khong tim thay phieu xuat.');
    throw error;
  }
}
