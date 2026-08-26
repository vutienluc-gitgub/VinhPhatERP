import type { Customer } from '@/domain/crm/customers.types';
import type { CustomersFormValues, LeadStatus } from '@/schema/customer.schema';

const ALLOWED_PHONE_KEYS = [
  'Backspace',
  'Delete',
  'ArrowLeft',
  'ArrowRight',
  'Tab',
  'Home',
  'End',
  'Enter',
  'Escape',
];

export function onPhoneKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
  if (
    !ALLOWED_PHONE_KEYS.includes(e.key) &&
    !e.ctrlKey &&
    !e.metaKey &&
    !/^[0-9\s\-().+]$/.test(e.key)
  ) {
    e.preventDefault();
  }
}

export function customerToFormValues(customer: Customer): CustomersFormValues {
  return {
    code: customer.code,
    name: customer.name,
    phone: customer.phone ?? '',
    email: customer.email ?? '',
    address: customer.address ?? '',
    tax_code: customer.tax_code ?? '',
    contact_person: customer.contact_person ?? '',
    source: customer.source ?? 'other',
    notes: customer.notes ?? '',
    status: customer.status,
    salesperson_id: customer.salesperson_id ?? '',
    lead_status: (customer.lead_status as LeadStatus) || 'lead',
  };
}
