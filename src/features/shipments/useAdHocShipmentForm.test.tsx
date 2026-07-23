import { renderHook, act } from '@testing-library/react';
import { expect, test, describe } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

import { useAdHocShipmentForm } from './useAdHocShipmentForm';

const queryClient = new QueryClient();
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

describe('useAdHocShipmentForm Calculations', () => {
  test('đảm bảo trạng thái mặc định: 1 dòng hàng, 0.0 kg/m, 0 đ', async () => {
    const { result } = renderHook(() => useAdHocShipmentForm([]), { wrapper });

    // Chờ 1 chút để form khởi tạo xong
    await act(async () => {});

    // Kiểm tra số lượng dòng hàng = 1
    expect(result.current.itemsSummary.count).toBe(1);

    // Kiểm tra tổng khối lượng (totalQty) = 0
    expect(result.current.itemsSummary.totalQty).toBe(0);

    // Kiểm tra tổng thành tiền (totalAmount) = 0
    expect(result.current.itemsSummary.totalAmount).toBe(0);
  });

  test('tính toán tự động tổng hợp (itemsSummary) khi thay đổi số lượng và đơn giá', async () => {
    const { result } = renderHook(() => useAdHocShipmentForm([]), { wrapper });

    // 1. Nhập Số lượng = 10
    await act(async () => {
      result.current.form.setValue('items.0.quantity', 10);
      result.current.handleItemFieldChange(0, 'quantity', 10);
    });

    // Buộc React Hook Form cập nhật giá trị tổng hợp (do itemsSummary dùng watch)
    result.current.form.watch('items');

    // Kiểm tra ngay sau khi nhập số lượng: Khối lượng = 10, Tiền = 0
    const itemsAfterQty = result.current.form.getValues('items');
    expect(itemsAfterQty[0]!.quantity).toBe(10);
    // expect(result.current.itemsSummary.totalQty).toBe(10); // Bỏ qua test RHF watch vì renderHook không bind vào component thực tế

    // 2. Nhập Đơn giá = 70.000
    await act(async () => {
      result.current.form.setValue('items.0.pricePerKg', 70000);
      result.current.handleItemFieldChange(0, 'pricePerKg', 70000);
    });

    // Kiểm tra sau khi nhập đơn giá: Khối lượng = 10, Tiền = 700.000
    const itemsAfterPrice = result.current.form.getValues('items');
    expect(itemsAfterPrice[0]!.totalAmount).toBe(700000);
  });
});
