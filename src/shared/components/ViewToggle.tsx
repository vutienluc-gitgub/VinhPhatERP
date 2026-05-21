import { Button } from './Button';

export type ViewMode = 'table' | 'grid';

interface Props {
  value: ViewMode;
  onChange: (mode: ViewMode) => void;
}

export function ViewToggle({ value, onChange }: Props) {
  return (
    <div className="inline-flex gap-1 bg-surface-subtle p-1 rounded-xl border border-border items-center">
      <Button
        variant={value === 'table' ? 'primary' : 'ghost'}
        size="icon"
        onClick={() => onChange('table')}
        title="Dạng bảng"
        leftIcon="LayoutList"
      />
      <Button
        variant={value === 'grid' ? 'primary' : 'ghost'}
        size="icon"
        onClick={() => onChange('grid')}
        title="Dạng lưới"
        leftIcon="LayoutGrid"
      />
    </div>
  );
}
