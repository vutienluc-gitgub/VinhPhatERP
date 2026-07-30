import { useState, useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';

import { supabase } from '@/services/supabase/client';
import { Icon, Button } from '@/shared/components';
import {
  usePublicPoComments,
  useAddPublicPoComment,
} from '@/features/supplier-portal/hooks/useSupplierPortal';

interface POCommentsProps {
  token: string;
}

export function POComments({ token }: POCommentsProps) {
  const [content, setContent] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  const { data: comments = [], isLoading } = usePublicPoComments(token);
  const addMutation = useAddPublicPoComment();

  // Scroll to bottom when comments change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [comments]);

  // Realtime subscription
  useEffect(() => {
    if (!token) return;

    // Listen to all inserts on purchase_order_comments
    // We cannot easily filter by token in RLS-bypassed way on client without knowing po.id
    // But we can filter by po_id if we have it. Since we only have token, we just invalidate on any insert.
    const channel = supabase
      .channel(`public-po-comments-${token}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'purchase_order_comments',
        },
        () => {
          queryClient.invalidateQueries({
            queryKey: ['public-po-comments', token],
          });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [token, queryClient]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || addMutation.isPending) return;

    addMutation.mutate(
      { token, content },
      {
        onSuccess: () => {
          setContent('');
          queryClient.invalidateQueries({
            queryKey: ['public-po-comments', token],
          });
        },
      },
    );
  };

  return (
    <div className="bg-surface rounded-xl shadow-sm border border-border overflow-hidden mt-6 flex flex-col h-[500px]">
      <div className="bg-surface-secondary p-4 border-b border-border flex items-center gap-2">
        <Icon name="message-square" className="w-5 h-5 text-primary" />
        <h3 className="font-semibold text-lg m-0">Trao đổi với Vinh Phát</h3>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {isLoading ? (
          <div className="flex justify-center py-4">
            <Icon name="loader-2" className="w-6 h-6 animate-spin text-muted" />
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-8 text-muted">
            <Icon
              name="message-circle"
              className="w-12 h-12 mx-auto mb-2 opacity-20"
            />
            <p>Chưa có trao đổi nào.</p>
            <p className="text-sm">
              Hãy gửi tin nhắn nếu bạn có thắc mắc về đơn hàng.
            </p>
          </div>
        ) : (
          comments.map((comment) => {
            const isMine = comment.sender_type === 'supplier';
            return (
              <div
                key={comment.id}
                className={`flex flex-col max-w-[80%] ${
                  isMine ? 'ml-auto items-end' : 'mr-auto items-start'
                }`}
              >
                <div
                  className={`px-4 py-2 rounded-2xl ${
                    isMine
                      ? 'bg-primary text-primary-foreground rounded-tr-sm'
                      : 'bg-surface-secondary text-foreground rounded-tl-sm'
                  }`}
                >
                  <p className="whitespace-pre-wrap break-words">
                    {comment.content}
                  </p>
                </div>
                <div className="flex items-center gap-1 mt-1 text-[11px] text-muted">
                  <span className="font-medium">
                    {isMine ? 'Bạn' : 'Vinh Phát'}
                  </span>
                  <span>•</span>
                  <span>{dayjs(comment.created_at).format('HH:mm')}</span>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <form
        onSubmit={handleSubmit}
        className="p-4 border-t border-border bg-surface flex gap-2"
      >
        <input
          type="text"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Nhập tin nhắn..."
          className="flex-1 px-4 py-2 bg-surface-secondary border border-border rounded-full focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
          disabled={addMutation.isPending}
        />
        <Button
          type="submit"
          disabled={!content.trim() || addMutation.isPending}
          className="rounded-full w-10 h-10 p-0 flex items-center justify-center shrink-0"
        >
          <Icon
            name={addMutation.isPending ? 'loader-2' : 'send'}
            className={`w-4 h-4 ${addMutation.isPending ? 'animate-spin' : ''}`}
          />
        </Button>
      </form>
    </div>
  );
}
