/**
 * YarnAvailabilityWarning — Hiển thị cảnh báo inline khi sợi không đủ.
 *
 * Dùng trong WorkOrderForm / WorkOrderYarnTable để người dùng biết
 * ngay lập tức sợi nào đang thiếu trước khi xuất kho.
 */
import { useYarnAvailability } from '@/application/production/useYarnReservation';
import { Icon } from '@/shared/components';

interface YarnRequirementRow {
  yarn_catalog_id: string;
  required_kg: number;
}

interface YarnAvailabilityWarningProps {
  requirements: YarnRequirementRow[];
}

export function YarnAvailabilityWarning({
  requirements,
}: YarnAvailabilityWarningProps) {
  const { data: availability, isLoading } = useYarnAvailability();

  if (isLoading || !availability || requirements.length === 0) {
    return null;
  }

  const warnings: Array<{
    yarnName: string;
    required: number;
    available: number;
  }> = [];

  for (const req of requirements) {
    if (!req.yarn_catalog_id || req.required_kg <= 0) continue;

    const yarn = availability.find((y) => y.id === req.yarn_catalog_id);
    if (!yarn) continue;

    if (yarn.available_qty < req.required_kg) {
      warnings.push({
        yarnName: `${yarn.code} - ${yarn.name}${yarn.color_name ? ` (${yarn.color_name})` : ''}`,
        required: req.required_kg,
        available: yarn.available_qty,
      });
    }
  }

  if (warnings.length === 0) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
        <Icon name="CircleCheck" size={14} />
        <span className="font-medium">
          Tồn kho đủ cho tất cả loại sợi yêu cầu
        </span>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 space-y-2">
      <div className="flex items-center gap-2 text-xs font-bold text-amber-800">
        <Icon name="TriangleAlert" size={14} />
        <span>Cảnh báo tồn kho không đủ ({warnings.length} loại sợi)</span>
      </div>
      <div className="space-y-1">
        {warnings.map((w) => (
          <div
            key={w.yarnName}
            className="flex items-center justify-between text-[11px] text-amber-700 bg-white/60 rounded-md px-2 py-1.5"
          >
            <span
              className="font-medium truncate max-w-[200px]"
              title={w.yarnName}
            >
              {w.yarnName}
            </span>
            <span className="shrink-0 ml-2">
              Cần <strong>{w.required.toLocaleString()}</strong> — Còn{' '}
              <strong className={w.available <= 0 ? 'text-red-600' : ''}>
                {w.available.toLocaleString()}
              </strong>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
