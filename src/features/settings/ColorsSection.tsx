import { useState } from 'react';
import toast from 'react-hot-toast';

import { Button, Badge, EmptyState } from '@/shared/components';
import { AdaptiveSheet } from '@/shared/components/AdaptiveSheet';
import { Icon } from '@/shared/components/Icon';
import { TableSkeleton } from '@/shared/components/TableSkeleton';
import { getColorHex } from '@/schema/color.schema';
import type { ColorRow } from '@/schema/color.schema';
import { useColorMutations, useColors } from '@/application/settings';
import { TabSwitcher, type TabItem } from '@/shared/components/TabSwitcher';

import { SETTINGS_LABELS } from './settings.constants';
import { ColorForm } from './ColorForm';

export function ColorsSection() {
  const { data: colors, isLoading } = useColors();
  const { deleteMutation } = useColorMutations();
  const [editingColor, setEditingColor] = useState<ColorRow | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [activeTab, setActiveTab] = useState<
    'all' | 'dark' | 'middle' | 'light' | 'none'
  >('all');

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

  const handleDelete = async (code: string) => {
    if (!window.confirm(SETTINGS_LABELS.COLOR_DELETE_CONFIRM)) return;
    try {
      await deleteMutation.mutateAsync(code);
      toast.success(SETTINGS_LABELS.COLOR_DELETE_SUCCESS);
    } catch (error: unknown) {
      toast.error(
        `${SETTINGS_LABELS.COLOR_DELETE_ERROR} ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  };

  const list = colors ?? [];

  const tabItems: TabItem<'all' | 'dark' | 'middle' | 'light' | 'none'>[] = [
    {
      key: 'all' as const,
      label: SETTINGS_LABELS.COLOR_FILTER_ALL,
      badge: list.length,
    },
    {
      key: 'dark' as const,
      label: SETTINGS_LABELS.COLOR_FILTER_DARK,
      badge: list.filter(
        (c) => c.color_group === SETTINGS_LABELS.COLOR_GROUP_DARK,
      ).length,
    },
    {
      key: 'middle' as const,
      label: SETTINGS_LABELS.COLOR_FILTER_MID,
      badge: list.filter(
        (c) => c.color_group === SETTINGS_LABELS.COLOR_GROUP_MID,
      ).length,
    },
    {
      key: 'light' as const,
      label: SETTINGS_LABELS.COLOR_FILTER_LIGHT,
      badge: list.filter(
        (c) => c.color_group === SETTINGS_LABELS.COLOR_GROUP_LIGHT,
      ).length,
    },
    {
      key: 'none' as const,
      label: SETTINGS_LABELS.COLOR_FILTER_OTHER,
      badge: list.filter((c) => !c.color_group).length,
    },
  ].filter((t) => t.key === 'all' || (t.badge && t.badge > 0));

  const filteredItems = list.filter((c) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'dark')
      return c.color_group === SETTINGS_LABELS.COLOR_GROUP_DARK;
    if (activeTab === 'middle')
      return c.color_group === SETTINGS_LABELS.COLOR_GROUP_MID;
    if (activeTab === 'light')
      return c.color_group === SETTINGS_LABELS.COLOR_GROUP_LIGHT;
    if (activeTab === 'none') return !c.color_group;
    return true;
  });

  const groups = [
    {
      title: SETTINGS_LABELS.COLOR_GROUP_DARK,
      items: filteredItems.filter(
        (c) => c.color_group === SETTINGS_LABELS.COLOR_GROUP_DARK,
      ),
    },
    {
      title: SETTINGS_LABELS.COLOR_GROUP_MID,
      items: filteredItems.filter(
        (c) => c.color_group === SETTINGS_LABELS.COLOR_GROUP_MID,
      ),
    },
    {
      title: SETTINGS_LABELS.COLOR_GROUP_LIGHT,
      items: filteredItems.filter(
        (c) => c.color_group === SETTINGS_LABELS.COLOR_GROUP_LIGHT,
      ),
    },
    {
      title: SETTINGS_LABELS.COLOR_GROUP_UNGROUPED,
      items: filteredItems.filter(
        (c) =>
          c.color_group !== SETTINGS_LABELS.COLOR_GROUP_DARK &&
          c.color_group !== SETTINGS_LABELS.COLOR_GROUP_MID &&
          c.color_group !== SETTINGS_LABELS.COLOR_GROUP_LIGHT,
      ),
    },
  ].filter((g) => g.items.length > 0);
  return (
    <div className="panel-card card-flush">
      {/* Header */}
      <div className="card-header-area">
        <span className="font-bold text-lg">{SETTINGS_LABELS.COLOR_TITLE}</span>
        <Button
          variant="primary"
          leftIcon="Plus"
          type="button"
          onClick={handleCreate}
        >
          Thêm màu
        </Button>
      </div>

      {/* Content */}
      <div className="px-4 py-2 border-b border-border bg-surface-subtle">
        <TabSwitcher
          tabs={tabItems}
          active={activeTab}
          onChange={setActiveTab}
          variant="pill"
        />
      </div>

      {isLoading ? (
        <TableSkeleton rows={6} columns={3} />
      ) : list.length === 0 ? (
        <div className="py-16">
          <EmptyState
            icon="Palette"
            title={SETTINGS_LABELS.COLOR_EMPTY_TITLE}
            description={SETTINGS_LABELS.COLOR_EMPTY_DESC}
            actionLabel={SETTINGS_LABELS.COLOR_EMPTY_ACTION}
            actionClick={handleCreate}
          />
        </div>
      ) : (
        <div>
          {/* Desktop header row */}
          <div className="hidden md:grid grid-cols-[100px_1fr_auto_auto] px-5 py-2 border-b border-border bg-[rgba(16,35,61,0.03)]">
            <span className="text-[0.72rem] font-bold uppercase tracking-[0.08em] text-[var(--muted)]">
              Mã
            </span>
            <span className="text-[0.72rem] font-bold uppercase tracking-[0.08em] text-[var(--muted)]">
              Tên màu
            </span>
            <span className="text-[0.72rem] font-bold uppercase tracking-[0.08em] text-[var(--muted)] w-28 text-center">
              Xu hướng
            </span>
            <span className="w-20" />
          </div>

          {/* Groups & Rows */}
          {groups.map((group) => (
            <div key={group.title}>
              {/* Group Header */}
              <div className="px-5 py-3 bg-[var(--surface)] border-b border-border font-bold text-[0.85rem] text-[var(--primary)]">
                {group.title}
              </div>

              {group.items.map((item) => (
                <div
                  key={item.code}
                  role="button"
                  tabIndex={0}
                  onClick={() => handleEdit(item)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') handleEdit(item);
                  }}
                  className="color-row grid grid-cols-[1fr_auto] items-center px-5 py-[0.65rem] border-b border-border cursor-pointer min-h-[48px] transition-colors"
                >
                  {/* Left: code + name */}
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Color preview dot */}
                    <span
                      title={getColorHex(item.code)}
                      className="inline-block w-4 h-4 min-w-[16px] rounded-full border-[1.5px] border-border shrink-0"
                      style={{ background: getColorHex(item.code) }}
                    />
                    <span className="font-mono text-xs font-bold text-[var(--primary)] whitespace-nowrap min-w-[4.5rem]">
                      {item.code}
                    </span>
                    <span className="font-medium text-[var(--text)] overflow-hidden text-ellipsis whitespace-nowrap">
                      {item.name}
                    </span>
                    {item.trend_year && (
                      <Badge
                        variant="info"
                        className="hidden md:inline-flex text-[0.68rem]"
                      >
                        {item.trend_year}
                      </Badge>
                    )}
                  </div>

                  {/* Right: actions */}
                  <div
                    className="flex gap-1 shrink-0"
                    onClick={(e) => e.stopPropagation()}
                    onKeyDown={(e) => e.stopPropagation()}
                    role="presentation"
                  >
                    <button
                      type="button"
                      className="btn-icon"
                      title={SETTINGS_LABELS.COLOR_EDIT_TOOLTIP}
                      onClick={() => handleEdit(item)}
                    >
                      <Icon name="Edit3" size={16} />
                    </button>
                    <button
                      type="button"
                      className="btn-icon danger"
                      title={SETTINGS_LABELS.COLOR_DELETE_TOOLTIP}
                      disabled={deleteMutation.isPending}
                      onClick={() => handleDelete(item.code)}
                    >
                      <Icon name="Trash2" size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      <AdaptiveSheet
        open={showForm}
        onClose={handleClose}
        title={
          editingColor
            ? `${SETTINGS_LABELS.COLOR_MODAL_EDIT} ${editingColor.name}`
            : SETTINGS_LABELS.COLOR_MODAL_NEW
        }
      >
        <ColorForm initialData={editingColor} onClose={handleClose} />
      </AdaptiveSheet>
    </div>
  );
}
