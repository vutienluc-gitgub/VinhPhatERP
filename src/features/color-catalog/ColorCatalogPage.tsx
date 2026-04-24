import { useState } from 'react';
import toast from 'react-hot-toast';

import { Button } from '@/shared/components';
import { AdaptiveSheet } from '@/shared/components/AdaptiveSheet';
import { Icon } from '@/shared/components/Icon';
import { TableSkeleton } from '@/shared/components/TableSkeleton';
import { EmptyState } from '@/shared/components/EmptyState';
import { getColorHex } from '@/schema/color.schema';
import type { ColorRow } from '@/schema/color.schema';
import { useColorMutations, useColors } from '@/application/color-catalog';
import { TabSwitcher, type TabItem } from '@/shared/components/TabSwitcher';

import { ColorForm } from './ColorForm';

export function ColorCatalogPage() {
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
    if (!window.confirm('Bạn có chắc chắn muốn xóa màu này?')) return;
    try {
      await deleteMutation.mutateAsync(code);
      toast.success('Đã xóa màu thành công');
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      toast.error('Lỗi khi xóa: ' + message);
    }
  };

  const list = colors ?? [];

  const tabItems: TabItem<'all' | 'dark' | 'middle' | 'light' | 'none'>[] = [
    {
      key: 'all' as const,
      label: 'Tất cả',
      badge: list.length,
    },
    {
      key: 'dark' as const,
      label: 'Đậm',
      badge: list.filter((c) => c.color_group === 'Màu Đậm').length,
    },
    {
      key: 'middle' as const,
      label: 'Trung',
      badge: list.filter((c) => c.color_group === 'Màu Trung').length,
    },
    {
      key: 'light' as const,
      label: 'Lợt',
      badge: list.filter((c) => c.color_group === 'Màu Lợt').length,
    },
    {
      key: 'none' as const,
      label: 'Khác',
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

  const groups = [
    {
      title: 'Màu Đậm',
      items: filteredItems.filter((c) => c.color_group === 'Màu Đậm'),
    },
    {
      title: 'Màu Trung',
      items: filteredItems.filter((c) => c.color_group === 'Màu Trung'),
    },
    {
      title: 'Màu Lợt',
      items: filteredItems.filter((c) => c.color_group === 'Màu Lợt'),
    },
    {
      title: 'Chưa phân nhóm',
      items: filteredItems.filter((c) => !c.color_group),
    },
  ].filter((g) => g.items.length > 0);

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Danh mục màu sắc</h1>
          <p className="page-subtitle">
            Quản lý bảng màu dùng chung cho toàn hệ thống sản xuất.
          </p>
        </div>
        <Button
          variant="primary"
          leftIcon="Plus"
          type="button"
          onClick={handleCreate}
        >
          Thêm màu
        </Button>
      </div>

      <div className="route-content">
        <div className="panel-card card-flush">
          {/* Tabs */}
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
                title="Chưa có màu sắc nào"
                description="Bấm Thêm màu để tạo màu mới dùng chung cho toàn hệ thống."
                actionLabel="Thêm màu đầu tiên"
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
                        if (e.key === 'Enter' || e.key === ' ')
                          handleEdit(item);
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
                          <span className="badge badge-info hidden md:inline-flex text-[0.68rem]">
                            {item.trend_year}
                          </span>
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
                          title="Chỉnh sửa"
                          onClick={() => handleEdit(item)}
                        >
                          <Icon name="Edit3" size={16} />
                        </button>
                        <button
                          type="button"
                          className="btn-icon danger"
                          title="Xóa màu"
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
              editingColor ? `Chỉnh sửa: ${editingColor.name}` : 'Thêm màu mới'
            }
          >
            <ColorForm initialData={editingColor} onClose={handleClose} />
          </AdaptiveSheet>
        </div>
      </div>
    </div>
  );
}
