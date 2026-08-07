import { useState, useMemo } from 'react';
import toast from 'react-hot-toast';
import html2canvas from 'html2canvas';

import { useAuth } from '@/shared/hooks/useAuth';
import { exportToExcel, type ExportColumn } from '@/shared/utils/export';
import { printService } from '@/shared/services/print/PrintService';
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
import { QUICK_SHIPMENT_MESSAGES as MSG } from '@/features/shipments/shipments.constants';

export type ColumnState = {
  id: string;
  fabricCode: string;
  weightsText: string;
};

export function useK80QuickShipment() {
  const { profile } = useAuth();
  const { data: customerOptions = [] } = useActiveCustomerOptions();
  const createMutation = useCreateAdHocShipment();

  const [ticketNumber, setTicketNumber] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [customerId, setCustomerId] = useState<string>('');
  const [saveToDb, setSaveToDb] = useState(false);
  const [paperSize, setPaperSize] = useState<'K80' | 'A5'>('K80');

  const [columns, setColumns] = useState<ColumnState[]>([
    { id: crypto.randomUUID(), fabricCode: '', weightsText: '' },
  ]);

  const customerComboOptions = useMemo(
    () =>
      customerOptions.map((c) => ({
        id: c.value,
        name: c.label,
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
      (c) => c.id === customerId,
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
        ? selectedCustomer.name
        : LABELS.EMPTY_VALUE,
      columns: parsedColumns,
      maxRows,
      totalRolls,
      totalKg,
      paperSize,
    };
  }, [
    columns,
    ticketNumber,
    date,
    customerId,
    profile,
    customerComboOptions,
    paperSize,
  ]);

  const handlePrint = () => {
    if (paperSize === 'A5') {
      printService.printA5();
    } else {
      printService.printK80();
    }
  };

  const [isExportingImage, setIsExportingImage] = useState(false);

  const handleShareZalo = async () => {
    const previewEl = document.querySelector(
      '.k80-preview-container',
    ) as HTMLElement;
    if (!previewEl) return;

    setIsExportingImage(true);
    const toastId = toast.loading(MESSAGES.ZALO_CREATING);

    const clone = previewEl.cloneNode(true) as HTMLElement;
    clone.style.position = 'absolute';
    clone.style.left = '-9999px';
    clone.style.top = '-9999px';
    clone.style.transform = 'none';
    document.body.appendChild(clone);

    try {
      const canvas = await html2canvas(clone, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
      });

      canvas.toBlob(async (blob) => {
        if (!blob) throw new Error(MESSAGES.ZALO_ERROR_CREATE);

        try {
          const item = new ClipboardItem({ 'image/png': blob });
          await navigator.clipboard.write([item]);
          toast.success(MESSAGES.ZALO_COPY_SUCCESS, {
            id: toastId,
            duration: 4000,
          });
        } catch (clipboardError) {
          console.error('Clipboard failed, downloading:', clipboardError);
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `Phieu_Xuat_${ticketNumber || 'Nhanh'}.png`;
          link.click();
          URL.revokeObjectURL(url);
          toast.success(MESSAGES.ZALO_DOWNLOAD_SUCCESS, {
            id: toastId,
            duration: 4000,
          });
        }
      }, 'image/png');
    } catch (error) {
      console.error('Lỗi khi tạo ảnh:', error);
      toast.error(MESSAGES.ZALO_ERROR_GENERAL, { id: toastId });
    } finally {
      setIsExportingImage(false);
      document.body.removeChild(clone);
    }
  };

  const handleExportExcel = async () => {
    if (printData.columns.length === 0) {
      toast.error(MESSAGES.REQUIRE_DATA);
      return;
    }

    const exportColumns: ExportColumn[] = printData.columns.map((c, i) => ({
      label: c.fabricCode || MSG.FABRIC_CODE(i + 1),
      key: c.id,
      align: 'right',
      width: 15,
    }));

    const dataRows = Array.from({ length: printData.maxRows }).map(
      (_, rowIdx) => {
        const row: Record<string, string | number> = {};
        printData.columns.forEach((c) => {
          row[c.id] = c.weights[rowIdx] !== undefined ? c.weights[rowIdx] : '';
        });
        return row;
      },
    );

    // Total rolls row
    const totalRollsRow: Record<string, string | number> = {};
    printData.columns.forEach((c) => {
      totalRollsRow[c.id] =
        c.weights.length > 0 ? MSG.ROLL_COUNT(c.weights.length) : '';
    });
    dataRows.push(totalRollsRow);

    // Total Kg row
    const totalKgRow: Record<string, string | number> = {};
    printData.columns.forEach((c) => {
      totalKgRow[c.id] = c.weights.length > 0 ? c.totalKg : '';
    });
    dataRows.push(totalKgRow);

    const fileName = `K80_${printData.ticketNumber || 'QuickPrint'}_${new Date().getTime()}`;

    try {
      await exportToExcel(dataRows, exportColumns, {
        fileName,
        sheetName: 'K80 Print',
        title: LABELS.RECEIPT_TITLE,
      });
      toast.success(MESSAGES.EXPORT_SUCCESS);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(`${MESSAGES.EXPORT_ERROR} ${msg}`);
    }
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
          purpose: MSG.PURPOSE_RETAIL,
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
    handleProcess,
    handleExportExcel,
    handleShareZalo,
    isPending: createMutation.isPending,
    isExportingImage,
    paperSize,
    setPaperSize,
  };
}
