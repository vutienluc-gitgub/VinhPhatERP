import { useState } from 'react';

import { Icon } from '@/shared/components/Icon';
import { useYarnCatalogList } from '@/application/settings';

import type { YarnCatalog } from './types';
import { YarnCatalogForm } from './YarnCatalogForm';
import { YarnCatalogList } from './YarnCatalogList';

export function YarnCatalogPage() {
  const [editItem, setEditItem] = useState<YarnCatalog | null>(null);
  const [showForm, setShowForm] = useState(false);

  // Lấy dữ liệu danh sách để tính KPI
  const { data: listResult } = useYarnCatalogList({}, 1);
  const items = listResult?.data ?? [];

  function openCreate() {
    setEditItem(null);
    setShowForm(true);
  }

  function openEdit(catalog: YarnCatalog) {
    setEditItem(catalog);
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditItem(null);
  }

  return (
    <div className="page-container p-4">
      {/* 📊 KPI Dashboard area */}
      <div className="kpi-grid mb-6">
        <div className="kpi-card-premium kpi-primary">
          <div className="kpi-overlay" />
          <div className="kpi-content">
            <div className="kpi-info">
              <p className="kpi-label">Tổng mã sợi</p>
              <p className="kpi-value">{items.length}</p>
            </div>
            <div className="kpi-icon-box">
              <Icon name="Layers" size={32} />
            </div>
          </div>
          <div className="kpi-footer text-xs opacity-80 italic">
            Trong danh mục hệ thống
          </div>
        </div>

        <div className="kpi-card-premium kpi-success">
          <div className="kpi-overlay" />
          <div className="kpi-content">
            <div className="kpi-info">
              <p className="kpi-label">Màu sắc</p>
              <p className="kpi-value">
                {
                  Array.from(new Set(items.map((i) => i.color_name))).filter(
                    Boolean,
                  ).length
                }
              </p>
            </div>
            <div className="kpi-icon-box">
              <Icon name="Palette" size={32} />
            </div>
          </div>
          <div className="kpi-footer text-xs opacity-80 italic">
            Đa dạng phân loại màu
          </div>
        </div>

        <div className="kpi-card-premium kpi-secondary">
          <div className="kpi-overlay" />
          <div className="kpi-content">
            <div className="kpi-info">
              <p className="kpi-label">Đang hoạt động</p>
              <p className="kpi-value">
                {items.filter((i) => i.status === 'active').length}
              </p>
            </div>
            <div className="kpi-icon-box">
              <Icon name="CheckCircle" size={32} />
            </div>
          </div>
          <div className="kpi-footer text-xs opacity-80 italic">
            Sẵn dụng cho nghiệp vụ
          </div>
        </div>
      </div>

      <YarnCatalogList onEdit={openEdit} onNew={openCreate} />
      {showForm && <YarnCatalogForm catalog={editItem} onClose={closeForm} />}
    </div>
  );
}
