/* eslint-disable react-refresh/only-export-components */
import React from 'react';

import { Icon } from '@/shared/components';
import {
  CUSTOMER_SOURCES,
  CUSTOMER_SOURCE_LABELS,
  CUSTOMER_SOURCE_ICONS,
} from '@/schema';
import { CRM_STATUS_LABELS, CRM_STATUS_ICONS } from '@/schema/customer.schema';
import { CUSTOMER_FORM_LABELS } from '@/features/customers/customers.constants';

export const SOURCE_OPTIONS = CUSTOMER_SOURCES.map((s) => ({
  value: s,
  label: CUSTOMER_SOURCE_LABELS[s],
  icon: (
    <Icon
      name={
        CUSTOMER_SOURCE_ICONS[s] as React.ComponentProps<typeof Icon>['name']
      }
      className="h-4 w-4 text-muted-foreground"
    />
  ),
}));

export const STATUS_OPTIONS = [
  {
    value: 'active',
    label: CUSTOMER_FORM_LABELS.statusActive,
    icon: <Icon name="check-circle-2" className="h-4 w-4 text-success" />,
  },
  {
    value: 'inactive',
    label: CUSTOMER_FORM_LABELS.statusInactive,
    icon: <Icon name="x-circle" className="h-4 w-4 text-muted-foreground" />,
  },
];

export const LEAD_STATUS_OPTIONS = [
  {
    value: 'lead',
    label: CRM_STATUS_LABELS.lead,
    icon: (
      <Icon
        name={
          CRM_STATUS_ICONS.lead as React.ComponentProps<typeof Icon>['name']
        }
        className="h-4 w-4 text-muted-foreground"
      />
    ),
  },
  {
    value: 'opportunity',
    label: CRM_STATUS_LABELS.opportunity,
    icon: (
      <Icon
        name={
          CRM_STATUS_ICONS.opportunity as React.ComponentProps<
            typeof Icon
          >['name']
        }
        className="h-4 w-4 text-muted-foreground"
      />
    ),
  },
  {
    value: 'customer',
    label: CRM_STATUS_LABELS.customer,
    icon: (
      <Icon
        name={
          CRM_STATUS_ICONS.customer as React.ComponentProps<typeof Icon>['name']
        }
        className="h-4 w-4 text-success"
      />
    ),
  },
  {
    value: 'lost',
    label: CRM_STATUS_LABELS.lost,
    icon: (
      <Icon
        name={
          CRM_STATUS_ICONS.lost as React.ComponentProps<typeof Icon>['name']
        }
        className="h-4 w-4 text-danger"
      />
    ),
  },
];
