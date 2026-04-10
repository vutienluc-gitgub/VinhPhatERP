import { Icon } from './Icon';

export type ViewMode = 'table' | 'grid';

interface Props {
  value: ViewMode;
  onChange: (mode: ViewMode) => void;
}

export function ViewToggle({ value, onChange }: Props) {
  return (
    <div className="inline-flex gap-1 bg-surface-subtle p-1 rounded-lg border border-border">
      <button
        type="button"
        className={`btn-icon${value === 'table' ? ' bg-surface-strong shadow-sm text-primary' : ' text-muted'}`}
        onClick={() => onChange('table')}
        title="Dang bang"
        style={{
          width: 36,
          height: 36,
          border: 'none',
        }}
      >
        <Icon name="LayoutList" size={20} />
      </button>
      <button
        type="button"
        className={`btn-icon${value === 'grid' ? ' bg-surface-strong shadow-sm text-primary' : ' text-muted'}`}
        onClick={() => onChange('grid')}
        title="Dang luoi"
        style={{
          width: 36,
          height: 36,
          border: 'none',
        }}
      >
        <Icon name="LayoutGrid" size={20} />
      </button>
    </div>
  );
}
