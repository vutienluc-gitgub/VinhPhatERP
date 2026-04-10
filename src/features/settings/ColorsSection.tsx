import { useState } from 'react';
import toast from 'react-hot-toast';

import { AdaptiveSheet } from '@/shared/components/AdaptiveSheet';
import { Icon } from '@/shared/components/Icon';
import { TableSkeleton } from '@/shared/components/TableSkeleton';
import { EmptyState } from '@/shared/components/EmptyState';
import { getColorHex } from '@/schema/color.schema';
import type { ColorRow } from '@/schema/color.schema';

import { ColorForm } from './ColorForm';
import { useColorMutations, useColors } from './hooks/useColors';

export function ColorsSection() {
  const { data: colors, isLoading } = useColors();
  const { deleteMutation } = useColorMutations();
  const [editingColor, setEditingColor] = useState<ColorRow | null>(null);
  const [showForm, setShowForm] = useState(false);

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
      toast.error('Lỗi khi xóa: ' + (error as Error).message);
    }
  };

  const list = colors ?? [];

  const groups = [
    {
      title: 'Màu Đậm',
      items: list.filter((c) => c.color_group === 'Màu Đậm'),
    },
    {
      title: 'Màu Trung',
      items: list.filter((c) => c.color_group === 'Màu Trung'),
    },
    {
      title: 'Màu Lợt',
      items: list.filter((c) => c.color_group === 'Màu Lợt'),
    },
    {
      title: 'Chưa phân nhóm',
      items: list.filter((c) => !c.color_group),
    },
  ].filter((g) => g.items.length > 0);
  return (
    <div className="panel-card card-flush">
      {/* Header */}
      <div className="card-header-premium">
        <div>
          <p className="eyebrow-premium">Cài đặt hệ thống</p>
          <h3 className="title-premium">Danh mục màu sắc</h3>
        </div>
        <button className="btn-primary" type="button" onClick={handleCreate}>
          <Icon name="Plus" size={18} />
          Thêm màu
        </button>
      </div>

      {/* Content */}
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
          <div
            className="hidden md:grid"
            style={{
              gridTemplateColumns: '100px 1fr auto auto',
              padding: '0.5rem 1.25rem',
              borderBottom: '1px solid var(--border)',
              background: 'rgba(16,35,61,0.03)',
            }}
          >
            <span
              style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: 'var(--muted)',
              }}
            >
              Mã
            </span>
            <span
              style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: 'var(--muted)',
              }}
            >
              Tên màu
            </span>
            <span
              style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: 'var(--muted)',
                width: '7rem',
                textAlign: 'center',
              }}
            >
              Xu hướng
            </span>
            <span style={{ width: '5rem' }} />
          </div>

          {/* Groups & Rows */}
          {groups.map((group) => (
            <div key={group.title}>
              {/* Group Header */}
              <div
                style={{
                  padding: '0.75rem 1.25rem',
                  backgroundColor: 'var(--surface)',
                  borderBottom: '1px solid var(--border)',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  color: 'var(--primary)',
                }}
              >
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
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr auto',
                    alignItems: 'center',
                    padding: '0.65rem 1.25rem',
                    borderBottom: '1px solid var(--border)',
                    cursor: 'pointer',
                    transition: 'background 0.12s ease',
                    minHeight: '48px',
                  }}
                  className="color-row"
                >
                  {/* Left: code + name */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      minWidth: 0,
                    }}
                  >
                    {/* Color preview dot */}
                    <span
                      title={getColorHex(item.code)}
                      style={{
                        display: 'inline-block',
                        width: '16px',
                        height: '16px',
                        minWidth: '16px',
                        borderRadius: '50%',
                        background: getColorHex(item.code),
                        border: '1.5px solid var(--border)',
                        flexShrink: 0,
                      }}
                    />
                    <span
                      style={{
                        fontFamily: 'monospace',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        color: 'var(--primary)',
                        whiteSpace: 'nowrap',
                        minWidth: '4.5rem',
                      }}
                    >
                      {item.code}
                    </span>
                    <span
                      style={{
                        fontWeight: 500,
                        color: 'var(--text)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {item.name}
                    </span>
                    {item.trend_year && (
                      <span
                        className="badge badge-info hidden md:inline-flex"
                        style={{
                          fontSize: '0.68rem',
                        }}
                      >
                        {item.trend_year}
                      </span>
                    )}
                  </div>

                  {/* Right: actions */}
                  <div
                    style={{
                      display: 'flex',
                      gap: '0.25rem',
                      flexShrink: 0,
                    }}
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
  );
}
