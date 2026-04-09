import { useState } from 'react';

import { Icon } from '@/shared/components/Icon';

import type { YarnReceipt } from './types';
import { useYarnReceipt, useYarnReceiptList } from './useYarnReceipts';
import { YarnReceiptForm } from './YarnReceiptForm';
import { YarnReceiptList } from './YarnReceiptList';

export function YarnReceiptsPage() {
  const [editId, setEditId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  // Lấy dữ liệu phiếu chi tiết khi sửa
  const { data: editReceipt } = useYarnReceipt(editId ?? undefined);

  // Lấy dữ liệu danh sách để tính toán chỉ số KPI (đơn giản hóa)
  const { data: listResult } = useYarnReceiptList({}, 1);
  const receipts = listResult?.data ?? [];

  const totalWeight = receipts.reduce((acc, r: YarnReceipt) => {
    const itemWeight =
      r.yarn_receipt_items?.reduce(
        (sum: number, it) => sum + (Number(it.quantity) || 0),
        0,
      ) || 0;
    return acc + itemWeight;
  }, 0);

  const pendingCount = receipts.filter((r) => r.status === 'draft').length;

  function openCreate() {
    setEditId(null);
    setShowForm(true);
  }

  function openEdit(receipt: YarnReceipt) {
    setEditId(receipt.id);
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditId(null);
  }

  return (
    <div className="page-container p-4">
      {/* 📊 KPI Dashboard area */}
      <div className="kpi-grid mb-6">
        <div className="kpi-card-premium kpi-primary">
          <div className="kpi-overlay" />
          <div className="kpi-content">
            <div className="kpi-info">
              <p className="kpi-label">Tổng lượng sợi nhập</p>
              <p className="kpi-value">{totalWeight.toLocaleString()} kg</p>
            </div>
            <div className="kpi-icon-box">
              <Icon name="Package" size={32} />
            </div>
          </div>
          <div className="kpi-footer text-xs opacity-80 italic">
            Cập nhật trong tháng này
          </div>
        </div>

        <div className="kpi-card-premium kpi-warning">
          <div className="kpi-overlay" />
          <div className="kpi-content">
            <div className="kpi-info">
              <p className="kpi-label">Phiếu chờ xác nhận</p>
              <p className="kpi-value">{pendingCount}</p>
            </div>
            <div className="kpi-icon-box">
              <Icon name="Activity" size={32} />
            </div>
          </div>
          <div className="kpi-footer text-xs opacity-80 italic">
            Yêu cầu kiểm tra & xác nhận
          </div>
        </div>

        <div className="kpi-card-premium kpi-success">
          <div className="kpi-overlay" />
          <div className="kpi-content">
            <div className="kpi-info">
              <p className="kpi-label">Nhà cung cấp</p>
              <p className="kpi-value">
                {Array.from(new Set(receipts.map((r) => r.supplier_id))).length}
              </p>
            </div>
            <div className="kpi-icon-box">
              <Icon name="Users" size={32} />
            </div>
          </div>
          <div className="kpi-footer text-xs opacity-80 italic">
            Đối tác cung ứng hiện có
          </div>
        </div>
      </div>

      {/* 📑 Main List */}
      <YarnReceiptList onEdit={openEdit} onNew={openCreate} />

      {/* 📄 Detail Form */}
      {showForm && (
        <YarnReceiptForm
          receipt={
            editId && editReceipt
              ? (editReceipt as unknown as YarnReceipt)
              : null
          }
          onClose={closeForm}
        />
      )}
    </div>
  );
}
