import { useMemo } from 'react';

import { Button } from '@/shared/components/Button';
import { ActionMenu } from '@/shared/components/ActionMenu';
import type { IconName } from '@/shared/components/Icon';

export type PageActionConfig = {
  id: string;
  label: string;
  icon?: IconName;
  priority: 'primary' | 'secondary' | 'danger' | 'ghost';
  permission?: string;
  onClick: () => void;
  disabled?: boolean;
};

export interface PageActionsProps {
  actions: PageActionConfig[];
}

/**
 * Action Registry component: render actions as buttons on desktop,
 * and auto-collapse secondary actions into an overflow menu on mobile.
 */
export function PageActions({ actions }: PageActionsProps) {
  const primaryActions = useMemo(
    () => actions.filter((a) => a.priority === 'primary'),
    [actions],
  );

  const secondaryActions = useMemo(
    () => actions.filter((a) => a.priority !== 'primary'),
    [actions],
  );

  const menuItems = useMemo(() => {
    return secondaryActions.map((a) => ({
      label: a.label,
      icon: a.icon,
      onClick: a.onClick,
      disabled: a.disabled,
      danger: a.priority === 'danger',
    }));
  }, [secondaryActions]);

  if (actions.length === 0) return null;

  return (
    <>
      {/* Desktop View: All actions inline */}
      <div className="hidden md:flex items-center gap-2 shrink-0">
        {secondaryActions.map((action) => (
          <Button
            key={action.id}
            variant={
              action.priority === 'danger'
                ? 'danger'
                : action.priority === 'ghost'
                  ? 'ghost'
                  : 'outline'
            }
            leftIcon={action.icon}
            onClick={action.onClick}
            disabled={action.disabled}
          >
            {action.label}
          </Button>
        ))}
        {primaryActions.map((action) => (
          <Button
            key={action.id}
            variant="primary"
            leftIcon={action.icon}
            onClick={action.onClick}
            disabled={action.disabled}
          >
            {action.label}
          </Button>
        ))}
      </div>

      {/* Mobile View: Primary inline, Secondary in Dropdown */}
      <div className="flex md:hidden items-center gap-2 shrink-0">
        {menuItems.length > 0 && (
          <ActionMenu
            items={menuItems}
            triggerIcon="MoreHorizontal"
            placement="left"
          />
        )}
        {primaryActions.map((action) => (
          <Button
            key={action.id}
            variant="primary"
            leftIcon={action.icon}
            onClick={action.onClick}
            disabled={action.disabled}
          >
            {action.label}
          </Button>
        ))}
      </div>
    </>
  );
}
