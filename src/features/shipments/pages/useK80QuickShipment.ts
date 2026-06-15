import { useState, useMemo, useRef } from 'react';
import toast from 'react-hot-toast';

import { useAuth } from '@/shared/hooks/useAuth';
import {
  useActiveCustomerOptions,
  useCreateAdHocShipment,
} from '@/application/shipments';
import type {
  K80PrintData,
  K80ColumnData,
} from '@/features/shipments/components/quick-print/K80PrintLayout';
import {
  K80_QUICK_PRINT_MESSAGES as MESSAGES,
  K80_PRINT_LAYOUT_LABELS as LABELS,
  K80_QUICK_PRINT_LABELS,
} from '@/features/shipments/components/quick-print/k80-quick-print.constants';

export type ColumnState = {
  id: string;
  fabricCode: string;
  weightsText: string;
};

export function useK80QuickShipment() {
  const { profile } = useAuth();
  const { data: customerOptions = [] } = useActiveCustomerOptions();
  const createMutation = useCreateAdHocShipment();
  const printRef = useRef<HTMLDivElement>(null);

  const [ticketNumber, setTicketNumber] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [customerId, setCustomerId] = useState<string>('');
  const [saveToDb, setSaveToDb] = useState(false);

  const [columns, setColumns] = useState<ColumnState[]>([
    { id: crypto.randomUUID(), fabricCode: '', weightsText: '' },
  ]);

  const customerComboOptions = useMemo(
    () =>
      customerOptions.map((c) => ({
        value: c.value,
        label: c.label,
        code: c.code,
      })),
    [customerOptions],
  );

  const addColumn = () => {
    if (columns.length >= 5) {
      toast.error(MESSAGES.MAX_COLUMNS);
      return;
    }
    setColumns([
      ...columns,
      { id: crypto.randomUUID(), fabricCode: '', weightsText: '' },
    ]);
  };

  const removeColumn = (id: string) => {
    if (columns.length <= 1) return;
    setColumns(columns.filter((c) => c.id !== id));
  };

  const updateColumn = (
    id: string,
    field: keyof ColumnState,
    value: string,
  ) => {
    setColumns(
      columns.map((c) => (c.id === id ? { ...c, [field]: value } : c)),
    );
  };

  const printData = useMemo<K80PrintData>(() => {
    const selectedCustomer = customerComboOptions.find(
      (c) => c.value === customerId,
    );

    const parsedColumns: K80ColumnData[] = columns
      .filter((c) => c.fabricCode.trim() !== '' || c.weightsText.trim() !== '')
      .map((c) => {
        const parts = c.weightsText.split(/[\s,\t\n]+/);
        const weights = parts
          .filter((p) => p.trim() !== '')
          .map((p) => parseFloat(p))
          .filter((num) => !isNaN(num) && num > 0);

        return {
          id: c.id,
          fabricCode: c.fabricCode.trim() || LABELS.EMPTY_VALUE,
          weights,
          totalKg: weights.reduce((sum, w) => sum + w, 0),
        };
      });

    const maxRows = Math.max(0, ...parsedColumns.map((c) => c.weights.length));
    const totalRolls = parsedColumns.reduce(
      (sum, c) => sum + c.weights.length,
      0,
    );
    const totalKg = parsedColumns.reduce(
      (sum, c) => sum + c.weights.reduce((s, w) => s + w, 0),
      0,
    );

    return {
      ticketNumber: ticketNumber.trim() || K80_QUICK_PRINT_LABELS.AUTO,
      date: new Date(date).toLocaleDateString('vi-VN'),
      exportTime: new Date().toLocaleTimeString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
      }),
      printTime: new Date().toLocaleString('vi-VN'),
      printedBy: profile?.full_name || 'ADMIN',
      customerName: selectedCustomer
        ? selectedCustomer.label
        : LABELS.EMPTY_VALUE,
      columns: parsedColumns,
      maxRows,
      totalRolls,
      totalKg,
    };
  }, [columns, ticketNumber, date, customerId, profile, customerComboOptions]);

  const handlePrint = () => {
    window.print();
  };

  const handleProcess = async () => {
    if (saveToDb) {
      if (!customerId) {
        toast.error(MESSAGES.REQUIRE_CUSTOMER);
        return;
      }
      if (printData.columns.length === 0) {
        toast.error(MESSAGES.REQUIRE_DATA);
        return;
      }

      const items = printData.columns.flatMap((col) =>
        col.weights.map((w) => ({
          finishedRollId: null,
          fabricType: col.fabricCode,
          quantity: w,
          unit: 'kg' as const,
          pricePerKg: 0,
          totalAmount: 0,
        })),
      );

      if (items.length === 0) {
        toast.error(MESSAGES.INVALID_DATA);
        return;
      }

      try {
        await createMutation.mutateAsync({
          shipmentNumber: ticketNumber,
          purpose: 'Hàng bán lẻ',
          syncDebt: false,
          customerId,
          shipmentDate: date,
          deliveryAddress: '',
          deliveryStaffId: '',
          employeeId: '',
          shippingRateId: '',
          shippingCost: 0,
          loadingFee: 0,
          vehicleInfo: '',
          notes: MESSAGES.PURPOSE_NOTE,
          items,
        });
        toast.success(MESSAGES.SAVE_SUCCESS);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        toast.error(`${MESSAGES.SAVE_ERROR} ${msg}`);
        return;
      }
    }

    handlePrint();
  };

  return {
    ticketNumber,
    setTicketNumber,
    date,
    setDate,
    customerId,
    setCustomerId,
    saveToDb,
    setSaveToDb,
    columns,
    customerComboOptions,
    addColumn,
    removeColumn,
    updateColumn,
    printData,
    printRef,
    handleProcess,
    isPending: createMutation.isPending,
  };
}
