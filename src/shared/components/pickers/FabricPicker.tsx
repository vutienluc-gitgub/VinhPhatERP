import { useFabricCatalogOptions } from '@/application/settings/useFabricCatalog';
import { VPCombobox } from '@/shared/components/VPCombobox';

type FabricPickerProps = {
  value?: string;
  onChange: (val: string) => void;
  disabled?: boolean;
  hasError?: boolean;
  placeholder?: string;
  className?: string;
};

export function FabricPicker({
  value,
  onChange,
  disabled,
  hasError,
  placeholder = 'Chọn loại vải...',
  className,
}: FabricPickerProps) {
  const { data: fabrics = [], isLoading } = useFabricCatalogOptions();

  const options = fabrics.map((f) => ({
    value: f.id,
    label: f.name,
    code: f.code,
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
      searchPlaceholder="Tìm kiếm vải..."
      emptyText="Không tìm thấy loại vải."
    />
  );
}
