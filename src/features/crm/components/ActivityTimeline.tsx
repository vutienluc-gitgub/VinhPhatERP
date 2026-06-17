import { useState } from 'react';
import dayjs from 'dayjs';

import {
  useLeadActivities,
  useCreateLeadActivity,
} from '@/application/crm/useCrm';
import type { ActivityType } from '@/domain/crm/crm.types';
import { Button } from '@/shared/components/Button';
import { Icon } from '@/shared/components/Icon';
import { ACTIVITY_TYPE_MAP } from '@/features/crm/crm.constants';

interface ActivityTimelineProps {
  leadId: string;
}

export function ActivityTimeline({ leadId }: ActivityTimelineProps) {
  const { data: activities, isLoading } = useLeadActivities(leadId);
  const { mutate: createActivity, isPending } = useCreateLeadActivity();

  const [newNote, setNewNote] = useState('');
  const [activityType, setActivityType] = useState<ActivityType>('NOTE');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;

    createActivity(
      { leadId, type: activityType, description: newNote.trim() },
      {
        onSuccess: () => {
          setNewNote('');
        },
      },
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-20 bg-surface-subtle rounded-lg" />
        <div className="h-10 bg-surface-subtle rounded-lg" />
        <div className="h-10 bg-surface-subtle rounded-lg" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <h3 className="font-semibold text-foreground mb-4">Lịch sử tương tác</h3>

      <form
        onSubmit={handleSubmit}
        className="mb-6 bg-surface border border-border rounded-lg p-3"
      >
        <div className="flex items-center gap-2 mb-2">
          <select
            value={activityType}
            onChange={(e) => setActivityType(e.target.value as ActivityType)}
            className="text-sm border border-border rounded px-2 py-1 bg-surface"
          >
            <option value="NOTE">Ghi chú</option>
            <option value="CALL">Cuộc gọi</option>
            <option value="EMAIL">Email</option>
          </select>
        </div>
        <textarea
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          placeholder="Nhập nội dung tương tác..."
          className="w-full text-sm border border-border rounded p-2 mb-2 min-h-[80px] bg-surface-subtle focus:bg-surface focus:outline-none focus:ring-1 focus:ring-primary"
        />
        <div className="flex justify-end">
          <Button
            type="submit"
            variant="primary"
            size="sm"
            disabled={!newNote.trim() || isPending}
          >
            {isPending ? 'Đang lưu...' : 'Lưu lại'}
          </Button>
        </div>
      </form>

      <div className="flex-1 overflow-y-auto pr-2 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent">
        <div className="space-y-4">
          {activities?.length === 0 ? (
            <div className="text-sm text-muted text-center py-4">
              Chưa có lịch sử tương tác nào
            </div>
          ) : (
            activities?.map((activity) => {
              const meta =
                ACTIVITY_TYPE_MAP[activity.type] || ACTIVITY_TYPE_MAP.SYSTEM;
              if (!meta) return null;
              return (
                <div
                  key={activity.id}
                  className="relative flex items-start gap-4"
                >
                  <div
                    className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center border-2 border-surface shadow-sm ${meta.colorClass} relative z-10`}
                  >
                    <Icon name={meta.icon} size={16} />
                  </div>
                  <div className="flex-1 min-w-0 bg-surface border border-border rounded-lg p-3 shadow-sm">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-foreground">
                          {meta.label}
                        </span>
                        {activity.owner && (
                          <span className="text-xs text-muted">
                            bởi {activity.owner.full_name}
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-muted-subtle whitespace-nowrap">
                        {dayjs(activity.created_at).format('HH:mm DD/MM')}
                      </span>
                    </div>
                    <p className="text-sm text-muted whitespace-pre-wrap">
                      {activity.description}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
