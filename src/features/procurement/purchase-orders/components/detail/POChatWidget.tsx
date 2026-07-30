import { useState, useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';

import { supabase } from '@/services/supabase/client';
import { Icon, Button } from '@/shared/components';
import {
  usePOComments,
  useAddPOComment,
} from '@/application/purchase-orders/usePurchaseOrders';

interface POChatWidgetProps {
  poId: string;
}

export function POChatWidget({ poId }: POChatWidgetProps) {
  const [content, setContent] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  const { data: comments = [], isLoading } = usePOComments(poId);
  const addMutation = useAddPOComment();

  // Scroll to bottom when comments change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [comments]);

  // Realtime subscription
  useEffect(() => {
    if (!poId) return;

    const channel = supabase
      .channel(`erp-po-comments-${poId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'purchase_order_comments',
          filter: `purchase_order_id=eq.${poId}`,
        },
        () => {
          queryClient.invalidateQueries({
            queryKey: ['purchase-orders', 'comments', poId],
          });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [poId, queryClient]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || addMutation.isPending) return;

    addMutation.mutate(
      { poId, content },
      {
        onSuccess: () => {
          setContent('');
          queryClient.invalidateQueries({
            queryKey: ['purchase-orders', 'comments', poId],
          });
        },
      },
    );
  };

  return (
    <div className="bg-surface border border-border rounded-xl flex flex-col h-[600px] overflow-hidden lg:col-span-1 shadow-sm">
      <div className="bg-surface-secondary p-4 border-b border-border flex items-center gap-2">
        <Icon name="MessageCircle" className="w-5 h-5 text-primary" />
        <h3 className="font-semibold m-0">Trao đổi nội bộ & NCC</h3>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
        {isLoading ? (
          <div className="flex justify-center py-4">
            <Icon name="Loader2" className="w-6 h-6 animate-spin text-muted" />
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-8 text-muted">
            <Icon
              name="MessageSquare"
              className="w-12 h-12 mx-auto mb-2 opacity-20"
            />
            <p className="text-sm">Chưa có trao đổi nào.</p>
          </div>
        ) : (
          comments.map((comment) => {
            const isMine = comment.sender_type === 'erp';
            return (
              <div
                key={comment.id}
                className={`flex flex-col max-w-[85%] ${
                  isMine ? 'ml-auto items-end' : 'mr-auto items-start'
                }`}
              >
                <div
                  className={`px-4 py-2.5 rounded-2xl shadow-sm text-sm ${
                    isMine
                      ? 'bg-primary text-primary-foreground rounded-tr-sm'
                      : 'bg-white border border-border text-foreground rounded-tl-sm'
                  }`}
                >
                  <p className="whitespace-pre-wrap break-words">
                    {comment.content}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 mt-1 text-[11px] text-muted">
                  <span className="font-medium">
                    {isMine
                      ? 'Bạn (ERP)'
                      : comment.sender_name || 'Nhà cung cấp'}
                  </span>
                  <span>•</span>
                  <span>{dayjs(comment.created_at).format('HH:mm DD/MM')}</span>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <form
        onSubmit={handleSubmit}
        className="p-3 border-t border-border bg-white flex gap-2"
      >
        <input
          type="text"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Nhập tin nhắn trao đổi..."
          className="flex-1 px-4 py-2 bg-slate-50 border border-border rounded-full focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
          disabled={addMutation.isPending}
        />
        <Button
          type="submit"
          disabled={!content.trim() || addMutation.isPending}
          className="rounded-full w-10 h-10 p-0 flex items-center justify-center shrink-0"
        >
          <Icon
            name={addMutation.isPending ? 'Loader2' : 'Send'}
            className={`w-4 h-4 ${addMutation.isPending ? 'animate-spin' : ''}`}
          />
        </Button>
      </form>
    </div>
  );
}
