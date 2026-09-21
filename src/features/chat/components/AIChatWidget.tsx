import { useEffect, useState } from 'react';

import { AIChatDrawer } from '@/features/chat/components/AIChatDrawer';
import { Icon } from '@/shared/components/Icon';

interface AIChatWidgetProps {
  className?: string;
}

/**
 * Floating trigger button for the AI Assistant drawer.
 * Supports Ctrl+J / Cmd+J keyboard shortcut.
 */
export function AIChatWidget({ className = '' }: AIChatWidgetProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'j') {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={`fixed bottom-5 right-5 z-40 h-12 px-3.5 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center gap-2 hover:scale-105 active:scale-95 transition-transform border-none cursor-pointer group ${className}`}
        aria-label="Mở Trợ lý AI Vịnh Phát"
        title="Trợ lý AI Vịnh Phát (Ctrl+J)"
      >
        <Icon
          name="Sparkles"
          size={20}
          className="transition-transform group-hover:rotate-12 text-primary-foreground"
        />
        <span className="hidden sm:inline font-medium text-xs tracking-wide">
          Trợ lý AI
        </span>
        <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded bg-primary-foreground/20 text-[10px] font-mono leading-none">
          Ctrl+J
        </kbd>
      </button>

      <AIChatDrawer open={open} onClose={() => setOpen(false)} />
    </>
  );
}
