/**
 * Bảng ánh xạ danh mục Dịch vụ và Vật tư từ MISA ASP sang hệ thống VinhPhatERP.
 * Phục vụ bóc tách Hóa đơn điện tử đầu vào/đầu ra và tự động phân loại nghiệp vụ.
 */

export type MisaServiceType =
  | 'WEAVING'
  | 'DYEING'
  | 'FINISHING'
  | 'SOFTWARE'
  | 'ADMIN_EXPENSE';

export interface MisaServiceMapping {
  misaCode: string;
  name: string;
  unit: string;
  defaultPrice: number;
  type: MisaServiceType;
  targetModule: 'weaving_invoices' | 'dyeing_orders' | 'expenses';
  accountCode: string;
  notes: string;
}

export const MISA_SERVICE_MAPPINGS: Record<string, MisaServiceMapping> = {
  // --- 1. DỊCH VỤ DỆT GIA CÔNG ---
  VT00017: {
    misaCode: 'VT00017',
    name: 'Gia công dệt vải CVC',
    unit: 'kg',
    defaultPrice: 7000,
    type: 'WEAVING',
    targetModule: 'weaving_invoices',
    accountCode: '154',
    notes: 'Dệt vải mộc CVC',
  },
  VT00027: {
    misaCode: 'VT00027',
    name: 'Gia công dệt vải mộc',
    unit: 'kg',
    defaultPrice: 7000,
    type: 'WEAVING',
    targetModule: 'weaving_invoices',
    accountCode: '154',
    notes: 'Dệt vải mộc tiêu chuẩn',
  },
  VT00038: {
    misaCode: 'VT00038',
    name: 'Gia công dệt vải',
    unit: 'kg',
    defaultPrice: 8500,
    type: 'WEAVING',
    targetModule: 'weaving_invoices',
    accountCode: '154',
    notes: 'Dệt vải thông thường',
  },
  VT00018: {
    misaCode: 'VT00018',
    name: 'VP-FL375XN (TC20+CVC10)',
    unit: 'kg',
    defaultPrice: 8500,
    type: 'WEAVING',
    targetModule: 'weaving_invoices',
    accountCode: '154',
    notes: 'Dệt theo mã quy cách xưởng',
  },

  // --- 2. DỊCH VỤ NHUỘM VẢI ---
  VT00016: {
    misaCode: 'VT00016',
    name: 'Gia công nhuộm vải CVC',
    unit: 'kg',
    defaultPrice: 40000,
    type: 'DYEING',
    targetModule: 'dyeing_orders',
    accountCode: '154',
    notes: 'Nhuộm vải thành phần CVC',
  },
  VT00019: {
    misaCode: 'VT00019',
    name: 'Gia công nhuộm vải',
    unit: 'kg',
    defaultPrice: 30000,
    type: 'DYEING',
    targetModule: 'dyeing_orders',
    accountCode: '154',
    notes: 'Nhuộm vải tiêu chuẩn',
  },
  VT00042: {
    misaCode: 'VT00042',
    name: 'Gia công nhuộm vải (cotton)',
    unit: 'kg',
    defaultPrice: 50000,
    type: 'DYEING',
    targetModule: 'dyeing_orders',
    accountCode: '154',
    notes: 'Nhuộm vải 100% Cotton',
  },

  // --- 3. DỊCH VỤ HOÀN TẤT, CĂNG KIM, CÀO LÔNG ---
  VT00028: {
    misaCode: 'VT00028',
    name: 'Gia công căng kim vải',
    unit: 'kg',
    defaultPrice: 9000,
    type: 'FINISHING',
    targetModule: 'dyeing_orders',
    accountCode: '154',
    notes: 'Căng kim hoàn tất',
  },
  VT00033: {
    misaCode: 'VT00033',
    name: 'Gia công hoàn tất vải',
    unit: 'kg',
    defaultPrice: 10000,
    type: 'FINISHING',
    targetModule: 'dyeing_orders',
    accountCode: '154',
    notes: 'Hoàn tất tổng hợp',
  },
  VT00039: {
    misaCode: 'VT00039',
    name: 'Gia công giặt căng kim vải',
    unit: 'kg',
    defaultPrice: 10000,
    type: 'FINISHING',
    targetModule: 'dyeing_orders',
    accountCode: '154',
    notes: 'Giặt và căng kim định hình',
  },
  VT00040: {
    misaCode: 'VT00040',
    name: 'Gia Công Cào Lông, Căng Kim Định Hình Vải',
    unit: 'kg',
    defaultPrice: 10000,
    type: 'FINISHING',
    targetModule: 'dyeing_orders',
    accountCode: '154',
    notes: 'Cào lông nỉ và căng kim',
  },
  VT00041: {
    misaCode: 'VT00041',
    name: 'Gia Công Căng Kim Định Hình Vải',
    unit: 'kg',
    defaultPrice: 6000,
    type: 'FINISHING',
    targetModule: 'dyeing_orders',
    accountCode: '154',
    notes: 'Căng kim định hình vải',
  },

  // --- 4. DỊCH VỤ PHẦN MỀM & QUẢN TRỊ ---
  VT00001: {
    misaCode: 'VT00001',
    name: 'Phần mềm HĐĐT meInvoice - Gói khởi tạo',
    unit: 'Gói',
    defaultPrice: 0,
    type: 'SOFTWARE',
    targetModule: 'expenses',
    accountCode: '632',
    notes: 'Nhà cung cấp MISA (NCC00001)',
  },
  VT00002: {
    misaCode: 'VT00002',
    name: 'Phần mềm HĐĐT meInvoice - Gói MEIR 2.000',
    unit: 'Gói',
    defaultPrice: 0,
    type: 'SOFTWARE',
    targetModule: 'expenses',
    accountCode: '632',
    notes: 'Nhà cung cấp MISA (NCC00001)',
  },
  VT00014: {
    misaCode: 'VT00014',
    name: 'Phần mềm MISA ASP Kế toán - Gói Enterprise',
    unit: 'Gói',
    defaultPrice: 0,
    type: 'SOFTWARE',
    targetModule: 'expenses',
    accountCode: '632',
    notes: 'Nhà cung cấp MISA (NCC00001)',
  },
  VT00021: {
    misaCode: 'VT00021',
    name: 'Duy trì tài khoản quản trị .vn detmayvinhphat.vn',
    unit: 'Gói',
    defaultPrice: 400000,
    type: 'ADMIN_EXPENSE',
    targetModule: 'expenses',
    accountCode: '6422',
    notes: 'Nhà cung cấp Mắt Bão (NCC00012)',
  },
  VT00022: {
    misaCode: 'VT00022',
    name: 'Lệ phí đăng ký TMVN .vn detmayvinhphat.vn',
    unit: 'Lần',
    defaultPrice: 0,
    type: 'ADMIN_EXPENSE',
    targetModule: 'expenses',
    accountCode: '6422',
    notes: 'Nhà cung cấp Mắt Bão (NCC00012)',
  },
  VT00023: {
    misaCode: 'VT00023',
    name: 'Lệ phí duy trì TMVN .vn detmayvinhphat.vn (4 năm)',
    unit: 'Lần',
    defaultPrice: 0,
    type: 'ADMIN_EXPENSE',
    targetModule: 'expenses',
    accountCode: '6422',
    notes: 'Nhà cung cấp Mắt Bão (NCC00012)',
  },
  VT00029: {
    misaCode: 'VT00029',
    name: 'Phí dịch vụ hỗ trợ kinh doanh Zalo Cloud',
    unit: 'Tháng',
    defaultPrice: 0,
    type: 'ADMIN_EXPENSE',
    targetModule: 'expenses',
    accountCode: '6422',
    notes: 'Nhà cung cấp VNG (NCC00011)',
  },
  VT00030: {
    misaCode: 'VT00030',
    name: 'Phí duy trì Email Pro v4 (1 năm)',
    unit: 'Gói',
    defaultPrice: 228000,
    type: 'ADMIN_EXPENSE',
    targetModule: 'expenses',
    accountCode: '6422',
    notes: 'Nhà cung cấp Mắt Bão (NCC00012)',
  },
  VT00031: {
    misaCode: 'VT00031',
    name: 'Phí duy trì domain .com (1 năm)',
    unit: 'Gói',
    defaultPrice: 369000,
    type: 'ADMIN_EXPENSE',
    targetModule: 'expenses',
    accountCode: '6422',
    notes: 'Nhà cung cấp Mắt Bão (NCC00012)',
  },
};
