import React from 'react';
import type { ERPPlugin } from '@/app/types/plugin';

export function OrderProgressPage() {
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Theo Dõi Tiến Độ Đơn Hàng</h1>
      <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800">
        <p className="text-slate-500">Giao diện biểu đồ tiến độ trực quan theo từng công đoạn: Mua sợi ➔ Dệt mộc ➔ Nhuộm ➔ Cắt may ➔ Giao hàng.</p>
      </div>
    </div>
  );
}

export const orderProgressPlugin: ERPPlugin = {
  key: 'order-progress',
  label: 'Tiến độ Đơn hàng',
  shortLabel: 'Tiến độ',
  description: 'Theo dõi tiến trình từng khâu sản xuất',
  icon: 'Activity',
  group: 'sales',
  order: 22,
  entryPath: '/orders/progress',
  routes: [{ path: '/orders/progress', component: () => Promise.resolve({ default: OrderProgressPage }) }],
};
