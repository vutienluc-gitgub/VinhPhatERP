import {
  useRawFabricInventory,
  useFinishedFabricInventory,
  useYarnInventory,
  useAgingStock,
} from './useInventory';
import type { InventoryBreakdownRow, AgingRoll } from './useInventory';

function fmt(val: number, decimals = 1): string {
  return val.toLocaleString('vi-VN', { maximumFractionDigits: decimals });
}

function fmtCurrency(val: number): string {
  return new Intl.NumberFormat('vi-VN').format(val);
}

function agingSeverity(days: number): { label: string; cls: string } {
  if (days >= 90)
    return {
      label: 'Nghiêm trọng',
      cls: 'aging-critical',
    };
  if (days >= 60)
    return {
      label: 'Cảnh báo',
      cls: 'aging-warning',
    };
  return {
    label: 'Lưu ý',
    cls: 'aging-caution',
  };
}

function AgingStockTable({ rolls }: { rolls: AgingRoll[] }) {
  if (rolls.length === 0) {
    return (
      <div
        className="table-empty"
        style={{
          padding: '1.5rem 1rem',
          fontSize: '0.88rem',
        }}
      >
        Không có cuộn nào tồn kho quá 30 ngày. 👍
      </div>
    );
  }

  const critical = rolls.filter((r) => r.age_days >= 90).length;
  const warning = rolls.filter(
    (r) => r.age_days >= 60 && r.age_days < 90,
  ).length;
  const caution = rolls.filter((r) => r.age_days < 60).length;

  return (
    <>
      <div className="aging-summary">
        {critical > 0 && (
          <span className="aging-badge aging-critical">
            🔴 {critical} cuộn &gt; 90 ngày
          </span>
        )}
        {warning > 0 && (
          <span className="aging-badge aging-warning">
            🟠 {warning} cuộn 60–90 ngày
          </span>
        )}
        {caution > 0 && (
          <span className="aging-badge aging-caution">
            🟡 {caution} cuộn 30–60 ngày
          </span>
        )}
      </div>
      <div className="data-table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Mã cuộn</th>
              <th>Loại</th>
              <th>Loại vải</th>
              <th className="hide-mobile">Màu</th>
              <th className="hide-mobile">Vị trí</th>
              <th className="text-right">Ngày tồn</th>
              <th>Mức</th>
            </tr>
          </thead>
          <tbody>
            {rolls.map((roll) => {
              const sev = agingSeverity(roll.age_days);
              return (
                <tr key={roll.id}>
                  <td>
                    <strong>{roll.roll_number}</strong>
                  </td>
                  <td className="td-muted">
                    {roll.source === 'raw' ? 'Mộc' : 'TP'}
                  </td>
                  <td>{roll.fabric_type}</td>
                  <td className="td-muted hide-mobile">
                    {roll.color_name ?? '—'}
                  </td>
                  <td className="td-muted hide-mobile">
                    {roll.warehouse_location ?? '—'}
                  </td>
                  <td
                    className="text-right"
                    style={{
                      fontVariantNumeric: 'tabular-nums',
                      fontWeight: 600,
                    }}
                  >
                    {roll.age_days} ngày
                  </td>
                  <td>
                    <span className={`aging-badge ${sev.cls}`}>
                      {sev.label}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}

function BreakdownTable({
  rows,
  title,
}: {
  rows: InventoryBreakdownRow[];
  title: string;
}) {
  if (rows.length === 0) {
    return (
      <div
        className="table-empty"
        style={{
          padding: '1.5rem 1rem',
          fontSize: '0.88rem',
        }}
      >
        Chưa có dữ liệu {title.toLowerCase()}.
      </div>
    );
  }

  return (
    <div className="data-table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            <th>Loại vải</th>
            <th className="hide-mobile">Màu</th>
            <th>Chất lượng</th>
            <th className="text-right">Cuộn</th>
            <th className="text-right hide-mobile">Dài (m)</th>
            <th className="text-right">Nặng (kg)</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              <td>{row.fabric_type ?? '—'}</td>
              <td className="td-muted hide-mobile">{row.color_name ?? '—'}</td>
              <td>
                {row.quality_grade ? (
                  <span className={`grade-badge grade-${row.quality_grade}`}>
                    {row.quality_grade}
                  </span>
                ) : (
                  '—'
                )}
              </td>
              <td
                className="text-right"
                style={{ fontVariantNumeric: 'tabular-nums' }}
              >
                {row.roll_count ?? 0}
              </td>
              <td
                className="text-right hide-mobile"
                style={{ fontVariantNumeric: 'tabular-nums' }}
              >
                {fmt(row.total_length_m ?? 0)}
              </td>
              <td
                className="text-right"
                style={{ fontVariantNumeric: 'tabular-nums' }}
              >
                {fmt(row.total_weight_kg ?? 0)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function InventoryPage() {
  const rawQuery = useRawFabricInventory();
  const finishedQuery = useFinishedFabricInventory();
  const yarnQuery = useYarnInventory();
  const agingQuery = useAgingStock();

  const isLoading =
    rawQuery.isLoading || finishedQuery.isLoading || yarnQuery.isLoading;
  const hasError = rawQuery.error || finishedQuery.error || yarnQuery.error;

  const rawStats = rawQuery.data?.stats;
  const finishedStats = finishedQuery.data?.stats;
  const yarnStats = yarnQuery.data;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '1.5rem',
      }}
    >
      {/* Dashboard Card — header + KPI */}
      <div className="panel-card card-flush">
        <div className="card-header-area">
          <div className="page-header">
            <div>
              <p className="eyebrow">Tồn kho</p>
              <h3>Dashboard tồn kho tổng hợp</h3>
            </div>
          </div>
        </div>

        {isLoading && (
          <p
            style={{
              padding: '2rem 1.25rem',
              color: 'var(--muted)',
              textAlign: 'center',
            }}
          >
            Đang tải dữ liệu tồn kho…
          </p>
        )}

        {hasError && (
          <p className="error-inline">
            Lỗi tải dữ liệu:{' '}
            {
              (
                (rawQuery.error ??
                  finishedQuery.error ??
                  yarnQuery.error) as Error
              )?.message
            }
          </p>
        )}

        {!isLoading && !hasError && (
          <div
            className="stats-bar"
            style={{ padding: '0.75rem 1.25rem 1.25rem' }}
          >
            <div className="stat-card stat-primary">
              <span className="stat-label">Sợi — Phiếu nhập</span>
              <span className="stat-value">
                {yarnStats?.totalReceipts ?? 0}
              </span>
            </div>
            <div className="stat-card">
              <span className="stat-label">Sợi — Giá trị</span>
              <span className="stat-value">
                {fmtCurrency(yarnStats?.totalAmount ?? 0)}
                <span className="stat-unit">đ</span>
              </span>
            </div>
            <div className="stat-card stat-primary">
              <span className="stat-label">Vải mộc — Cuộn</span>
              <span className="stat-value">{rawStats?.totalRolls ?? 0}</span>
            </div>
            <div className="stat-card">
              <span className="stat-label">Vải mộc — Tổng dài</span>
              <span className="stat-value">
                {fmt(rawStats?.totalLengthM ?? 0)}
                <span className="stat-unit">m</span>
              </span>
            </div>
            <div className="stat-card stat-primary">
              <span className="stat-label">Thành phẩm — Cuộn</span>
              <span className="stat-value">
                {finishedStats?.totalRolls ?? 0}
              </span>
            </div>
            <div className="stat-card">
              <span className="stat-label">Thành phẩm — Tổng dài</span>
              <span className="stat-value">
                {fmt(finishedStats?.totalLengthM ?? 0)}
                <span className="stat-unit">m</span>
              </span>
            </div>
          </div>
        )}
      </div>

      {!isLoading && !hasError && (
        <>
          <div className="panel-card card-flush">
            <div className="card-header-area" style={{ paddingBottom: 0 }}>
              <div className="page-header">
                <div>
                  <p className="eyebrow">Vải mộc</p>
                  <h3>Chi tiết tồn kho vải mộc</h3>
                </div>
              </div>
            </div>
            <div style={{ padding: '0.75rem 1.25rem 1.25rem' }}>
              <BreakdownTable
                rows={rawQuery.data?.breakdown ?? []}
                title="vải mộc"
              />
            </div>
          </div>

          {/* ── Finished Fabric Breakdown ── */}
          <div className="panel-card card-flush">
            <div className="card-header-area" style={{ paddingBottom: 0 }}>
              <div className="page-header">
                <div>
                  <p className="eyebrow">Vải thành phẩm</p>
                  <h3>Chi tiết tồn kho thành phẩm</h3>
                </div>
              </div>
            </div>
            <div style={{ padding: '0.75rem 1.25rem 1.25rem' }}>
              <BreakdownTable
                rows={finishedQuery.data?.breakdown ?? []}
                title="vải thành phẩm"
              />
            </div>
          </div>

          {/* ── Aging Stock ── */}
          <div className="panel-card card-flush">
            <div className="card-header-area" style={{ paddingBottom: 0 }}>
              <div className="page-header">
                <div>
                  <p className="eyebrow">⚠️ Cảnh báo</p>
                  <h3>Cuộn tồn kho lâu (aging stock)</h3>
                </div>
              </div>
            </div>
            <div style={{ padding: '0.75rem 1.25rem 1.25rem' }}>
              {agingQuery.isLoading ? (
                <p className="table-empty">Đang kiểm tra...</p>
              ) : agingQuery.error ? (
                <p className="error-inline">
                  Lỗi: {(agingQuery.error as Error).message}
                </p>
              ) : (
                <AgingStockTable rolls={agingQuery.data ?? []} />
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
