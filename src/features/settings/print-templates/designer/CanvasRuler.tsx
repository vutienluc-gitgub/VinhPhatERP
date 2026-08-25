interface CanvasRulerProps {
  widthMm: number;
  heightMm: number;
  zoomLevel: number;
}

export function CanvasRuler({
  widthMm,
  heightMm,
  zoomLevel,
}: CanvasRulerProps) {
  // Generate millimeter ticks every 10mm and 50mm
  const horizontalTicksCount = Math.floor(widthMm / 10);
  const verticalTicksCount = Math.floor(heightMm / 10);

  return (
    <>
      {/* Horizontal Top Ruler */}
      <div
        className="absolute top-0 left-8 right-0 h-6 bg-surface-secondary/90 border-b border-default text-[9px] font-mono text-muted select-none flex items-end overflow-hidden pointer-events-none"
        style={{ width: `${widthMm * 3.78 * zoomLevel}px` }}
      >
        {Array.from({ length: horizontalTicksCount + 1 }).map((_, i) => {
          const mm = i * 10;
          const isMajor = mm % 50 === 0;
          return (
            <div
              key={mm}
              className="absolute bottom-0 flex flex-col items-center"
              style={{ left: `${mm * 3.78 * zoomLevel}px` }}
            >
              {isMajor && (
                <span className="text-[8px] font-semibold -top-3 absolute text-foreground/80">
                  {mm}
                </span>
              )}
              <div
                className={`w-[1px] bg-default ${
                  isMajor ? 'h-3.5 bg-foreground/40' : 'h-1.5'
                }`}
              />
            </div>
          );
        })}
      </div>

      {/* Vertical Left Ruler */}
      <div
        className="absolute top-6 left-0 bottom-0 w-8 bg-surface-secondary/90 border-r border-default text-[9px] font-mono text-muted select-none flex flex-col items-end overflow-hidden pointer-events-none"
        style={{ height: `${heightMm * 3.78 * zoomLevel}px` }}
      >
        {Array.from({ length: verticalTicksCount + 1 }).map((_, i) => {
          const mm = i * 10;
          const isMajor = mm % 50 === 0;
          return (
            <div
              key={mm}
              className="absolute right-0 flex items-center justify-end"
              style={{ top: `${mm * 3.78 * zoomLevel}px` }}
            >
              {isMajor && (
                <span className="text-[8px] font-semibold right-3 absolute text-foreground/80">
                  {mm}
                </span>
              )}
              <div
                className={`h-[1px] bg-default ${
                  isMajor ? 'w-3.5 bg-foreground/40' : 'w-1.5'
                }`}
              />
            </div>
          );
        })}
      </div>

      {/* Top Left Corner */}
      <div className="absolute top-0 left-0 w-8 h-6 bg-surface-secondary border-r border-b border-default z-10 flex items-center justify-center text-[8px] font-mono text-muted">
        mm
      </div>
    </>
  );
}
