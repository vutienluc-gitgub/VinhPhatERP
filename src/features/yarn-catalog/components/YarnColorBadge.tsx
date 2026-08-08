import { useColorOptions } from '@/shared/hooks/useColorOptions';
import { getColorHex } from '@/schema/color.schema';

export function YarnColorBadge({ colorName }: { colorName: string | null }) {
  const { data: colorOptions = [] } = useColorOptions();
  if (!colorName) return null;

  const option = colorOptions.find((c) => c.name === colorName);
  const hex = getColorHex(option ? option.code : colorName);

  return (
    <div className="flex items-center gap-1.5 mt-0.5 text-xs text-muted-foreground">
      <span>Màu:</span>
      <span
        title={colorName}
        className="inline-block w-3 h-3 rounded-full border border-border shrink-0 shadow-sm"
        style={{ background: hex }}
      />
      <span>{colorName}</span>
    </div>
  );
}
