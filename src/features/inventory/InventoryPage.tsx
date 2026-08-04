import { useState } from 'react';

import {
  Icon,
  Badge,
  DataTable,
  TabSwitcher,
  PageLayout,
  PageHeader,
  KpiCard,
  ErrorInline,
} from '@/shared/components';
import { formatQuantity } from '@/shared/value/core/formatter';
import {
  useRawFabricInventory,
  useFinishedFabricInventory,
  useYarnInventory,
  useAgingStock,
} from '@/application/inventory';
import type { InventoryBreakdownRow, AgingRoll } from '@/application/inventory';
import type { YarnAvailability } from '@/api/yarn-reservation.api';
import { useContextualGuide } from '@/features/guide-system/hooks/useContextualGuide';
import { ContextualGuide } from '@/features/guide-system/components/ContextualGuide';

import { InventoryDataGrid } from './components/InventoryDataGrid';
import {
  useYarnInventoryColumns,
  YarnInventoryMobileCard,
} from './components/YarnInventoryColumns';
import { YarnStockLedgerModal } from './components/YarnStockLedgerModal';
import { InventoryAdjustmentModal } from './components/InventoryAdjustmentModal';
import { InventoryAdjustmentHistory } from './components/InventoryAdjustmentHistory';
import {
  useAgingColumns,
  useBreakdownColumns,
} from './hooks/useInventoryColumns';
import {
  AgingMobileCard,
  BreakdownMobileCard,
} from './components/InventoryMobileCard';
import { INVENTORY_MESSAGES as MSG } from './inventory.constants';

type InventoryTab = 'yarn' | 'raw' | 'finished' | 'aging' | 'history';

const INVENTORY_TABS: { key: InventoryTab; label: string }[] = [
  { key: 'yarn', label: MSG.TAB_YARN },
  { key: 'raw', label: MSG.TAB_RAW },
  { key: 'finished', label: MSG.TAB_FINISHED },
  { key: 'aging', label: MSG.TAB_AGING },
  { key: 'history', label: MSG.TAB_HISTORY },
];

function InventoryBreakdownTabs({
  yarnData,
  yarnLoading,
  rawData,
  rawLoading,
  finishedData,
  finishedLoading,
  agingRolls,
  agingLoading,
  agingError,
  criticalCount,
  warningCount,
  onYarnCodeClick,
}: {
  yarnData: YarnAvailability[];
  yarnLoading: boolean;
  rawData: InventoryBreakdownRow[];
  rawLoading: boolean;
  finishedData: InventoryBreakdownRow[];
  finishedLoading: boolean;
  agingRolls: AgingRoll[];
  agingLoading: boolean;
  agingError: Error | null;
  criticalCount: number;
  warningCount: number;
  onYarnCodeClick?: (yarn: YarnAvailability) => void;
}) {
  const [activeTab, setActiveTab] = useState<InventoryTab>('yarn');
  const agingColumns = useAgingColumns();
  const breakdownColumns = useBreakdownColumns();
  const yarnColumns = useYarnInventoryColumns(onYarnCodeClick);

  const tabs = INVENTORY_TABS.map((t) => {
    let badge = 0;
    if (t.key === 'yarn') badge = yarnData.length;
    else if (t.key === 'raw') badge = rawData.length;
    else if (t.key === 'finished') badge = finishedData.length;
    else if (t.key === 'aging') badge = agingRolls.length;
    return { ...t, badge };
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full">
        <TabSwitcher
          tabs={tabs}
          active={activeTab}
          onChange={(val) => setActiveTab(val as InventoryTab)}
        />

        {activeTab === 'aging' && agingRolls.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            {criticalCount > 0 && (
              <Badge variant="danger" className="text-[10px]">
                {criticalCount} {MSG.BADGE_CRITICAL}
              </Badge>
            )}
            {warningCount > 0 && (
              <Badge variant="warning" className="text-[10px]">
                {warningCount} {MSG.BADGE_WARNING}
              </Badge>
            )}
          </div>
        )}
      </div>

      {activeTab === 'yarn' && (
        <InventoryDataGrid
          title=""
          data={yarnData}
          columns={yarnColumns}
          isLoading={yarnLoading}
          rowKey={(r) => r.id}
          emptyStateTitle={MSG.EMPTY_YARN_TITLE}
          renderMobileCard={(r) => (
            <YarnInventoryMobileCard row={r} onCodeClick={onYarnCodeClick} />
          )}
        />
      )}

      {activeTab === 'raw' && (
        <InventoryDataGrid
          title=""
          data={rawData}
          columns={breakdownColumns}
          isLoading={rawLoading}
          rowKey={(r) =>
            `${r.fabric_type ?? 'none'}-${r.color_name ?? 'none'}-${r.quality_grade ?? 'none'}`
          }
          renderMobileCard={(r) => <BreakdownMobileCard row={r} />}
        />
      )}

      {activeTab === 'finished' && (
        <InventoryDataGrid
          title=""
          data={finishedData}
          columns={breakdownColumns}
          isLoading={finishedLoading}
          rowKey={(r) =>
            `${r.fabric_type ?? 'none'}-${r.color_name ?? 'none'}-${r.quality_grade ?? 'none'}`
          }
          renderMobileCard={(r) => <BreakdownMobileCard row={r} />}
        />
      )}

      {activeTab === 'aging' && (
        <>
          {agingError ? (
            <ErrorInline>
              {MSG.ERR_LOAD_AGING}{' '}
              {agingError instanceof Error
                ? agingError.message
                : String(agingError)}
            </ErrorInline>
          ) : (
            <DataTable
              data={agingRolls}
              columns={agingColumns}
              isLoading={agingLoading}
              rowKey={(r) => r.id}
              emptyStateTitle={MSG.EMPTY_AGING_TITLE}
              emptyStateDescription={MSG.EMPTY_AGING_DESC}
              emptyStateIcon="CheckCircle"
              renderMobileCard={(r) => <AgingMobileCard roll={r} />}
            />
          )}
        </>
      )}

      {activeTab === 'history' && <InventoryAdjustmentHistory />}
    </div>
  );
}

export function InventoryPage() {
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [selectedYarnForLedger, setSelectedYarnForLedger] =
    useState<YarnAvailability | null>(null);

  const rawQuery = useRawFabricInventory();
  const finishedQuery = useFinishedFabricInventory();
  const yarnQuery = useYarnInventory();
  const agingQuery = useAgingStock();
  const { activeGuides } = useContextualGuide('Inventory');

  const hasError = rawQuery.error ?? finishedQuery.error ?? yarnQuery.error;

  const rawStats = rawQuery.data?.stats;
  const finishedStats = finishedQuery.data?.stats;
  const yarnStats = yarnQuery.data?.stats;

  const agingRolls = agingQuery.data?.rolls ?? [];
  const criticalCount = agingQuery.data?.stats.criticalCount ?? 0;
  const warningCount = agingQuery.data?.stats.warningCount ?? 0;

  return (
    <PageLayout>
      {activeGuides.length > 0 && (
        <ContextualGuide activeGuides={activeGuides} />
      )}

      <PageHeader
        title={MSG.PAGE_TITLE}
        subtitle={MSG.PAGE_SUBTITLE}
        actions={
          <button
            type="button"
            className="btn-primary flex items-center gap-2"
            onClick={() => setIsAdjustModalOpen(true)}
          >
            <Icon name="Settings2" size={16} />
            {MSG.BTN_ADJUSTMENT}
          </button>
        }
      />

      <div className="flex flex-col gap-6 w-full">
        {hasError && (
          <ErrorInline>
            {MSG.ERR_DATA_LOAD}{' '}
            {hasError instanceof Error ? hasError.message : String(hasError)}
          </ErrorInline>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <KpiCard
            label={MSG.LBL_YARN_IN_STOCK}
            value={yarnStats?.totalAvailableKg ?? 0}
            icon="Box"
            variant="primary"
            formatMode="number"
            isLoading={yarnQuery.isLoading}
          />
          <KpiCard
            label={MSG.LBL_RAW_ROLLS}
            value={rawStats?.totalRolls ?? 0}
            footer={`${MSG.LBL_RAW_LENGTH}: ${formatQuantity(rawStats?.totalLengthM ?? 0)} m`}
            icon="Layers"
            variant="success"
            formatMode="number"
            isLoading={rawQuery.isLoading}
          />
          <KpiCard
            label={MSG.LBL_FIN_ROLLS}
            value={finishedStats?.totalRolls ?? 0}
            footer={`${MSG.LBL_FIN_LENGTH}: ${formatQuantity(finishedStats?.totalLengthM ?? 0)} m`}
            icon="Package"
            variant="primary"
            formatMode="number"
            isLoading={finishedQuery.isLoading}
          />
        </div>

        {!hasError && (
          <InventoryBreakdownTabs
            yarnData={yarnQuery.data?.breakdownList ?? []}
            yarnLoading={yarnQuery.isLoading}
            rawData={rawQuery.data?.breakdown ?? []}
            rawLoading={rawQuery.isLoading}
            finishedData={finishedQuery.data?.breakdown ?? []}
            finishedLoading={finishedQuery.isLoading}
            agingRolls={agingRolls}
            agingLoading={agingQuery.isLoading}
            agingError={agingQuery.error}
            criticalCount={criticalCount}
            warningCount={warningCount}
            onYarnCodeClick={setSelectedYarnForLedger}
          />
        )}
      </div>

      <InventoryAdjustmentModal
        isOpen={isAdjustModalOpen}
        onClose={() => setIsAdjustModalOpen(false)}
      />

      <YarnStockLedgerModal
        yarn={selectedYarnForLedger}
        isOpen={!!selectedYarnForLedger}
        onClose={() => setSelectedYarnForLedger(null)}
      />
    </PageLayout>
  );
}
