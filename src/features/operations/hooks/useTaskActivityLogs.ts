import { useEffect, useState } from 'react';

import { supabase } from '@/services/supabase/client';
import { untypedDb } from '@/services/supabase/untyped';

export interface TaskActivityLog {
  id: string;
  task_id: string;
  room_id: string;
  action_type: string;
  old_status: string | null;
  new_status: string | null;
  changed_by: string | null;
  created_at: string;
}

export function useTaskActivityLogs(taskId: string) {
  const [logs, setLogs] = useState<TaskActivityLog[]>([]);

  useEffect(() => {
    if (!taskId) return;

    // Lấy log ban đầu
    const fetchLogs = async () => {
      const { data, error } = await untypedDb
        .from('task_activity_logs')
        .select('*')
        .eq('task_id', taskId)
        .order('created_at', { ascending: true });

      if (!error && data) {
        setLogs(data as TaskActivityLog[]);
      }
    };

    void fetchLogs();

    // Cấu hình Realtime Supabase: Chỉ bật Realtime cho bảng task_activity_logs với filter: room_id = eq.${taskId}
    const channel = supabase
      .channel(`room:${taskId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'task_activity_logs',
          filter: `room_id=eq.${taskId}`,
        },
        (payload) => {
          setLogs((prev) => [...prev, payload.new as TaskActivityLog]);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [taskId]);

  return logs;
}
