import { lazy, Suspense, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

const AdHocShipmentForm = lazy(() =>
  import('./AdHocShipmentForm').then((m) => ({
    default: m.AdHocShipmentForm,
  })),
);
import { useConfirm } from '@/shared/components/ConfirmDialog';
import {
  Icon,
  DataTableAdvanced,
  FilterBar,
  TabSwitcher,
  type FilterFieldConfig,
  type TabItem,
  PageHeader,
  TableSection,
  KpiCard,
  ErrorInline,
} from '@/shared/components';
// eslint-disable-next-line boundaries/dependencies
import { ChatDrawer } from '@/features/chat/ChatDrawer';
import { useUrlFilterState } from '@/shared/hooks/useUrlFilterState';
import {
  useConfirmShipment,
  useDeleteShipment,
  useExportShipmentPdf,
  useShipmentList,
  useDeliveryStaffList,
} from '@/application/shipments';
import { sumBy } from '@/shared/utils/array.util';

import { DeliveryConfirmForm } from './DeliveryConfirmForm';
import { exportShipmentToPdf } from './shipment-document';
import type { Shipment, ShipmentsFilter } from './types';
import { SHIPMENT_LIST_MESSAGES as MSG } from './shipments.constants';
import { ShipmentMobileCard } from './components/ShipmentMobileCard';
import { calcShipmentCost } from './shipments.constants';
import { useShipmentColumns } from './hooks/useShipmentColumns';

type ShipmentTab = '' | 'preparing' | 'shipped' | 'delivered';

const BASE_TABS: TabItem<ShipmentTab>[] = [
  { key: '', label: MSG.TAB_ALL, icon: <Icon name="List" size={16} /> },
  {
    key: 'preparing',
    label: MSG.TAB_PREPARING,
    icon: <Icon name="Clock" size={16} />,
  },
  {
    key: 'shipped',
    label: MSG.TAB_SHIPPED,
    icon: <Icon name="Truck" size={16} />,
  },
  {
    key: 'delivered',
    label: MSG.TAB_DELIVERED,
    icon: <Icon name="CircleCheck" size={16} />,
  },
];

export function ShipmentList() {
  const { filters, setFilter, clearFilters } = useUrlFilterState([
    'search',
    'deliveryStaffId',
    'status',
    'unreconciled',
  ]);
  const [page, setPage] = useState(1);
  const [deliveryShipment, setDeliveryShipment] = useState<Shipment | null>(
    null,
  );
  const [chatShipment, setChatShipment] = useState<Shipment | null>(null);
  const [showAdHocForm, setShowAdHocForm] = useState(false);

  const {
    data: result,
    isLoading,
    error,
  } = useShipmentList(filters as ShipmentsFilter, page);
  const shipments = result?.data ?? [];
  const confirmMutation = useConfirmShipment();
  const deleteMutation = useDeleteShipment();
  const exportPdfMutation = useExportShipmentPdf();
  const staffListResult = useDeliveryStaffList();
  const { confirm, alert: showAlert } = useConfirm();

  function getErrorMessage(error: unknown): string {
    return error instanceof Error ? error.message : MSG.ERR_UNKNOWN;
  }

  const staffOptions = (staffListResult.data ?? []).map((s) => ({
    value: s.id,
    label: s.full_name,
  }));

  const filterSchema: FilterFieldConfig[] = [
    {
      key: 'search',
      type: 'search',
      label: MSG.FILTER_SEARCH_LABEL,
      placeholder: MSG.FILTER_SEARCH_PLACEHOLDER,
    },
    {
      key: 'deliveryStaffId',
      type: 'combobox',
      label: MSG.FILTER_STAFF_LABEL,
      options: staffOptions,
    },
    {
      key: 'unreconciled',
      type: 'combobox',
      label: MSG.FILTER_TYPE_LABEL,
      options: [
        { value: '', label: MSG.FILTER_TYPE_ALL },
        { value: 'true', label: MSG.FILTER_TYPE_MANUAL },
      ],
    },
  ];

  function handleFilterChange(key: string, value: string | undefined) {
    setPage(1);
    setFilter(key, value);
  }

  async function handleConfirm(shipment: Shipment) {
    const ok = await confirm({
      message: MSG.CONFIRM_DELIVERY_MSG(shipment.shipment_number),
    });
    if (!ok) return;

    try {
      const confirmedShipment = await confirmMutation.mutateAsync({
        shipmentId: shipment.id,
        expectedUpdatedAt: shipment.updated_at ?? undefined,
      });
      try {
        await exportShipmentToPdf(confirmedShipment);
      } catch (pdfError) {
        await showAlert(
          MSG.ERR_PDF_OPEN(
            confirmedShipment.shipment_number,
            getErrorMessage(pdfError),
          ),
          MSG.ERR_PDF_OPEN_TITLE,
        );
      }
    } catch (error) {
      await showAlert(MSG.ERR_CONFIRM(getErrorMessage(error)));
    }
  }

  async function handleDelete(id: string) {
    const ok = await confirm({
      message: MSG.CONFIRM_DELETE_MSG,
      variant: 'danger',
    });
    if (!ok) return;

    try {
      await deleteMutation.mutateAsync(id);
      toast.success(MSG.DELETE_SUCCESS);
    } catch (error) {
      await showAlert(MSG.ERR_DELETE(getErrorMessage(error)));
    }
  }

  async function handleExportPdf(
    shipment: Shipment,
    format?: 'A4' | 'A5_DOT_MATRIX',
  ) {
    try {
      await exportPdfMutation.mutateAsync({ shipmentId: shipment.id, format });
    } catch (error) {
      await showAlert(
        MSG.ERR_PDF_CREATE(shipment.shipment_number, getErrorMessage(error)),
      );
    }
  }

  const hasFilter = !!(
    filters.search ||
    filters.status ||
    filters.deliveryStaffId
  );

  const preparingCount = shipments.filter(
    (s) => s.status === 'preparing',
  ).length;

  const tabsWithBadge = BASE_TABS.map((t) => {
    if (t.key === 'preparing') return { ...t, badge: preparingCount };
    return t;
  });

  const columns = useShipmentColumns({
    onConfirm: handleConfirm,
    onDelete: handleDelete,
    onExportPdf: handleExportPdf,
    onDeliveryConfirm: setDeliveryShipment,
    onChat: setChatShipment,
    isConfirming: confirmMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isExporting: exportPdfMutation.isPending,
  });

  return (
    <>
      <PageHeader
        title={MSG.PAGE_TITLE}
        subtitle={MSG.PAGE_SUBTITLE}
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              className="btn-primary flex items-center gap-2"
              onClick={() => setShowAdHocForm(true)}
            >
              <Icon name="FilePlus" size={18} />
              {MSG.BTN_CREATE_MANUAL}
            </button>
            <Link to="/shipments/dispatch">
              <button className="btn-primary bg-success-soft hover:bg-success-soft text-white shadow-lg shadow-emerald-600/30 flex items-center gap-2">
                <Icon name="Navigation" size={18} />
                {MSG.BTN_DISPATCH_BOARD}
              </button>
            </Link>
            <Link to="/shipments/k80-quick-print">
              <button className="btn-secondary flex items-center gap-2">
                <Icon name="Printer" size={18} />
                {MSG.BTN_QUICK_PRINT}
              </button>
            </Link>
          </div>
        }
      />

      {/* Stats Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 px-4 sm:px-6 lg:px-8 mt-4">
        <KpiCard
          label={MSG.STAT_COUNT_TITLE}
          value={shipments.length}
          icon="Truck"
          variant="primary"
          formatMode="number"
        />
        <KpiCard
          label={MSG.STAT_COST_TITLE}
          value={sumBy(shipments, calcShipmentCost)}
          icon="Banknote"
          variant="success"
          formatMode="currency"
        />
        <KpiCard
          label={MSG.STAT_PENDING_TITLE}
          value={preparingCount}
          icon="Clock"
          variant="warning"
          formatMode="number"
        />
      </div>

      <TabSwitcher
        tabs={tabsWithBadge}
        active={filters.status || ''}
        onChange={(val) => {
          setPage(1);
          setFilter('status', val ? val : undefined);
        }}
        variant="underline"
      />
      <FilterBar
        schema={filterSchema}
        value={filters}
        onChange={handleFilterChange}
        onClear={hasFilter ? clearFilters : undefined}
      />

      <TableSection>
        {error && (
          <div className="px-4 sm:px-6 lg:px-8 mt-4">
            <ErrorInline>
              {MSG.ERR_LOAD} {getErrorMessage(error)}
            </ErrorInline>
          </div>
        )}

        {(confirmMutation.error ||
          deleteMutation.error ||
          exportPdfMutation.error) && (
          <div className="px-4 sm:px-6 lg:px-8 mt-4">
            <ErrorInline>
              {MSG.ERR_GENERIC}{' '}
              {getErrorMessage(
                confirmMutation.error ||
                  deleteMutation.error ||
                  exportPdfMutation.error,
              )}
            </ErrorInline>
          </div>
        )}
        <DataTableAdvanced
          data={shipments}
          isLoading={isLoading}
          rowKey={(s) => s.id}
          columns={columns}
          renderMobileCard={(s) => (
            <ShipmentMobileCard
              shipment={s}
              onConfirm={handleConfirm}
              onDelete={handleDelete}
              onExportPdf={handleExportPdf}
              onDeliveryConfirm={setDeliveryShipment}
              isConfirming={confirmMutation.isPending}
              isDeleting={deleteMutation.isPending}
              isExporting={exportPdfMutation.isPending}
            />
          )}
          emptyStateTitle={
            hasFilter
              ? MSG.EMPTY_STATE_FILTER_TITLE
              : MSG.EMPTY_STATE_DEFAULT_TITLE
          }
          emptyStateDescription={
            hasFilter
              ? MSG.EMPTY_STATE_FILTER_DESC
              : MSG.EMPTY_STATE_DEFAULT_DESC
          }
          emptyStateIcon={hasFilter ? 'Search' : 'Truck'}
          pagination={{
            result,
            onPageChange: setPage,
          }}
        />
      </TableSection>

      {/* Delivery confirm modal */}
      {deliveryShipment && (
        <DeliveryConfirmForm
          shipment={deliveryShipment}
          onClose={() => setDeliveryShipment(null)}
        />
      )}

      {/* Chat Drawer */}
      {chatShipment ? (
        <ChatDrawer
          open
          onClose={() => setChatShipment(null)}
          entityType="shipment"
          entityId={chatShipment.id}
          title={`Chat — ${chatShipment.shipment_number}`}
          subtitle={chatShipment.customers?.name ?? undefined}
        />
      ) : null}

      {/* Ad-hoc Shipment Form */}
      {showAdHocForm && (
        <Suspense fallback={null}>
          <AdHocShipmentForm onClose={() => setShowAdHocForm(false)} />
        </Suspense>
      )}
    </>
  );
}
