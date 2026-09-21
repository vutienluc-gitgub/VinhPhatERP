import React from 'react';
import { LayoutGrid, List } from 'lucide-react';
import { Button } from './Button';

export function ViewToggle({ mode, onChange }: { mode: 'grid' | 'list'; onChange: (m: 'grid' | 'list') => void }) {
  return (
    <div className="inline-flex rounded-lg border border-slate-200 dark:border-slate-800 p-1 bg-slate-100 dark:bg-slate-800">
      <Button
        size="sm"
        variant={mode === 'list' ? 'secondary' : 'ghost'}
        className="px-2 py-1"
        onClick={() => onChange('list')}
      >
        <List size={16} />
      </Button>
      <Button
        size="sm"
        variant={mode === 'grid' ? 'secondary' : 'ghost'}
        className="px-2 py-1"
        onClick={() => onChange('grid')}
      >
        <LayoutGrid size={16} />
      </Button>
    </div>
  );
}
