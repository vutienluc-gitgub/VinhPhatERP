import type {
  UseFormRegister,
  Control,
  FieldErrors,
  UseFieldArrayAppend,
  UseFieldArrayRemove,
  FieldArrayWithId,
} from 'react-hook-form';

import { Button } from '@/shared/components';
import type { WeavingInvoiceFormValues } from '@/schema/weaving-invoice.schema';
import { WEAVING_INVOICE_MESSAGES as MSG } from '@/features/weaving-invoices/weaving-invoices.constants';

import { RollProgressBar } from './RollProgressBar';
import { PasteExcelParser } from './PasteExcelParser';
import { BulkRollStation } from './BulkRollStation';

type Props = {
  fields: FieldArrayWithId<WeavingInvoiceFormValues, 'rolls'>[];
  register: UseFormRegister<WeavingInvoiceFormValues>;
  control: Control<WeavingInvoiceFormValues>;
  errors: FieldErrors<WeavingInvoiceFormValues>;
  remove: UseFieldArrayRemove;
  append: UseFieldArrayAppend<WeavingInvoiceFormValues, 'rolls'>;
  activeRollIndex: number;
  setActiveRollIndex: (index: number) => void;
  scannedCount: number;
  totalKg: number;
  totalAmount: number;
  autoPrefix: string;
  handleImportRolls: (
    imported: { roll_number: string; weight_kg: number; length_m?: number }[],
  ) => void;
};

export function WeavingInvoiceFormStep2Rolls({
  fields,
  register,
  control,
  errors,
  remove,
  append,
  activeRollIndex,
  setActiveRollIndex,
  scannedCount,
  totalKg,
  totalAmount,
  autoPrefix,
  handleImportRolls,
}: Props) {
  return (
    <div className="flex flex-col gap-4">
      {/* Gamification Progress Bar */}
      <RollProgressBar
        scanned={scannedCount}
        total={fields.length}
        totalKg={totalKg}
        totalAmount={totalAmount}
      />

      {errors.rolls?.root && (
        <p className="error-inline">{errors.rolls.root.message}</p>
      )}

      {/* Import tools: Paste Excel / Auto-gen */}
      <PasteExcelParser onImport={handleImportRolls} autoPrefix={autoPrefix} />

      {/* Ops UI: Scanning Station + Roll Grid */}
      <BulkRollStation
        fields={fields}
        register={register}
        control={control}
        remove={remove}
        errors={errors}
        activeIndex={activeRollIndex}
        onActiveIndexChange={setActiveRollIndex}
      />

      {/* Add single & Validation Summary */}
      <div className="flex flex-wrap gap-2 items-center justify-between">
        <Button
          variant="secondary"
          type="button"
          onClick={() => {
            const nextNumMatch = String(fields.length + 1).padStart(3, '0');
            append({
              roll_number: `${autoPrefix}${nextNumMatch}`,
              weight_kg: undefined as unknown as number,
              length_m: undefined,
              quality_grade: undefined,
              warehouse_location: '',
              lot_number: '',
              notes: '',
            });
            setActiveRollIndex(fields.length);
          }}
        >
          {MSG.BTN_ADD_ROLL}
        </Button>

        {errors.rolls &&
          Array.isArray(errors.rolls) &&
          errors.rolls.some(Boolean) && (
            <div className="text-sm font-semibold text-red-600 bg-red-50 border border-red-200 px-3 py-1.5 rounded-lg animate-pulse">
              {MSG.ERR_ROLLS_INVALID.replace(
                '{count}',
                String(errors.rolls.filter(Boolean).length),
              )}
            </div>
          )}
      </div>
    </div>
  );
}
