import { useNavigate, useLocation } from 'react-router-dom';
import { useForm, useWatch } from 'react-hook-form';
import { useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import dayjs from 'dayjs';
import toast from 'react-hot-toast';

import { useCreatePurchaseOrder } from '@/application/purchase-orders';
import { useActiveSuppliers, useEmployees } from '@/application/crm';
import { purchaseOrderFormSchema } from '@/domain/purchase-orders';
import type { PurchaseOrderFormValues } from '@/domain/purchase-orders';
import { Button, CancelButton } from '@/shared/components';
import { getErrorMessage } from '@/shared/utils/error';
import { PO_CONSTANTS } from '@/features/procurement/purchase-orders/purchase-orders.constants';
import { usePOCalculations } from '@/features/procurement/purchase-orders/usePOCalculations';
import { useMaterialAutoFill } from '@/features/procurement/purchase-orders/useMaterialAutoFill';
import { useRFQQuotes } from '@/application/procurement/useRFQs';
import { POGeneralInfoCard } from '@/features/procurement/purchase-orders/components/POGeneralInfoCard';
import { POItemsTable } from '@/features/procurement/purchase-orders/components/POItemsTable';
import { POAttachmentsCard } from '@/features/procurement/purchase-orders/components/POAttachmentsCard';
import { POPaymentPanel } from '@/features/procurement/purchase-orders/components/POPaymentPanel';

export function POCreatePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const createMutation = useCreatePurchaseOrder();

  const rfqId = location.state?.rfq_id as string | undefined;
  const quoteId = location.state?.quote_id as string | undefined;
  const { data: quotes } = useRFQQuotes(rfqId ?? null);

  const { data: suppliers = [], isLoading: isLoadingSuppliers } =
    useActiveSuppliers();
  const { data: employees = [], isLoading: isLoadingEmployees } = useEmployees({
    status: 'active',
  });

  const form = useForm<PurchaseOrderFormValues>({
    resolver: zodResolver(purchaseOrderFormSchema),
    defaultValues: {
      supplier_id: '',
      supplier_name_snapshot: '',
      order_date: dayjs().format('YYYY-MM-DD'),
      expected_date: '',
      person_in_charge: '',
      payment_terms: 'NET30',
      currency: 'VND',
      vat_rate: 0,
      shipping_fee: 0,
      delivery_warehouse: 'Kho Nguyên Phụ Liệu',
      supplier_ref: '',
      incoterms: '',
      payment_deadline: '',
      priority: 'normal',
      attachments: [],
      vat_terms: '',
      items: [{ material_id: '', uom: 'kg', ordered_qty: 0, unit_price: 0 }],
    },
  });

  const {
    watch,
    handleSubmit,
    setValue,
    control,
    formState: { isSubmitting },
  } = form;

  // Auto-fill from RFQ Quote if present
  useEffect(() => {
    if (quoteId && quotes && quotes.length > 0 && suppliers.length > 0) {
      const targetQuote = quotes.find((q) => q.id === quoteId);
      if (targetQuote) {
        // Try to match supplier by name or phone
        const matchedSupplier = suppliers.find(
          (s) =>
            s.name
              .toLowerCase()
              .includes(targetQuote.supplier_name.toLowerCase()) ||
            (s.phone &&
              targetQuote.supplier_phone &&
              s.phone.includes(targetQuote.supplier_phone)),
        );

        if (matchedSupplier) {
          setValue('supplier_id', matchedSupplier.id);
          setValue('supplier_name_snapshot', matchedSupplier.name);
        }

        // Fill items that have a valid material_id
        if (targetQuote.items && targetQuote.items.length > 0) {
          const poItems = targetQuote.items
            .filter((qi) => qi.material_id) // ensure it's not null
            .map((qi) => ({
              material_id: qi.material_id as string,
              uom: (qi.uom || 'kg') as 'kg' | 'cây' | 'mét' | 'cuộn',
              ordered_qty: qi.qty_offered,
              unit_price: qi.unit_price,
            }));

          if (poItems.length > 0) {
            setValue('items', poItems);
            toast.success('Đã tự động điền vật tư từ Báo giá!');
          }
        }
      }
    }
  }, [quoteId, quotes, suppliers, setValue]);

  const watchItems = useWatch({ control, name: 'items' }) || watch('items');
  const watchVatRate = watch('vat_rate') || 0;
  const watchShippingFee = watch('shipping_fee') || 0;

  const { subtotal, vatAmount, totalAmount, lineTotals } = usePOCalculations(
    watchItems,
    watchVatRate,
    watchShippingFee,
  );

  const { handleMaterialBlur, supplierPrices, globalMaterials } =
    useMaterialAutoFill({
      watch,
      setValue,
    });

  const isPending = isSubmitting || createMutation.isPending;

  async function onSubmit(values: PurchaseOrderFormValues) {
    try {
      await createMutation.mutateAsync(values);
      toast.success(
        `${PO_CONSTANTS.CREATE_PAGE_TITLE} ${PO_CONSTANTS.MSG_CREATE_SUCCESS}`,
      );
      navigate('/purchase-orders');
    } catch (error) {
      toast.error(PO_CONSTANTS.ERR_CREATE_FAILED + getErrorMessage(error));
    }
  }

  if (isLoadingSuppliers || isLoadingEmployees) {
    return (
      <div className="page-container p-4 max-w-7xl mx-auto">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-surface-secondary rounded w-1/3"></div>
          <div className="h-64 bg-surface-secondary rounded-xl"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container p-4 max-w-7xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold m-0">
              {PO_CONSTANTS.CREATE_PAGE_TITLE}
            </h1>
            <span className="px-2 py-1 bg-surface-secondary text-muted text-xs rounded-md font-medium border border-default">
              {PO_CONSTANTS.STATUS_DRAFT}
            </span>
          </div>
          <p className="text-muted mt-1">{PO_CONSTANTS.PAGE_SUBTITLE}</p>
        </div>
        <div className="flex gap-2">
          <CancelButton onClick={() => navigate('/purchase-orders')} />
          <Button
            type="button"
            variant="primary"
            isLoading={isPending}
            onClick={handleSubmit(onSubmit, (errors) => {
              console.error('Form validation failed:', errors);
              toast.error(PO_CONSTANTS.ERR_FORM_VALIDATION);
            })}
          >
            {PO_CONSTANTS.BTN_CONFIRM_CREATE}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 space-y-6">
          <POGeneralInfoCard
            form={form}
            suppliers={suppliers}
            employees={employees}
          />

          <POItemsTable
            form={form}
            handleMaterialBlur={handleMaterialBlur}
            supplierPrices={supplierPrices}
            globalMaterials={globalMaterials}
            lineTotals={lineTotals}
          />

          <POAttachmentsCard />
        </div>

        <div className="lg:col-span-4">
          <POPaymentPanel
            form={form}
            subtotal={subtotal}
            vatAmount={vatAmount}
            totalAmount={totalAmount}
            isPending={isPending}
            onSubmit={onSubmit}
          />
        </div>
      </div>
    </div>
  );
}

// Force Vite HMR
export default POCreatePage;
