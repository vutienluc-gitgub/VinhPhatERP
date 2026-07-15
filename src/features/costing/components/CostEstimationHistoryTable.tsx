import { useCostEstimationHistory } from '@/features/costing/hooks/useGreigeCosting';
import type { CostingSimulationState } from '@/features/costing/types/greige-costing.type';
import { Icon } from '@/shared/components/Icon';
import { Badge } from '@/shared/components/Badge';
import { MoneyText } from '@/shared/value';
import { COSTING_LABELS } from '@/features/costing/costing.constants';

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
        <p className="text-sm">{COSTING_LABELS.LOADING_HISTORY}</p>
      </div>
    );
  }

  if (!history || history.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-muted">
        <Icon name="History" size={40} className="mb-2 opacity-30" />
        <p className="text-sm">{COSTING_LABELS.EMPTY_HISTORY}</p>
      </div>
    );
  }

  return (
    <div className="card-table-section mt-4">
      <table className="data-table">
        <thead>
          <tr>
            <th>{COSTING_LABELS.COL_VERSION}</th>
            <th>{COSTING_LABELS.COL_DATE}</th>
            <th className="text-right">{COSTING_LABELS.COL_YARN}</th>
            <th className="text-right">{COSTING_LABELS.COL_TOTAL_GREIGE}</th>
            <th className="text-right">{COSTING_LABELS.COL_SUGGESTED}</th>
            <th className="text-right">{COSTING_LABELS.COL_ACTIONS}</th>
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
                    {isCurrent && (
                      <Badge variant="info">
                        {COSTING_LABELS.BADGE_CURRENT}
                      </Badge>
                    )}
                  </div>
                </td>
                <td className="text-muted text-sm">
                  {/* eslint-disable-next-line no-restricted-syntax */}
                  {new Date(record.created_at).toLocaleString('vi-VN')}
                </td>
                <td className="text-right">
                  <MoneyText value={record.est_yarn_price} />
                </td>
                <td className="text-right font-medium">
                  <MoneyText value={record.est_total_cost} />
                </td>
                <td className="text-right font-bold text-primary">
                  <MoneyText value={record.suggested_price} />
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
                        ? COSTING_LABELS.TITLE_RESTORE
                        : COSTING_LABELS.TITLE_NO_RESTORE
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
