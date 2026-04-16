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
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        width: '100%',
        padding: '0.875rem 1rem',
        borderRadius: 'var(--radius)',
        border: isActive
          ? '2px solid var(--primary)'
          : isDone
            ? '1.5px solid var(--success)'
            : '1.5px solid var(--border)',
        background: isActive
          ? 'rgba(11, 107, 203, 0.07)'
          : isDone
            ? 'rgba(10, 128, 92, 0.06)'
            : 'var(--surface)',
        cursor: isDone || disabled ? 'default' : 'pointer',
        textAlign: 'left',
      }}
    >
      <div
        style={{
          width: 28,
          height: 28,
          borderRadius: '50%',
          background: isDone
            ? 'var(--success)'
            : isActive
              ? 'var(--primary)'
              : 'var(--surface-muted)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        {isDone ? (
          <Icon name="Check" size={14} style={{ color: '#fff' }} />
        ) : isActive ? (
          <Icon name="ChevronRight" size={14} style={{ color: '#fff' }} />
        ) : (
          <Icon
            name="Circle"
            size={14}
            style={{ color: 'var(--text-tertiary)' }}
          />
        )}
      </div>
      <span
        style={{
          fontSize: '0.9rem',
          fontWeight: isActive || isDone ? 600 : 400,
          color: isDone
            ? 'var(--success)'
            : isActive
              ? 'var(--primary)'
              : 'var(--text-tertiary)',
        }}
      >
        {label}
      </span>
      {isActive && !isDone && (
        <span
          style={{
            marginLeft: 'auto',
            fontSize: '0.75rem',
            fontWeight: 600,
            color: 'var(--primary)',
            background: 'rgba(11, 107, 203, 0.12)',
            padding: '2px 8px',
            borderRadius: 99,
          }}
        >
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
    <div
      style={{
        background: 'var(--surface)',
        borderRadius: 'var(--radius-lg)',
        border: '1.5px solid var(--border)',
        overflow: 'hidden',
        marginBottom: '1rem',
      }}
    >
      {/* Card header */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          padding: '1rem',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          gap: '0.75rem',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.75rem',
          }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 'var(--radius)',
              background: 'rgba(11, 107, 203, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Icon name="Truck" size={20} style={{ color: 'var(--primary)' }} />
          </div>
          <div style={{ textAlign: 'left' }}>
            <p
              style={{
                fontWeight: 700,
                fontSize: '0.95rem',
                color: 'var(--text-primary)',
              }}
            >
              {shipment.shipment_number}
            </p>
            <p
              style={{
                fontSize: '0.8rem',
                color: 'var(--text-secondary)',
                marginTop: 2,
              }}
            >
              {shipment.customers?.name ?? 'Khách hàng'}
            </p>
            {shipment.journey_status && (
              <span
                style={{
                  display: 'inline-block',
                  marginTop: 4,
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  color: 'var(--primary)',
                  background: 'rgba(11, 107, 203, 0.1)',
                  padding: '2px 8px',
                  borderRadius: 99,
                }}
              >
                {JOURNEY_STATUS_LABELS[shipment.journey_status]}
              </span>
            )}
          </div>
        </div>
        <Icon
          name={expanded ? 'ChevronUp' : 'ChevronDown'}
          size={18}
          style={{
            color: 'var(--text-tertiary)',
            flexShrink: 0,
          }}
        />
      </button>

      {/* Details */}
      {expanded && (
        <div style={{ padding: '0 1rem 1rem' }}>
          {/* Info row */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '0.5rem',
              padding: '0.75rem',
              background: 'var(--surface-accent)',
              borderRadius: 'var(--radius)',
              marginBottom: '1rem',
              fontSize: '0.82rem',
            }}
          >
            <div>
              <p style={{ color: 'var(--text-tertiary)' }}>Ngày giao</p>
              <p style={{ fontWeight: 600 }}>{shipment.shipment_date}</p>
            </div>
            <div>
              <p style={{ color: 'var(--text-tertiary)' }}>Cước vận chuyển</p>
              <p
                style={{
                  fontWeight: 600,
                  color: 'var(--primary)',
                }}
              >
                {totalCost ? `${formatCurrency(totalCost)}đ` : 'Miễn phí'}
              </p>
            </div>
            {shipment.delivery_address && (
              <div style={{ gridColumn: '1 / -1' }}>
                <p style={{ color: 'var(--text-tertiary)' }}>Địa chỉ giao</p>
                <p style={{ fontWeight: 500 }}>{shipment.delivery_address}</p>
              </div>
            )}
            {shipment.vehicle_info && (
              <div>
                <p style={{ color: 'var(--text-tertiary)' }}>Xe</p>
                <p style={{ fontWeight: 500 }}>{shipment.vehicle_info}</p>
              </div>
            )}
          </div>

          {/* Journey steps */}
          <p
            style={{
              fontSize: '0.75rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              color: 'var(--text-tertiary)',
              letterSpacing: '0.06em',
              marginBottom: '0.5rem',
            }}
          >
            Cập nhật hành trình
          </p>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
              marginBottom: '1rem',
            }}
          >
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
            <div style={{ marginBottom: '0.75rem' }}>
              <label
                style={{
                  fontSize: '0.8rem',
                  color: 'var(--text-secondary)',
                  display: 'block',
                  marginBottom: 4,
                }}
              >
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
              <p
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  color: 'var(--text-tertiary)',
                  letterSpacing: '0.06em',
                  marginBottom: '0.5rem',
                }}
              >
                Lịch sử hành trình
              </p>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.25rem',
                }}
              >
                {logs.map((log) => (
                  <div
                    key={log.id}
                    style={{
                      display: 'flex',
                      gap: '0.5rem',
                      fontSize: '0.78rem',
                      color: 'var(--text-secondary)',
                    }}
                  >
                    <Icon
                      name="Clock"
                      size={13}
                      style={{
                        flexShrink: 0,
                        marginTop: 2,
                      }}
                    />
                    <div>
                      <span style={{ fontWeight: 600 }}>
                        {JOURNEY_STATUS_LABELS[log.journey_status]}
                      </span>
                      {log.notes && <span> — {log.notes}</span>}
                      <span
                        style={{
                          color: 'var(--text-tertiary)',
                          marginLeft: 4,
                        }}
                      >
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
        <div
          style={{
            textAlign: 'center',
            padding: '3rem',
            color: 'var(--text-tertiary)',
          }}
        >
          <Icon name="Loader2" size={32} />
          <p
            style={{
              marginTop: '0.5rem',
              fontSize: '0.85rem',
            }}
          >
            Đang tải thông tin tài xế...
          </p>
        </div>
      );
    }
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '60vh',
          gap: '1rem',
          padding: '2rem',
          textAlign: 'center',
        }}
      >
        <Icon
          name="UserX"
          size={48}
          style={{ color: 'var(--text-tertiary)' }}
        />
        <p
          style={{
            fontWeight: 700,
            fontSize: '1rem',
          }}
        >
          Tài khoản chưa liên kết với nhân viên
        </p>
        <p
          style={{
            fontSize: '0.85rem',
            color: 'var(--text-secondary)',
          }}
        >
          Vui lòng liên hệ quản trị viên để liên kết tài khoản này với hồ sơ
          nhân viên tài xế.
        </p>
      </div>
    );
  }

  if (!employeeId) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '60vh',
          gap: '1rem',
          padding: '2rem',
          textAlign: 'center',
        }}
      >
        <Icon
          name="UserX"
          size={48}
          style={{ color: 'var(--text-tertiary)' }}
        />
        <p
          style={{
            fontWeight: 700,
            fontSize: '1rem',
          }}
        >
          Tài khoản chưa liên kết với nhân viên
        </p>
        <p
          style={{
            fontSize: '0.85rem',
            color: 'var(--text-secondary)',
          }}
        >
          Vui lòng liên hệ quản trị viên để liên kết tài khoản này với hồ sơ
          nhân viên tài xế.
        </p>
      </div>
    );
  }

  return (
    <div
      style={{
        maxWidth: 600,
        margin: '0 auto',
        padding: '1rem',
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <p
          style={{
            fontSize: '0.75rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: 'var(--text-tertiary)',
          }}
        >
          CỔNG TÀI XẾ
        </p>
        <h1
          style={{
            fontSize: '1.5rem',
            fontWeight: 800,
            color: 'var(--text-primary)',
            margin: '4px 0 2px',
          }}
        >
          Đơn giao hôm nay
        </h1>
        <p
          style={{
            fontSize: '0.85rem',
            color: 'var(--text-secondary)',
          }}
        >
          Xin chào, {profile?.full_name ?? 'Tài xế'}
        </p>
      </div>

      {/* Loading */}
      {isLoading && (
        <div
          style={{
            textAlign: 'center',
            padding: '3rem',
            color: 'var(--text-tertiary)',
          }}
        >
          <Icon name="Loader2" size={32} />
          <p
            style={{
              marginTop: '0.5rem',
              fontSize: '0.85rem',
            }}
          >
            Đang tải đơn giao hàng...
          </p>
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
        <div
          style={{
            textAlign: 'center',
            padding: '3rem 1rem',
            color: 'var(--text-tertiary)',
            background: 'var(--surface)',
            borderRadius: 'var(--radius-lg)',
            border: '1.5px dashed var(--border)',
          }}
        >
          <Icon name="PackageCheck" size={40} />
          <p
            style={{
              fontWeight: 700,
              marginTop: '0.75rem',
            }}
          >
            Không có đơn giao nào
          </p>
          <p
            style={{
              fontSize: '0.82rem',
              marginTop: 4,
            }}
          >
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
