import React, { useState, useRef, useEffect } from 'react';

import { Button } from './Button';
import { Icon, type IconName } from './Icon';

export type ActionMenuItem = {
  label: string;
  icon?: IconName;
  iconClass?: string;
  onClick: () => void;
  danger?: boolean;
  separated?: boolean;
  disabled?: boolean;
};

interface ActionMenuProps {
  items: ActionMenuItem[];
  triggerIcon?: IconName;
  placement?: 'left' | 'right';
  children?: React.ReactNode;
}

export function ActionMenu({
  items,
  triggerIcon = 'MoreVertical',
  placement = 'right',
  children,
}: ActionMenuProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const placementClass = placement === 'left' ? 'left-0' : 'right-0';

  return (
    <div className="relative inline-flex" ref={menuRef}>
      {children ? (
        <div
          onClick={() => setMenuOpen(!menuOpen)}
          className="inline-flex cursor-pointer"
          role="button"
          tabIndex={0}
        >
          {children}
        </div>
      ) : (
        <Button
          variant="ghost"
          size="icon"
          className="w-8 h-8 rounded-full min-h-0 min-w-0"
          onClick={() => setMenuOpen(!menuOpen)}
          leftIcon={triggerIcon}
        />
      )}

      {menuOpen && (
        <div
          className={`absolute ${placementClass} top-full mt-2 w-max min-w-[12rem] bg-surface shadow-2xl border border-border/60 rounded-xl overflow-hidden z-[100] animate-in fade-in zoom-in-95 duration-200`}
        >
          <div className="p-1.5 flex flex-col gap-0.5">
            {items.map((item, index) => (
              <React.Fragment key={index}>
                {item.separated && (
                  <div className="h-px bg-border/40 my-1 mx-2" />
                )}
                <button
                  type="button"
                  disabled={item.disabled}
                  className={`w-full text-left px-3 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap ${
                    item.disabled
                      ? 'opacity-50 cursor-not-allowed'
                      : item.danger
                        ? 'hover:bg-danger/10 hover:text-danger'
                        : 'hover:bg-surface-subtle text-foreground'
                  }`}
                  onClick={() => {
                    if (item.disabled) return;
                    setMenuOpen(false);
                    item.onClick();
                  }}
                >
                  {item.icon && (
                    <Icon
                      name={item.icon}
                      size={16}
                      className={
                        item.iconClass ||
                        (item.danger ? 'text-danger/80' : 'text-muted')
                      }
                    />
                  )}
                  {item.label}
                </button>
              </React.Fragment>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
