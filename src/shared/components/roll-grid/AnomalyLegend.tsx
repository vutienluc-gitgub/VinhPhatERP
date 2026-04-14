import { ChartLegend } from '@/shared/components/ChartLegend';

/**
 * AnomalyLegend - Cập nhật dùng Component hệ thống.
 * Chỉ hiện 2 màu bất thường (light/heavy).
 */
export function AnomalyLegend() {
  return (
    <ChartLegend
      items={[
        {
          label: 'Nhẹ',
          color: 'danger',
          tooltip: 'Nhẹ hơn chuẩn',
        },
        {
          label: 'Nặng',
          color: 'warning',
          tooltip: 'Nặng hơn chuẩn',
        },
      ]}
    />
  );
}
