import os

path = 'src/features/purchase-orders/PODetailPage.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Imports
content = content.replace(
    "import { Badge, Button } from '@/shared/components';",
    "import { Badge, Button, Icon } from '@/shared/components';"
)

# 2. Add POTimeline
timeline_code = """
function POTimeline({ status }: { status: string }) {
  const steps = [
    { id: 'draft', label: 'Nháp (Draft)' },
    { id: 'approved', label: 'Đã duyệt' },
    { id: 'partial_received', label: 'Nhập kho 1 phần' },
    { id: 'completed', label: 'Hoàn tất' },
  ];

  if (status === 'rejected') {
    return (
      <div className="flex items-center gap-4 py-4 px-6 bg-red-50 border border-red-200 rounded-xl shadow-sm mb-6 text-red-700">
        <Icon name="XCircle" size={24} className="text-red-500" />
        <span className="font-semibold text-lg">Đã từ chối (Rejected)</span>
      </div>
    );
  }
  if (status === 'cancelled') {
    return (
      <div className="flex items-center gap-4 py-4 px-6 bg-gray-50 border border-gray-200 rounded-xl shadow-sm mb-6 text-gray-700">
        <Icon name="Slash" size={24} className="text-gray-500" />
        <span className="font-semibold text-lg">Đã hủy (Cancelled)</span>
      </div>
    );
  }

  let currentIndex = steps.findIndex((s) => s.id === status);
  if (currentIndex === -1) currentIndex = 0;

  return (
    <div className="bg-surface border border-border rounded-xl p-6 shadow-sm mb-6">
      <h3 className="font-semibold text-lg border-b border-border pb-3 mb-8 m-0">
        Tiến trình xử lý (Lifecycle)
      </h3>
      <div className="flex items-center justify-between relative px-2">
        <div className="absolute left-10 right-10 top-5 h-1.5 bg-gray-100 -z-10 rounded-full"></div>
        <div 
          className="absolute left-10 top-5 h-1.5 bg-primary -z-10 transition-all duration-500 rounded-full"
          style={{ width: `calc(${(currentIndex / (steps.length - 1)) * 100}% - 5rem)` }}
        ></div>
        {steps.map((step, index) => {
          const isCompleted = index <= currentIndex;
          const isCurrent = index === currentIndex;
          return (
            <div key={step.id} className="flex flex-col items-center gap-3 bg-surface px-4">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors ${isCompleted ? 'bg-primary border-primary text-white shadow-md' : 'bg-surface border-gray-200 text-gray-400'}`}>
                {isCompleted ? <Icon name="Check" size={20} /> : index + 1}
              </div>
              <span className={`text-sm font-semibold ${isCurrent ? 'text-primary' : isCompleted ? 'text-gray-800' : 'text-gray-400'}`}>
                {step.label}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  );
}

export function PODetailPage() {"""
content = content.replace('export function PODetailPage() {', timeline_code)

# 3. Insert POTimeline into render
content = content.replace(
    '<div className="grid grid-cols-1 md:grid-cols-2 gap-6">',
    '<POTimeline status={po.status} />\n\n      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">'
)

# 4. Update "Thông tin chung"
old_info_chunk = """<div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted">Ngày đặt:</span>
              <span className="font-medium">
                {dayjs(po.order_date).format('DD/MM/YYYY')}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Ngày dự kiến giao:</span>
              <span className="font-medium">
                {po.expected_date
                  ? dayjs(po.expected_date).format('DD/MM/YYYY')
                  : '---'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Tổng tiền:</span>
              <span className="font-medium text-primary text-lg">
                {formatCurrency(po.total_amount)} đ
              </span>
            </div>
            {po.status === 'rejected' && po.rejection_reason && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
                <span className="font-bold">Lý do từ chối:</span>{' '}
                {po.rejection_reason}
              </div>
            )}
          </div>"""

new_info_chunk = """<div className="grid grid-cols-2 gap-y-4 gap-x-6">
            <div className="flex flex-col">
              <span className="text-xs text-muted">Ngày đặt</span>
              <span className="font-medium text-sm mt-1">
                {dayjs(po.order_date).format('DD/MM/YYYY')}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-muted">Ngày dự kiến giao</span>
              <span className="font-medium text-sm mt-1">
                {po.expected_date
                  ? dayjs(po.expected_date).format('DD/MM/YYYY')
                  : 'Chưa cập nhật'}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-muted">Trạng thái</span>
              <span className="font-medium text-sm mt-1 capitalize">
                {po.status}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-muted">Người tạo</span>
              <span className="font-medium text-sm mt-1">
                {po.created_by || 'Hệ thống'}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-muted">Điều khoản TT</span>
              <span className="font-medium text-sm mt-1">
                {po.payment_terms || 'Không có'}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-muted">NCC Ref</span>
              <span className="font-medium text-sm mt-1">
                {po.supplier_ref || 'Không có'}
              </span>
            </div>
            
            <div className="col-span-2 mt-2 pt-4 border-t border-border flex justify-between items-center">
              <span className="text-muted font-medium">Tổng tiền:</span>
              <span className="font-bold text-primary text-2xl bg-primary/10 px-4 py-1.5 rounded-lg">
                {formatCurrency(po.total_amount)} đ
              </span>
            </div>
            
            {po.status === 'rejected' && po.rejection_reason && (
              <div className="col-span-2 mt-2 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
                <span className="font-bold">Lý do từ chối:</span>{' '}
                {po.rejection_reason}
              </div>
            )}
          </div>"""

content = content.replace(old_info_chunk, new_info_chunk)

# 5. Update "Thao tác"
old_actions_chunk = """          <div className="flex flex-wrap gap-3">
            {po.status === 'draft' &&
              (user?.role === 'admin' || user?.role === 'manager') && (
                <>
                  <Button
                    variant="primary"
                    isLoading={approveMutation.isPending}
                    onClick={handleApprove}
                  >
                    Duyệt PO
                  </Button>
                  <Button
                    variant="danger"
                    onClick={() => setShowRejectModal(true)}
                  >
                    Từ chối
                  </Button>
                </>
              )}
            {(po.status === 'approved' || po.status === 'partial_received') &&
              (user?.role === 'admin' ||
                user?.role === 'manager' ||
                user?.role === 'staff') && (
                <Button variant="primary" onClick={() => setShowGrForm(true)}>
                  + Nhập kho (Goods Receipt)
                </Button>
              )}
          </div>"""

new_actions_chunk = """          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" className="w-full justify-center">
                <Icon name="Printer" size={16} className="mr-2" /> In PO
              </Button>
              <Button variant="outline" className="w-full justify-center">
                <Icon name="Download" size={16} className="mr-2" /> Xuất PDF
              </Button>
            </div>
            
            {po.status === 'draft' &&
              (user?.role === 'admin' || user?.role === 'manager') && (
                <div className="grid grid-cols-2 gap-3 mt-1">
                  <Button
                    variant="primary"
                    isLoading={approveMutation.isPending}
                    onClick={handleApprove}
                    className="w-full justify-center"
                  >
                    <Icon name="Check" size={16} className="mr-2" /> Duyệt PO
                  </Button>
                  <Button
                    variant="danger"
                    onClick={() => setShowRejectModal(true)}
                    className="w-full justify-center"
                  >
                    <Icon name="XCircle" size={16} className="mr-2" /> Hủy/Từ chối
                  </Button>
                </div>
              )}
            {(po.status === 'approved' || po.status === 'partial_received') &&
              (user?.role === 'admin' ||
                user?.role === 'manager' ||
                user?.role === 'staff') && (
                <div className="mt-1 pt-3 border-t border-border">
                  <Button variant="primary" className="w-full justify-center py-2" onClick={() => setShowGrForm(true)}>
                    <Icon name="Plus" size={16} className="mr-2" /> Tạo phiếu nhập kho (GR)
                  </Button>
                </div>
              )}
          </div>"""

content = content.replace(old_actions_chunk, new_actions_chunk)

# 6. Update headers
content = content.replace('<th className="p-3">Nguyên liệu</th>', '<th className="px-4 py-3 font-semibold w-[25%]">Nguyên liệu</th>')
content = content.replace('<th className="p-3 text-right">Đơn giá</th>', '<th className="px-4 py-3 font-semibold text-right">Đơn giá</th>')
content = content.replace('<th className="p-3 text-right">SL Đặt</th>', '<th className="px-4 py-3 font-semibold text-right">SL Đặt</th>')
content = content.replace('<th className="p-3 text-right">Đã nhận</th>', '<th className="px-4 py-3 font-semibold text-right">Đã nhận</th>')
content = content.replace('<th className="p-3 text-right">Còn lại</th>', '<th className="px-4 py-3 font-semibold text-right">Còn lại</th>')
content = content.replace('<th className="p-3 text-center">Tiến độ</th>', '<th className="px-4 py-3 font-semibold text-right w-[150px]">Tiến độ</th>')

# 7. Update cells and progress bar
old_cells_chunk = """                    <td className="p-3 font-medium">{item.material_id}</td>
                    <td className="p-3 text-right">
                      {formatCurrency(item.unit_price)} đ
                    </td>
                    <td className="p-3 text-right">
                      {item.ordered_qty} {item.uom}
                    </td>
                    <td className="p-3 text-right text-green-600 font-medium">
                      {item.received_qty} {item.uom}
                    </td>
                    <td className="p-3 text-right text-orange-600 font-medium">
                      {item.remaining_qty} {item.uom}
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-2 justify-end">
                        <div className="w-16 h-2 bg-gray-200 rounded overflow-hidden">
                          <div
                            className={`h-full ${percent >= 100 ? 'bg-green-500' : 'bg-orange-400'}`}
                            style={{ width: `${Math.min(100, percent)}%` }}
                          />
                        </div>
                        <span className="text-xs w-8 text-right">
                          {percent}%
                        </span>
                      </div>
                    </td>"""

new_cells_chunk = """                    <td className="px-4 py-3 font-medium text-gray-800">{item.material_id}</td>
                    <td className="px-4 py-3 text-right">
                      {formatCurrency(item.unit_price)} đ
                    </td>
                    <td className="px-4 py-3 text-right">
                      {item.ordered_qty} {item.uom}
                    </td>
                    <td className="px-4 py-3 text-right text-emerald-600 font-semibold">
                      {item.received_qty} {item.uom}
                    </td>
                    <td className="px-4 py-3 text-right text-amber-600 font-semibold">
                      {item.remaining_qty} {item.uom}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1.5 items-end">
                        <span className="text-xs font-bold text-gray-700">
                          {percent}%
                        </span>
                        <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden border border-gray-200">
                          <div
                            className={`h-full transition-all ${percent === 0 ? 'bg-gray-300' : percent >= 100 ? 'bg-emerald-500' : 'bg-amber-400'}`}
                            style={{ width: `${Math.max(5, Math.min(100, percent))}%` }}
                          />
                        </div>
                      </div>
                    </td>"""

content = content.replace(old_cells_chunk, new_cells_chunk)

# 8. Lịch sử nhập kho empty
old_gr_empty_chunk = """        {receipts.length === 0 ? (
          <div className="p-8 text-center text-muted">
            Chưa có phiếu nhập kho nào.
          </div>
        ) : ("""

new_gr_empty_chunk = """        {receipts.length === 0 ? (
          <div className="p-10 flex flex-col items-center justify-center text-center bg-gray-50/30">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4 text-gray-400">
              <Icon name="Inbox" size={32} />
            </div>
            <h4 className="font-semibold text-gray-800 mb-1">Chưa có phiếu nhập kho</h4>
            <p className="text-sm text-gray-500 max-w-sm mb-6">
              Đơn hàng này chưa có dữ liệu nhập kho. Hãy tạo phiếu nhập kho khi hàng được giao đến.
            </p>
            {(po.status === 'approved' || po.status === 'partial_received') && (
              <Button variant="primary" onClick={() => setShowGrForm(true)}>
                <Icon name="Plus" size={16} className="mr-2" /> Tạo phiếu nhập kho ngay
              </Button>
            )}
          </div>
        ) : ("""

content = content.replace(old_gr_empty_chunk, new_gr_empty_chunk)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Replacement done!")
