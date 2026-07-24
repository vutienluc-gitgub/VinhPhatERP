import { useState } from 'react';

import { Icon, Badge, StatusBadge } from '@/shared/components';
import {
  TimelineProgress,
  type TimelineStep,
  AdaptiveSheet,
  Button,
} from '@/shared/components';
import { FadeUp } from '@/shared/components';
import { formatQuantity } from '@/shared/utils/format';
import { MoneyText } from '@/shared/value';
import {
  calcTotalBomRatio,
  calcTotalRequiredKg,
  calcTotalAllocatedKg,
  calcTotalIssuedKg,
} from '@/shared/utils/yarn-requirement.util';
import {
  useWorkOrderDetail,
  useWorkOrderRequirements,
  useStartWorkOrder,
  useCompleteWorkOrder,
  useYarnIssuesForWorkOrder,
} from '@/application/production';

import type { WorkOrder } from './types';
import { YarnIssueModal } from './components/YarnIssueModal';
import { WORK_ORDER_MESSAGES as MSG } from './work-orders.constants';

interface WorkOrderDetailProps {
  id: string;
  onBack: () => void;
  onEdit: (wo: WorkOrder) => void;
}

export function WorkOrderDetail({ id, onBack, onEdit }: WorkOrderDetailProps) {
  const { data: wo, isLoading } = useWorkOrderDetail(id);
  const { data: requirements, isLoading: isLoadingReq } =
    useWorkOrderRequirements(id);
  const startMutation = useStartWorkOrder();
  const completeMutation = useCompleteWorkOrder();
  const { data: yarnIssues } = useYarnIssuesForWorkOrder(id);
  const [showIssueModal, setShowIssueModal] = useState(false);

  // Complete Work Order Modal State
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [actualYieldM, setActualYieldM] = useState<number | ''>('');

  if (isLoading)
    return (
      <div className="panel-card p-12 flex flex-col items-center gap-3">
        <div className="spinner" />
        <p className="text-muted text-sm">{MSG.LOADING_DETAIL}</p>
      </div>
    );
  if (!wo) return <p className="error-inline p-8">{MSG.ERR_NOT_FOUND}</p>;

  const timelineSteps: TimelineStep[] = [
    {
      id: 'step-1',
      title: MSG.TIMELINE_STEP_1_TITLE,
      subtitle: `BOM: ${wo.bom_template?.code || 'N/A'}, Mục tiêu: ${wo.target_quantity}m`,
      status: 'completed',
      date: new Date(wo.created_at).toLocaleDateString('vi-VN'),
      icon: 'FileText',
    },
    {
      id: 'step-2',
      title: MSG.TIMELINE_STEP_2_TITLE,
      subtitle: wo.supplier?.name
        ? `${MSG.LABEL_WEAVER}: ${wo.supplier.name}`
        : MSG.TIMELINE_STEP_2_WAITING,
      status:
        wo.status === 'in_progress'
          ? 'current'
          : wo.status === 'completed'
            ? 'completed'
            : 'pending',
      date: wo.start_date
        ? new Date(wo.start_date).toLocaleDateString('vi-VN')
        : undefined,
      icon: 'Scissors',
    },
    {
      id: 'step-3',
      title: MSG.TIMELINE_STEP_3_TITLE,
      subtitle:
        wo.status === 'completed'
          ? `Nghiệm thu thực tế: ${wo.actual_yield_m}m mộc`
          : MSG.TIMELINE_STEP_3_PENDING,
      status: wo.status === 'completed' ? 'completed' : 'pending',
      date:
        wo.status === 'completed'
          ? new Date().toLocaleDateString('vi-VN')
          : undefined,
      icon: 'CheckCircle',
    },
  ];

  if (wo.status === 'cancelled') {
    timelineSteps.push({
      id: 'step-cancel',
      title: MSG.TIMELINE_STEP_CANCELLED,
      status: 'error',
      icon: 'XCircle',
    });
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header Card */}
      <FadeUp delay={0.1}>
        <div className="panel-card card-flush">
          <div className="card-header-area">
            <div className="flex items-center gap-3">
              <button
                className="btn-icon"
                type="button"
                onClick={onBack}
                title={MSG.BTN_BACK}
              >
                <Icon name="ArrowLeft" size={20} />
              </button>
              <div>
                <span className="font-bold text-lg flex items-center gap-3">
                  {wo.work_order_number}
                  <StatusBadge domain="WORK_ORDER" status={wo.status} />
                </span>
                {wo.order && (
                  <p className="text-xs text-muted mt-0.5">
                    Sản xuất cho ĐH: {wo.order.order_number}
                  </p>
                )}
              </div>
            </div>

            <div className="flex gap-2">
              {wo.status === 'draft' && (
                <button
                  className="btn-secondary flex items-center gap-2"
                  type="button"
                  onClick={() => onEdit(wo)}
                >
                  <Icon name="Edit2" size={16} />
                  {MSG.BTN_EDIT}
                </button>
              )}
              {wo.status === 'draft' && (
                <button
                  className="btn-primary flex items-center gap-2"
                  type="button"
                  onClick={() => setShowIssueModal(true)}
                >
                  <Icon name="PackageOpen" size={16} />
                  {MSG.BTN_YARN_ISSUE}
                </button>
              )}
              {wo.status === 'yarn_issued' && (
                <button
                  className="btn-primary flex items-center gap-2"
                  type="button"
                  onClick={() => startMutation.mutate(wo.id)}
                  disabled={startMutation.isPending}
                >
                  <Icon name="Play" size={16} />
                  {MSG.BTN_START_WEAVING}
                </button>
              )}
              {wo.status === 'in_progress' && (
                <button
                  className="btn-primary flex items-center gap-2"
                  type="button"
                  onClick={() => {
                    setActualYieldM(wo.target_quantity);
                    setShowCompleteModal(true);
                  }}
                >
                  <Icon name="CheckCircle" size={16} />
                  {MSG.BTN_COMPLETE_WEAVING}
                </button>
              )}
            </div>
          </div>

          {/* Info Grid */}
          <div className="p-5">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              <div className="form-field">
                <label>BOM định mức</label>
                <p className="font-bold">
                  {wo.bom_template?.code} (V{wo.bom_version})
                </p>
              </div>
              <div className="form-field">
                <label>{MSG.LABEL_TARGET_FABRIC}</label>
                <p className="font-bold">
                  {wo.bom_template?.target_fabric?.name || '—'}
                </p>
              </div>
              <div className="form-field">
                <label>{MSG.LABEL_CREATED_AT}</label>
                <p>{new Date(wo.created_at).toLocaleDateString('vi-VN')}</p>
              </div>
              <div className="form-field">
                <label>{MSG.LABEL_LOSS_PCT}</label>
                <p className="font-bold text-warning">
                  {wo.standard_loss_pct}%
                </p>
              </div>
              <div className="form-field">
                <label>{MSG.LABEL_LINKED_ORDER}</label>
                <p>{wo.order?.order_number || MSG.LABEL_ORDER_NONE}</p>
              </div>
              <div className="form-field">
                <label>{MSG.LABEL_WEAVER}</label>
                <p className="font-bold text-primary">
                  {wo.supplier?.name || '—'}
                </p>
              </div>
              <div className="form-field">
                <label>{MSG.LABEL_DETAIL_LOOM}</label>
                <p className="font-bold">
                  {wo.loom?.code ? `${wo.loom.code} - ${wo.loom.name}` : '—'}
                </p>
              </div>
              <div className="form-field">
                <label>{MSG.LABEL_DETAIL_WEAVING_PRICE}</label>
                <p className="font-bold">
                  <MoneyText value={wo.weaving_unit_price} />
                  /m
                </p>
              </div>
              <div className="form-field">
                <label>{MSG.LABEL_TOTAL_FEE}</label>
                <p className="font-bold text-success">
                  <MoneyText
                    value={wo.target_quantity * wo.weaving_unit_price}
                  />
                </p>
              </div>
            </div>
          </div>
        </div>
      </FadeUp>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <FadeUp delay={0.2} className="md:col-span-1">
          <div className="panel-card p-6 h-full border-t-4 border-t-primary">
            <h3 className="text-lg font-bold mb-6 flex items-center gap-2 border-b border-border pb-3">
              <Icon name="Activity" size={20} className="text-primary" />
              Tiến trình lệnh SX
            </h3>
            <TimelineProgress steps={timelineSteps} />
          </div>
        </FadeUp>

        <FadeUp delay={0.3} className="md:col-span-2 h-full">
          {/* Yarn Requirements */}
          <div className="panel-card card-flush h-full">
            <div className="card-header-area">
              <div className="flex items-center gap-2">
                <Icon name="Package" size={20} className="text-primary" />
                <span className="font-bold text-lg">
                  {MSG.SECTION_REQUIREMENTS}
                </span>
              </div>
            </div>

            {isLoadingReq ? (
              <div className="p-8 text-center text-sm text-muted">
                {MSG.LOADING_DETAIL}
              </div>
            ) : !requirements || requirements.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted">
                {MSG.SECTION_REQUIREMENTS_EMPTY}
              </div>
            ) : (
              <div className="card-table-section">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>{MSG.COL_YARN_TYPE}</th>
                      <th className="max-sm:hidden">{MSG.COL_COLOR_CODE}</th>
                      <th className="text-right">{MSG.COL_BOM_PCT}</th>
                      <th className="text-right">{MSG.COL_REQUIRED_KG}</th>
                      <th className="text-right">{MSG.COL_ALLOCATED}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {requirements.map((req) => (
                      <tr key={req.id}>
                        <td>
                          <strong>{req.yarn_catalog?.name || '—'}</strong>
                        </td>
                        <td className="max-sm:hidden text-muted text-sm">
                          {req.yarn_catalog?.color_name || '—'}
                        </td>
                        <td className="text-right">{req.bom_ratio_pct}%</td>
                        <td className="text-right font-bold text-primary">
                          {formatQuantity(req.required_kg, 1)}
                        </td>
                        <td className="text-right font-bold text-success">
                          {formatQuantity(req.allocated_kg, 1)}
                        </td>
                      </tr>
                    ))}
                    <tr className="font-bold bg-surface-subtle">
                      <td colSpan={2} className="text-right">
                        {MSG.LABEL_TOTAL}
                      </td>
                      <td className="text-right">
                        {calcTotalBomRatio(requirements)}%
                      </td>
                      <td className="text-right text-primary">
                        {formatQuantity(calcTotalRequiredKg(requirements), 1)}{' '}
                        kg
                      </td>
                      <td className="text-right text-success">
                        {formatQuantity(calcTotalAllocatedKg(requirements), 1)}{' '}
                        kg
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </FadeUp>
      </div>

      {/* Stats — target & results */}
      <FadeUp delay={0.4}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="panel-card p-5">
            <span className="font-bold text-lg block mb-3">
              {MSG.SECTION_TARGETS}
            </span>
            <div className="flex flex-col gap-2">
              <div className="stat-card">
                <span className="stat-label">{MSG.LABEL_TARGET_M}</span>
                <span className="stat-value text-primary">
                  {formatQuantity(wo.target_quantity)} m
                </span>
              </div>
              <div className="stat-card">
                <span className="stat-label">{MSG.LABEL_TARGET_WEIGHT}</span>
                <span className="stat-value">
                  {wo.target_weight_kg
                    ? `${formatQuantity(wo.target_weight_kg)} kg`
                    : 'N/A'}
                </span>
              </div>
            </div>
          </div>

          <div className="panel-card p-5">
            <span className="font-bold text-lg block mb-3">
              {MSG.SECTION_RESULTS}
            </span>
            {wo.status === 'completed' ? (
              <div className="flex flex-col gap-2">
                <div className="stat-card">
                  <span className="stat-label">{MSG.LABEL_YIELD_M}</span>
                  <span className="stat-value text-success">
                    {formatQuantity(wo.actual_yield_m ?? 0)} m
                  </span>
                </div>
                <div className="stat-card">
                  <span className="stat-label">{MSG.LABEL_YIELD_RATE}</span>
                  <span className="stat-value">
                    {(
                      ((wo.actual_yield_m || 0) / wo.target_quantity) *
                      100
                    ).toFixed(1)}
                    %
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 gap-2">
                <Icon name="Scissors" size={40} className="opacity-20" />
                <p className="text-sm text-muted">
                  {MSG.SECTION_RESULTS_WAITING}
                </p>
              </div>
            )}
          </div>
        </div>
      </FadeUp>
      {/* Yarn Issue History */}
      {yarnIssues && yarnIssues.length > 0 && (
        <FadeUp delay={0.5}>
          <div className="panel-card card-flush">
            <div className="card-header-area">
              <div className="flex items-center gap-2">
                <Icon name="ClipboardList" size={20} className="text-success" />
                <span className="font-bold text-lg">
                  {MSG.SECTION_ISSUE_HISTORY}
                </span>
                <Badge variant="success">{yarnIssues.length} lo</Badge>
              </div>
            </div>
            <div className="card-table-section">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>{MSG.COL_RECEIPT}</th>
                    <th className="max-sm:hidden">{MSG.COL_YARN_SUPPLIER}</th>
                    <th>{MSG.COL_YARN_TYPE}</th>
                    <th className="max-sm:hidden">{MSG.COL_LOT}</th>
                    <th className="text-right">{MSG.COL_QTY_KG}</th>
                    <th className="max-sm:hidden">{MSG.COL_ISSUE_DATE}</th>
                  </tr>
                </thead>
                <tbody>
                  {yarnIssues.map((issue) => (
                    <tr key={issue.id}>
                      <td>
                        <span className="font-bold text-primary">
                          {issue.receipt_number}
                        </span>
                      </td>
                      <td className="max-sm:hidden text-muted text-sm">
                        {issue.supplier_name}
                      </td>
                      <td className="font-medium">{issue.yarn_type}</td>
                      <td className="max-sm:hidden text-muted text-sm">
                        {issue.lot_number ?? '—'}
                      </td>
                      <td className="text-right font-bold text-success tabular-nums">
                        {formatQuantity(issue.issued_kg)}
                      </td>
                      <td className="max-sm:hidden text-muted text-sm">
                        {new Date(issue.created_at).toLocaleDateString('vi-VN')}
                      </td>
                    </tr>
                  ))}
                  <tr className="font-bold bg-surface-subtle">
                    <td colSpan={4} className="text-right">
                      {MSG.LABEL_TOTAL}
                    </td>
                    <td className="text-right text-success tabular-nums">
                      {formatQuantity(calcTotalIssuedKg(yarnIssues))} kg
                    </td>
                    <td className="max-sm:hidden" />
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </FadeUp>
      )}

      {/* Yarn Issue Modal */}
      {showIssueModal && (
        <YarnIssueModal
          workOrderId={wo.id}
          onClose={() => setShowIssueModal(false)}
          onSuccess={() => setShowIssueModal(false)}
        />
      )}
      {/* Complete Work Order Modal */}
      <AdaptiveSheet
        open={showCompleteModal}
        onClose={() => setShowCompleteModal(false)}
        title={MSG.MODAL_COMPLETE_TITLE}
        maxWidth={400}
      >
        <div className="p-4 space-y-4">
          <div className="form-field">
            <label className="field-label">
              {MSG.MODAL_COMPLETE_ACTUAL_YIELD}{' '}
              <span className="text-danger">*</span>
            </label>
            <input
              type="number"
              className="field-input"
              value={actualYieldM}
              onChange={(e) => setActualYieldM(Number(e.target.value))}
              placeholder={MSG.MODAL_COMPLETE_PLACEHOLDER}
            />
            <p className="text-xs text-muted-foreground mt-1">
              {MSG.MODAL_COMPLETE_DESC}
            </p>
          </div>
          <div className="flex gap-2 justify-end pt-4">
            <Button
              variant="secondary"
              onClick={() => setShowCompleteModal(false)}
            >
              {MSG.BTN_CANCEL}
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                if (actualYieldM) {
                  completeMutation.mutate({
                    id: wo.id,
                    input: { actual_yield_m: Number(actualYieldM) },
                  });
                  setShowCompleteModal(false);
                }
              }}
              disabled={completeMutation.isPending || !actualYieldM}
            >
              {completeMutation.isPending
                ? MSG.BTN_PROCESSING
                : MSG.BTN_CONFIRM_COMPLETE}
            </Button>
          </div>
        </div>
      </AdaptiveSheet>
    </div>
  );
}
