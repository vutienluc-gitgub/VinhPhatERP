/**
 * Custom Hook: Yarn Slip Direct Transaction
 * Handles One-Click Direct Confirmation and Instant Draft Creation from Scan Workspace.
 * Automates inventory updates and query invalidations.
 */

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

import {
  createYarnReceiptFull,
  confirmYarnReceipt,
  type YarnReceiptCreateInput,
} from '@/api/yarn-receipts.api';
import type { YarnReceipt } from '@/domain/inventory/yarn-receipts.types';
import { SCAN_WORKSPACE_LABELS } from '@/features/yarn-receipts/yarn-slip-scan.constants';
import type { YarnReceiptsFormValues } from '@/schema/yarn-receipt.schema';

export interface UseYarnSlipDirectTransactionReturn {
  isSubmitting: boolean;
  error: string | null;
  createDraftReceipt: (
    values: Partial<YarnReceiptsFormValues>,
  ) => Promise<YarnReceipt>;
  confirmDirectReceipt: (
    values: Partial<YarnReceiptsFormValues>,
  ) => Promise<YarnReceipt>;
}

export function useYarnSlipDirectTransaction(): UseYarnSlipDirectTransactionReturn {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const toCreateInput = (
    values: Partial<YarnReceiptsFormValues>,
  ): YarnReceiptCreateInput => {
    if (!values.supplierId) {
      throw new Error(SCAN_WORKSPACE_LABELS.STATUS_AMBIGUOUS_SUPPLIER);
    }

    const items = (values.items || []).map((item) => ({
      yarnType: item.yarnType?.trim() || '',
      colorName: item.colorName?.trim() || null,
      quantity: Number(item.quantity) || 0,
      unitPrice: Number(item.unitPrice) || 0,
      lotNumber: item.lotNumber?.trim() || null,
      grade: item.grade?.trim() || null,
      unit: item.unit?.trim() || 'kg',
      tensileStrength: item.tensileStrength?.trim() || null,
      composition: item.composition?.trim() || null,
      origin: item.origin?.trim() || null,
      notes: item.notes?.trim() || null,
      dtex: item.dtex?.trim() || null,
      twist: item.twist?.trim() || null,
      machine_no: item.machineNo?.trim() || null,
      yarnCatalogId: item.yarnCatalogId?.trim() || null,
      netWeight: item.netWeight ? Number(item.netWeight) : null,
      grossWeight: item.grossWeight ? Number(item.grossWeight) : null,
      serialNumber: item.serialNumber?.trim() || null,
      productionWeek: item.productionWeek ? Number(item.productionWeek) : null,
      dist: item.dist?.trim() || null,
      conesPerBox: item.conesPerBox ? Number(item.conesPerBox) : null,
      boxCount: item.boxCount ? Number(item.boxCount) : null,
      boxNo: item.boxNo?.trim() || null,
    }));

    return {
      receiptNumber: values.receiptNumber?.trim() || undefined,
      supplierId: values.supplierId,
      receiptDate: values.receiptDate || new Date().toISOString().slice(0, 10),
      notes: values.notes?.trim() || null,
      vehicleInfo: values.vehicleInfo?.trim() || null,
      items,
    };
  };

  const createDraftReceipt = async (
    values: Partial<YarnReceiptsFormValues>,
  ): Promise<YarnReceipt> => {
    setIsSubmitting(true);
    setError(null);
    try {
      const input = toCreateInput(values);
      const created = await createYarnReceiptFull(input);
      await queryClient.invalidateQueries({ queryKey: ['yarn-receipts'] });
      toast.success(SCAN_WORKSPACE_LABELS.MSG_SAVE_DRAFT_SUCCESS);
      return created;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
      toast.error(msg);
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDirectReceipt = async (
    values: Partial<YarnReceiptsFormValues>,
  ): Promise<YarnReceipt> => {
    setIsSubmitting(true);
    setError(null);
    try {
      const input = toCreateInput(values);
      // 1. Create Receipt in DB
      const created = await createYarnReceiptFull(input);

      // 2. Confirm to trigger Domain Transaction and Stock Movement
      await confirmYarnReceipt(created.id);

      // 3. Invalidate stock and receipt queries
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['yarn-receipts'] }),
        queryClient.invalidateQueries({ queryKey: ['v_yarn_availability'] }),
        queryClient.invalidateQueries({ queryKey: ['yarn-catalog'] }),
      ]);

      toast.success(SCAN_WORKSPACE_LABELS.MSG_CONFIRM_DIRECT_SUCCESS);
      return { ...created, status: 'confirmed' };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
      toast.error(msg);
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    isSubmitting,
    error,
    createDraftReceipt,
    confirmDirectReceipt,
  };
}
