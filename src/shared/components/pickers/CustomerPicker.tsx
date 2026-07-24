import { useCustomerList } from '@/application/crm/useCustomers';
import { VPCombobox } from '@/shared/components/VPCombobox';
import type { Customer } from '@/domain/crm/customers.types';

type CustomerPickerProps = {
  value?: string;
  onChange: (val: string) => void;
  disabled?: boolean;
  hasError?: boolean;
  placeholder?: string;
  className?: string;
};

export function CustomerPicker({
  value,
  onChange,
  disabled,
  hasError,
  placeholder = 'Chọn khách hàng...',
  className,
}: CustomerPickerProps) {
  const { data: customerResult, isLoading } = useCustomerList();

  const customers = Array.isArray(customerResult)
    ? customerResult
    : customerResult?.data || [];

  const options = customers.map((c: Customer) => ({
    value: c.id,
    label: c.name,
    code: c.code,
    phone: c.phone ?? undefined,
  }));

  return (
    <VPCombobox
      options={options}
      value={value}
      onChange={onChange}
      disabled={disabled}
      loading={isLoading}
      hasError={hasError}
      placeholder={placeholder}
      className={className}
      searchPlaceholder="Tìm kiếm khách hàng..."
      emptyText="Không tìm thấy khách hàng."
    />
  );
}
