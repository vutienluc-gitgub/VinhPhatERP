export interface ProgressExpBarProps {
  percentage: number;
}

export function ProgressExpBar({ percentage }: ProgressExpBarProps) {
  const isCompleted = percentage === 100;

  return (
    <div className="h-[6px] bg-border/50 rounded-full overflow-hidden mb-2 shadow-inner relative">
      <div
        className="absolute top-0 left-0 h-full rounded-full transition-all duration-700 ease-out"
        style={{
          width: `${percentage}%`,
          background: isCompleted
            ? 'linear-gradient(to right, #059669, #10b981)'
            : 'linear-gradient(to right, #2563eb, #3b82f6)',
          boxShadow: isCompleted
            ? '0 0 10px rgba(16, 185, 129, 0.4)'
            : '0 0 10px rgba(59, 130, 246, 0.4)',
        }}
      >
        {/* Stripes effect */}
        <div
          className="w-full h-full opacity-20 animate-[progress-stripes_1s_linear_infinite]"
          style={{
            backgroundImage:
              'linear-gradient(45deg, rgba(255,255,255,1) 25%, transparent 25%, transparent 50%, rgba(255,255,255,1) 50%, rgba(255,255,255,1) 75%, transparent 75%, transparent)',
            backgroundSize: '1rem 1rem',
          }}
        />
      </div>
    </div>
  );
}
