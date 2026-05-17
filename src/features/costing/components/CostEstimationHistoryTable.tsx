import { useCostEstimationHistory } from '@/features/costing/hooks/useGreigeCosting';
import type { CostingSimulationState } from '@/features/costing/types/greige-costing.type';
import { Icon } from '@/shared/components/Icon';
import { Badge } from '@/shared/components/Badge';
import { formatCurrency } from '@/shared/utils/format';

interface CostEstimationHistoryTableProps {
  referenceType: string;
  referenceId: string;
  currentVersion?: number;
  onRestore: (state: CostingSimulationState) => void;
}

export function CostEstimationHistoryTable({
  referenceType,
  referenceId,
  currentVersion,
  onRestore,
}: CostEstimationHistoryTableProps) {
  const { data: history, isLoading } = useCostEstimationHistory(
    referenceType,
    referenceId,
  );

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-muted">
        <div className="spinner mb-2" />
        <p className="text-sm">Đang tải lịch sử tính giá...</p>
      </div>
    );
  }

  if (!history || history.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-muted">
        <Icon name="History" size={40} className="mb-2 opacity-30" />
        <p className="text-sm">Chưa có lịch sử tính giá (snapshot) nào.</p>
      </div>
    );
  }

  return (
    <div className="card-table-section mt-4">
      <table className="data-table">
        <thead>
          <tr>
            <th>Phiên bản</th>
            <th>Ngày lưu</th>
            <th className="text-right">Tiền sợi</th>
            <th className="text-right">Giá mộc tổng</th>
            <th className="text-right">Giá đề xuất</th>
            <th className="text-right">Thao tác</th>
          </tr>
        </thead>
        <tbody>
          {history.map((record) => {
            const isCurrent = currentVersion === record.version;
            return (
              <tr key={record.id} className={isCurrent ? 'bg-primary/5' : ''}>
                <td>
                  <div className="flex items-center gap-2">
                    <span className="font-bold">v{record.version}</span>
                    {isCurrent && <Badge variant="info">Đang chọn</Badge>}
                  </div>
                </td>
                <td className="td-muted">
                  {new Date(record.created_at).toLocaleString('vi-VN')}
                </td>
                <td className="text-right">
                  {formatCurrency(record.est_yarn_price)}
                </td>
                <td className="text-right font-medium">
                  {formatCurrency(record.est_total_cost)}
                </td>
                <td className="text-right font-bold text-primary">
                  {formatCurrency(record.suggested_price)}
                </td>
                <td className="text-right">
                  <button
                    className="btn-icon"
                    disabled={!record.simulation_state || isCurrent}
                    onClick={() =>
                      onRestore(
                        record.simulation_state as unknown as CostingSimulationState,
                      )
                    }
                    title={
                      record.simulation_state
                        ? 'Phục hồi tham số từ phiên bản này'
                        : 'Không có dữ liệu tham số để phục hồi'
                    }
                  >
                    <Icon name="RefreshCcw" size={16} />
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
