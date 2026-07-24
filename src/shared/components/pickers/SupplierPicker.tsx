import { useSuppliersList } from '@/application/crm/useSuppliers';
import { VPCombobox } from '@/shared/components/VPCombobox';

type SupplierPickerProps = {
  value?: string;
  onChange: (val: string) => void;
  disabled?: boolean;
  hasError?: boolean;
  placeholder?: string;
  className?: string;
};

export function SupplierPicker({
  value,
  onChange,
  disabled,
  hasError,
  placeholder = 'Chọn nhà cung cấp...',
  className,
}: SupplierPickerProps) {
  const { data: suppliersResult, isLoading } = useSuppliersList();

  const suppliers = Array.isArray(suppliersResult)
    ? suppliersResult
    : suppliersResult?.data || [];

  const options = suppliers.map((s) => ({
    value: s.id,
    label: s.name,
    code: s.code,
    phone: s.phone,
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
      searchPlaceholder="Tìm kiếm nhà cung cấp..."
      emptyText="Không tìm thấy nhà cung cấp."
    />
  );
}
