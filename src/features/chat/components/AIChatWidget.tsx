import { useState } from 'react';

import { AIChatDrawer } from '@/features/chat/components/AIChatDrawer';
import { Icon } from '@/shared/components/Icon';

interface AIChatWidgetProps {
  className?: string;
}

/**
 * Floating trigger button for the AI Assistant drawer.
 */
export function AIChatWidget({ className = '' }: AIChatWidgetProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={`fixed bottom-5 right-5 z-40 w-12 h-12 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:scale-105 active:scale-95 transition-transform border-none cursor-pointer group ${className}`}
        aria-label="Mở Trợ lý AI Vịnh Phát"
        title="Trợ lý AI Vịnh Phát"
      >
        <Icon
          name="Sparkles"
          size={22}
          className="transition-transform group-hover:rotate-12"
        />
      </button>

      <AIChatDrawer open={open} onClose={() => setOpen(false)} />
    </>
  );
}
