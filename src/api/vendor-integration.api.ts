import type { YarnReceiptItemFormValues } from '@/schema/yarn-receipt.schema';

/**
 * Giả lập API tích hợp với Nhà cung cấp (Vendor)
 * Trong thực tế, hàm này sẽ dùng fetch() hoặc axios() để gọi tới REST API của nhà cung cấp,
 * truyền vào barcode và nhận về JSON chứa các thông số.
 */
export async function fetchYarnSpecsFromVendorApi(
  barcode: string,
): Promise<Partial<YarnReceiptItemFormValues>> {
  // Giả lập mạng chậm 1 giây
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // Thực tế:
  // const res = await fetch(`https://api.vendor.com/v1/barcode/${barcode}`, {
  //   headers: { Authorization: `Bearer TOKEN` }
  // });
  // const data = await res.json();
  // return mapDataToForm(data);

  if (barcode === '240504001074') {
    return {
      yarnType: 'POLYESTER TEXTURED YARN (DTY) 333dtex/96f',
      colorName: 'RAW WHITE (11-1001TCX)',
      quantity: 35.8, // Net Weight
      unit: 'kg',
      unitPrice: 0,
      lotNumber: '17S0132W',
      grade: 'B',
      dtex: '333dtex/96f',
      twist: 'Z',
      machineNo: 'B755',
      notes: `Q'TY: 6 cuộn | G.WT: 38.5 KGS`,
    };
  }

  if (barcode === '2510-F000016') {
    return {
      yarnType: 'CREORA Spandex H350 Clear',
      colorName: 'Clear',
      quantity: 34.2, // Net Wt
      unit: 'kg',
      unitPrice: 0,
      lotNumber: '4088V',
      grade: 'AA',
      dtex: '40 (44DTex)',
      twist: '',
      machineNo: '',
      notes: `Gross Wt: 40.27Kg | Nom Wt: 570g | Units: 60`,
    };
  }

  if (barcode === '2604-F000005' || barcode === 'DSPZH35CZ7088V014') {
    return {
      yarnType: 'CREORA Spandex H350 Clear',
      colorName: 'Clear',
      quantity: 34.2, // Net Wt
      unit: 'kg',
      unitPrice: 0,
      lotNumber: '7088V',
      grade: 'AA',
      dtex: '70 (77DTex)',
      twist: '',
      machineNo: '6384',
      notes: `Gross Wt: 40.06Kg | Nom Wt: 570g | Units: 60`,
    };
  }

  throw new Error('Barcode không tồn tại hoặc lỗi kết nối API NCC!');
}
