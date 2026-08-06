// Barrel export for shared UI components
// Import from '@/shared/components' instead of deep paths

export { Icon } from './Icon';
export type { IconName } from './Icon';
export { FAB } from './FAB';

export { AdaptiveSheet } from './AdaptiveSheet';
export { Badge } from './Badge';
export type { BadgeVariant } from './Badge';
export { Combobox } from './Combobox';
export { VPCombobox } from './VPCombobox';
export type { VPComboboxProps, VPComboboxOption } from './VPCombobox';
export { VPVirtualCombobox } from './VPVirtualCombobox';
export type {
  VPVirtualComboboxProps,
  VPVirtualComboboxOption,
} from './VPVirtualCombobox';
export { VPSelect } from './VPSelect';
export type { VPSelectProps, VPOption } from './VPSelect';
export * from './pickers';
export { BasicNumberInput } from './BasicNumberInput';
export { ConfirmProvider, ConfirmContext, useConfirm } from './ConfirmDialog';
export { DataTable } from './DataTable';
export type { Column as DataTableColumn, PaginationConfig } from './DataTable';
export { MediaLibraryModal, type MediaItem } from './media/MediaLibraryModal';
export { DataTableAdvanced } from './DataTableAdvanced';
export type { DataTableAdvancedProps } from './DataTableAdvanced';
export { FilterBar } from './filter-bar';
export type {
  FilterFieldConfig,
  FilterFieldType,
  FilterBarProps,
  ComboboxFilterField,
} from './filter-bar';
export * from './status';
export { default as DraftBanner } from './DraftBanner';
export { EmptyState } from './EmptyState';
export { ErrorBoundary } from './ErrorBoundary';
export { ErrorInline } from './ErrorInline';
export { FeatureScaffoldPage } from './FeatureScaffoldPage';
export { KpiCard, KpiGrid } from './KpiCard';
export type { KpiVariant } from './KpiCard';
export { PagePlaceholder } from './PagePlaceholder';
export { Pagination } from './Pagination';
export { Portal } from './Portal';
export { default as SaveStatus } from './SaveStatus';
export { TableSkeleton } from './TableSkeleton';
export * from './TagInput';
export { TabSwitcher } from './TabSwitcher';
export type { TabItem } from './TabSwitcher';
export { Switch } from './Switch';
export { ViewToggle } from './ViewToggle';
export type { ViewMode } from './ViewToggle';
export * from './PhoneContact';
export { StepperFooter } from './StepperFooter';

export { SearchInput } from './SearchInput';
export { AddButton } from './AddButton';
export { CancelButton } from './CancelButton';
export { ClearFilterButton } from './ClearFilterButton';
export { ProgressBar } from './ProgressBar';
export { Button } from './Button';
export type { ButtonProps } from './Button';
export { ActionBar } from './ActionBar';
export type { ActionConfig } from './ActionBar';
export { ActionMenu } from './ActionMenu';
export * from './ActionMenu';

export * from './Card';
export * from './Input';
export * from './QRCodeDisplay';
export * from './BarcodeDisplay';

export { FadeUp } from './FadeUp';
export { LiveIndicator } from './LiveIndicator';
export { TimelineProgress } from './TimelineProgress';
export type { TimelineStep } from './TimelineProgress';
export * from './EntityLink';
export { ImagePicker } from './ImagePicker';
export { AdvancedImageUploader } from './AdvancedImageUploader';

export { StatCard } from './StatCard';
export type { StatCardProps, StatCardTone } from './StatCard';
export { StatusStepper } from './StatusStepper';
export type { StatusStepperProps, StepItem } from './StatusStepper';

// End of exports
export * from './layout';
export { DebtAgingSection } from './DebtAgingSection';
export * from './DebtDistributionBar';
export { PrintPreviewBox } from './PrintPreviewBox';
export * from '@/shared/value';

export * from '@/shared/value';
export { FilterChips } from './FilterChips';
