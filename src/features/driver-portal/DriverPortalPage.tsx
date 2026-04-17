import { useState } from 'react';
import toast from 'react-hot-toast';

import { useAuth } from '@/features/auth/AuthProvider';
import { Icon } from '@/shared/components';
import { formatCurrency } from '@/shared/utils/format';
import {
  useMyDriverEmployee,
  useDriverShipments,
  useJourneyLogs,
  useUpdateJourneyStatus,
} from '@/application/shipments';

import { JOURNEY_STATUS_LABELS, JOURNEY_STATUS_ORDER } from './types';
import type { DriverShipment, JourneyStatus } from './types';

function JourneyStepButton({
  status: _status,
  label,
  isActive,
  isDone,
  onClick,
  disabled,
}: {
  status: JourneyStatus;
  label: string;
  isActive: boolean;
  isDone: boolean;
  onClick: () => void;
  disabled: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || isDone}
      className={`flex items-center gap-3 w-full py-[0.875rem] px-4 rounded-[var(--radius)] text-left ${
        isActive
          ? 'border-2 border-primary bg-[rgba(11,107,203,0.07)]'
          : isDone
            ? 'border-[1.5px] border-success bg-[rgba(10,128,92,0.06)] cursor-default'
            : 'border-[1.5px] border-border bg-surface'
      } ${isDone || disabled ? 'cursor-default' : 'cursor-pointer'}`}
    >
      <div
        className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-white ${
          isDone ? 'bg-success' : isActive ? 'bg-primary' : 'bg-muted'
        }`}
      >
        {isDone ? (
          <Icon name="Check" size={14} />
        ) : isActive ? (
          <Icon name="ChevronRight" size={14} />
        ) : (
          <Icon name="Circle" size={14} className="text-muted-foreground" />
        )}
      </div>
      <span
        className={`text-[0.9rem] ${isActive || isDone ? 'font-semibold' : 'font-normal'} ${
          isDone
            ? 'text-success'
            : isActive
              ? 'text-primary'
              : 'text-muted-foreground'
        }`}
      >
        {label}
      </span>
      {isActive && !isDone && (
        <span className="ml-auto text-xs font-semibold text-primary bg-[rgba(11,107,203,0.12)] px-2 py-0.5 rounded-full">
          Nhấn để cập nhật
        </span>
      )}
    </button>
  );
}

function ShipmentCard({
  shipment,
  employeeId,
}: {
  shipment: DriverShipment;
  employeeId: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const [notesInput, setNotesInput] = useState('');
  const { data: logs = [] } = useJourneyLogs(
    expanded ? shipment.id : undefined,
  );
  const mutation = useUpdateJourneyStatus();

  const currentJourneyIdx = shipment.journey_status
    ? JOURNEY_STATUS_ORDER.indexOf(shipment.journey_status)
    : -1;

  const nextStatus = JOURNEY_STATUS_ORDER[currentJourneyIdx + 1];

  async function handleAdvance(targetStatus: JourneyStatus) {
    try {
      await mutation.mutateAsync({
        shipmentId: shipment.id,
        journeyStatus: targetStatus,
        notes: notesInput.trim() || undefined,
        updatedBy: employeeId,
      });
      setNotesInput('');
      toast.success(`Đã cập nhật: ${JOURNEY_STATUS_LABELS[targetStatus]}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Có lỗi xảy ra');
    }
  }

  const totalCost = (shipment.shipping_cost ?? 0) + (shipment.loading_fee ?? 0);

  return (
    <div className="bg-surface rounded-xl border-[1.5px] border-border overflow-hidden mb-4">
      {/* Card header */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex items-center justify-between w-full p-4 bg-transparent border-none cursor-pointer gap-3"
      >
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-[var(--radius)] bg-[rgba(11,107,203,0.1)] flex items-center justify-center shrink-0">
            <Icon name="Truck" size={20} className="text-primary" />
          </div>
          <div className="text-left">
            <p className="font-bold text-[0.95rem] text-[var(--text-primary)]">
              {shipment.shipment_number}
            </p>
            <p className="text-[0.8rem] text-[var(--text-secondary)] mt-[2px]">
              {shipment.customers?.name ?? 'Khách hàng'}
            </p>
            {shipment.journey_status && (
              <span className="inline-block mt-1 text-[0.72rem] font-semibold text-primary bg-[rgba(11,107,203,0.1)] px-2 py-0.5 rounded-full">
                {JOURNEY_STATUS_LABELS[shipment.journey_status]}
              </span>
            )}
          </div>
        </div>
        <Icon
          name={expanded ? 'ChevronUp' : 'ChevronDown'}
          size={18}
          className="text-muted-foreground shrink-0"
        />
      </button>

      {/* Details */}
      {expanded && (
        <div className="px-4 pb-4">
          {/* Info row */}
          <div className="grid grid-cols-2 gap-2 p-3 bg-[var(--surface-accent)] rounded-[var(--radius)] mb-4 text-[0.82rem]">
            <div>
              <p className="text-[var(--text-tertiary)]">Ngày giao</p>
              <p className="font-semibold">{shipment.shipment_date}</p>
            </div>
            <div>
              <p className="text-[var(--text-tertiary)]">Cước vận chuyển</p>
              <p className="font-semibold text-primary">
                {totalCost ? `${formatCurrency(totalCost)}đ` : 'Miễn phí'}
              </p>
            </div>
            {shipment.delivery_address && (
              <div className="col-span-full">
                <p className="text-[var(--text-tertiary)]">Địa chỉ giao</p>
                <p className="font-medium">{shipment.delivery_address}</p>
              </div>
            )}
            {shipment.vehicle_info && (
              <div>
                <p className="text-[var(--text-tertiary)]">Xe</p>
                <p className="font-medium">{shipment.vehicle_info}</p>
              </div>
            )}
          </div>

          {/* Journey steps */}
          <p className="text-xs font-bold uppercase text-[var(--text-tertiary)] tracking-[0.06em] mb-2">
            Cập nhật hành trình
          </p>
          <div className="flex flex-col gap-2 mb-4">
            {JOURNEY_STATUS_ORDER.map((step, idx) => {
              const isDone = currentJourneyIdx >= idx;
              const isNext =
                step === nextStatus && shipment.status !== 'delivered';
              return (
                <JourneyStepButton
                  key={step}
                  status={step}
                  label={JOURNEY_STATUS_LABELS[step]}
                  isActive={isNext}
                  isDone={isDone}
                  disabled={
                    mutation.isPending || shipment.status === 'delivered'
                  }
                  onClick={() => {
                    if (isNext) void handleAdvance(step);
                  }}
                />
              );
            })}
          </div>

          {nextStatus && shipment.status !== 'delivered' && (
            <div className="mb-3">
              <label className="text-[0.8rem] text-[var(--text-secondary)] block mb-1">
                Ghi chú (tùy chọn)
              </label>
              <input
                className="field-input"
                value={notesInput}
                onChange={(e) => setNotesInput(e.target.value)}
                placeholder="Ví dụ: Đã đến địa chỉ, chờ khách ra nhận..."
              />
            </div>
          )}

          {/* Journey log */}
          {logs.length > 0 && (
            <div>
              <p className="text-xs font-bold uppercase text-[var(--text-tertiary)] tracking-[0.06em] mb-2">
                Lịch sử hành trình
              </p>
              <div className="flex flex-col gap-1">
                {logs.map((log) => (
                  <div
                    key={log.id}
                    className="flex gap-2 text-[0.78rem] text-[var(--text-secondary)]"
                  >
                    <Icon name="Clock" size={13} className="shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold">
                        {JOURNEY_STATUS_LABELS[log.journey_status]}
                      </span>
                      {log.notes && <span> — {log.notes}</span>}
                      <span className="text-[var(--text-tertiary)] ml-1">
                        {new Date(log.created_at).toLocaleTimeString('vi-VN', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function DriverPortalPage() {
  const { profile } = useAuth();
  const { data: myEmployee, isLoading: loadingEmployee } = useMyDriverEmployee(
    profile?.id,
  );
  const employeeId = myEmployee?.id;
  const {
    data: shipments = [],
    isLoading,
    error,
  } = useDriverShipments(employeeId);

  if (loadingEmployee || (!myEmployee && !employeeId)) {
    if (loadingEmployee) {
      return (
        <div className="text-center p-12 text-[var(--text-tertiary)]">
          <Icon name="Loader2" size={32} />
          <p className="mt-2 text-[0.85rem]">Đang tải thông tin tài xế...</p>
        </div>
      );
    }
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 p-8 text-center">
        <Icon name="UserX" size={48} className="text-[var(--text-tertiary)]" />
        <p className="font-bold text-base">
          Tài khoản chưa liên kết với nhân viên
        </p>
        <p className="text-[0.85rem] text-[var(--text-secondary)]">
          Vui lòng liên hệ quản trị viên để liên kết tài khoản này với hồ sơ
          nhân viên tài xế.
        </p>
      </div>
    );
  }

  if (!employeeId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 p-8 text-center">
        <Icon name="UserX" size={48} className="text-[var(--text-tertiary)]" />
        <p className="font-bold text-base">
          Tài khoản chưa liên kết với nhân viên
        </p>
        <p className="text-[0.85rem] text-[var(--text-secondary)]">
          Vui lòng liên hệ quản trị viên để liên kết tài khoản này với hồ sơ
          nhân viên tài xế.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-[600px] mx-auto p-4">
      {/* Header */}
      <div className="mb-6">
        <p className="text-xs font-bold uppercase tracking-[0.08em] text-[var(--text-tertiary)]">
          CỔNG TÀI XẾ
        </p>
        <h1 className="text-2xl font-extrabold text-[var(--text-primary)] mt-1 mb-0.5 mx-0">
          Đơn giao hôm nay
        </h1>
        <p className="text-[0.85rem] text-[var(--text-secondary)]">
          Xin chào, {profile?.full_name ?? 'Tài xế'}
        </p>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="text-center p-12 text-[var(--text-tertiary)]">
          <Icon name="Loader2" size={32} />
          <p className="mt-2 text-[0.85rem]">Đang tải đơn giao hàng...</p>
        </div>
      )}

      {/* Error */}
      {error && (
        <p className="error-inline">
          Lỗi tải dữ liệu: {(error as Error).message}
        </p>
      )}

      {/* Empty state */}
      {!isLoading && shipments.length === 0 && (
        <div className="text-center py-12 px-4 text-[var(--text-tertiary)] bg-surface rounded-xl border-[1.5px] border-dashed border-border">
          <Icon name="PackageCheck" size={40} />
          <p className="font-bold mt-3">Không có đơn giao nào</p>
          <p className="text-[0.82rem] mt-1">
            Hiện tại bạn chưa được phân công đơn giao hàng nào.
          </p>
        </div>
      )}

      {/* Shipment list */}
      {shipments.map((shipment) => (
        <ShipmentCard
          key={shipment.id}
          shipment={shipment}
          employeeId={employeeId}
        />
      ))}
    </div>
  );
}
