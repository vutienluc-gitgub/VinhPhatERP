import { useRef, useEffect } from 'react';

import { useUnifiedTimeline } from '@/application/chat/useUnifiedTimeline';
import { CHAT_LABELS } from '@/schema/chat.schema';

export function UnifiedFeedPage() {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, status } =
    useUnifiedTimeline();

  const loadMoreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasNextPage && !isFetchingNextPage) {
          void fetchNextPage();
        }
      },
      { threshold: 0.1 },
    );
    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }
    return () => observer.disconnect();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  if (status === 'pending') {
    return (
      <div className="p-6 text-center text-[var(--muted-foreground)]">
        {CHAT_LABELS.LOADING}
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="p-6 text-center text-danger">
        Đã xảy ra lỗi khi tải luồng sự kiện.
      </div>
    );
  }

  const items = data?.pages.flat() || [];

  return (
    <div className="max-w-3xl mx-auto p-4 pb-20">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[var(--foreground)]">
          Luồng Sự Kiện (Feed)
        </h1>
        <p className="text-sm text-[var(--muted-foreground)]">
          Theo dõi các tin nhắn và cập nhật mới nhất từ các chứng từ bạn đang
          tham gia.
        </p>
      </div>

      <div className="space-y-4">
        {items.length === 0 ? (
          <div className="text-center p-8 bg-[var(--surface)] rounded-xl border border-[var(--border)]">
            <span className="text-[var(--muted-foreground)]">
              {CHAT_LABELS.NO_MESSAGES}
            </span>
          </div>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              className="p-4 bg-[var(--surface)] rounded-xl border border-[var(--border)] shadow-sm"
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                  <div className="font-semibold text-[var(--foreground)]">
                    {item.sender_name || CHAT_LABELS.UNKNOWN_USER}
                  </div>
                  {item.sender_role && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-[rgba(var(--primary-rgb),0.1)] text-[var(--primary)]">
                      {item.sender_role}
                    </span>
                  )}
                </div>
                <div className="text-xs text-[var(--muted-foreground)]">
                  {new Intl.DateTimeFormat('vi-VN', {
                    hour: '2-digit',
                    minute: '2-digit',
                    day: '2-digit',
                    month: '2-digit',
                  }).format(new Date(item.created_at))}
                </div>
              </div>

              <div className="text-sm text-[var(--foreground)] mb-3">
                {item.content}
              </div>

              <div className="pt-3 border-t border-[var(--border-subtle)] flex items-center gap-2">
                <span className="text-xs font-medium px-2 py-1 bg-[var(--surface-hover)] rounded text-[var(--muted-foreground)]">
                  {item.entity_type === 'shipment'
                    ? 'Lô hàng'
                    : item.entity_type === 'order'
                      ? 'Đơn hàng'
                      : item.entity_type}
                </span>
                <span className="text-xs text-[var(--primary)] hover:underline cursor-pointer">
                  Đi đến chi tiết
                </span>
              </div>
            </div>
          ))
        )}

        <div ref={loadMoreRef} className="h-4 w-full" />

        {isFetchingNextPage && (
          <div className="text-center text-sm text-[var(--muted-foreground)] py-4">
            {CHAT_LABELS.LOADING}
          </div>
        )}
      </div>
    </div>
  );
}
