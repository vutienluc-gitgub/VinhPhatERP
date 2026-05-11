import { z } from 'zod';

import { findDuplicateRollNumbers as _findDuplicateRollNumbers } from '@/domain/inventory/InventoryDomain';

import {
  QUALITY_GRADES,
  ROLL_STATUSES,
  formatBulkRollNumber,
} from './roll.schema';

export {
  QUALITY_GRADES,
  QUALITY_GRADE_LABELS,
  ROLL_STATUSES,
  ROLL_STATUS_LABELS,
  formatBulkRollNumber,
  countFilledRolls,
} from './roll.schema';
export type { QualityGrade, RollStatus } from './roll.schema';

export const findDuplicateRollNumbers = _findDuplicateRollNumbers;

const optionalPositiveNum = z.preprocess(
  (val) =>
    val === '' || val === null || val === undefined ? undefined : Number(val),
  z.number().positive('Giá trị phải lớn hơn 0').optional(),
);

export const finishedFabricSchema = z.object({
  roll_number: z.string().trim().min(2, 'Mã cuộn phải có ít nhất 2 ký tự'),
  raw_roll_id: z
    .string()
    .uuid('Phải chọn cuộn vải mộc nguồn')
    .optional()
    .or(z.literal('')),
  supplier_id: z
    .string()
    .uuid('ID Nhà cung cấp không hợp lệ')
    .nullable()
    .optional(),
  purchase_price: optionalPositiveNum,
  lot_number: z.string().trim().optional().or(z.literal('')),
  fabric_type: z.string().trim().min(2, 'Loại vải không được để trống'),
  color_name: z.string().trim().optional().or(z.literal('')),
  color_code: z.string().trim().max(20).optional().or(z.literal('')),
  width_cm: optionalPositiveNum,
  length_m: optionalPositiveNum,
  weight_kg: optionalPositiveNum,
  quality_grade: z.enum(QUALITY_GRADES).optional(),
  status: z.enum(ROLL_STATUSES).default('in_stock'),
  warehouse_location: z.string().trim().max(120).optional().or(z.literal('')),
  production_date: z.string().optional().or(z.literal('')),
  reserved_for_order_id: z.string().uuid().nullable().optional(),
  notes: z.string().trim().optional().or(z.literal('')),
  image_url: z.string().url().nullable().optional(),
});

export type FinishedFabricFormValues = z.infer<typeof finishedFabricSchema>;

export const finishedFabricDefaults: FinishedFabricFormValues = {
  roll_number: '',
  raw_roll_id: '',
  supplier_id: null,
  purchase_price: undefined,
  lot_number: '',
  fabric_type: '',
  color_name: '',
  color_code: '',
  width_cm: undefined,
  length_m: undefined,
  weight_kg: undefined,
  quality_grade: undefined,
  status: 'in_stock',
  warehouse_location: '',
  production_date: '',
  reserved_for_order_id: null,
  notes: '',
  image_url: null,
};

export const bulkFinishedRollRowSchema = z.object({
  roll_number: z.string().trim().min(2, 'Mã cuộn phải có ít nhất 2 ký tự'),
  raw_roll_id: z.string().uuid('ID không hợp lệ').or(z.literal('')),
  weight_kg: z.preprocess(
    (val) =>
      val === '' || val === null || val === undefined ? undefined : Number(val),
    z.number().positive('Trọng lượng phải > 0'),
  ),
  length_m: optionalPositiveNum,
  quality_grade: z.enum(QUALITY_GRADES).optional(),
  notes: z.string().trim().optional(),
});

export type BulkFinishedRollRow = z.infer<typeof bulkFinishedRollRowSchema>;

export const bulkFinishedInputSchema = z
  .object({
    lot_number: z.string().trim().min(1, 'Số lô (Lot number) không được trống'),
    fabric_type: z.string().trim().min(2, 'Loại vải không được để trống'),
    color_name: z.string().trim().optional(),
    color_code: z.string().trim().max(20).optional(),
    width_cm: optionalPositiveNum,
    quality_grade: z.enum(QUALITY_GRADES).optional(),
    status: z.enum(ROLL_STATUSES).default('in_stock'),
    warehouse_location: z.string().trim().max(120).optional(),
    production_date: z.string().optional(),
    roll_prefix: z.string().trim().min(1, 'Tiền tố mã cuộn không được trống'),
    start_number: z.preprocess(
      (val) =>
        val === '' || val === null || val === undefined ? 1 : Number(val),
      z.number().int().min(1, 'Số bắt đầu phải ≥ 1'),
    ),
    rolls: z.array(bulkFinishedRollRowSchema).min(1, 'Phải có ít nhất 1 cuộn'),
    source_type: z.enum(['produced', 'purchased']).default('produced'),
    supplier_id: z
      .string()
      .uuid('ID Nhà cung cấp không hợp lệ')
      .nullable()
      .optional(),
    purchase_price: optionalPositiveNum,
  })
  .superRefine((values, ctx) => {
    const duplicates = findDuplicateRollNumbers(values.rolls);
    for (const dup of duplicates) {
      values.rolls.forEach((roll, i) => {
        if (roll.roll_number.trim() === dup) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['rolls', i, 'roll_number'],
            message: `Mã cuộn "${dup}" bị trùng trong lô nhập`,
          });
        }
      });
    }

    if (values.source_type === 'purchased') {
      if (!values.supplier_id) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['supplier_id'],
          message: 'Bắt buộc chọn Nhà cung cấp khi Nhập thương mại',
        });
      }
    }
  });

export type BulkFinishedInputFormValues = z.infer<
  typeof bulkFinishedInputSchema
>;

/**
 * Input type for form initial/intermediate state.
 * weight_kg may be undefined before user input — Zod validates at submit.
 */
export type BulkFinishedRollRowInput = Omit<
  BulkFinishedRollRow,
  'weight_kg'
> & {
  weight_kg: number | undefined;
};

/** Initial empty row — Zod validates the complete values at submit time. */
const EMPTY_ROLL: BulkFinishedRollRowInput = {
  roll_number: formatBulkRollNumber('FN-', 1),
  raw_roll_id: '',
  weight_kg: undefined,
  length_m: undefined,
  quality_grade: undefined,
  notes: '',
};

export const bulkFinishedInputDefaults: BulkFinishedInputFormValues = {
  lot_number: '',
  fabric_type: '',
  color_name: '',
  color_code: '',
  width_cm: undefined,
  quality_grade: undefined,
  status: 'in_stock',
  warehouse_location: '',
  production_date: '',
  roll_prefix: 'FN-',
  start_number: 1,
  source_type: 'produced',
  supplier_id: null,
  purchase_price: undefined,
  rolls: [EMPTY_ROLL],
} as BulkFinishedInputFormValues;
