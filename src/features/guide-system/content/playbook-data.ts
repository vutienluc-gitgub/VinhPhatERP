import type { PlaybookSection } from '@/features/guide-system/types';
import { APP_ROUTES } from '@/features/guide-system/constants/routes';

import { VALUE_CHAINS, VALUE_CHAIN_LABELS } from './value-chains';

export const PLAYBOOK_REGISTRY: PlaybookSection[] = [
  {
    id: VALUE_CHAINS.SUPPLY,
    title: VALUE_CHAIN_LABELS[VALUE_CHAINS.SUPPLY],
    roles: ['admin', 'manager', 'staff'],
    modules: ['YarnReceipts', 'WorkOrders', 'RawFabric', 'WeavingInvoices'],
    steps: [
      {
        id: 'supply-1',
        title: '1. Nhập Sợi (Từ Nhà Cung Cấp)',
        content:
          'Đây là bước đầu tiên trong chuỗi cung ứng, tiếp nhận nguồn nguyên liệu sợi từ các nhà cung cấp bên ngoài.\n\n[CHECKLIST] CHECKLIST CÔNG VIỆC\n• Đối chiếu phiếu giao hàng của NCC với Đơn Đặt Sợi (Purchase Order) trên hệ thống.\n• Kiểm đếm thực tế: Mã sợi (Yarn Code), Lô sợi (Lot Number), Quy cách đóng gói.\n• Cân và nhập trọng lượng thực tế (kg) vào hệ thống.\n• Đánh giá chất lượng ngoại quan (Grade A/B/C) và ghi chú nếu có hàng lỗi, ướt, hoặc sai quy cách.\n\n[WARNING] LƯU Ý QUAN TRỌNG\n- Chỉ chọn trạng thái "Đã xác nhận" (Confirmed) khi hàng đã thực sự vào kho và khớp số lượng.\n- Hệ thống sẽ tự động tăng Tồn Kho Sợi (Yarn Inventory) ngay khi phiếu nhập được duyệt.',
        actions: [
          {
            type: 'navigate',
            payload: APP_ROUTES.YARN_RECEIPTS,
            label: 'Tới trang Nhập Sợi',
          },
        ],
        nextSteps: ['supply-2'],
      },
      {
        id: 'supply-2',
        title: '2. Cấp Sợi & Tạo Lệnh Dệt',
        content:
          'Điều phối viên sản xuất tiến hành lên Lệnh Dệt (Work Order) để giao sợi cho các phân xưởng hoặc đối tác dệt gia công.\n\n[CHECKLIST] CHECKLIST CÔNG VIỆC\n• Xác định Khách hàng & Mã Vải (Fabric Code) cần dệt.\n• Lựa chọn Định mức sản xuất (BOM) phiên bản mới nhất đang áp dụng.\n• Nhập số mét vải mộc mục tiêu (Target Length). Hệ thống sẽ tự tính ra số kg sợi cần xuất kho dựa trên BOM.\n• Lựa chọn Lô Sợi (Lot Number) có trong kho để cấp cho xưởng.\n\n[WARNING] LƯU Ý QUAN TRỌNG\n- Hãy đảm bảo số lượng sợi xuất kho luôn bám sát định mức. Nếu xưởng yêu cầu xuất bù sợi (do hao hụt quá mức), cần có sự phê duyệt của Quản đốc.\n- Trạng thái Lệnh Dệt phải chuyển sang "Đang sản xuất" (In Progress) khi bắt đầu giao sợi.',
        actions: [
          {
            type: 'navigate',
            payload: APP_ROUTES.WORK_ORDERS,
            label: 'Tới Lệnh Dệt',
          },
        ],
        nextSteps: ['supply-3'],
      },
      {
        id: 'supply-3',
        title: '3. Nhập Vải Mộc',
        content:
          'Tiếp nhận vải mộc (Raw Fabric) từ xưởng dệt sau khi Lệnh Dệt hoàn thành.\n\n[CHECKLIST] CHECKLIST CÔNG VIỆC\n• Kiểm tra nhãn mác từng cây vải từ xưởng dệt gửi về.\n• Cân và đo chiều dài thực tế (Length) & trọng lượng (Weight) của từng cây vải.\n• Nhập liệu vào hệ thống theo Lô (Lot) và Map với Lệnh Dệt (Work Order) tương ứng.\n• Đánh giá chất lượng: Phân loại Grade (A/B/C), ghi nhận lỗi dệt (đứt sợi, sọc vân...).\n\n[WARNING] LƯU Ý QUAN TRỌNG\n- Hệ thống cung cấp cơ chế sinh mã vạch (Barcode/Lot Number) tự động cho từng cuộn vải. Hãy dán mã này lên cây vải để dễ dàng truy xuất sau này.\n- Số mét vải mộc thu hồi thực tế so với số kg sợi đã cấp sẽ là cơ sở để tính hao hụt dệt.',
        actions: [
          {
            type: 'navigate',
            payload: APP_ROUTES.RAW_FABRIC,
            label: 'Tới Kho Vải Mộc',
          },
        ],
        nextSteps: ['supply-4'],
      },
      {
        id: 'supply-4',
        title: '4. Chốt Công Dệt',
        content:
          'Kế toán sản xuất thực hiện chốt công dệt và tạo Hóa Đơn Dệt (Weaving Invoice) để ghi nhận chi phí gia công.\n\n[CHECKLIST] CHECKLIST CÔNG VIỆC\n• Lọc các Lệnh Dệt đã hoàn thành trong tháng của từng Xưởng dệt.\n• Đối soát tổng số mét vải mộc đã nhập kho với biên bản giao nhận của xưởng.\n• Áp dụng Đơn giá dệt (Price) theo thỏa thuận.\n• Tạo Hóa đơn (Invoice) và chuyển sang cho Kế toán thanh toán.\n\n[WARNING] LƯU Ý QUAN TRỌNG\n- Không thanh toán công dệt cho phần hao hụt vượt định mức cho phép (nếu có quy định bồi thường).',
        actions: [
          {
            type: 'navigate',
            payload: APP_ROUTES.WEAVING_INVOICES,
            label: 'Tới Hóa Đơn Dệt',
          },
        ],
      },
    ],
  },
  {
    id: VALUE_CHAINS.PRODUCTION,
    title: VALUE_CHAIN_LABELS[VALUE_CHAINS.PRODUCTION],
    roles: ['admin', 'manager', 'staff'],
    modules: ['DyeingOrders', 'FinishedFabric'],
    steps: [
      {
        id: 'prod-1',
        title: '1. Xuất Nhuộm (Gia Công)',
        content:
          'Quy trình xuất vải mộc sang xưởng nhuộm để gia công thành vải thành phẩm.\n\n[CHECKLIST] CHECKLIST CÔNG VIỆC\n• Lên Lệnh Nhuộm (Dyeing Order) dựa trên Đơn Hàng (Order) của Sales.\n• Lựa chọn Màu Sắc (Color) từ Color Catalog chuẩn.\n• Chỉ định chính xác các cây vải mộc (Raw Fabric Rolls) sẽ được xuất đi nhuộm.\n• Nhập Đơn giá nhuộm (Dyeing Price) và dự kiến ngày giao hàng.\n\n[WARNING] LƯU Ý QUAN TRỌNG\n- Việc chọn sai mã màu có thể dẫn đến đền bù toàn bộ lô hàng. Cần đối chiếu kỹ với mẫu màu (Lab Dip) đã được duyệt.\n- In Phiếu Xuất Kho Vải Mộc cho xưởng nhuộm ký nhận.',
        actions: [
          {
            type: 'navigate',
            payload: APP_ROUTES.DYEING_ORDERS,
            label: 'Tới Lệnh Nhuộm',
          },
        ],
        nextSteps: ['prod-2'],
      },
      {
        id: 'prod-2',
        title: '2. Nhập Vải Thành Phẩm',
        content:
          'Tiếp nhận vải đã nhuộm hoàn thiện từ xưởng nhuộm về kho tổng.\n\n[CHECKLIST] CHECKLIST CÔNG VIỆC\n• Cân và đo lại chiều dài thực tế (Length), trọng lượng (Weight) của từng cây vải thành phẩm.\n• Kiểm tra độ co rút (Shrinkage), độ bền màu (Color Fastness), và độ lệch màu (Shade) so với mẫu chuẩn.\n• Nhập kho hệ thống (Finished Fabric Rolls) và dán nhãn (Label) cho từng cuộn.\n\n[WARNING] LƯU Ý QUAN TRỌNG\n- Nếu chất lượng không đạt, phải tick chọn Grade B/C hoặc từ chối nhập kho, yêu cầu xưởng tái chế (Re-dye).',
        actions: [
          {
            type: 'navigate',
            payload: APP_ROUTES.FINISHED_FABRIC,
            label: 'Tới Vải Thành Phẩm',
          },
        ],
      },
    ],
  },
  {
    id: VALUE_CHAINS.SALES,
    title: VALUE_CHAIN_LABELS[VALUE_CHAINS.SALES],
    roles: ['admin', 'manager', 'sale'],
    modules: ['Quotations', 'Orders', 'OrderKanban', 'Shipments'],
    steps: [
      {
        id: 'sale-1',
        title: '1. Báo Giá & Chốt Đơn',
        content:
          'Khởi đầu quy trình bán hàng bằng việc tiếp nhận nhu cầu và gửi báo giá cho khách.\n\n[CHECKLIST] CHECKLIST CÔNG VIỆC\n• Tạo Báo Giá (Quotation): Chọn khách hàng, mã vải, màu sắc, số lượng dự kiến và đơn giá.\n• Xuất file PDF Báo Giá từ hệ thống và gửi cho khách hàng.\n• Khi khách đồng ý, bấm "Convert to Order" để chuyển báo giá thành Đơn Hàng (Sales Order) chính thức.\n\n[WARNING] LƯU Ý QUAN TRỌNG\n- Kiểm tra Hạn Mức Công Nợ (Credit Limit) của khách hàng trước khi chốt đơn. Nếu khách vượt hạn mức, hệ thống sẽ cảnh báo đỏ, cần xin ý kiến Giám đốc.\n- Chú ý thời gian giao hàng cam kết (Delivery Date).',
        actions: [
          {
            type: 'navigate',
            payload: APP_ROUTES.QUOTATIONS,
            label: 'Tới Báo Giá',
          },
          {
            type: 'navigate',
            payload: APP_ROUTES.ORDERS,
            label: 'Tới Đơn Hàng',
          },
        ],
        nextSteps: ['sale-2'],
      },
      {
        id: 'sale-2',
        title: '2. Theo Dõi & Cọc Hàng (Kanban)',
        content:
          'Theo dõi vòng đời đơn hàng và đảm bảo hàng hóa được giữ chỗ (Reserve) đúng cho khách.\n\n[CHECKLIST] CHECKLIST CÔNG VIỆC\n• Vào Bảng Kanban (Order Kanban) để xem tổng quan các Đơn hàng đang ở trạng thái nào.\n• Với Đơn hàng cần giao từ hàng có sẵn, tiến hành "Giữ chỗ" (Reserve) các cuộn vải thành phẩm trong kho.\n• Với Đơn hàng dệt/nhuộm mới, theo dõi tiến độ Work Order / Dyeing Order tương ứng.\n\n[WARNING] LƯU Ý QUAN TRỌNG\n- Hãy kéo thả thẻ (Drag & Drop) trên Kanban để cập nhật trạng thái đơn hàng (Mới -> Đang sản xuất -> Chờ Giao).\n- Hàng đã bị Giữ chỗ (Reserved) thì các Sale khác sẽ không thể xuất bán được nữa.',
        actions: [
          {
            type: 'navigate',
            payload: APP_ROUTES.ORDER_KANBAN,
            label: 'Tới Bảng Kanban',
          },
        ],
        nextSteps: ['sale-3'],
      },
      {
        id: 'sale-3',
        title: '3. Xuất Kho Giao Hàng',
        content:
          'Hoàn tất quá trình bán hàng bằng việc giao vải cho khách và xuất hóa đơn.\n\n[CHECKLIST] CHECKLIST CÔNG VIỆC\n• Kiểm tra điều kiện xuất kho: Khách đã thanh toán cọc hoặc công nợ còn trong hạn mức.\n• Lập Phiếu Giao Hàng (Shipment), chỉ định phương tiện và tài xế giao hàng.\n• Hệ thống sẽ tự động trừ Tồn kho Thành phẩm và cộng vào Công nợ khách hàng (Customer Debt).\n• In Phiếu xuất kho / Biên bản bàn giao cho tài xế mang theo.\n\n[WARNING] LƯU Ý QUAN TRỌNG\n- Sau khi Phiếu giao hàng được đánh dấu "Đã hoàn thành" (Completed), công nợ mới thực sự được ghi nhận.',
        actions: [
          {
            type: 'navigate',
            payload: APP_ROUTES.SHIPMENTS,
            label: 'Tới Giao Hàng',
          },
        ],
      },
    ],
  },
  {
    id: VALUE_CHAINS.FINANCE,
    title: VALUE_CHAIN_LABELS[VALUE_CHAINS.FINANCE],
    roles: ['admin', 'manager'],
    modules: ['Payments'],
    steps: [
      {
        id: 'fin-1',
        title: 'Quản Lý Thu Tiền & Công Nợ',
        content:
          'Quy trình kiểm soát dòng tiền vào và công nợ của khách hàng.\n\n[CHECKLIST] CHECKLIST CÔNG VIỆC\n• Khi nhận được tiền từ khách (Tiền mặt / Chuyển khoản), lập Phiếu Thu (Payment).\n• Phân bổ (Allocate) số tiền thu được vào các Đơn Hàng (Order) hoặc dư nợ cũ.\n• Kiểm tra Báo cáo Công nợ Khách hàng (Customer Debt Aging) để nhắc nhở Sales thu hồi các khoản nợ quá hạn.\n\n[WARNING] LƯU Ý QUAN TRỌNG\n- Đảm bảo chọn đúng Tài khoản thanh toán (Payment Account) (Ví dụ: Techcombank, Tiền mặt tại quỹ) để số dư Sổ quỹ (Cashbook) khớp với thực tế.\n- Không được phép sửa xóa Phiếu thu khi đã chốt sổ tháng.',
        actions: [
          {
            type: 'navigate',
            payload: APP_ROUTES.PAYMENTS,
            label: 'Tới Thanh Toán (Thu)',
          },
        ],
        nextSteps: ['fin-2'],
      },
      {
        id: 'fin-2',
        title: 'Quản Lý Chi Tiền (Chi Phí)',
        content:
          'Kiểm soát dòng tiền ra cho các chi phí vận hành và thanh toán đối tác gia công / nhà cung cấp.\n\n[CHECKLIST] CHECKLIST CÔNG VIỆC\n• Lập Phiếu Chi (Expense) cho các khoản thanh toán: Tiền mua sợi, Công dệt, Công nhuộm, Điện nước, Lương...\n• Gắn mã Nhà Cung Cấp (Supplier) nếu thanh toán công nợ.\n• Kiểm tra Báo cáo Dòng Tiền (Cash Flow) để cân đối nguồn vốn.\n\n[WARNING] LƯU Ý QUAN TRỌNG\n- Chi phí sản xuất (dệt, nhuộm) phải khớp với Hóa đơn gia công (Weaving Invoices) hoặc Phiếu nhập (Yarn Receipts).',
        actions: [
          {
            type: 'navigate',
            payload: APP_ROUTES.EXPENSES,
            label: 'Tới Phiếu Chi',
          },
        ],
      },
    ],
  },
];
