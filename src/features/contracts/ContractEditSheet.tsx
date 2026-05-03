import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { Button, AdaptiveSheet } from '@/shared/components';

import { updateContractInputSchema } from './contracts.module';
import type { Contract, UpdateContractInput } from './contracts.module';

type ContractEditSheetProps = {
  open: boolean;
  onClose: () => void;
  contract: Contract;
  onSave: (data: UpdateContractInput) => void;
  isLoading: boolean;
};

export function ContractEditSheet({
  open,
  onClose,
  contract,
  onSave,
  isLoading,
}: ContractEditSheetProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<UpdateContractInput>({
    resolver: zodResolver(updateContractInputSchema),
    defaultValues: {
      party_a_name: contract.party_a_name,
      party_a_address: contract.party_a_address ?? '',
      party_a_tax_code: contract.party_a_tax_code ?? '',
      party_a_representative: contract.party_a_representative ?? '',
      party_a_title: contract.party_a_title ?? '',
      party_b_name: contract.party_b_name,
      party_b_address: contract.party_b_address ?? '',
      party_b_tax_code: contract.party_b_tax_code ?? '',
      party_b_bank_account: contract.party_b_bank_account ?? '',
      party_b_representative: contract.party_b_representative ?? '',
      payment_term: contract.payment_term ?? '',
      effective_date: contract.effective_date ?? '',
      expiry_date: contract.expiry_date ?? '',
      notes: contract.notes ?? '',
    },
  });

  function handleClose() {
    reset();
    onClose();
  }

  return (
    <AdaptiveSheet
      open={open}
      onClose={handleClose}
      title="Chỉnh sửa hợp đồng"
      maxWidth={640}
      footer={
        <div className="flex gap-3 justify-end">
          <Button
            variant="secondary"
            onClick={handleClose}
            disabled={isLoading}
          >
            Thoát
          </Button>
          <Button
            variant="primary"
            onClick={() => void handleSubmit(onSave)()}
            isLoading={isLoading}
          >
            Lưu thay đổi
          </Button>
        </div>
      }
    >
      <div className="form-grid">
        <p className="text-sm font-semibold text-muted mb-2">Thông tin Bên A</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="form-field">
            <label>
              Tên bên A <span className="field-required">*</span>
            </label>
            <input
              type="text"
              className={`field-input${errors.party_a_name ? ' is-error' : ''}`}
              {...register('party_a_name')}
            />
            {errors.party_a_name && (
              <span className="field-error">{errors.party_a_name.message}</span>
            )}
          </div>
          <div className="form-field">
            <label>MST bên A</label>
            <input
              type="text"
              className="field-input"
              {...register('party_a_tax_code')}
            />
          </div>
        </div>
        <div className="form-field">
          <label>Địa chỉ bên A</label>
          <input
            type="text"
            className="field-input"
            {...register('party_a_address')}
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="form-field">
            <label>Người đại diện bên A</label>
            <input
              type="text"
              className="field-input"
              {...register('party_a_representative')}
            />
          </div>
          <div className="form-field">
            <label>Chức vụ</label>
            <input
              type="text"
              className="field-input"
              {...register('party_a_title')}
            />
          </div>
        </div>

        <p className="text-sm font-semibold text-muted mb-2 mt-2">
          Thông tin Bên B (Vĩnh Phát)
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="form-field">
            <label>
              Tên bên B <span className="field-required">*</span>
            </label>
            <input
              type="text"
              className={`field-input${errors.party_b_name ? ' is-error' : ''}`}
              {...register('party_b_name')}
            />
            {errors.party_b_name && (
              <span className="field-error">{errors.party_b_name.message}</span>
            )}
          </div>
          <div className="form-field">
            <label>MST bên B</label>
            <input
              type="text"
              className="field-input"
              {...register('party_b_tax_code')}
            />
          </div>
        </div>
        <div className="form-field">
          <label>Địa chỉ bên B</label>
          <input
            type="text"
            className="field-input"
            {...register('party_b_address')}
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="form-field">
            <label>Người đại diện bên B</label>
            <input
              type="text"
              className="field-input"
              {...register('party_b_representative')}
            />
          </div>
          <div className="form-field">
            <label>Tài khoản ngân hàng</label>
            <input
              type="text"
              className="field-input"
              {...register('party_b_bank_account')}
            />
          </div>
        </div>

        <p className="text-sm font-semibold text-muted mb-2 mt-2">Điều khoản</p>
        <div className="form-field">
          <label>Điều khoản thanh toán</label>
          <input
            type="text"
            className="field-input"
            placeholder="VD: Thanh toán 30 ngày sau khi giao hàng"
            {...register('payment_term')}
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="form-field">
            <label>Ngày hiệu lực</label>
            <input
              type="date"
              className="field-input"
              {...register('effective_date')}
            />
          </div>
          <div className="form-field">
            <label>Ngày hết hạn</label>
            <input
              type="date"
              className="field-input"
              {...register('expiry_date')}
            />
          </div>
        </div>
        <div className="form-field">
          <label>Ghi chú</label>
          <textarea
            className="field-textarea"
            rows={3}
            {...register('notes')}
          />
        </div>
      </div>
    </AdaptiveSheet>
  );
}
