import { memo, useMemo } from 'react';

import { VIEW_TOGGLE_LABELS } from '@/shared/constants/ui.constants';

import {
  SegmentedControl,
  type SegmentedControlOption,
} from './SegmentedControl';
import type { IconName } from './Icon';

export type ViewMode = 'table' | 'grid' | 'kanban' | 'calendar';

interface ModeConfig {
  icon: IconName;
  defaultLabel: string;
  defaultTitle: string;
}

const MODE_CONFIGS: Record<ViewMode, ModeConfig> = {
  table: {
    icon: 'LayoutList',
    defaultLabel: VIEW_TOGGLE_LABELS.TABLE_LABEL,
    defaultTitle: VIEW_TOGGLE_LABELS.TABLE_TITLE,
  },
  grid: {
    icon: 'LayoutGrid',
    defaultLabel: VIEW_TOGGLE_LABELS.GRID_LABEL,
    defaultTitle: VIEW_TOGGLE_LABELS.GRID_TITLE,
  },
  kanban: {
    icon: 'Kanban',
    defaultLabel: VIEW_TOGGLE_LABELS.KANBAN_LABEL,
    defaultTitle: VIEW_TOGGLE_LABELS.KANBAN_TITLE,
  },
  calendar: {
    icon: 'Calendar',
    defaultLabel: VIEW_TOGGLE_LABELS.CALENDAR_LABEL,
    defaultTitle: VIEW_TOGGLE_LABELS.CALENDAR_TITLE,
  },
};

export interface ViewToggleProps {
  value: ViewMode;
  onChange: (mode: ViewMode) => void;
  modes?: ViewMode[];
  showLabels?: boolean;
  labels?: Partial<Record<ViewMode, string>>;
  variant?: 'surface' | 'primary';
  size?: 'sm' | 'md';
  className?: string;
}

export const ViewToggle = memo(function ViewToggle({
  value,
  onChange,
  modes = ['table', 'grid'],
  showLabels = false,
  labels,
  variant = 'surface',
  size = 'sm',
  className,
}: ViewToggleProps) {
  const options = useMemo<SegmentedControlOption<ViewMode>[]>(() => {
    return modes.map((mode) => {
      const config = MODE_CONFIGS[mode] || {
        icon: 'LayoutList',
        defaultLabel: mode,
        defaultTitle: mode,
      };

      const label = labels?.[mode] || config.defaultLabel;

      return {
        value: mode,
        icon: config.icon,
        label: showLabels ? label : undefined,
        title: labels?.[mode] || config.defaultTitle,
      };
    });
  }, [modes, showLabels, labels]);

  return (
    <SegmentedControl
      value={value}
      onChange={onChange}
      options={options}
      variant={variant}
      size={size}
      ariaLabel={VIEW_TOGGLE_LABELS.ARIA_LABEL}
      className={className}
    />
  );
});
