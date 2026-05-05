/**
 * Master Data Seed - East (Quanzhou) Intelligent Technology Co., Ltd.
 * Nhà cung cấp máy dệt kim tròn (Circular Knitting Machines)
 *
 * Source: https://www.eastinoknittingmachine.com/
 * Extracted: May 2026
 */

// Types được inline để file seed tự chứa đủ thông tin
type SupplierSeed = {
  code: string;
  name: string;
  short_name: string;
  country: string;
  province: string;
  city: string;
  address: string;
  phone: string;
  email: string;
  website?: string;
  tax_code?: string | null;
  supplier_type: string;
  industry: string;
  product_categories: string[];
  payment_terms?: string;
  currency?: string;
  lead_time_days?: number;
  moq_usd?: number;
  certifications?: string[];
  is_active: boolean;
  notes?: string;
  tags?: string[];
  source?: string;
  source_url?: string;
  extracted_at?: string;
};

type MachineCatalogSeed = {
  supplier_code: string;
  sku: string;
  name: string;
  short_name: string;
  category: string;
  subcategory: string;
  description: string;
  specifications: Record<string, unknown>;
  features?: string[];
  applications?: string[];
  moq: number;
  unit: string;
  estimated_price_usd?: number;
  price_valid_until?: string;
  warranty_months?: number;
  lead_time_days?: number;
  origin: string;
  hs_code?: string;
  is_active: boolean;
};

export const eastinoSupplier: SupplierSeed = {
  code: 'EASTINO',
  name: 'East (Quanzhou) Intelligent Technology Co., Ltd.',
  short_name: 'EASTINO',
  country: 'CN',
  province: 'Fujian',
  city: 'Quanzhou',
  address: 'Quanzhou, Fujian Province, China',
  phone: '+86 15905970887',
  email: 'anna@east-corp.cn',
  website: 'https://www.eastinoknittingmachine.com',
  tax_code: null,
  supplier_type: 'manufacturer',
  industry: 'textile_machinery',
  product_categories: ['circular_knitting_machine', 'knitting_accessories'],
  payment_terms: 'TT_30_70', // 30% advance, 70% before shipment
  currency: 'USD',
  lead_time_days: 45,
  moq_usd: 10000,
  certifications: ['Alibaba Best Supplier 2021'],
  is_active: true,
  notes:
    'Nhà sản xuất máy dệt kim tròn Trung Quốc, 280+ nhân viên, 1000+ máy/năm. Có 7 phân xưởng sản xuất và trung tâm đào tạo công nghệ dệt.',
  tags: [
    'knitting_machine',
    'circular_knitting',
    'double_jersey',
    'single_jersey',
    'china',
  ],
  source: 'website',
  source_url: 'https://www.eastinoknittingmachine.com',
  extracted_at: '2026-05-05',
};

export const eastinoMachineCatalog: MachineCatalogSeed[] = [
  // ═══════════════════════════════════════════════════════════
  // DOUBLE JERSEY MACHINES - Máy dệt 2 mặt
  // ═══════════════════════════════════════════════════════════
  {
    supplier_code: 'EASTINO',
    sku: 'E-DFM-30-72',
    name: 'Double Jersey Faux Fur Mink Velvet Circular Knitting Machine',
    short_name: 'DJ Faux Fur Mink Velvet',
    category: 'double_jersey',
    subcategory: 'faux_fur',
    description:
      'Máy dệt kim tròn 2 mặt chuyên sản xuất vải lông chồn giả, nhung mink. Dùng cho áo khoác, chăn ga, đồ trang trí.',
    specifications: {
      diameter_inch: 30,
      gauge: 72,
      feeders: 72,
      tracks: 4,
      motor_power_kw: 5.5,
      voltage: '380V/3P/50Hz',
      speed_rpm: 20,
      weight_kg: 4200,
      dimensions_mm: '2800x2200x2200',
    },
    features: [
      'Hệ thống jacquard điện tử',
      'Cam điều khiển độ chính xác cao',
      'Tự động tra dầu',
      'Hệ thống đo lường điện tử',
    ],
    applications: ['faux_fur_coat', 'blanket', 'home_textile', 'upholstery'],
    moq: 1,
    unit: 'machine',
    estimated_price_usd: 45000,
    price_valid_until: '2026-12-31',
    warranty_months: 12,
    lead_time_days: 60,
    origin: 'CN',
    hs_code: '84471100',
    is_active: true,
  },
  {
    supplier_code: 'EASTINO',
    sku: 'E-DEJ-30-108',
    name: 'Double Jersey Electronic Jacquard Circular Knitting Machine',
    short_name: 'DJ Electronic Jacquard',
    category: 'double_jersey',
    subcategory: 'jacquard',
    description:
      'Máy dệt jacquard điện tử 2 mặt, điều khiển bằng máy tính, tạo họa tiết phức tạp trên vải.',
    specifications: {
      diameter_inch: 30,
      gauge: 108,
      feeders: 72,
      tracks: 4,
      motor_power_kw: 5.5,
      voltage: '380V/3P/50Hz',
      speed_rpm: 18,
      weight_kg: 4500,
      dimensions_mm: '3000x2400x2300',
    },
    features: [
      'Hệ thống jacquard điện tử ECP',
      'Màn hình cảm ứng LCD',
      'Tự động phát hiện lỗi kim',
      'Lưu trữ 1000+ mẫu thiết kế',
    ],
    applications: ['fashion_fabric', 'technical_textile', 'automotive_textile'],
    moq: 1,
    unit: 'machine',
    estimated_price_usd: 55000,
    price_valid_until: '2026-12-31',
    warranty_months: 12,
    lead_time_days: 60,
    origin: 'CN',
    hs_code: '84471100',
    is_active: true,
  },
  {
    supplier_code: 'EASTINO',
    sku: 'E-DRTJ-30-96',
    name: 'Double Jersey Rib Transfer Jacquard Circular Knitting Machine',
    short_name: 'DJ Rib Transfer Jacquard',
    category: 'double_jersey',
    subcategory: 'transfer_jacquard',
    description:
      'Máy chuyển sợi jacquard 2 mặt, chuyên dùng cho vải có cấu trúc phức tạp, gân chuyển đổi.',
    specifications: {
      diameter_inch: 30,
      gauge: 96,
      feeders: 72,
      tracks: 4,
      motor_power_kw: 5.5,
      voltage: '380V/3P/50Hz',
      speed_rpm: 22,
      weight_kg: 4300,
    },
    features: [
      'Hệ thống chuyển sợi lên/xuống',
      'Jacquard điện tử',
      'Điều khiển ăn mòn chính xác',
    ],
    applications: ['premium_fashion', 'sportswear', 'technical_fabric'],
    moq: 1,
    unit: 'machine',
    estimated_price_usd: 58000,
    price_valid_until: '2026-12-31',
    warranty_months: 12,
    lead_time_days: 60,
    origin: 'CN',
    hs_code: '84471100',
    is_active: true,
  },
  {
    supplier_code: 'EASTINO',
    sku: 'E-MCIE-30-72',
    name: 'May&Cie Double Jersey Tubular Circular Knitting Machine',
    short_name: 'May&Cie DJ Tubular',
    category: 'double_jersey',
    subcategory: 'interlock',
    description:
      'Máy dệt 2 mặt ống bo Interlock, công nghệ May&Cie, dùng cho vải bo chất lượng cao.',
    specifications: {
      diameter_inch: 30,
      gauge: 72,
      feeders: 72,
      tracks: 4,
      motor_power_kw: 5.5,
      voltage: '380V/3P/50Hz',
      speed_rpm: 25,
      weight_kg: 4000,
    },
    features: [
      'Công nghệ May&Cie',
      'Thiết kế ống bo tối ưu',
      'Chất lượng vải đồng đều',
    ],
    applications: ['interlock_fabric', 'rib_fabric', 'premium_garment'],
    moq: 1,
    unit: 'machine',
    estimated_price_usd: 48000,
    price_valid_until: '2026-12-31',
    warranty_months: 12,
    lead_time_days: 45,
    origin: 'CN',
    hs_code: '84471100',
    is_active: true,
  },
  {
    supplier_code: 'EASTINO',
    sku: 'E-DCT-34-108',
    name: 'Double Jersey Carpet Terry Circular Knitting Machine',
    short_name: 'DJ Carpet Terry',
    category: 'double_jersey',
    subcategory: 'terry',
    description:
      'Máy dệt lông xù thảm 2 mặt, tạo bề mặt lông xù dày dặn cho thảm và đồ gia dụng.',
    specifications: {
      diameter_inch: 34,
      gauge: 108,
      feeders: 72,
      tracks: 4,
      motor_power_kw: 7.5,
      voltage: '380V/3P/50Hz',
      speed_rpm: 15,
      weight_kg: 5000,
    },
    features: [
      'Cơ chế tạo lòng xù đặc biệt',
      'Điều chỉnh chiều cao lông',
      'Tốc độ thấp - chất lượng cao',
    ],
    applications: ['carpet', 'bath_towel', 'floor_mat', 'home_textile'],
    moq: 1,
    unit: 'machine',
    estimated_price_usd: 65000,
    price_valid_until: '2026-12-31',
    warranty_months: 12,
    lead_time_days: 75,
    origin: 'CN',
    hs_code: '84471100',
    is_active: true,
  },
  {
    supplier_code: 'EASTINO',
    sku: 'E-DFJ-30-144',
    name: 'Double Jersey Full Jacquard Electronic Circular Knitting Machine',
    short_name: 'DJ Full Jacquard',
    category: 'double_jersey',
    subcategory: 'full_jacquard',
    description:
      'Máy jacquard toàn phần 2 mặt, điều khiển từng kim riêng lẻ, tạo họa tiết không giới hạn.',
    specifications: {
      diameter_inch: 30,
      gauge: 144,
      feeders: 72,
      tracks: 4,
      motor_power_kw: 7.5,
      voltage: '380V/3P/50Hz',
      speed_rpm: 16,
      weight_kg: 5500,
    },
    features: [
      'Jacquard toàn phần điện tử',
      'Điều khiển từng kim độc lập',
      'Phần mềm thiết kế 3D',
      'Truyền dữ liệu USB/Wifi',
    ],
    applications: ['high_end_fashion', 'technical_textile', 'automotive'],
    moq: 1,
    unit: 'machine',
    estimated_price_usd: 75000,
    price_valid_until: '2026-12-31',
    warranty_months: 12,
    lead_time_days: 90,
    origin: 'CN',
    hs_code: '84471100',
    is_active: true,
  },

  // ═══════════════════════════════════════════════════════════
  // SINGLE JERSEY MACHINES - Máy dệt 1 mặt
  // ═══════════════════════════════════════════════════════════
  {
    supplier_code: 'EASTINO',
    sku: 'E-SJ-30-96',
    name: 'Single Jersey Circular Knitting Machine',
    short_name: 'Single Jersey',
    category: 'single_jersey',
    subcategory: 'standard',
    description:
      'Máy dệt kim tròn 1 mặt tiêu chuẩn, dùng cho vải thun cotton, polyester thông dụng.',
    specifications: {
      diameter_inch: 30,
      gauge: 96,
      feeders: 72,
      tracks: 4,
      motor_power_kw: 3.7,
      voltage: '380V/3P/50Hz',
      speed_rpm: 32,
      weight_kg: 2800,
    },
    features: [
      'Thiết kế đơn giản, dễ vận hành',
      'Tiết kiệm điện',
      'Bảo trì thấp',
    ],
    applications: ['t_shirt', 'underwear', 'casual_wear', 'basic_fabric'],
    moq: 1,
    unit: 'machine',
    estimated_price_usd: 28000,
    price_valid_until: '2026-12-31',
    warranty_months: 12,
    lead_time_days: 30,
    origin: 'CN',
    hs_code: '84471100',
    is_active: true,
  },
  {
    supplier_code: 'EASTINO',
    sku: 'E-OWCJ-34-108',
    name: 'Open Width Computerized Jacquard Circular Knitting Machine',
    short_name: 'Open Width Jacquard',
    category: 'single_jersey',
    subcategory: 'open_width_jacquard',
    description:
      'Máy jacquard mở khổ, dệt vải phẳng không cuộn, họa tiết jacquard điện tử.',
    specifications: {
      diameter_inch: 34,
      gauge: 108,
      feeders: 72,
      tracks: 4,
      motor_power_kw: 5.5,
      voltage: '380V/3P/50Hz',
      speed_rpm: 25,
      weight_kg: 3500,
    },
    features: [
      'Hệ thống mở khổ tự động',
      'Jacquard điện tử ECP',
      'Vải phẳng không xoắn',
    ],
    applications: ['jacquard_fabric', 'fashion_garment', 'home_textile'],
    moq: 1,
    unit: 'machine',
    estimated_price_usd: 42000,
    price_valid_until: '2026-12-31',
    warranty_months: 12,
    lead_time_days: 45,
    origin: 'CN',
    hs_code: '84471100',
    is_active: true,
  },
  {
    supplier_code: 'EASTINO',
    sku: 'E-STF-30-72',
    name: 'Single Jersey Three Thread Fleece Circular Knitting Machine',
    short_name: 'SJ 3-Thread Fleece',
    category: 'single_jersey',
    subcategory: 'fleece',
    description:
      'Máy dệt nỉ 3 sợi 1 mặt, tạo vải nỉ mềm mại cho áo khoác, chăn.',
    specifications: {
      diameter_inch: 30,
      gauge: 72,
      feeders: 72,
      tracks: 3,
      motor_power_kw: 5.5,
      voltage: '380V/3P/50Hz',
      speed_rpm: 22,
      weight_kg: 3200,
    },
    features: [
      'Cơ chế 3 sợi tạo lông nỉ',
      'Điều chỉnh độ dài lông',
      'Tốc độ cao',
    ],
    applications: ['fleece_fabric', 'sweatshirt', 'blanket', 'sportswear'],
    moq: 1,
    unit: 'machine',
    estimated_price_usd: 35000,
    price_valid_until: '2026-12-31',
    warranty_months: 12,
    lead_time_days: 45,
    origin: 'CN',
    hs_code: '84471100',
    is_active: true,
  },
  {
    supplier_code: 'EASTINO',
    sku: 'E-S6T-30-108',
    name: 'Single Jersey 6 Tread Circular Knitting Machine',
    short_name: 'SJ 6-Tread',
    category: 'single_jersey',
    subcategory: 'multi_thread',
    description:
      'Máy dệt 6 đường sợi, dùng cho vải có cấu trúc phức tạp, độ dày cao.',
    specifications: {
      diameter_inch: 30,
      gauge: 108,
      feeders: 72,
      tracks: 6,
      motor_power_kw: 5.5,
      voltage: '380V/3P/50Hz',
      speed_rpm: 28,
      weight_kg: 3400,
    },
    features: ['6 đường sợi độc lập', 'Tạo vải dày, ấm', 'Ứng dụng đa dạng'],
    applications: ['heavy_fabric', 'winter_wear', 'technical_fabric'],
    moq: 1,
    unit: 'machine',
    estimated_price_usd: 38000,
    price_valid_until: '2026-12-31',
    warranty_months: 12,
    lead_time_days: 45,
    origin: 'CN',
    hs_code: '84471100',
    is_active: true,
  },
  {
    supplier_code: 'EASTINO',
    sku: 'E-S6F-30-72',
    name: 'Single Jersey 6-Track Fleece Machine',
    short_name: 'SJ 6-Track Fleece',
    category: 'single_jersey',
    subcategory: 'fleece',
    description: 'Máy nỉ 6 đường chạy, chuyên dùng cho vải nỉ chất lượng cao.',
    specifications: {
      diameter_inch: 30,
      gauge: 72,
      feeders: 72,
      tracks: 6,
      motor_power_kw: 5.5,
      voltage: '380V/3P/50Hz',
      speed_rpm: 24,
      weight_kg: 3600,
    },
    features: [
      '6 đường chạy riêng biệt',
      'Nỉ dày, đều',
      'Tiết kiệm nguyên liệu',
    ],
    applications: ['premium_fleece', 'outdoor_wear', 'home_textile'],
    moq: 1,
    unit: 'machine',
    estimated_price_usd: 40000,
    price_valid_until: '2026-12-31',
    warranty_months: 12,
    lead_time_days: 45,
    origin: 'CN',
    hs_code: '84471100',
    is_active: true,
  },
  {
    supplier_code: 'EASTINO',
    sku: 'E-SSU-26-108',
    name: 'Single Seamless Underwear Knitting Machine',
    short_name: 'Seamless Underwear',
    category: 'single_jersey',
    subcategory: 'seamless',
    description: 'Máy dệt liền khối đồ lót, không đường may, ôm sát cơ thể.',
    specifications: {
      diameter_inch: 26,
      gauge: 108,
      feeders: 48,
      tracks: 4,
      motor_power_kw: 3.7,
      voltage: '380V/3P/50Hz',
      speed_rpm: 35,
      weight_kg: 2200,
    },
    features: [
      'Dệt liền khối không đường may',
      'Kích thước nhỏ gọn',
      'Tốc độ cao',
      'Phù hợp đồ lót, áo thun body',
    ],
    applications: ['underwear', 'leggings', 'sportswear', 'compression_wear'],
    moq: 1,
    unit: 'machine',
    estimated_price_usd: 32000,
    price_valid_until: '2026-12-31',
    warranty_months: 12,
    lead_time_days: 45,
    origin: 'CN',
    hs_code: '84471100',
    is_active: true,
  },
  {
    supplier_code: 'EASTINO',
    sku: 'E-SNB-30-72',
    name: 'Single Jersey Net Bag Circular Knitting Machine',
    short_name: 'Net Bag Machine',
    category: 'single_jersey',
    subcategory: 'net_bag',
    description: 'Máy dệt túi lưới, túi đựng rau củ, hành tây, hoa quả.',
    specifications: {
      diameter_inch: 30,
      gauge: 72,
      feeders: 48,
      tracks: 2,
      motor_power_kw: 3.7,
      voltage: '380V/3P/50Hz',
      speed_rpm: 40,
      weight_kg: 2500,
    },
    features: [
      'Lưới đều, bền',
      'Tốc độ sản xuất cao',
      'Dễ điều chỉnh kích thước lưới',
    ],
    applications: ['vegetable_bag', 'fruit_bag', 'packaging_net'],
    moq: 1,
    unit: 'machine',
    estimated_price_usd: 25000,
    price_valid_until: '2026-12-31',
    warranty_months: 12,
    lead_time_days: 30,
    origin: 'CN',
    hs_code: '84471100',
    is_active: true,
  },
  {
    supplier_code: 'EASTINO',
    sku: 'E-SDT-20-48',
    name: 'Small Diameter Single Jersey Circular Knitting Machine',
    short_name: 'Small Diameter SJ',
    category: 'single_jersey',
    subcategory: 'small_diameter',
    description:
      'Máy dệt đường kính nhỏ, dùng cho vải ống cỡ nhỏ, găng tay, ống tay.',
    specifications: {
      diameter_inch: 20,
      gauge: 48,
      feeders: 36,
      tracks: 4,
      motor_power_kw: 2.2,
      voltage: '380V/3P/50Hz',
      speed_rpm: 45,
      weight_kg: 1800,
    },
    features: [
      'Đường kính nhỏ 20"',
      'Tốc độ rất cao',
      'Phù hợp sản xuất ống nhỏ',
    ],
    applications: ['glove', 'sleeve', 'small_tube', 'accessories'],
    moq: 2,
    unit: 'machine',
    estimated_price_usd: 18000,
    price_valid_until: '2026-12-31',
    warranty_months: 12,
    lead_time_days: 30,
    origin: 'CN',
    hs_code: '84471100',
    is_active: true,
  },

  // ═══════════════════════════════════════════════════════════
  // ACCESSORIES - Phụ kiện
  // ═══════════════════════════════════════════════════════════
  {
    supplier_code: 'EASTINO',
    sku: 'E-FTD-UNI',
    name: 'Fabric Take Down System for Circular Knitting Machine',
    short_name: 'Take Down System',
    category: 'accessories',
    subcategory: 'take_down',
    description: 'Hệ thống kéo vải xuống tự động, điều chỉnh lực căng vải đều.',
    specifications: {
      compatible_machines: ['single_jersey', 'double_jersey'],
      voltage: '220V',
      control_type: 'electronic',
    },
    features: [
      'Điều chỉnh lực căng tự động',
      'Phù hợp nhiều loại máy',
      'Dễ lắp đặt',
    ],
    moq: 1,
    unit: 'set',
    estimated_price_usd: 2500,
    price_valid_until: '2026-12-31',
    warranty_months: 6,
    lead_time_days: 15,
    origin: 'CN',
    hs_code: '84485900',
    is_active: true,
  },
  {
    supplier_code: 'EASTINO',
    sku: 'E-AO-UNI',
    name: 'Auto Oiler for Circular Knitting Machine',
    short_name: 'Auto Oiler',
    category: 'accessories',
    subcategory: 'lubrication',
    description:
      'Hệ thống bôi trơn tự động cho máy dệt kim, giảm ma sát kim-cam.',
    specifications: {
      compatible_machines: ['single_jersey', 'double_jersey'],
      capacity_l: 5,
      control_type: 'pneumatic',
    },
    features: [
      'Bôi trơn tự động theo chu kỳ',
      'Tiết kiệm dầu',
      'Giảm hao mòn kim',
    ],
    moq: 1,
    unit: 'set',
    estimated_price_usd: 1200,
    price_valid_until: '2026-12-31',
    warranty_months: 6,
    lead_time_days: 15,
    origin: 'CN',
    hs_code: '84485900',
    is_active: true,
  },
  {
    supplier_code: 'EASTINO',
    sku: 'E-CR-UNI',
    name: 'Creel for Circular Knitting Machine',
    short_name: 'Yarn Creel',
    category: 'accessories',
    subcategory: 'creel',
    description: 'Giá treo sợi (creel) cho máy dệt, tổ chức cone sợi gọn gàng.',
    specifications: {
      compatible_machines: ['single_jersey', 'double_jersey'],
      capacity_cones: 72,
      material: 'steel',
    },
    features: ['Sức chứa 72 cone', 'Điều chỉnh được', 'Chất liệu thép bền'],
    moq: 1,
    unit: 'set',
    estimated_price_usd: 800,
    price_valid_until: '2026-12-31',
    warranty_months: 6,
    lead_time_days: 15,
    origin: 'CN',
    hs_code: '84485900',
    is_active: true,
  },
  {
    supplier_code: 'EASTINO',
    sku: 'E-ND-UNI',
    name: 'Needle Detector of Circular Knitting Machine',
    short_name: 'Needle Detector',
    category: 'accessories',
    subcategory: 'quality_control',
    description: 'Thiết bị phát hiện lỗi kim, kim gãy, giúp giảm phế phẩm.',
    specifications: {
      compatible_machines: ['single_jersey', 'double_jersey'],
      detection_type: 'optical',
      alarm_type: 'audio_visual',
    },
    features: [
      'Phát hiện kim gãy tự động',
      'Báo động âm thanh + đèn',
      'Dừng máy an toàn',
    ],
    moq: 1,
    unit: 'set',
    estimated_price_usd: 1500,
    price_valid_until: '2026-12-31',
    warranty_months: 6,
    lead_time_days: 15,
    origin: 'CN',
    hs_code: '84485900',
    is_active: true,
  },
];

/**
 * Export tất cả seed data cho Eastino
 */
export const eastinoSeedData = {
  supplier: eastinoSupplier,
  machines: eastinoMachineCatalog,
  metadata: {
    total_products: eastinoMachineCatalog.length,
    categories: [...new Set(eastinoMachineCatalog.map((m) => m.category))],
    price_range: (() => {
      const prices = eastinoMachineCatalog
        .map((m) => m.estimated_price_usd)
        .filter((p): p is number => p !== undefined);
      return {
        min: prices.length > 0 ? Math.min(...prices) : 0,
        max: prices.length > 0 ? Math.max(...prices) : 0,
      };
    })(),
    extraction_source: 'https://www.eastinoknittingmachine.com',
    extracted_at: '2026-05-05',
    verified: false, // Cần liên hệ nhà cung cấp để xác nhận giá & tồn kho
  },
};

export default eastinoSeedData;
