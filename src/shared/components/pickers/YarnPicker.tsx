import { useYarnCatalogOptions } from '@/shared/hooks/useYarnCatalogOptions';
import { VPCombobox } from '@/shared/components/VPCombobox';

type YarnPickerProps = {
  value?: string;
  onChange: (val: string) => void;
  disabled?: boolean;
  hasError?: boolean;
  placeholder?: string;
  className?: string;
};

export function YarnPicker({
  value,
  onChange,
  disabled,
  hasError,
  placeholder = 'Chọn loại sợi...',
  className,
}: YarnPickerProps) {
  const { data: yarns = [], isLoading } = useYarnCatalogOptions();

  const options = yarns.map((y) => ({
    value: y.id,
    label: y.name,
    code: y.code,
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
      searchPlaceholder="Tìm kiếm sợi..."
      emptyText="Không tìm thấy loại sợi."
    />
  );
}
