import { useState } from 'react';

import { Icon } from '@/shared/components/Icon';
import { useUpdateStageStatus } from '@/application/orders';

import {
  PRODUCTION_STAGES,
  STAGE_LABELS,
  STAGE_STATUS_LABELS,
} from './order-progress.module';
import type { OrderProgress, StageStatus } from './types';

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
      <div className="mb-4">
        <div className="flex justify-between text-[0.8rem] mb-1">
          <span>Tiến độ sản xuất</span>
          <span>
            {progressPercent}% ({doneCount}/{totalCount})
          </span>
        </div>
        <div className="h-2 bg-border rounded">
          <div
            className={`h-full rounded transition-[width] duration-300 ease-in-out ${
              progressPercent === 100 ? 'bg-success' : 'bg-primary'
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Timeline */}
      <div className="flex flex-col gap-0">
        {PRODUCTION_STAGES.map((stageKey, idx) => {
          const row = stageMap.get(stageKey);
          if (!row) return null;
          const isLast = idx === PRODUCTION_STAGES.length - 1;
          const color = STATUS_COLORS[row.status];

          return (
            <div key={row.id} className="flex gap-4 min-h-[64px]">
              {/* Timeline node + connector line */}
              <div className="flex flex-col items-center w-6">
                <div
                  className={`rounded-full shrink-0 flex items-center justify-center ${
                    row.status === 'in_progress' || row.status === 'done'
                      ? 'w-6 h-6 mt-0'
                      : 'w-4 h-4 mt-1'
                  } ${
                    row.status === 'in_progress'
                      ? 'border-2 shadow-[0_0_0_4px_#eff6ff]'
                      : 'border-[2.5px]'
                  }`}
                  style={{
                    backgroundColor:
                      row.status === 'done'
                        ? color
                        : row.status === 'in_progress'
                          ? '#eff6ff'
                          : 'var(--bg)',
                    borderColor: color,
                    color: color,
                  }}
                >
                  {row.status === 'in_progress' && (
                    <Icon name="Loader2" size={16} className="animate-spin" />
                  )}
                  {row.status === 'done' && (
                    <Icon name="Check" size={16} color="#fff" strokeWidth={3} />
                  )}
                </div>
                {!isLast && (
                  <div
                    className={`w-[2px] flex-1 ${
                      row.status === 'in_progress' || row.status === 'done'
                        ? 'mt-1'
                        : 'mt-0.5'
                    }`}
                    style={{
                      backgroundColor:
                        row.status === 'done' ? color : 'var(--border)',
                    }}
                  />
                )}
              </div>

              {/* Content */}
              <div
                className={`flex-1 ${isLast ? 'pb-0' : 'pb-5'} ${
                  row.status === 'in_progress'
                    ? `bg-slate-50 rounded-[var(--radius)] p-3 shadow-[0_2px_4px_rgba(11,107,203,0.05)] ${
                        isLast ? 'mb-0' : 'mb-3'
                      }`
                    : ''
                }`}
                style={
                  row.status === 'in_progress'
                    ? {
                        borderColor: color,
                        borderWidth: 1,
                        borderStyle: 'solid',
                      }
                    : {}
                }
              >
                <div className="flex items-center gap-2 flex-wrap">
                  <strong className="text-[0.9rem]">
                    {STAGE_LABELS[stageKey]}
                  </strong>
                  <span
                    className={`roll-status text-[0.72rem] ${row.status === 'done' ? 'in_stock' : row.status === 'in_progress' ? 'in_process' : row.status === 'skipped' ? 'damaged' : 'shipped'}`}
                  >
                    {STAGE_STATUS_LABELS[row.status]}
                  </span>
                </div>

                <div className="flex gap-1.5 text-[0.8rem] text-muted-foreground mt-[2px]">
                  {row.planned_date && <span>Dự kiến: {row.planned_date}</span>}
                  {row.actual_date && <span>| Thực tế: {row.actual_date}</span>}
                </div>

                {row.notes && editingId !== row.id && (
                  <div className="text-[0.82rem] text-muted-foreground mt-[2px]">
                    📝 {row.notes}
                  </div>
                )}

                {/* Inline note editor */}
                {editingId === row.id && (
                  <div className="flex gap-1.5 mt-1">
                    <input
                      className="field-input flex-1 text-[0.82rem]"
                      type="text"
                      value={noteText}
                      onChange={(e) => setNoteText(e.target.value)}
                      placeholder="Ghi chú..."
                    />
                    <button
                      className="btn-secondary text-[0.78rem]"
                      type="button"
                      onClick={() => handleSaveNote(row)}
                    >
                      Lưu
                    </button>
                    <button
                      className="btn-secondary text-[0.78rem]"
                      type="button"
                      onClick={() => setEditingId(null)}
                    >
                      Hủy
                    </button>
                  </div>
                )}

                {/* Actions */}
                {!readonly && (
                  <div className="flex gap-1.5 mt-1">
                    {row.status !== 'done' && row.status !== 'skipped' && (
                      <button
                        className="btn-secondary text-[0.78rem] px-2 py-1"
                        type="button"
                        onClick={() => handleAdvance(row)}
                        disabled={updateMutation.isPending}
                      >
                        {row.status === 'pending'
                          ? '▶ Bắt đầu'
                          : '✓ Hoàn thành'}
                      </button>
                    )}
                    {row.status === 'pending' && (
                      <button
                        className="btn-secondary text-[0.78rem] px-2 py-1 text-muted-foreground"
                        type="button"
                        onClick={() => handleSkip(row)}
                        disabled={updateMutation.isPending}
                      >
                        Bỏ qua
                      </button>
                    )}
                    {editingId !== row.id && (
                      <button
                        className="btn-secondary text-[0.78rem] px-2 py-1"
                        type="button"
                        onClick={() => {
                          setEditingId(row.id);
                          setNoteText(row.notes ?? '');
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
        <p className="text-danger-fg text-[0.85rem] mt-2">
          Lỗi cập nhật: {(updateMutation.error as Error).message}
        </p>
      )}
    </div>
  );
}
