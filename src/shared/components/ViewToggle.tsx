import { Icon } from './Icon';

export type ViewMode = 'table' | 'grid';

interface Props {
  value: ViewMode;
  onChange: (mode: ViewMode) => void;
}

export function ViewToggle({ value, onChange }: Props) {
  return (
    <div className="inline-flex gap-1 bg-surface-subtle p-1 rounded-[10px] border border-border items-center">
      <button
        type="button"
        className={`btn-icon w-[34px] h-[34px] border-none rounded-lg flex items-center justify-center transition-all duration-200 ${value === 'table' ? 'bg-primary text-white shadow-md scale-105' : 'text-muted hover:text-text'}`}
        onClick={() => onChange('table')}
        title="Dạng bảng"
      >
        <Icon name="LayoutList" size={18} />
      </button>
      <button
        type="button"
        className={`btn-icon w-[34px] h-[34px] border-none rounded-lg flex items-center justify-center transition-all duration-200 ${value === 'grid' ? 'bg-primary text-white shadow-md scale-105' : 'text-muted hover:text-text'}`}
        onClick={() => onChange('grid')}
        title="Dạng lưới"
      >
        <Icon name="LayoutGrid" size={18} />
      </button>
    </div>
  );
}
