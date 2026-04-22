import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';

import { Button } from '@/shared/components';
import { AdaptiveSheet } from '@/shared/components/AdaptiveSheet';
import {
  useBomDetail,
  useApproveBom,
  useDeprecateBom,
  useReviseBom,
} from '@/application/production';

import { BomDetail } from './BomDetail';

type ActionSheetState =
  | { type: 'idle' }
  | { type: 'approve'; bomId: string; bomCode: string }
  | { type: 'deprecate'; bomId: string; bomCode: string }
  | { type: 'revise'; bomId: string; bomCode: string };

export function BomDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [actionSheet, setActionSheet] = useState<ActionSheetState>({
    type: 'idle',
  });
  const [actionReason, setActionReason] = useState('');

  const { data: bom } = useBomDetail(id ?? null);
  const approveBom = useApproveBom();
  const deprecateBom = useDeprecateBom();
  const reviseBom = useReviseBom();

  const isMutating =
    approveBom.isPending || deprecateBom.isPending || reviseBom.isPending;

  const closeActionSheet = () => {
    setActionSheet({ type: 'idle' });
    setActionReason('');
  };

  const handleConfirmAction = async () => {
    if (actionSheet.type === 'idle') return;

    try {
      if (actionSheet.type === 'approve') {
        await approveBom.mutateAsync({
          id: actionSheet.bomId,
          reason: actionReason || 'Phê duyệt',
        });
        toast.success(`Đã phê duyệt BOM ${actionSheet.bomCode}`);
      }

      if (actionSheet.type === 'deprecate') {
        if (!actionReason.trim()) {
          toast.error('Vui lòng nhập lý do báo phế.');
          return;
        }
        await deprecateBom.mutateAsync({
          id: actionSheet.bomId,
          reason: actionReason,
        });
        toast.success(`Đã báo phế BOM ${actionSheet.bomCode}`);
      }

      if (actionSheet.type === 'revise') {
        if (!actionReason.trim()) {
          toast.error('Vui lòng nhập lý do tạo phiên bản mới.');
          return;
        }
        await reviseBom.mutateAsync({
          id: actionSheet.bomId,
          reason: actionReason,
        });
        toast.success(`Đã tạo phiên bản mới cho BOM ${actionSheet.bomCode}`);
        navigate('/bom');
      }

      closeActionSheet();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Có lỗi xảy ra');
    }
  };

  if (!id) return null;

  const needsReason =
    actionSheet.type !== 'idle' && actionSheet.type !== 'approve';
  const reasonLabels: Record<string, string> = {
    deprecate: 'Lý do ngừng áp dụng',
    revise: 'Lý do tạo phiên bản mới',
  };
  const titles: Record<string, string> =
    actionSheet.type !== 'idle'
      ? {
          approve: `Phê duyệt BOM ${actionSheet.bomCode}`,
          deprecate: `Báo phế BOM ${actionSheet.bomCode}`,
          revise: `Tạo phiên bản mới — ${actionSheet.bomCode}`,
        }
      : {};

  return (
    <>
      <BomDetail
        bomId={id}
        bom={bom ?? null}
        onBack={() => navigate('/bom')}
        onApprove={(bomId, bomCode) =>
          setActionSheet({
            type: 'approve',
            bomId,
            bomCode,
          })
        }
        onDeprecate={(bomId, bomCode) =>
          setActionSheet({
            type: 'deprecate',
            bomId,
            bomCode,
          })
        }
        onRevise={(bomId, bomCode) =>
          setActionSheet({
            type: 'revise',
            bomId,
            bomCode,
          })
        }
        onCreateWorkOrder={(bomId) =>
          navigate(`/work-orders?action=create&bom_id=${bomId}`)
        }
        onEdit={() => navigate(`/bom/${id}/edit`)}
        isSaving={isMutating}
      />

      {actionSheet.type !== 'idle' && (
        <AdaptiveSheet
          open
          onClose={closeActionSheet}
          title={titles[actionSheet.type] ?? ''}
          footer={
            <div className="flex gap-3 w-full">
              <Button
                variant="secondary"
                className="flex-1"
                type="button"
                onClick={closeActionSheet}
                disabled={isMutating}
              >
                Hủy
              </Button>
              <Button
                variant="primary"
                className="flex-1"
                type="button"
                onClick={handleConfirmAction}
                isLoading={isMutating}
              >
                Xác nhận
              </Button>
            </div>
          }
        >
          <div className="flex flex-col gap-4">
            {actionSheet.type === 'approve' && (
              <>
                <p className="text-sm text-muted">
                  Bạn có chắc chắn muốn phê duyệt BOM này? Sau khi duyệt, BOM sẽ
                  được áp dụng cho sản xuất.
                </p>
                <div className="form-field">
                  <label>Ghi chú (tùy chọn)</label>
                  <textarea
                    className="field-input min-h-[60px]"
                    placeholder="Ghi chú phê duyệt..."
                    value={actionReason}
                    onChange={(e) => setActionReason(e.target.value)}
                  />
                </div>
              </>
            )}
            {needsReason && (
              <div className="form-field">
                <label>{reasonLabels[actionSheet.type] ?? ''}</label>
                <textarea
                  className="field-input min-h-[80px]"
                  placeholder="Nhập lý do..."
                  value={actionReason}
                  onChange={(e) => setActionReason(e.target.value)}
                  autoFocus
                />
              </div>
            )}
          </div>
        </AdaptiveSheet>
      )}
    </>
  );
}
