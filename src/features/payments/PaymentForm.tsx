import React, { useState } from 'react';
import { Button } from '@/shared/components/Button';
import { Input } from '@/shared/components/Input';
import { Combobox } from '@/shared/components/Combobox';

export function PaymentForm({ onSuccess, onCancel }: { onSuccess?: () => void; onCancel?: () => void }) {
  const [amount, setAmount] = useState('');
  const [type, setType] = useState('income');
  const [partner, setPartner] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSuccess?.();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4">
      <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Tạo Phiếu Thu / Chi</h3>
      <Combobox
        value={type}
        onChange={setType}
        options={[
          { value: 'income', label: 'Phiếu thu tiền' },
          { value: 'expense', label: 'Phiếu chi tiền' },
        ]}
      />
      <Input label="Đối tác (Khách hàng / NCC)" value={partner} onChange={(e) => setPartner(e.target.value)} required />
      <Input label="Số tiền (VND)" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} required />
      <div className="flex justify-end gap-2 pt-4">
        <Button variant="outline" type="button" onClick={onCancel}>Hủy</Button>
        <Button type="submit">Lưu phiếu</Button>
      </div>
    </form>
  );
}

export default PaymentForm;
