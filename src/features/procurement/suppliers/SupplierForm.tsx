import React, { useState } from 'react';
import { Button } from '@/shared/components/Button';
import { Input } from '@/shared/components/Input';

export function SupplierForm({ onSuccess, onCancel }: { onSuccess?: () => void; onCancel?: () => void }) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSuccess?.(); }} className="space-y-4 p-4">
      <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Thông Tin Nhà Cung Cấp</h3>
      <Input label="Tên Nhà Cung Cấp" value={name} onChange={(e) => setName(e.target.value)} required />
      <Input label="Số Điện Thoại" value={phone} onChange={(e) => setPhone(e.target.value)} required />
      <div className="flex justify-end gap-2 pt-4">
        <Button variant="outline" type="button" onClick={onCancel}>Hủy</Button>
        <Button type="submit">Lưu</Button>
      </div>
    </form>
  );
}

export default SupplierForm;
