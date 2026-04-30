import { MiniBarChart } from '@/shared/components/MiniBarChart';
import type { CustomerSourceItem } from '@/application/analytics';

type CustomerSourceChartProps = {
  sources: CustomerSourceItem[];
  isLoading: boolean;
};

export function CustomerSourceChart({
  sources,
  isLoading,
}: CustomerSourceChartProps) {
  const maxCount = Math.max(...sources.map((s) => s.count), 1);

  return (
    <div className="panel-card card-flush">
      <div className="card-header-area">
        <div className="card-header-row">
          <h3 className="text-lg font-bold m-0">Nguồn khách hàng</h3>
        </div>
        <p className="td-muted text-[0.85rem] mt-[0.35rem] mb-0">
          Phân bổ theo nguồn tiếp cận
        </p>
      </div>

      <div className="px-5 pb-5 pt-3">
        {isLoading ? (
          <div className="flex flex-col gap-[0.6rem]">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="skeleton-block h-[22px]" />
            ))}
          </div>
        ) : sources.length === 0 ? (
          <p className="task-empty">Chưa có dữ liệu nguồn khách hàng</p>
        ) : (
          <MiniBarChart
            maxValue={maxCount}
            data={sources.map((item) => ({
              label: item.source,
              value: item.count,
              color: item.color,
            }))}
          />
        )}
      </div>
    </div>
  );
}
