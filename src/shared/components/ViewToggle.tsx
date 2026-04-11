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
        className={`btn-icon transition-all duration-200 ${value === 'table' ? 'bg-primary text-white shadow-md scale-105' : 'text-muted hover:text-text'}`}
        onClick={() => onChange('table')}
        title="Dạng bảng"
        style={{
          width: 34,
          height: 34,
          border: 'none',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon name="LayoutList" size={18} />
      </button>
      <button
        type="button"
        className={`btn-icon transition-all duration-200 ${value === 'grid' ? 'bg-primary text-white shadow-md scale-105' : 'text-muted hover:text-text'}`}
        onClick={() => onChange('grid')}
        title="Dạng lưới"
        style={{
          width: 34,
          height: 34,
          border: 'none',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon name="LayoutGrid" size={18} />
      </button>
    </div>
  );
}
