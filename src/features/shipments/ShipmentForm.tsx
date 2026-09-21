import React from 'react';
import { Button } from '@/shared/components/Button';
import { Input } from '@/shared/components/Input';

export function ShipmentForm({ onSuccess, onCancel }: { onSuccess?: () => void; onCancel?: () => void }) {
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSuccess?.(); }} className="space-y-4 p-4">
      <h3 className="text-lg font-bold">Tạo Phiếu Vận Chuyển / Giao Hàng</h3>
      <Input label="Khách Hàng Nhận" required />
      <Input label="Địa Chỉ Giao Hàng" required />
      <Input label="Tài Xế" required />
      <div className="flex justify-end gap-2 pt-4">
        <Button variant="outline" type="button" onClick={onCancel}>Hủy</Button>
        <Button type="submit">Lưu Phiếu</Button>
      </div>
    </form>
  );
}

export default ShipmentForm;
