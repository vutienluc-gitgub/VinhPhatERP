import { memo } from 'react';

import { Badge, type BadgeVariant } from '@/shared/components';
import type { FabricCategory } from '@/domain/settings/fabric-category.types';

type FabricCategoryBadgeProps = {
  category: Pick<FabricCategory, 'name' | 'color_hint'> | null | undefined;
  className?: string;
};

function mapColorHintToVariant(
  colorHint: string | null | undefined,
): BadgeVariant {
  switch (colorHint) {
    case 'blue':
      return 'info';
    case 'green':
      return 'success';
    case 'purple':
      return 'purple';
    case 'orange':
      return 'warning';
    case 'pink':
      return 'danger'; // Using danger for pink since there's no native pink variant usually, or warning
    default:
      return 'gray';
  }
}

export const FabricCategoryBadge = memo(function FabricCategoryBadge({
  category,
  className,
}: FabricCategoryBadgeProps) {
  if (!category)
    return <span className="text-muted-foreground text-sm italic">N/A</span>;

  return (
    <Badge
      variant={mapColorHintToVariant(category.color_hint)}
      className={className}
    >
      {category.name}
    </Badge>
  );
});

FabricCategoryBadge.displayName = 'FabricCategoryBadge';
