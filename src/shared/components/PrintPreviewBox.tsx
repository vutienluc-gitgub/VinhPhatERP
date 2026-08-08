import React, { useState } from 'react';

interface PrintPreviewBoxProps {
  title?: string;
  zoomLevels?: number[];
  defaultZoom?: number;
  children: React.ReactNode;
}

export function PrintPreviewBox({
  title = 'XEM TRƯỚC BẢN IN',
  zoomLevels = [1, 1.25, 1.5],
  defaultZoom = 1,
  children,
}: PrintPreviewBoxProps) {
  const [zoom, setZoom] = useState(defaultZoom);

  return (
    <div className="w-full flex flex-col items-center gap-4">
      <div className="flex items-center justify-between w-full">
        <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-widest">
          {title}
        </h3>
        <div className="flex gap-1 bg-[var(--surface-subtle)] border border-[var(--border)] p-1 rounded-lg">
          {zoomLevels.map((level) => (
            <button
              key={level}
              type="button"
              onClick={() => setZoom(level)}
              className={`px-3 py-1 text-xs font-bold rounded transition-colors ${
                zoom === level
                  ? 'bg-surface shadow-sm text-foreground'
                  : 'text-muted-foreground hover:text-[var(--foreground)]'
              }`}
            >
              {level * 100}%
            </button>
          ))}
        </div>
      </div>
      <div className="bg-[var(--surface-strong)] p-8 rounded-2xl w-full flex justify-center border border-[var(--border)] overflow-hidden">
        <div
          className="shadow-xl border border-[var(--border)] transform transition-transform"
          style={{
            transform: `scale(${zoom})`,
            transformOrigin: 'top center',
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
