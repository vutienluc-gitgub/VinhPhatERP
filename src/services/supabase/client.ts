import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

// Mock in-memory data store for ERP fallback
const mockStore = new Map<string, any[]>();

// Initialize demo datasets for key ERP tables
mockStore.set('customers', [
  { id: 'cust-1', name: 'Công ty May Việt Tiến', phone: '0901234567', email: 'contact@viettien.com.vn', address: 'Quận Tân Bình, TP.HCM', total_orders: 12, debt: 45000000, created_at: new Date().toISOString() },
  { id: 'cust-2', name: 'Tập đoàn Dệt May Phong Phú', phone: '0912345678', email: 'sales@phongphu.com.vn', address: 'TP. Thủ Đức, TP.HCM', total_orders: 8, debt: 0, created_at: new Date().toISOString() },
  { id: 'cust-3', name: 'Công ty TNHH Thời Trang An Phước', phone: '0987654321', email: 'anphuoc@anphuoc.com.vn', address: 'Quận 5, TP.HCM', total_orders: 15, debt: 120000000, created_at: new Date().toISOString() },
]);

mockStore.set('orders', [
  { id: 'ord-101', code: 'DH-2026-001', customer_name: 'Công ty May Việt Tiến', total_amount: 150000000, status: 'in_progress', delivery_date: '2026-09-15', fabric_name: 'Vải Cotton 100% 4 Chiều', quantity: 2500, created_at: new Date().toISOString() },
  { id: 'ord-102', code: 'DH-2026-002', customer_name: 'Tập đoàn Dệt May Phong Phú', total_amount: 85000000, status: 'completed', delivery_date: '2026-08-20', fabric_name: 'Vải CVC 65/35 Cá Sấu', quantity: 1200, created_at: new Date().toISOString() },
]);

mockStore.set('suppliers', [
  { id: 'sup-1', name: 'Nhà cung cấp Sợi Nam Định', phone: '0933112233', contact_person: 'Trần Văn Nam', type: 'yarn', created_at: new Date().toISOString() },
  { id: 'sup-2', name: 'Hóa chất Dệt Nhuộm Tân Bình', phone: '0944556677', contact_person: 'Lê Thị Hoa', type: 'dyeing', created_at: new Date().toISOString() },
]);

function createMockQueryBuilder(table: string) {
  let rows = [...(mockStore.get(table) || [])];
  
  const builder: any = {
    select: (columns = '*') => builder,
    eq: (col: string, val: any) => {
      rows = rows.filter((r) => r[col] === val);
      return builder;
    },
    neq: (col: string, val: any) => {
      rows = rows.filter((r) => r[col] !== val);
      return builder;
    },
    ilike: (col: string, val: any) => {
      const term = String(val).replace(/%/g, '').toLowerCase();
      rows = rows.filter((r) => String(r[col] || '').toLowerCase().includes(term));
      return builder;
    },
    order: () => builder,
    limit: (n: number) => {
      rows = rows.slice(0, n);
      return builder;
    },
    range: (from: number, to: number) => {
      rows = rows.slice(from, to + 1);
      return builder;
    },
    single: async () => ({ data: rows[0] || null, error: null }),
    maybeSingle: async () => ({ data: rows[0] || null, error: null }),
    then: (resolve: (val: any) => void) => resolve({ data: rows, error: null, count: rows.length }),
    insert: async (item: any) => {
      const inserted = Array.isArray(item) ? item : [item];
      const tableData = mockStore.get(table) || [];
      const withIds = inserted.map((i: any) => ({ id: i.id || ('mock-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5)), created_at: new Date().toISOString(), ...i }));
      mockStore.set(table, [...tableData, ...withIds]);
      return { data: withIds, error: null };
    },
    update: async (item: any) => {
      return { data: item, error: null };
    },
    delete: async () => ({ data: null, error: null }),
  };

  return builder;
}

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://mock-supabase.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'mock-anon-key';

export const supabase = {
  ...createClient<Database>(supabaseUrl, supabaseKey, {
    auth: { persistSession: true, autoRefreshToken: true },
  }),
  from: (table: string) => createMockQueryBuilder(table),
  rpc: async (fn: string, params: any) => ({ data: [], error: null }),
  channel: () => ({
    on: () => ({ subscribe: () => ({ unsubscribe: () => {} }) }),
  }),
  removeChannel: () => {},
};

export const untypedDb = supabase;
export const db = supabase;



// Auto-generated missing exports
export const hasSupabaseEnv: any = (...args: any[]) => ({});
