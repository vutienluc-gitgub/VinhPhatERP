import { useCallback, useEffect, useRef, useState } from 'react';

import { Icon, Button } from '@/shared/components';
import type { ContractType } from '@/schema';

// ── Props ────────────────────────────────────────────────────────────────────

type NewTemplateMenuProps = {
  onSelect: (type: ContractType) => void;
};

// ── Component ────────────────────────────────────────────────────────────────

export function NewTemplateMenu({ onSelect }: NewTemplateMenuProps) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  function handleSelect(type: ContractType) {
    setOpen(false);
    onSelect(type);
  }

  const handleClickOutside = useCallback((e: Event) => {
    if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
      setOpen(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [open, handleClickOutside]);

  return (
    <div className="relative" ref={menuRef}>
      <Button
        variant="primary"
        type="button"
        className="h-[48px] px-6 shadow-lg shadow-primary/20 flex items-center gap-2.5 rounded-2xl font-black text-sm transition-all hover:-translate-y-0.5 active:scale-95"
        onClick={() => setOpen((v) => !v)}
      >
        <Icon name="Plus" size={20} />
        TẠO MẪU MỚI
        <div
          className={`ml-1 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        >
          <Icon name="ChevronDown" size={14} />
        </div>
      </Button>

      {open && (
        <div className="absolute right-0 top-full mt-2.5 z-[50] w-64 p-2 rounded-2xl border border-border/60 bg-surface shadow-2xl animate-in zoom-in-95 duration-200 origin-top-right">
          <button
            type="button"
            className="w-full text-left px-4 py-3.5 rounded-xl text-sm font-bold hover:bg-emerald-600 hover:text-surface flex items-center gap-3 transition-all group"
            onClick={() => handleSelect('sale')}
          >
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 group-hover:bg-surface/20 group-hover:text-surface transition-colors">
              <Icon name="BadgeDollarSign" size={16} />
            </div>
            Bản mẫu Bán hàng
          </button>
          <button
            type="button"
            className="w-full text-left px-4 py-3.5 rounded-xl text-sm font-bold hover:bg-blue-600 hover:text-surface flex items-center gap-3 mt-1 transition-all group"
            onClick={() => handleSelect('purchase')}
          >
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600 group-hover:bg-surface/20 group-hover:text-surface transition-colors">
              <Icon name="ShoppingCart" size={16} />
            </div>
            Bản mẫu Mua hàng
          </button>
        </div>
      )}
    </div>
  );
}
