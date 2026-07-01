import { useState, useRef } from 'react';
import toast from 'react-hot-toast';

import { useAuth } from '@/features/auth/AuthProvider';
import { Icon } from '@/shared/components';
import { SignaturePad } from '@/shared/components/SignaturePad';
// eslint-disable-next-line boundaries/dependencies
import { ChatDrawer } from '@/features/chat/ChatDrawer';
import { MoneyText } from '@/shared/value';
import {
  useMyDriverEmployee,
  useDriverShipments,
  useJourneyLogs,
  useUpdateJourneyStatus,
  uploadDeliveryPhoto,
  uploadSignatureBlob,
  saveDeliverySignature,
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
  onOpenChat,
}: {
  shipment: DriverShipment;
  employeeId: string;
  onOpenChat: (shipment: DriverShipment) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [notesInput, setNotesInput] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showSignaturePad, setShowSignaturePad] = useState(false);
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const { data: logs = [] } = useJourneyLogs(
    expanded ? shipment.id : undefined,
  );
  const mutation = useUpdateJourneyStatus();

  const currentJourneyIdx = shipment.journey_status
    ? JOURNEY_STATUS_ORDER.indexOf(shipment.journey_status)
    : -1;

  const nextStatus = JOURNEY_STATUS_ORDER[currentJourneyIdx + 1];

  function handlePhotoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  }

  async function handleSignatureConfirm(dataUrl: string) {
    setSignatureDataUrl(dataUrl);
    setShowSignaturePad(false);
  }

  async function handleAdvance(targetStatus: JourneyStatus) {
    try {
      setIsUploading(true);
      let photoUrl: string | undefined;

      if (targetStatus === 'delivered_confirmed') {
        if (signatureDataUrl) {
          const sigUrl = await uploadSignatureBlob(
            signatureDataUrl,
            shipment.id,
          );
          await saveDeliverySignature(shipment.id, sigUrl);
          photoUrl = sigUrl;
        } else if (photoFile) {
          photoUrl = await uploadDeliveryPhoto(photoFile, shipment.id);
        }
      }

      await mutation.mutateAsync({
        shipmentId: shipment.id,
        journeyStatus: targetStatus,
        notes: notesInput.trim() || undefined,
        updatedBy: employeeId,
        photoUrl,
      });
      setNotesInput('');
      setPhotoFile(null);
      setPhotoPreview(null);
      setSignatureDataUrl(null);
      toast.success(`Đã cập nhật: ${JOURNEY_STATUS_LABELS[targetStatus]}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Có lỗi xảy ra');
    } finally {
      setIsUploading(false);
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
                {totalCost ? (
                  <MoneyText value={totalCost} suffix="đ" />
                ) : (
                  'Miễn phí'
                )}
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
                    mutation.isPending ||
                    isUploading ||
                    shipment.status === 'delivered'
                  }
                  onClick={() => {
                    if (isNext) void handleAdvance(step);
                  }}
                />
              );
            })}
          </div>

          {nextStatus && shipment.status !== 'delivered' && (
            <div className="mb-3 flex flex-col gap-2">
              <div>
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

              {nextStatus === 'delivered_confirmed' && (
                <div className="flex flex-col gap-2">
                  <label className="text-[0.8rem] font-semibold text-[var(--text-secondary)] block">
                    Bằng chứng giao hàng
                    <span className="text-[var(--text-tertiary)] font-normal ml-1">
                      (tùy chọn)
                    </span>
                  </label>

                  {/* Signature */}
                  {signatureDataUrl ? (
                    <div className="relative rounded-[var(--radius)] border border-border bg-white overflow-hidden">
                      <img
                        src={signatureDataUrl}
                        alt="Chữ ký"
                        className="w-full max-h-24 object-contain"
                      />
                      <div className="absolute top-1 left-2 text-[9px] text-[var(--text-tertiary)] font-semibold uppercase">
                        ✒ Chữ ký
                      </div>
                      <button
                        type="button"
                        onClick={() => setSignatureDataUrl(null)}
                        className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/50 flex items-center justify-center text-white"
                      >
                        <Icon name="X" size={12} />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowSignaturePad(true)}
                      className="flex items-center gap-2 w-full py-2.5 px-4 rounded-[var(--radius)] border-[1.5px] border-dashed border-border text-[var(--text-secondary)] text-[0.85rem] hover:border-primary hover:text-primary transition-colors"
                    >
                      <Icon name="PenLine" size={16} />
                      Lấy chữ ký khách hàng
                    </button>
                  )}

                  {/* Photo proof */}
                  <input
                    ref={photoInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={handlePhotoSelect}
                  />
                  {photoPreview ? (
                    <div className="relative w-full rounded-[var(--radius)] overflow-hidden border border-border">
                      <img
                        src={photoPreview}
                        alt="Ảnh"
                        className="w-full max-h-32 object-cover"
                      />
                      <div className="absolute top-1 left-2 text-[9px] text-[var(--text-tertiary)] font-semibold uppercase">
                        📸 Ảnh hiện trường
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setPhotoFile(null);
                          setPhotoPreview(null);
                        }}
                        className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/50 flex items-center justify-center text-white"
                      >
                        <Icon name="X" size={12} />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => photoInputRef.current?.click()}
                      className="flex items-center gap-2 w-full py-2.5 px-4 rounded-[var(--radius)] border-[1.5px] border-dashed border-border text-[var(--text-secondary)] text-[0.85rem] hover:border-primary hover:text-primary transition-colors"
                    >
                      <Icon name="Camera" size={16} />
                      Chụp ảnh hiện trường
                    </button>
                  )}
                </div>
              )}

              {showSignaturePad && (
                <SignaturePad
                  onConfirm={handleSignatureConfirm}
                  onCancel={() => setShowSignaturePad(false)}
                />
              )}
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
                    <div className="flex-1 min-w-0">
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
                      {log.photo_url && (
                        <a
                          href={log.photo_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block mt-1"
                        >
                          <img
                            src={log.photo_url}
                            alt="Ảnh xác nhận giao hàng"
                            className="rounded-[var(--radius)] max-h-28 object-cover border border-border"
                          />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Chat button */}
          <button
            type="button"
            className="flex items-center justify-center gap-2 w-full py-3 mt-3 rounded-[var(--radius)] border-[1.5px] border-primary text-primary font-semibold text-[0.85rem] bg-transparent cursor-pointer"
            onClick={() => onOpenChat(shipment)}
          >
            <Icon name="MessageCircle" size={18} />
            Liên hệ điều phối
          </button>
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
  const [chatShipment, setChatShipment] = useState<DriverShipment | null>(null);

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
          {error instanceof Error ? error.message : String(error)}
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
          onOpenChat={setChatShipment}
        />
      ))}

      {/* Chat Drawer */}
      {chatShipment ? (
        <ChatDrawer
          open
          onClose={() => setChatShipment(null)}
          entityType="shipment"
          entityId={chatShipment.id}
          title={`Chat ${chatShipment.shipment_number}`}
          subtitle={chatShipment.customers?.name ?? undefined}
        />
      ) : null}
    </div>
  );
}
