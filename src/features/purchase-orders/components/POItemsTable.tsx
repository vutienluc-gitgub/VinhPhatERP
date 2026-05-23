import { KeyboardEvent, useMemo } from 'react';
import { UseFormReturn, useFieldArray, Controller } from 'react-hook-form';

import type { PurchaseOrderFormValues } from '@/domain/purchase-orders';
import {
  Button,
  FormattedInput,
  CurrencyInput,
  Icon,
  Combobox,
} from '@/shared/components';
import { formatCurrency } from '@/shared/utils/format';
import { PO_CONSTANTS } from '@/features/purchase-orders/purchase-orders.constants';
import type { SupplierPrice } from '@/api/suppliers.api';
import type { GlobalMaterialOption } from '@/features/purchase-orders/useMaterialAutoFill';

interface POItemsTableProps {
  form: UseFormReturn<PurchaseOrderFormValues>;
  handleMaterialBlur: (index: number, materialId: string) => Promise<void>;
  supplierPrices: (SupplierPrice & { material_id: string })[];
  globalMaterials: GlobalMaterialOption[];
  lineTotals: number[];
}

export function POItemsTable({
  form,
  handleMaterialBlur,
  supplierPrices,
  globalMaterials,
  lineTotals,
}: POItemsTableProps) {
  const {
    control,
    register,
    watch,
    formState: { errors },
  } = form;

  const { fields, append, remove, insert } = useFieldArray({
    control,
    name: 'items',
  });

  const materialOptions = useMemo(() => {
    const options = globalMaterials.map((mat) => {
      const priceInfo = supplierPrices.find((p) => p.material_id === mat.code);

      if (priceInfo) {
        return {
          value: mat.code,
          label: `${mat.code} - ${mat.name}`,
          desc: `Giá HĐ: ${formatCurrency(priceInfo.unit_price)} | ĐVT: ${priceInfo.uom} | MOQ: ${priceInfo.moq} | Leadtime: ${priceInfo.lead_time_days} ngày`,
        };
      }

      return {
        value: mat.code,
        label: `${mat.code} - ${mat.name}`,
        desc: `(Chưa có giá hợp đồng) Loại: ${mat.type === 'yarn' ? 'Sợi' : 'Vải'} | ĐVT: ${mat.unit}`,
      };
    });

    // Include any supplier materials that might not be in the global catalog (just in case)
    const globalCodes = new Set(globalMaterials.map((m) => m.code));
    supplierPrices.forEach((p) => {
      if (!globalCodes.has(p.material_id)) {
        options.push({
          value: p.material_id,
          label: p.material_id,
          desc: `Giá HĐ: ${formatCurrency(p.unit_price)} | ĐVT: ${p.uom} | MOQ: ${p.moq} | Leadtime: ${p.lead_time_days} ngày`,
        });
      }
    });

    return options;
  }, [globalMaterials, supplierPrices]);

  const handleKeyDown = (
    e: KeyboardEvent<Element>,
    index: number,
    field: 'material_id' | 'uom' | 'ordered_qty' | 'unit_price',
  ) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const nextId = `input-${field}-${index + 1}`;
      const nextEl = document.getElementById(nextId);
      if (nextEl) {
        nextEl.focus();
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (index > 0) {
        const prevId = `input-${field}-${index - 1}`;
        const prevEl = document.getElementById(prevId);
        if (prevEl) {
          prevEl.focus();
        }
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (field === 'unit_price' && index === fields.length - 1) {
        append({ material_id: '', uom: 'kg', ordered_qty: 0, unit_price: 0 });
        setTimeout(() => {
          const nextEl = document.getElementById(
            `input-material_id-${index + 1}`,
          );
          if (nextEl) {
            nextEl.focus();
          }
        }, 50);
      } else if (field === 'unit_price' && index < fields.length - 1) {
        const nextEl = document.getElementById(
          `input-material_id-${index + 1}`,
        );
        if (nextEl) {
          nextEl.focus();
        }
      }
    }
  };

  return (
    <div className="bg-surface rounded-xl shadow-sm border border-border overflow-hidden">
      <div className="p-4 border-b border-border bg-gray-50 flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-lg m-0">
            {PO_CONSTANTS.SECTION_ITEMS}
          </h3>
          <span className="text-xs text-muted mt-1">
            {PO_CONSTANTS.TIP_KEYBOARD_NAV}
          </span>
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="h-8 text-xs"
          >
            <Icon name="Upload" size={14} className="mr-1" />
            {PO_CONSTANTS.BTN_IMPORT_EXCEL}
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="h-8 text-xs"
          >
            <Icon name="Copy" size={14} className="mr-1" />
            {PO_CONSTANTS.BTN_COPY_BOM}
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto overflow-y-auto max-h-[450px]">
        <table className="w-full text-sm text-left relative border-collapse">
          <thead className="text-xs text-gray-600 bg-gray-50/80 border-b border-border sticky top-0 z-20 backdrop-blur-sm">
            <tr>
              <th className="px-3 py-2.5 font-semibold align-middle w-[40px] text-center">
                #
              </th>
              <th className="px-2 py-2.5 font-semibold align-middle">
                {PO_CONSTANTS.COL_MATERIAL}{' '}
                <span className="text-red-500">*</span>
              </th>
              <th className="px-2 py-2.5 font-semibold align-middle w-[100px]">
                {PO_CONSTANTS.COL_UOM}
              </th>
              <th className="px-2 py-2.5 font-semibold align-middle w-[120px] text-right">
                {PO_CONSTANTS.COL_QTY} <span className="text-red-500">*</span>
              </th>
              <th className="px-2 py-2.5 font-semibold align-middle w-[150px] text-right">
                {PO_CONSTANTS.COL_UNIT_PRICE}{' '}
                <span className="text-red-500">*</span>
              </th>
              <th className="px-3 py-2.5 font-semibold align-middle w-[150px] text-right">
                {PO_CONSTANTS.COL_LINE_TOTAL}
              </th>
              <th className="px-3 py-2.5 font-semibold align-middle w-[70px]"></th>
            </tr>
          </thead>
          <tbody>
            {fields.map((item, index) => {
              const price = watch(`items.${index}.unit_price`) || 0;
              const lineTotal = lineTotals[index] || 0;

              const currentMaterialId = watch(`items.${index}.material_id`);
              const contractPriceInfo = supplierPrices.find(
                (p) => p.material_id === currentMaterialId,
              );
              const contractPrice = contractPriceInfo
                ? contractPriceInfo.unit_price
                : null;
              const isPriceHigherThanContract =
                contractPrice !== null && price > contractPrice;

              return (
                <tr
                  key={item.id}
                  className="border-b border-border hover:bg-gray-50/50 group"
                >
                  <td className="px-3 py-1.5 text-center text-gray-400 align-middle">
                    {index + 1}
                  </td>
                  <td className="px-2 py-1.5 relative align-middle">
                    <Controller
                      name={`items.${index}.material_id`}
                      control={control}
                      render={({ field }) => (
                        <Combobox
                          id={`input-material_id-${index}`}
                          allowInput
                          options={materialOptions}
                          value={field.value}
                          onChange={(val) => {
                            field.onChange(val);
                            handleMaterialBlur(index, val);
                          }}
                          onKeyDown={(e) =>
                            handleKeyDown(e, index, 'material_id')
                          }
                          placeholder={PO_CONSTANTS.PLACEHOLDER_MATERIAL}
                          className="h-9 w-full"
                          variant="table-cell"
                          hasError={!!errors.items?.[index]?.material_id}
                        />
                      )}
                    />
                  </td>
                  <td className="px-2 py-1.5 align-middle">
                    <select
                      id={`input-uom-${index}`}
                      className="table-cell-select font-normal"
                      {...register(`items.${index}.uom`)}
                      onKeyDown={(e) => handleKeyDown(e, index, 'uom')}
                    >
                      {PO_CONSTANTS.UOM_OPTIONS.map((u) => (
                        <option key={u} value={u}>
                          {u}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-2 py-1.5 text-right align-middle">
                    <Controller
                      name={`items.${index}.ordered_qty`}
                      control={control}
                      render={({ field }) => (
                        <FormattedInput
                          id={`input-ordered_qty-${index}`}
                          className="table-cell-input table-cell-input-numeric"
                          placeholder="0"
                          value={field.value}
                          onChange={(val) => field.onChange(val || 0)}
                          onKeyDown={(e) =>
                            handleKeyDown(e, index, 'ordered_qty')
                          }
                        />
                      )}
                    />
                  </td>
                  <td className="px-2 py-1.5 text-right align-middle">
                    <Controller
                      name={`items.${index}.unit_price`}
                      control={control}
                      render={({ field }) => (
                        <div className="flex flex-col items-stretch">
                          <CurrencyInput
                            id={`input-unit_price-${index}`}
                            className={`table-cell-input table-cell-input-numeric ${
                              isPriceHigherThanContract
                                ? 'border-amber-400 focus:border-amber-500 text-amber-700 bg-amber-50/20 font-semibold'
                                : ''
                            }`}
                            placeholder="0"
                            value={field.value}
                            onChange={(val) => field.onChange(val || 0)}
                            onKeyDown={(e) =>
                              handleKeyDown(e, index, 'unit_price')
                            }
                          />
                          {isPriceHigherThanContract && (
                            <div className="text-[10px] text-amber-700 flex items-center gap-1 mt-1 bg-amber-50 p-1 rounded border border-amber-200 justify-end font-semibold">
                              <span>
                                {PO_CONSTANTS.MSG_PRICE_HIGHER_THAN_CONTRACT} (
                                {formatCurrency(contractPrice)})
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    />
                  </td>
                  <td className="px-3 py-1.5 text-right tabular-nums text-gray-800 font-semibold align-middle">
                    {formatCurrency(lineTotal)}
                  </td>
                  <td className="px-3 py-1.5 text-center whitespace-nowrap align-middle">
                    <button
                      type="button"
                      onClick={() => {
                        const currentItem = watch(`items.${index}`);
                        insert(index + 1, {
                          material_id: currentItem.material_id,
                          uom: currentItem.uom,
                          ordered_qty: currentItem.ordered_qty,
                          unit_price: currentItem.unit_price,
                        });
                      }}
                      className="text-gray-400 hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity p-1 mr-1"
                      title={PO_CONSTANTS.BTN_DUPLICATE_ROW}
                    >
                      <Icon name="Copy" size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => remove(index)}
                      className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                      title={PO_CONSTANTS.BTN_DELETE_ROW}
                    >
                      <Icon name="Trash2" size={16} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {errors.items?.root && (
          <div className="p-3 text-red-500 text-sm bg-red-50">
            {errors.items.root.message}
          </div>
        )}
      </div>
      <div className="p-3 bg-gray-50 border-t border-border">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="text-primary hover:bg-primary/10"
          onClick={() =>
            append({
              material_id: '',
              uom: 'kg',
              ordered_qty: 0,
              unit_price: 0,
            })
          }
        >
          <Icon name="Plus" size={16} className="mr-1" />
          {PO_CONSTANTS.BTN_ADD_ROW}
        </Button>
      </div>
    </div>
  );
}
