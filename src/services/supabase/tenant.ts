import { supabase } from './client';

let currentTenantId: string = 'tenant-vinhphat-001';

export function getTenantId(): string {
  return currentTenantId;
}

export function setTenantId(id: string): void {
  currentTenantId = id;
}

export function resetTenantCache(): void {
  console.log('Resetting tenant cache');
}

export function getTenantSupabase() {
  return supabase;
}


// Auto-generated missing exports
export const withTenantId: any = (...args: any[]) => ({});
