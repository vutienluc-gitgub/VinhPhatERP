import React, { useState, useRef, useEffect } from 'react';

import { Button } from './Button';
import { Icon, type IconName } from './Icon';
import { Portal } from './Portal';

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
  const [coords, setCoords] = useState<{
    top: number;
    left?: number;
    right?: number;
  } | null>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        menuOpen &&
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        setMenuOpen(false);
      }
    }

    function handleScroll() {
      if (menuOpen) setMenuOpen(false); // Close on scroll for simplicity
    }

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [menuOpen]);

  const toggleMenu = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!menuOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      if (placement === 'left') {
        setCoords({
          top: rect.bottom + window.scrollY,
          left: rect.left + window.scrollX,
        });
      } else {
        // placement === 'right' -> align right edge
        setCoords({
          top: rect.bottom + window.scrollY,
          right: window.innerWidth - rect.right - window.scrollX,
        });
      }
    }
    setMenuOpen(!menuOpen);
  };

  return (
    <div className="relative inline-flex" ref={triggerRef}>
      {children ? (
        <div
          onClick={toggleMenu}
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
          className="rounded-full"
          onClick={toggleMenu}
          leftIcon={triggerIcon}
        />
      )}

      {menuOpen && coords && (
        <Portal>
          <div
            ref={menuRef}
            className="absolute mt-1 w-max min-w-[12rem] bg-surface shadow-2xl border border-border/60 rounded-xl overflow-hidden z-[100] animate-in fade-in zoom-in-95 duration-200"
            style={{
              top: coords.top,
              ...(coords.left !== undefined ? { left: coords.left } : {}),
              ...(coords.right !== undefined ? { right: coords.right } : {}),
            }}
          >
            <div className="p-1.5 flex flex-col gap-0.5">
              {items.map((item) => (
                <React.Fragment key={item.label}>
                  {item.separated && (
                    <div className="h-px bg-border/40 my-1 mx-2" />
                  )}
                  <Button
                    variant="ghost"
                    disabled={item.disabled}
                    className={`w-full justify-start text-left px-3 py-2.5 font-medium rounded-lg h-auto min-h-[44px] gap-2 whitespace-nowrap ${
                      item.disabled
                        ? 'opacity-50 cursor-not-allowed'
                        : item.danger
                          ? 'hover:bg-danger/10 text-danger hover:text-danger'
                          : 'hover:bg-surface-subtle text-foreground'
                    }`}
                    onClick={(e) => {
                      e.stopPropagation();
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
                  </Button>
                </React.Fragment>
              ))}
            </div>
          </div>
        </Portal>
      )}
    </div>
  );
}
