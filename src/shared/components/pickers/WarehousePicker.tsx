import { useEmployees } from '@/shared/hooks/useEmployeeOptions';
import { VPCombobox } from '@/shared/components/VPCombobox';

type WarehousePickerProps = {
  value?: string;
  onChange: (val: string) => void;
  disabled?: boolean;
  hasError?: boolean;
  placeholder?: string;
  className?: string;
};

export function WarehousePicker({
  value,
  onChange,
  disabled,
  hasError,
  placeholder = 'Chọn nhân viên kho...',
  className,
}: WarehousePickerProps) {
  const { data: employees = [], isLoading } = useEmployees({
    role: 'warehouse',
    status: 'active',
  });

  const options = employees.map((emp) => ({
    value: emp.id,
    label: emp.name,
    code: emp.code,
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
      searchPlaceholder="Tìm kiếm..."
      emptyText="Không tìm thấy nhân viên."
    />
  );
}
