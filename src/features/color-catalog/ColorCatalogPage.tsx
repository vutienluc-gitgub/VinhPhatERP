import { useState } from 'react';

import {
  AddButton,
  DataTableAdvanced,
  PageLayout,
  PageHeader,
  TableSection,
} from '@/shared/components';
import { AdaptiveSheet } from '@/shared/components/AdaptiveSheet';
import type { ColorRow } from '@/schema/color.schema';
import { useColors } from '@/application/color-catalog';
import { TabSwitcher, type TabItem } from '@/shared/components/TabSwitcher';

import { ColorForm } from './ColorForm';
import { useColorColumns } from './hooks/useColorColumns';
import { ColorMobileCard } from './components/ColorMobileCard';
import { COLOR_CATALOG_MESSAGES as MSG } from './color-catalog.constants';

type ColorTab = 'all' | 'dark' | 'middle' | 'light' | 'none';

export function ColorCatalogPage() {
  const { data: colors, isLoading } = useColors();

  const [editingColor, setEditingColor] = useState<ColorRow | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [activeTab, setActiveTab] = useState<ColorTab>('all');

  const handleCreate = () => {
    setEditingColor(null);
    setShowForm(true);
  };

  const handleEdit = (color: ColorRow) => {
    setEditingColor(color);
    setShowForm(true);
  };

  const handleClose = () => {
    setShowForm(false);
    setEditingColor(null);
  };

  const list = colors ?? [];

  const tabItems: TabItem<ColorTab>[] = [
    {
      key: 'all' as ColorTab,
      label: MSG.TAB_ALL,
      badge: list.length,
    },
    {
      key: 'dark' as ColorTab,
      label: MSG.TAB_DARK,
      badge: list.filter((c) => c.color_group === 'Màu Đậm').length,
    },
    {
      key: 'middle' as ColorTab,
      label: MSG.TAB_MIDDLE,
      badge: list.filter((c) => c.color_group === 'Màu Trung').length,
    },
    {
      key: 'light' as ColorTab,
      label: MSG.TAB_LIGHT,
      badge: list.filter((c) => c.color_group === 'Màu Lợt').length,
    },
    {
      key: 'none' as ColorTab,
      label: MSG.TAB_NONE,
      badge: list.filter((c) => !c.color_group).length,
    },
  ].filter((t) => t.key === 'all' || (t.badge && t.badge > 0));

  const filteredItems = list.filter((c) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'dark') return c.color_group === 'Màu Đậm';
    if (activeTab === 'middle') return c.color_group === 'Màu Trung';
    if (activeTab === 'light') return c.color_group === 'Màu Lợt';
    if (activeTab === 'none') return !c.color_group;
    return true;
  });

  const columns = useColorColumns();

  return (
    <PageLayout>
      <PageHeader
        title={MSG.PAGE_TITLE}
        subtitle={MSG.PAGE_SUBTITLE}
        actions={<AddButton onClick={handleCreate} label={MSG.BTN_ADD} />}
      />

      <div className="w-full">
        <div className="panel-card card-flush">
          {/* Tabs */}
          <div className="px-4">
            <TabSwitcher
              tabs={tabItems}
              active={activeTab}
              onChange={(val) => setActiveTab(val as ColorTab)}
            />
          </div>

          <TableSection>
            <DataTableAdvanced
              data={filteredItems}
              columns={columns}
              isLoading={isLoading}
              rowKey={(row) => row.code}
              onRowClick={handleEdit}
              emptyStateTitle={MSG.EMPTY_TITLE}
              emptyStateDescription={MSG.EMPTY_DESC}
              emptyStateIcon="Palette"
              renderMobileCard={(row: ColorRow) => (
                <ColorMobileCard color={row} onClick={() => handleEdit(row)} />
              )}
            />
          </TableSection>

          <AdaptiveSheet
            open={showForm}
            onClose={handleClose}
            title={
              editingColor
                ? `${MSG.BTN_CREATE}: ${editingColor.name}`
                : MSG.BTN_ADD
            }
          >
            <ColorForm initialData={editingColor} onClose={handleClose} />
          </AdaptiveSheet>
        </div>
      </div>
    </PageLayout>
  );
}
