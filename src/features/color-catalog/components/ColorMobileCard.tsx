import { Badge } from '@/shared/components';
import type { ColorRow } from '@/schema/color.schema';
import { getColorHex } from '@/schema/color.schema';
import { getColorGroupVariant } from '@/features/color-catalog/color-catalog.constants';

export function ColorMobileCard({
  color,
  onClick,
}: {
  color: ColorRow;
  onClick: () => void;
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') onClick();
      }}
      className="mobile-card flex items-start justify-between gap-3 p-4 border-b border-border hover:bg-surface-subtle transition-colors cursor-pointer"
    >
      <div className="flex items-start gap-3">
        <span
          title={getColorHex(color.code)}
          className="inline-block w-8 h-8 rounded-full border-[1.5px] border-border shrink-0 mt-0.5"
          style={{ background: getColorHex(color.code) }}
        />
        <div>
          <div className="font-mono text-xs font-bold text-primary mb-1">
            {color.code}
          </div>
          <div className="font-medium text-text">{color.name}</div>
        </div>
      </div>
      <div>
        {color.color_group ? (
          <Badge
            variant={getColorGroupVariant(color.color_group)}
            className="text-[10px]"
          >
            {color.color_group}
          </Badge>
        ) : (
          <span className="text-muted text-xs">—</span>
        )}
      </div>
    </div>
  );
}
