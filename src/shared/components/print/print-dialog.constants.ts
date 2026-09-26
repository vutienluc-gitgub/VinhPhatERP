export type PrintItem = {
  roll_number: string | null;
  fabric_type: string;
  color_name: string | null;
  quantity: number;
};

export const DEFAULT_PRINT_ITEMS: PrintItem[] = [
  {
    roll_number: 'C01',
    fabric_type: 'Vải Cotton 100% 2 chiều 230gsm',
    color_name: 'Trắng Sứ (W-01)',
    quantity: 120.5,
  },
  {
    roll_number: 'C02',
    fabric_type: 'Vải Cotton 100% 2 chiều 230gsm',
    color_name: 'Trắng Sứ (W-01)',
    quantity: 118.0,
  },
  {
    roll_number: 'C03',
    fabric_type: 'Vải CVC 65/35 Cá Sấu 4 chiều',
    color_name: 'Xanh Navy (NV-09)',
    quantity: 145.2,
  },
];
