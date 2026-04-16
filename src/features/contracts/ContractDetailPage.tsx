import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useQuery } from '@tanstack/react-query';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';

import { supabase } from '@/services/supabase/client';
import { Button, AdaptiveSheet, Icon, useConfirm } from '@/shared/components';
import { Combobox } from '@/shared/components/Combobox';
import {
  useContract,
  useContractLinkedOrders,
  useContractAuditLogs,
  useUpdateContract,
  useUpdateContractStatus,
  useLinkOrder,
  useUnlinkOrder,
} from '@/application/contracts';

import {
  CONTRACT_TYPE_LABELS,
  CONTRACT_STATUS_LABELS,
  updateContractInputSchema,
} from './contracts.module';
import type {
  Contract,
  ContractAuditLog,
  UpdateContractInput,
} from './contracts.module';
import { ContractStatusBadge } from './ContractStatusBadge';
import { ContractPreview } from './ContractPreview';

// ── Types ────────────────────────────────────────────────────────────────────

type ContractDetailPageProps = {
  contractId: string;
  onBack: () => void;
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

// ── Cancel sheet ─────────────────────────────────────────────────────────────

type CancelSheetProps = {
  open: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  isLoading: boolean;
};

function CancelSheet({
  open,
  onClose,
  onConfirm,
  isLoading,
}: CancelSheetProps) {
  const [reason, setReason] = useState('');
  const [touched, setTouched] = useState(false);
  const hasError = touched && !reason.trim();

  function handleSubmit() {
    setTouched(true);
    if (!reason.trim()) return;
    onConfirm(reason.trim());
  }

  function handleClose() {
    setReason('');
    setTouched(false);
    onClose();
  }

  return (
    <AdaptiveSheet
      open={open}
      onClose={handleClose}
      title="Hủy hợp đồng"
      footer={
        <div className="flex gap-3 justify-end">
          <Button
            variant="secondary"
            onClick={handleClose}
            disabled={isLoading}
          >
            Thoát
          </Button>
          <Button variant="danger" onClick={handleSubmit} isLoading={isLoading}>
            Xác nhận huỷ
          </Button>
        </div>
      }
    >
      <div className="form-field">
        <label>
          Lý do huỷ <span className="field-required">*</span>
        </label>
        <textarea
          className={`field-textarea${hasError ? ' is-error' : ''}`}
          rows={4}
          placeholder="Nhập lý do huỷ hợp đồng..."
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          onBlur={() => setTouched(true)}
        />
        {hasError && (
          <span className="field-error">Vui lòng nhập lý do huỷ hợp đồng.</span>
        )}
      </div>
    </AdaptiveSheet>
  );
}

// ── Sign sheet ────────────────────────────────────────────────────────────────

type SignSheetProps = {
  open: boolean;
  onClose: () => void;
  onConfirm: (signedFileUrl?: string) => void;
  isLoading: boolean;
};

function SignSheet({ open, onClose, onConfirm, isLoading }: SignSheetProps) {
  const [fileUrl, setFileUrl] = useState('');

  function handleClose() {
    setFileUrl('');
    onClose();
  }

  return (
    <AdaptiveSheet
      open={open}
      onClose={handleClose}
      title="Xác nhận hợp đồng đã ký"
      footer={
        <div className="flex gap-3 justify-end">
          <Button
            variant="secondary"
            onClick={handleClose}
            disabled={isLoading}
          >
            Thoát
          </Button>
          <Button
            variant="success"
            onClick={() => onConfirm(fileUrl.trim() || undefined)}
            isLoading={isLoading}
          >
            Xác nhận đã ký
          </Button>
        </div>
      }
    >
      <div className="form-field">
        <label>URL file hợp đồng đã ký (tuỳ chọn)</label>
        <input
          type="text"
          className="field-input"
          placeholder="https://..."
          value={fileUrl}
          onChange={(e) => setFileUrl(e.target.value)}
        />
        <p className="field-hint text-xs text-muted mt-1">
          Đính kèm link file scan hợp đồng đã ký nếu có.
        </p>
      </div>
    </AdaptiveSheet>
  );
}

// ── Link order sheet ──────────────────────────────────────────────────────────

function useAvailableOrders(excludeIds: string[]) {
  return useQuery({
    queryKey: ['orders', 'link-picker', excludeIds],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('id, order_number, customers(name)')
        .not('status', 'eq', 'cancelled')
        .order('order_date', { ascending: false })
        .limit(200);
      if (error) throw error;
      return (data ?? [])
        .filter((o) => !excludeIds.includes(o.id))
        .map((o) => ({
          value: o.id,
          label: o.order_number,
          code: (o.customers as { name: string } | null)?.name ?? '',
        }));
    },
    enabled: true,
  });
}

type LinkOrderSheetProps = {
  open: boolean;
  onClose: () => void;
  onLink: (orderId: string) => void;
  isLoading: boolean;
  linkedOrderIds: string[];
};

function LinkOrderSheet({
  open,
  onClose,
  onLink,
  isLoading,
  linkedOrderIds,
}: LinkOrderSheetProps) {
  const [selectedOrderId, setSelectedOrderId] = useState('');
  const [touched, setTouched] = useState(false);
  const hasError = touched && !selectedOrderId;

  const { data: orderOptions = [] } = useAvailableOrders(linkedOrderIds);

  function handleSubmit() {
    setTouched(true);
    if (!selectedOrderId) return;
    onLink(selectedOrderId);
  }

  function handleClose() {
    setSelectedOrderId('');
    setTouched(false);
    onClose();
  }

  return (
    <AdaptiveSheet
      open={open}
      onClose={handleClose}
      title="Liên kết đơn hàng"
      footer={
        <div className="flex gap-3 justify-end">
          <Button
            variant="secondary"
            onClick={handleClose}
            disabled={isLoading}
          >
            Thoát
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            isLoading={isLoading}
          >
            Liên kết
          </Button>
        </div>
      }
    >
      <div className="form-field">
        <label>
          Đơn hàng <span className="field-required">*</span>
        </label>
        <Combobox
          options={orderOptions}
          value={selectedOrderId}
          onChange={(val) => setSelectedOrderId(val as string)}
          placeholder="Tìm kiếm số đơn hàng hoặc tên khách hàng..."
          hasError={hasError}
        />
        {hasError && (
          <span className="field-error">Vui lòng chọn đơn hàng.</span>
        )}
        <p className="field-hint text-xs text-muted mt-1">
          Chỉ hiển thị đơn hàng chưa bị huỷ và chưa được liên kết.
        </p>
      </div>
    </AdaptiveSheet>
  );
}

// ── Edit form sheet ───────────────────────────────────────────────────────────

type EditSheetProps = {
  open: boolean;
  onClose: () => void;
  contract: Contract;
  onSave: (data: UpdateContractInput) => void;
  isLoading: boolean;
};

function EditSheet({
  open,
  onClose,
  contract,
  onSave,
  isLoading,
}: EditSheetProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<UpdateContractInput>({
    resolver: zodResolver(updateContractInputSchema),
    defaultValues: {
      party_a_name: contract.party_a_name,
      party_a_address: contract.party_a_address ?? '',
      party_a_tax_code: contract.party_a_tax_code ?? '',
      party_a_representative: contract.party_a_representative ?? '',
      party_a_title: contract.party_a_title ?? '',
      party_b_name: contract.party_b_name,
      party_b_address: contract.party_b_address ?? '',
      party_b_tax_code: contract.party_b_tax_code ?? '',
      party_b_bank_account: contract.party_b_bank_account ?? '',
      party_b_representative: contract.party_b_representative ?? '',
      payment_term: contract.payment_term ?? '',
      effective_date: contract.effective_date ?? '',
      expiry_date: contract.expiry_date ?? '',
      notes: contract.notes ?? '',
    },
  });

  function handleClose() {
    reset();
    onClose();
  }

  return (
    <AdaptiveSheet
      open={open}
      onClose={handleClose}
      title="Chỉnh sửa hợp đồng"
      maxWidth={640}
      footer={
        <div className="flex gap-3 justify-end">
          <Button
            variant="secondary"
            onClick={handleClose}
            disabled={isLoading}
          >
            Thoát
          </Button>
          <Button
            variant="primary"
            onClick={() => void handleSubmit(onSave)()}
            isLoading={isLoading}
          >
            Lưu thay đổi
          </Button>
        </div>
      }
    >
      <div className="form-grid">
        <p className="text-sm font-semibold text-muted mb-2">Thông tin Bên A</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="form-field">
            <label>
              Tên bên A <span className="field-required">*</span>
            </label>
            <input
              type="text"
              className={`field-input${errors.party_a_name ? ' is-error' : ''}`}
              {...register('party_a_name')}
            />
            {errors.party_a_name && (
              <span className="field-error">{errors.party_a_name.message}</span>
            )}
          </div>
          <div className="form-field">
            <label>MST bên A</label>
            <input
              type="text"
              className="field-input"
              {...register('party_a_tax_code')}
            />
          </div>
        </div>
        <div className="form-field">
          <label>Địa chỉ bên A</label>
          <input
            type="text"
            className="field-input"
            {...register('party_a_address')}
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="form-field">
            <label>Người đại diện bên A</label>
            <input
              type="text"
              className="field-input"
              {...register('party_a_representative')}
            />
          </div>
          <div className="form-field">
            <label>Chức vụ</label>
            <input
              type="text"
              className="field-input"
              {...register('party_a_title')}
            />
          </div>
        </div>

        <p className="text-sm font-semibold text-muted mb-2 mt-2">
          Thông tin Bên B (Vĩnh Phát)
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="form-field">
            <label>
              Tên bên B <span className="field-required">*</span>
            </label>
            <input
              type="text"
              className={`field-input${errors.party_b_name ? ' is-error' : ''}`}
              {...register('party_b_name')}
            />
            {errors.party_b_name && (
              <span className="field-error">{errors.party_b_name.message}</span>
            )}
          </div>
          <div className="form-field">
            <label>MST bên B</label>
            <input
              type="text"
              className="field-input"
              {...register('party_b_tax_code')}
            />
          </div>
        </div>
        <div className="form-field">
          <label>Địa chỉ bên B</label>
          <input
            type="text"
            className="field-input"
            {...register('party_b_address')}
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="form-field">
            <label>Người đại diện bên B</label>
            <input
              type="text"
              className="field-input"
              {...register('party_b_representative')}
            />
          </div>
          <div className="form-field">
            <label>Tài khoản ngân hàng</label>
            <input
              type="text"
              className="field-input"
              {...register('party_b_bank_account')}
            />
          </div>
        </div>

        <p className="text-sm font-semibold text-muted mb-2 mt-2">Điều khoản</p>
        <div className="form-field">
          <label>Điều khoản thanh toán</label>
          <input
            type="text"
            className="field-input"
            placeholder="VD: Thanh toán 30 ngày sau khi giao hàng"
            {...register('payment_term')}
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="form-field">
            <label>Ngày hiệu lực</label>
            <input
              type="date"
              className="field-input"
              {...register('effective_date')}
            />
          </div>
          <div className="form-field">
            <label>Ngày hết hạn</label>
            <input
              type="date"
              className="field-input"
              {...register('expiry_date')}
            />
          </div>
        </div>
        <div className="form-field">
          <label>Ghi chú</label>
          <textarea
            className="field-textarea"
            rows={3}
            {...register('notes')}
          />
        </div>
      </div>
    </AdaptiveSheet>
  );
}

// ── Audit log entry ───────────────────────────────────────────────────────────

const ACTION_LABELS: Record<string, string> = {
  created: 'Hợp đồng được tạo',
  updated: 'Cập nhật thông tin',
  status_changed: 'Chuyển trạng thái',
  order_linked: 'Liên kết đơn hàng',
  order_unlinked: 'Hủy liên kết đơn hàng',
};

const ACTION_ICONS: Record<string, string> = {
  created: 'FilePlus',
  updated: 'Pencil',
  status_changed: 'RefreshCw',
  order_linked: 'Link',
  order_unlinked: 'Unlink',
};

type AuditLogEntryProps = {
  log: ContractAuditLog;
  isLast: boolean;
};

function AuditLogEntry({ log, isLast }: AuditLogEntryProps) {
  const label = ACTION_LABELS[log.action] ?? log.action;
  const iconName = (ACTION_ICONS[log.action] ?? 'Activity') as Parameters<
    typeof Icon
  >[0]['name'];

  const formattedTime = new Date(log.performed_at).toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const newStatus =
    log.action === 'status_changed' &&
    log.new_values &&
    typeof log.new_values['status'] === 'string'
      ? (CONTRACT_STATUS_LABELS[
          log.new_values['status'] as keyof typeof CONTRACT_STATUS_LABELS
        ] ?? (log.new_values['status'] as string))
      : null;

  const cancelReason: string | null =
    log.action === 'status_changed' &&
    log.new_values &&
    typeof log.new_values['reason'] === 'string'
      ? (log.new_values['reason'] as string)
      : null;

  return (
    <div className="flex gap-3 group">
      {/* Timeline line */}
      <div className="flex flex-col items-center shrink-0">
        <div className="w-7 h-7 rounded-full bg-surface-subtle border border-border flex items-center justify-center text-muted group-hover:border-primary/30 transition-colors">
          <Icon name={iconName} size={14} />
        </div>
        {!isLast && <div className="w-px flex-1 bg-border min-h-[20px] mt-1" />}
      </div>

      {/* Content */}
      <div className={`pb-4 min-w-0 flex-1 ${isLast ? 'pb-0' : ''}`}>
        <p className="text-sm font-medium text-foreground">{label}</p>
        {newStatus && (
          <p className="text-xs text-muted mt-0.5">
            Trạng thái mới: <span className="font-medium">{newStatus}</span>
          </p>
        )}
        {cancelReason && (
          <p className="text-xs italic text-muted mt-0.5">
            Lý do: {cancelReason}
          </p>
        )}
        <p className="text-xs text-muted mt-0.5">{formattedTime}</p>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function ContractDetailPage({
  contractId,
  onBack,
}: ContractDetailPageProps) {
  const { data: contract, isLoading, error } = useContract(contractId);
  const { data: linkedOrders = [], isLoading: ordersLoading } =
    useContractLinkedOrders(contractId);
  const { data: auditLogs = [], isLoading: auditLoading } =
    useContractAuditLogs(contractId);

  const updateMutation = useUpdateContract();
  const statusMutation = useUpdateContractStatus();
  const linkMutation = useLinkOrder();
  const unlinkMutation = useUnlinkOrder();
  const { confirm } = useConfirm();

  const [showEdit, setShowEdit] = useState(false);
  const [showCancel, setShowCancel] = useState(false);
  const [showSign, setShowSign] = useState(false);
  const [showLinkOrder, setShowLinkOrder] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);

  // ── Loading / error states ──────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="panel-card">
        <p className="table-empty">Đang tải...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="panel-card">
        <p className="error-inline">Lỗi: {(error as Error).message}</p>
      </div>
    );
  }

  if (!contract) {
    return (
      <div className="panel-card">
        <p className="table-empty">Không tìm thấy hợp đồng.</p>
      </div>
    );
  }

  const canEdit = contract.status === 'draft' || contract.status === 'sent';
  const canSend = contract.status === 'draft';
  const canSign = contract.status === 'sent';
  const canCancel = contract.status === 'draft' || contract.status === 'sent';
  const canLinkOrder = contract.status !== 'signed';

  // ── Handlers ────────────────────────────────────────────────────────────────

  async function handleSend() {
    const ok = await confirm({
      message: 'Xác nhận đã gửi hợp đồng cho đối tác?',
    });
    if (!ok) return;
    statusMutation.mutate(
      {
        id: contractId,
        status: 'sent',
      },
      { onSuccess: () => toast.success('Đã cập nhật trạng thái: Đã gửi') },
    );
  }

  function handleCancelConfirm(reason: string) {
    statusMutation.mutate(
      {
        id: contractId,
        status: 'cancelled',
        meta: { cancelReason: reason },
      },
      {
        onSuccess: () => {
          setShowCancel(false);
          toast.success('Đã huỷ hợp đồng');
        },
      },
    );
  }

  function handleSignConfirm(signedFileUrl?: string) {
    statusMutation.mutate(
      {
        id: contractId,
        status: 'signed',
        meta: { signedFileUrl },
      },
      {
        onSuccess: () => {
          setShowSign(false);
          toast.success('Đã xác nhận hợp đồng đã ký');
        },
      },
    );
  }

  async function handleExportPdf() {
    setPdfLoading(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token ?? '';
      const { error: fnError } = await supabase.functions.invoke(
        'export-contract-pdf',
        {
          body: { contract_id: contractId },
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        },
      );
      if (fnError) throw fnError;
      toast.success('Xuất PDF thành công');
    } catch (err) {
      toast.error((err as Error).message ?? 'Xuất PDF thất bại');
    } finally {
      setPdfLoading(false);
    }
  }

  function handleSaveEdit(data: UpdateContractInput) {
    updateMutation.mutate(
      {
        id: contractId,
        data,
      },
      { onSuccess: () => setShowEdit(false) },
    );
  }

  function handleLinkOrder(orderId: string) {
    linkMutation.mutate(
      {
        contractId,
        orderId,
      },
      { onSuccess: () => setShowLinkOrder(false) },
    );
  }

  async function handleUnlinkOrder(orderId: string, orderNumber: string) {
    const ok = await confirm({
      message: `Hủy liên kết đơn hàng ${orderNumber}?`,
      variant: 'danger',
    });
    if (!ok) return;
    unlinkMutation.mutate({
      contractId,
      orderId,
    });
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <>
      <div className="panel-card card-flush">
        {/* Header */}
        <div className="p-5">
          <div className="flex items-center gap-3 mb-4 flex-wrap">
            <Button variant="secondary" leftIcon="ArrowLeft" onClick={onBack}>
              Quay lại
            </Button>
            <div className="flex-1 min-w-0">
              <h3 className="m-0 font-mono text-lg">
                {contract.contract_number}
              </h3>
              <span className="td-muted text-sm">
                {CONTRACT_TYPE_LABELS[contract.type]}
              </span>
            </div>
            <ContractStatusBadge status={contract.status} />
          </div>

          {/* Info grid */}
          <div className="dashboard-summary-row mb-4">
            <div>
              <div className="td-muted summary-label">Bên A</div>
              <div className="font-medium">{contract.party_a_name}</div>
              {contract.party_a_tax_code && (
                <div className="text-xs text-muted">
                  MST: {contract.party_a_tax_code}
                </div>
              )}
            </div>
            <div>
              <div className="td-muted summary-label">Người đại diện A</div>
              <div>{contract.party_a_representative ?? '—'}</div>
              {contract.party_a_title && (
                <div className="text-xs text-muted">
                  {contract.party_a_title}
                </div>
              )}
            </div>
            <div>
              <div className="td-muted summary-label">Ngày hiệu lực</div>
              <div>{formatDate(contract.effective_date)}</div>
            </div>
            <div>
              <div className="td-muted summary-label">Ngày hết hạn</div>
              <div>{formatDate(contract.expiry_date)}</div>
            </div>
            <div>
              <div className="td-muted summary-label">Điều khoản TT</div>
              <div>{contract.payment_term ?? '—'}</div>
            </div>
          </div>

          {/* Lifecycle metadata */}
          {(contract.sent_at ||
            contract.signed_at ||
            contract.cancelled_at) && (
            <div className="info-box mb-4 text-sm space-y-1">
              {contract.sent_at && (
                <p>
                  <span className="font-medium">Đã gửi:</span>{' '}
                  {formatDate(contract.sent_at)}
                </p>
              )}
              {contract.signed_at && (
                <p>
                  <span className="font-medium">Đã ký:</span>{' '}
                  {formatDate(contract.signed_at)}
                </p>
              )}
              {contract.cancelled_at && (
                <p>
                  <span className="font-medium">Đã huỷ:</span>{' '}
                  {formatDate(contract.cancelled_at)}
                  {contract.cancel_reason && (
                    <span className="text-muted">
                      {' '}
                      — {contract.cancel_reason}
                    </span>
                  )}
                </p>
              )}
              {contract.signed_file_url && (
                <p>
                  <a
                    href={contract.signed_file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary underline"
                  >
                    Xem file hợp đồng đã ký
                  </a>
                </p>
              )}
            </div>
          )}

          {contract.notes && (
            <div className="info-box mb-4">
              <strong>Ghi chú:</strong> {contract.notes}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-wrap gap-2 mb-2">
            {canEdit && (
              <Button
                variant="secondary"
                leftIcon="Pencil"
                onClick={() => setShowEdit(true)}
              >
                Chỉnh sửa
              </Button>
            )}
            {canSend && (
              <Button
                variant="primary"
                leftIcon="Send"
                onClick={() => void handleSend()}
                isLoading={statusMutation.isPending && !showCancel && !showSign}
              >
                Gửi hợp đồng
              </Button>
            )}
            {canSign && (
              <Button
                variant="success"
                leftIcon="CheckCircle"
                onClick={() => setShowSign(true)}
              >
                Xác nhận đã ký
              </Button>
            )}
            <Button
              variant="outline"
              leftIcon="FileDown"
              onClick={() => void handleExportPdf()}
              isLoading={pdfLoading}
            >
              Xuất PDF
            </Button>
            {canLinkOrder && (
              <Button
                variant="outline"
                leftIcon="Link"
                onClick={() => setShowLinkOrder(true)}
              >
                Liên kết đơn hàng
              </Button>
            )}
            {canCancel && (
              <Button
                variant="secondary"
                leftIcon="XCircle"
                onClick={() => setShowCancel(true)}
                className="text-danger"
              >
                Hủy hợp đồng
              </Button>
            )}
          </div>

          {statusMutation.error && (
            <p className="error-inline text-sm mt-2">
              Lỗi: {(statusMutation.error as Error).message}
            </p>
          )}
        </div>

        {/* Linked orders */}
        <div className="px-5 pb-5">
          <h4 className="mb-3 flex items-center gap-2">
            <Icon name="Link" size={16} />
            Đơn hàng liên kết ({linkedOrders.length})
          </h4>
          {ordersLoading ? (
            <p className="table-empty text-sm">Đang tải...</p>
          ) : linkedOrders.length === 0 ? (
            <p className="table-empty text-sm">
              Chưa có đơn hàng nào được liên kết.
            </p>
          ) : (
            <div className="data-table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Số đơn hàng</th>
                    <th>Trạng thái</th>
                    <th>Ngày liên kết</th>
                    {canLinkOrder && <th className="text-right">Thao tác</th>}
                  </tr>
                </thead>
                <tbody>
                  {linkedOrders.map((order) => (
                    <tr key={order.id}>
                      <td className="font-mono font-medium">
                        {order.order_number}
                      </td>
                      <td>
                        <span className="badge-outline text-xs">
                          {order.status}
                        </span>
                      </td>
                      <td className="td-muted text-sm">
                        {formatDate(order.linked_at)}
                      </td>
                      {canLinkOrder && (
                        <td className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            leftIcon="Unlink"
                            onClick={() =>
                              void handleUnlinkOrder(
                                order.id,
                                order.order_number,
                              )
                            }
                            isLoading={unlinkMutation.isPending}
                            className="text-danger"
                          >
                            Huy lien ket
                          </Button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Audit log timeline */}
        <div className="px-5 pb-5">
          <h4 className="mb-3 flex items-center gap-2">
            <Icon name="History" size={16} />
            Lịch sử hoạt động
          </h4>
          {auditLoading ? (
            <p className="table-empty text-sm">Đang tải...</p>
          ) : auditLogs.length === 0 ? (
            <p className="table-empty text-sm">Chưa có hoạt động nào.</p>
          ) : (
            <div className="space-y-0">
              {auditLogs.map((log, idx) => (
                <AuditLogEntry
                  key={log.id}
                  log={log}
                  isLast={idx === auditLogs.length - 1}
                />
              ))}
            </div>
          )}
        </div>

        {/* Contract preview */}
        <div className="px-5 pb-5">
          <h4 className="mb-3 flex items-center gap-2">
            <Icon name="FileText" size={16} />
            Xem trước nội dung hợp đồng
          </h4>
          <ContractPreview
            content={contract.content}
            contractNumber={contract.contract_number}
          />
        </div>
      </div>

      {/* Sheets */}
      {canEdit && (
        <EditSheet
          open={showEdit}
          onClose={() => setShowEdit(false)}
          contract={contract}
          onSave={handleSaveEdit}
          isLoading={updateMutation.isPending}
        />
      )}

      <CancelSheet
        open={showCancel}
        onClose={() => setShowCancel(false)}
        onConfirm={handleCancelConfirm}
        isLoading={statusMutation.isPending}
      />

      <SignSheet
        open={showSign}
        onClose={() => setShowSign(false)}
        onConfirm={handleSignConfirm}
        isLoading={statusMutation.isPending}
      />

      <LinkOrderSheet
        open={showLinkOrder}
        onClose={() => setShowLinkOrder(false)}
        onLink={handleLinkOrder}
        isLoading={linkMutation.isPending}
        linkedOrderIds={linkedOrders.map((o) => o.id)}
      />
    </>
  );
}
