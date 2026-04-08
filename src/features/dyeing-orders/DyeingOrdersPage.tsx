import { useDyeingOrderList } from './useDyeingOrders';

export function DyeingOrdersPage() {
  const { data, isLoading } = useDyeingOrderList();

  return (
    <div className="p-4">
      <div className="page-header mb-6">
        <div>
          <h1 className="text-2xl font-bold">Quản lý Lệnh nhuộm</h1>
          <p className="text-muted-foreground">
            Theo dõi quá trình gửi nhuộm và nhận vải thành phẩm.
          </p>
        </div>
      </div>

      <div className="panel-card p-8 border-2 border-dashed border-gray-300 rounded-lg text-center text-gray-500">
        {isLoading ? (
          <p>Đang tải dữ liệu lệnh nhuộm...</p>
        ) : (
          <>
            <p>Đã đồng bộ khai báo "{data?.total ?? 0}" lệnh nhuộm.</p>
            <br />
            Tính năng đang được cấu trúc lại hoàn thiện (DyeingOrderList,
            DyeingOrderForm).
          </>
        )}
      </div>
    </div>
  );
}
