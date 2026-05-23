import { useNavigate } from 'react-router-dom';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import dayjs from 'dayjs';
import toast from 'react-hot-toast';

import { useCreatePurchaseOrder } from '@/application/purchase-orders';
import { useActiveSuppliers, useEmployees } from '@/application/crm';
import { purchaseOrderFormSchema } from '@/domain/purchase-orders';
import type { PurchaseOrderFormValues } from '@/domain/purchase-orders';
import { Button, CancelButton } from '@/shared/components';
import { getErrorMessage } from '@/shared/utils/error';
import { PO_CONSTANTS } from '@/features/purchase-orders/purchase-orders.constants';
import { usePOCalculations } from '@/features/purchase-orders/usePOCalculations';
import { useMaterialAutoFill } from '@/features/purchase-orders/useMaterialAutoFill';
import { POGeneralInfoCard } from '@/features/purchase-orders/components/POGeneralInfoCard';
import { POItemsTable } from '@/features/purchase-orders/components/POItemsTable';
import { POAttachmentsCard } from '@/features/purchase-orders/components/POAttachmentsCard';
import { POPaymentPanel } from '@/features/purchase-orders/components/POPaymentPanel';

export function POCreatePage() {
  const navigate = useNavigate();
  const createMutation = useCreatePurchaseOrder();
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
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-64 bg-gray-200 rounded-xl"></div>
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
            <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-md font-medium border border-gray-200">
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
            onClick={handleSubmit(onSubmit)}
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
