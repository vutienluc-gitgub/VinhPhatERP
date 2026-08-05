import React, { forwardRef } from 'react';
import { clsx } from 'clsx';

import { Icon, type IconName } from '@/shared/components/Icon';
import { useInteraction } from '@/shared/interaction/engine/useInteraction';
import { useAttention } from '@/shared/interaction/engine/useAttention';
import type {
  InteractionDomain,
  AttentionType,
  AttentionPolicy,
  InteractionIntent,
} from '@/shared/interaction/engine/types';

export interface TableRowInteractionProps extends React.HTMLAttributes<HTMLTableRowElement> {
  interactionDomain?: InteractionDomain;
  intent?: InteractionIntent;
  attention?: AttentionType | AttentionPolicy;
  children: React.ReactNode;
}

export const TableRowInteraction = forwardRef<
  HTMLTableRowElement,
  TableRowInteractionProps
>(
  (
    {
      interactionDomain = 'default',
      intent = 'default',
      attention,
      className,
      children,
      onClick,
      ...props
    },
    ref,
  ) => {
    const interaction = useInteraction(interactionDomain, intent);
    const attentionData = useAttention(attention);

    // Support keyboard navigation (Enter key)
    const handleKeyDown = (e: React.KeyboardEvent<HTMLTableRowElement>) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if (onClick) {
          onClick(
            e as unknown as React.MouseEvent<HTMLTableRowElement, MouseEvent>,
          );
        }
      }
      if (props.onKeyDown) props.onKeyDown(e);
    };

    return (
      <tr
        ref={ref}
        tabIndex={onClick ? 0 : undefined}
        className={clsx(
          interaction.wrapperClassName,
          attentionData.className,
          'relative overflow-hidden outline-none',
          className,
        )}
        style={{ ...interaction.style, ...attentionData.style }}
        onClick={onClick}
        onKeyDown={handleKeyDown}
        {...props}
      >
        {/* Render Left Accent if variant is detail */}
        {interaction.variant === 'detail' && (
          <td className="p-0 m-0 w-0 border-0 outline-none absolute inset-y-0 left-0 pointer-events-none z-10">
            <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-[rgba(var(--interaction-rgb),1)] opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity duration-200" />
            <div className="absolute left-2 top-1/2 -translate-y-1/2 text-[rgba(var(--interaction-rgb),1)] opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 group-focus-visible:opacity-100 group-focus-visible:translate-x-0 transition-all duration-200">
              {interaction.icon && (
                <Icon
                  name={interaction.icon as IconName}
                  size={16}
                  strokeWidth={2.5}
                />
              )}
            </div>
          </td>
        )}
        {children}
      </tr>
    );
  },
);

TableRowInteraction.displayName = 'TableRowInteraction';
