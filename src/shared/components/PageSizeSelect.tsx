import { TABLE_LABELS } from '@/shared/constants/ui.constants';

import { VPSelect, VPOption } from './VPSelect';

type PageSizeSelectProps = {
  value: number;
  onValueChange: (value: number) => void;
  options?: number[];
  disabled?: boolean;
};

const DEFAULT_OPTIONS = [10, 20, 30, 40, 50, 100];

export function PageSizeSelect({
  value,
  onValueChange,
  options = DEFAULT_OPTIONS,
  disabled = false,
}: PageSizeSelectProps) {
  const selectOptions: VPOption<number>[] = options.map((pageSize) => ({
    value: pageSize,
    label: `${pageSize} ${TABLE_LABELS.ROWS_SUFFIX}`,
  }));

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted whitespace-nowrap">
        {TABLE_LABELS.DISPLAY_LABEL}
      </span>
      <VPSelect<number>
        value={value}
        onValueChange={onValueChange}
        options={selectOptions}
        disabled={disabled}
        size="sm"
        className="w-28"
      />
    </div>
  );
}
