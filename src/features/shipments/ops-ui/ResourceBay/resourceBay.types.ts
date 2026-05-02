import React from 'react';

export interface ResourceBayProps {
  id: string;
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  maxSlots: number;
  usedSlots: number;
  children?: React.ReactNode;
}
