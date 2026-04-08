import { useState } from 'react';

import {
  PRODUCTION_STAGES,
  STAGE_LABELS,
  STAGE_STATUS_LABELS,
} from './order-progress.module';
import type { OrderProgress, StageStatus } from './types';
import { useUpdateStageStatus } from './useOrderProgress';

type ProgressTimelineProps = {
  stages: OrderProgress[];
  readonly?: boolean;
};

const STATUS_COLORS: Record<StageStatus, string> = {
  pending: '#94a3b8',
  in_progress: '#0b6bcb',
  done: '#0c8f68',
  skipped: '#9ca3af',
};

const NEXT_STATUS: Record<StageStatus, StageStatus> = {
  pending: 'in_progress',
  in_progress: 'done',
  done: 'done',
  skipped: 'skipped',
};

export function ProgressTimeline({
  stages,
  readonly = false,
}: ProgressTimelineProps) {
  const updateMutation = useUpdateStageStatus();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [noteText, setNoteText] = useState('');

  const stageMap = new Map(stages.map((s) => [s.stage, s]));

  const doneCount = stages.filter((s) => s.status === 'done').length;
  const totalCount = stages.filter((s) => s.status !== 'skipped').length;
  const progressPercent =
    totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;

  function handleAdvance(row: OrderProgress) {
    if (readonly || row.status === 'done' || row.status === 'skipped') return;
    const nextStatus = NEXT_STATUS[row.status];
    if (nextStatus === row.status) return;
    updateMutation.mutate({
      progressId: row.id,
      status: nextStatus,
    });
  }

  function handleSkip(row: OrderProgress) {
    if (readonly || row.status === 'done') return;
    updateMutation.mutate({
      progressId: row.id,
      status: 'skipped',
    });
  }

  function handleSaveNote(row: OrderProgress) {
    updateMutation.mutate({
      progressId: row.id,
      status: row.status,
      notes: noteText,
    });
    setEditingId(null);
    setNoteText('');
  }

  return (
    <div>
      {/* Progress bar */}
      <div style={{ marginBottom: '1rem' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '0.8rem',
            marginBottom: '0.25rem',
          }}
        >
          <span>Tiến độ sản xuất</span>
          <span>
            {progressPercent}% ({doneCount}/{totalCount})
          </span>
        </div>
        <div
          style={{
            height: 8,
            background: 'var(--border)',
            borderRadius: 4,
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${progressPercent}%`,
              background: progressPercent === 100 ? '#0c8f68' : '#0b6bcb',
              borderRadius: 4,
              transition: 'width 300ms ease',
            }}
          />
        </div>
      </div>

      {/* Timeline */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 0,
        }}
      >
        {PRODUCTION_STAGES.map((stageKey, idx) => {
          const row = stageMap.get(stageKey);
          if (!row) return null;
          const isLast = idx === PRODUCTION_STAGES.length - 1;
          const color = STATUS_COLORS[row.status];

          return (
            <div
              key={row.id}
              style={{
                display: 'flex',
                gap: '0.75rem',
                minHeight: 56,
              }}
            >
              {/* Timeline node + connector line */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  width: 24,
                }}
              >
                <div
                  style={{
                    width: 16,
                    height: 16,
                    borderRadius: '50%',
                    background: row.status === 'done' ? color : 'var(--bg)',
                    border: `2.5px solid ${color}`,
                    flexShrink: 0,
                    marginTop: 4,
                  }}
                />
                {!isLast && (
                  <div
                    style={{
                      width: 2,
                      flex: 1,
                      background: 'var(--border)',
                      marginTop: 2,
                    }}
                  />
                )}
              </div>

              {/* Content */}
              <div
                style={{
                  flex: 1,
                  paddingBottom: isLast ? 0 : '0.5rem',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    flexWrap: 'wrap',
                  }}
                >
                  <strong style={{ fontSize: '0.9rem' }}>
                    {STAGE_LABELS[stageKey]}
                  </strong>
                  <span
                    className={`roll-status ${row.status === 'done' ? 'in_stock' : row.status === 'in_progress' ? 'in_process' : row.status === 'skipped' ? 'damaged' : 'shipped'}`}
                    style={{ fontSize: '0.72rem' }}
                  >
                    {STAGE_STATUS_LABELS[row.status]}
                  </span>
                </div>

                <div
                  style={{
                    display: 'flex',
                    gap: '0.4rem',
                    fontSize: '0.8rem',
                    color: 'var(--muted)',
                    marginTop: 2,
                  }}
                >
                  {row.planned_date && <span>Dự kiến: {row.planned_date}</span>}
                  {row.actual_date && <span>| Thực tế: {row.actual_date}</span>}
                </div>

                {row.notes && editingId !== row.id && (
                  <div
                    style={{
                      fontSize: '0.82rem',
                      color: 'var(--muted)',
                      marginTop: 2,
                    }}
                  >
                    📝 {row.notes}
                  </div>
                )}

                {/* Inline note editor */}
                {editingId === row.id && (
                  <div
                    style={{
                      display: 'flex',
                      gap: '0.3rem',
                      marginTop: 4,
                    }}
                  >
                    <input
                      className="field-input"
                      type="text"
                      value={noteText}
                      onChange={(e) => setNoteText(e.target.value)}
                      placeholder="Ghi chú..."
                      style={{
                        flex: 1,
                        fontSize: '0.82rem',
                      }}
                    />
                    <button
                      className="btn-secondary"
                      type="button"
                      onClick={() => handleSaveNote(row)}
                      style={{ fontSize: '0.78rem' }}
                    >
                      Lưu
                    </button>
                    <button
                      className="btn-secondary"
                      type="button"
                      onClick={() => setEditingId(null)}
                      style={{ fontSize: '0.78rem' }}
                    >
                      Huỷ
                    </button>
                  </div>
                )}

                {/* Actions */}
                {!readonly && (
                  <div
                    style={{
                      display: 'flex',
                      gap: '0.4rem',
                      marginTop: 4,
                    }}
                  >
                    {row.status !== 'done' && row.status !== 'skipped' && (
                      <button
                        className="btn-secondary"
                        type="button"
                        onClick={() => handleAdvance(row)}
                        disabled={updateMutation.isPending}
                        style={{
                          fontSize: '0.78rem',
                          padding: '0.25rem 0.5rem',
                        }}
                      >
                        {row.status === 'pending'
                          ? '▶ Bắt đầu'
                          : '✓ Hoàn thành'}
                      </button>
                    )}
                    {row.status === 'pending' && (
                      <button
                        className="btn-secondary"
                        type="button"
                        onClick={() => handleSkip(row)}
                        disabled={updateMutation.isPending}
                        style={{
                          fontSize: '0.78rem',
                          padding: '0.25rem 0.5rem',
                          color: 'var(--muted)',
                        }}
                      >
                        Bỏ qua
                      </button>
                    )}
                    {editingId !== row.id && (
                      <button
                        className="btn-secondary"
                        type="button"
                        onClick={() => {
                          setEditingId(row.id);
                          setNoteText(row.notes ?? '');
                        }}
                        style={{
                          fontSize: '0.78rem',
                          padding: '0.25rem 0.5rem',
                        }}
                      >
                        📝
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {updateMutation.error && (
        <p
          style={{
            color: '#c0392b',
            fontSize: '0.85rem',
            marginTop: '0.5rem',
          }}
        >
          Lỗi cập nhật: {(updateMutation.error as Error).message}
        </p>
      )}
    </div>
  );
}
