import { MiniBarChart } from '@/shared/components';
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
    <div
      className="panel-card"
      style={{
        padding: 0,
        overflow: 'hidden',
      }}
    >
      <div style={{ padding: '1.25rem 1.25rem 0' }}>
        <div className="card-header-row">
          <div>
            <p className="eyebrow">Phân tích</p>
            <h3 style={{ margin: 0 }}>Nguồn khách hàng</h3>
          </div>
        </div>
        <p
          className="td-muted"
          style={{
            fontSize: '0.85rem',
            marginTop: '0.35rem',
          }}
        >
          Phân bổ theo nguồn tiếp cận
        </p>
      </div>

      <div style={{ padding: '1rem 1.25rem 1.25rem' }}>
        {isLoading ? (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.6rem',
            }}
          >
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="skeleton-block"
                style={{ height: '22px' }}
              />
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
