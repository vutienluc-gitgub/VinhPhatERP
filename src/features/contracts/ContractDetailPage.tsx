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
import { StatusBadge } from '@/shared/components';

import { CONTRACT_TYPE_LABELS } from './contracts.module';
import type { UpdateContractInput } from './contracts.module';
import { CONTRACT_LABELS, CONTRACT_MESSAGES } from './contracts.constants';
import { ContractPreview } from './ContractPreview';
import { ContractCancelSheet } from './ContractCancelSheet';
import { ContractSignSheet } from './ContractSignSheet';
import { ContractLinkOrderSheet } from './ContractLinkOrderSheet';
import { ContractEditSheet } from './ContractEditSheet';
import { ContractAuditTimeline } from './ContractAuditTimeline';
import { ContractLinkedOrders } from './ContractLinkedOrders';
import { ContractDetailSummary } from './components/ContractDetailSummary';
import { ContractLifecycleMetadata } from './components/ContractLifecycleMetadata';

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
        <p className="table-empty">{CONTRACT_MESSAGES.LOADING}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="panel-card">
        <p className="error-inline">
          {CONTRACT_MESSAGES.ERROR}:{' '}
          {error instanceof Error ? error.message : String(error)}
        </p>
      </div>
    );
  }

  if (!contract) {
    return (
      <div className="panel-card">
        <p className="table-empty">{CONTRACT_MESSAGES.NO_DATA}</p>
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
      message: CONTRACT_MESSAGES.CONFIRM_SEND,
    });
    if (!ok) return;
    statusMutation.mutate(
      {
        id: contractId,
        status: 'sent',
      },
      { onSuccess: () => toast.success(CONTRACT_MESSAGES.TOAST_SENT) },
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
          toast.success(CONTRACT_MESSAGES.TOAST_CANCELLED);
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
          toast.success(CONTRACT_MESSAGES.TOAST_SIGNED);
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
      message: `${CONTRACT_MESSAGES.CONFIRM_UNLINK} ${orderNumber}?`,
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
              {CONTRACT_LABELS.BTN_BACK}
            </Button>
            <div className="flex-1 min-w-0">
              <h3 className="m-0 font-mono text-lg">
                {contract.contract_number}
              </h3>
              <span className="text-muted-foreground text-sm text-sm">
                {CONTRACT_TYPE_LABELS[contract.type]}
              </span>
            </div>
            <StatusBadge domain="CONTRACT" status={contract.status} />
          </div>

          <ContractDetailSummary contract={contract} />

          <ContractLifecycleMetadata contract={contract} />

          {contract.notes && (
            <div className="info-box mb-4">
              <strong>{CONTRACT_LABELS.NOTES}:</strong> {contract.notes}
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
                {CONTRACT_LABELS.BTN_EDIT}
              </Button>
            )}
            {canSend && (
              <Button
                variant="primary"
                leftIcon="Send"
                onClick={() => void handleSend()}
                isLoading={statusMutation.isPending && !showCancel && !showSign}
              >
                {CONTRACT_LABELS.BTN_SEND}
              </Button>
            )}
            {canSign && (
              <Button
                variant="success"
                leftIcon="CheckCircle"
                onClick={() => setShowSign(true)}
              >
                {CONTRACT_LABELS.BTN_SIGN}
              </Button>
            )}
            <Button
              variant="outline"
              leftIcon="FileDown"
              onClick={() => void handleExportPdf()}
              isLoading={exportPdfMutation.isPending}
            >
              {CONTRACT_LABELS.BTN_EXPORT_PDF}
            </Button>
            {canLinkOrder && (
              <Button
                variant="outline"
                leftIcon="Link"
                onClick={() => setShowLinkOrder(true)}
              >
                {CONTRACT_LABELS.BTN_LINK_ORDER}
              </Button>
            )}
            {canCancel && (
              <Button
                variant="secondary"
                leftIcon="XCircle"
                onClick={() => setShowCancel(true)}
                className="text-danger"
              >
                {CONTRACT_LABELS.BTN_CANCEL}
              </Button>
            )}
          </div>

          {statusMutation.error && (
            <p className="error-inline text-sm mt-2">
              {CONTRACT_MESSAGES.ERROR}:{' '}
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
            {CONTRACT_LABELS.PREVIEW_CONTENT}
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
