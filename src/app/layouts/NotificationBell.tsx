import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

import { supabase } from '@/services/supabase/client';
import { Icon } from '@/shared/components';

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Đóng khi click ngoài
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Kích hoạt WebSocket Realtime cho Bảng Orders
  useEffect(() => {
    const channel = supabase
      .channel('realtime_pending_orders')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
        },
        (payload) => {
          // Báo cho React Query update lại chuông
          queryClient.invalidateQueries({
            queryKey: ['pending-review-notifications'],
          });

          // Hiển thị Popup Toast nổi ngay lập tức nếu là Đơn Vừa Mới Đặt (INSERT)
          if (
            payload.eventType === 'INSERT' &&
            payload.new.status === 'pending_review'
          ) {
            toast.success(
              `Có yêu cầu đặt hàng mới mã ${payload.new.order_number}!`,
              { icon: '🔔' },
            );
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  // Fetch đơn hàng đang chờ duyệt
  type PendingOrder = {
    id: string;
    order_number: string;
    created_at: string;
    customer: { name: string } | null;
  };

  const { data: pendingOrders = [] } = useQuery({
    queryKey: ['pending-review-notifications'],
    queryFn: async () => {
      // Fetch đơn hàng pending_review cùng với tên khách hàng
      const { data, error } = await supabase
        .from('orders')
        .select(
          `
          id,
          order_number,
          created_at,
          customer:customers(name)
        `,
        )
        .eq('status', 'pending_review')
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      return (data || []) as PendingOrder[];
    },
    // refetchInterval không cần nữa vì đã có WebSocket lo!
  });

  const unreadCount = pendingOrders.length;

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Thông báo"
        className="relative flex items-center justify-center bg-transparent hover:bg-surface rounded-full w-9 h-9 cursor-pointer text-muted hover:text-text transition-colors border-none p-0"
      >
        <Icon name="Bell" size={20} strokeWidth={1.5} />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 bg-danger w-2 h-2 rounded-full border border-surface shadow-sm animate-pulse"></span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-[calc(100vw-2rem)] sm:w-[360px] max-w-[360px] bg-surface border border-border rounded-lg shadow-xl z-50 overflow-hidden flex flex-col">
          <div className="px-4 py-3 border-b border-border flex items-center justify-between bg-surface sticky top-0">
            <div className="flex items-center gap-2 text-text">
              <Icon name="Bell" size={14} strokeWidth={2} />
              <h3 className="font-bold text-xs uppercase m-0 tracking-wider">
                Thông báo mới
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-muted hover:text-danger mix-blend-multiply opacity-60 hover:opacity-100 transition-opacity"
            >
              <Icon name="X" size={16} />
            </button>
          </div>

          <div className="max-h-[350px] overflow-y-auto">
            {pendingOrders.length === 0 ? (
              <div className="py-8 px-4 text-center text-muted flex flex-col items-center gap-2">
                <Icon name="CheckCircle2" size={24} className="opacity-50" />
                <p className="text-sm">Bạn không có thông báo mới nào</p>
              </div>
            ) : (
              <div className="flex flex-col">
                {pendingOrders.map((order) => (
                  <button
                    key={order.id}
                    type="button"
                    onClick={() => {
                      setIsOpen(false);
                      navigate('/orders');
                    }}
                    className="p-3 border-b border-border text-left hover:bg-hover active:bg-active transition-colors flex gap-3 items-start"
                  >
                    <div className="bg-danger/10 text-danger p-1.5 rounded-lg mt-0.5 shrink-0 flex items-center justify-center">
                      <Icon name="Megaphone" size={18} strokeWidth={1.5} />
                    </div>
                    <div className="flex-1 min-w-0 pr-2">
                      <p className="text-sm font-bold leading-tight mb-1 uppercase tracking-wide">
                        Yêu cầu đặt hàng chờ duyệt
                      </p>
                      <p className="text-[13px] text-muted leading-relaxed line-clamp-3">
                        Khoảng{' '}
                        {new Date(order.created_at).toLocaleString('vi-VN')} -{' '}
                        {order.customer?.name
                          ? `Khách hàng ${order.customer.name}`
                          : 'Một khách hàng'}{' '}
                        vừa tạo yêu cầu đặt hàng mã {order.order_number}. Vui
                        lòng kiểm tra và duyệt!
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {pendingOrders.length > 0 && (
            <div className="px-4 py-2 bg-surface text-right border-t border-border">
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  navigate('/orders');
                }}
                className="text-xs font-semibold text-text hover:text-primary transition-colors inline-flex items-center gap-1"
              >
                Xem thêm <Icon name="ChevronRight" size={14} />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
