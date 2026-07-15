import { Controller } from 'react-hook-form';
import type { Control } from 'react-hook-form';

import { Combobox } from '@/shared/components/Combobox';
import type { RawFabricFormValues } from '@/schema/raw-fabric.schema';
import { RAW_FABRIC_MESSAGES as MSG } from '@/features/raw-fabric/raw-fabric.constants';

type RawFabricFormStep3OriginProps = {
  control: Control<RawFabricFormValues>;
  workOrderOptions: { value: string; label: string }[];
  weavingPartnerOptions: { value: string; label: string }[];
  yarnReceiptOptions: { value: string; label: string }[];
  onNewPartnerClick: () => void;
};

export function RawFabricFormStep3Origin({
  control,
  workOrderOptions,
  weavingPartnerOptions,
  yarnReceiptOptions,
  onNewPartnerClick,
}: RawFabricFormStep3OriginProps) {
  return (
    <div className="form-grid">
      <div className="form-field">
        <label htmlFor="work_order_id">{MSG.LBL_WORK_ORDER}</label>
        <Controller
          name="work_order_id"
          control={control}
          render={({ field }) => (
            <Combobox
              options={workOrderOptions}
              value={field.value}
              onChange={field.onChange}
              placeholder={MSG.VAL_NO_WO}
            />
          )}
        />
        <span className="field-hint">{MSG.HINT_WORK_ORDER}</span>
      </div>

      <div className="form-field">
        <label htmlFor="weaving_partner_id">{MSG.LBL_WEAVING_PARTNER}</label>
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <Controller
              name="weaving_partner_id"
              control={control}
              render={({ field }) => (
                <Combobox
                  options={weavingPartnerOptions}
                  value={field.value}
                  onChange={field.onChange}
                  placeholder={MSG.VAL_CHOOSE_WEAVER}
                />
              )}
            />
          </div>
          <button
            type="button"
            className="btn-ghost whitespace-nowrap"
            onClick={onNewPartnerClick}
          >
            {MSG.BTN_NEW_PARTNER}
          </button>
        </div>
      </div>

      <div className="form-field">
        <label htmlFor="yarn_receipt_id">{MSG.LBL_YARN_RECEIPT}</label>
        <Controller
          name="yarn_receipt_id"
          control={control}
          render={({ field }) => (
            <Combobox
              options={yarnReceiptOptions}
              value={field.value}
              onChange={field.onChange}
              placeholder={MSG.VAL_CHOOSE_YARN}
            />
          )}
        />
        <span className="field-hint">{MSG.HINT_YARN_RECEIPT}</span>
      </div>
    </div>
  );
}
