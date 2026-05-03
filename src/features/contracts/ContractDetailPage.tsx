import { useState } from 'react';
import toast from 'react-hot-toast';

import { Button, Icon, useConfirm } from '@/shared/components';
import {
  useContract,
  useContractLinkedOrders,
  useContractAuditLogs,
  useUpdateContract,
  useUpdateContractStatus,
  useLinkOrder,
  useUnlinkOrder,
  useExportContractPdf,
} from '@/application/contracts';

import { CONTRACT_TYPE_LABELS } from './contracts.module';
import type { UpdateContractInput } from './contracts.module';
import { ContractStatusBadge } from './ContractStatusBadge';
import { ContractPreview } from './ContractPreview';
import { ContractCancelSheet } from './ContractCancelSheet';
import { ContractSignSheet } from './ContractSignSheet';
import { ContractLinkOrderSheet } from './ContractLinkOrderSheet';
import { ContractEditSheet } from './ContractEditSheet';
import { ContractAuditTimeline } from './ContractAuditTimeline';
import { ContractLinkedOrders } from './ContractLinkedOrders';
import { formatContractDate } from './contracts.utils';

// ── Types ────────────────────────────────────────────────────────────────────

type ContractDetailPageProps = {
  contractId: string;
  onBack: () => void;
};

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
  const exportPdfMutation = useExportContractPdf();
  const { confirm } = useConfirm();

  const [showEdit, setShowEdit] = useState(false);
  const [showCancel, setShowCancel] = useState(false);
  const [showSign, setShowSign] = useState(false);
  const [showLinkOrder, setShowLinkOrder] = useState(false);

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
        <p className="error-inline">
          Lỗi: {error instanceof Error ? error.message : String(error)}
        </p>
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

  function handleExportPdf() {
    exportPdfMutation.mutate(contractId);
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
              <div>{formatContractDate(contract.effective_date)}</div>
            </div>
            <div>
              <div className="td-muted summary-label">Ngày hết hạn</div>
              <div>{formatContractDate(contract.expiry_date)}</div>
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
                  {formatContractDate(contract.sent_at)}
                </p>
              )}
              {contract.signed_at && (
                <p>
                  <span className="font-medium">Đã ký:</span>{' '}
                  {formatContractDate(contract.signed_at)}
                </p>
              )}
              {contract.cancelled_at && (
                <p>
                  <span className="font-medium">Đã huỷ:</span>{' '}
                  {formatContractDate(contract.cancelled_at)}
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
              isLoading={exportPdfMutation.isPending}
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
              Lỗi:{' '}
              {statusMutation.error instanceof Error
                ? statusMutation.error.message
                : String(statusMutation.error)}
            </p>
          )}
        </div>

        {/* Linked orders */}
        <ContractLinkedOrders
          orders={linkedOrders}
          isLoading={ordersLoading}
          canLinkOrder={canLinkOrder}
          onUnlink={(orderId, orderNumber) =>
            void handleUnlinkOrder(orderId, orderNumber)
          }
          isUnlinking={unlinkMutation.isPending}
        />

        {/* Audit log timeline */}
        <ContractAuditTimeline logs={auditLogs} isLoading={auditLoading} />

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
        <ContractEditSheet
          open={showEdit}
          onClose={() => setShowEdit(false)}
          contract={contract}
          onSave={handleSaveEdit}
          isLoading={updateMutation.isPending}
        />
      )}

      <ContractCancelSheet
        open={showCancel}
        onClose={() => setShowCancel(false)}
        onConfirm={handleCancelConfirm}
        isLoading={statusMutation.isPending}
      />

      <ContractSignSheet
        open={showSign}
        onClose={() => setShowSign(false)}
        onConfirm={handleSignConfirm}
        isLoading={statusMutation.isPending}
      />

      <ContractLinkOrderSheet
        open={showLinkOrder}
        onClose={() => setShowLinkOrder(false)}
        onLink={handleLinkOrder}
        isLoading={linkMutation.isPending}
        linkedOrderIds={linkedOrders.map((o) => o.id)}
      />
    </>
  );
}
