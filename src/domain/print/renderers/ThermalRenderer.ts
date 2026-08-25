import type { PrintTemplateEntity } from '@/domain/print/types';

import { EscPosEncoder } from './EscPosEncoder';

export class ThermalRenderer {
  // Render K80 Receipt
  renderReceipt(
    _template: PrintTemplateEntity,
    data: {
      companyName?: string;
      docNumber: string;
      customerName: string;
      date: string;
      items: Array<{ name: string; qty: number; unit: string }>;
      totalMeters: number;
    },
  ): Uint8Array {
    const encoder = new EscPosEncoder();
    encoder
      .init()
      .align('center')
      .bold(true)
      .line(data.companyName || 'DET MAY VINH PHAT')
      .bold(false)
      .line('PHIEU XUAT KHO')
      .separator()
      .align('left')
      .line(`So: ${data.docNumber}`)
      .line(`Khach: ${data.customerName}`)
      .line(`Ngay: ${data.date}`)
      .separator();

    data.items.forEach((item, i) => {
      encoder.line(`${i + 1}. ${item.name}`);
      encoder.line(`   ${item.qty} ${item.unit}`);
    });

    encoder
      .separator()
      .bold(true)
      .line(`TONG: ${data.totalMeters.toFixed(1)} m`)
      .bold(false)
      .separator()
      .align('center')
      .barcodeCode128(data.docNumber)
      .line('Cam on quy khach!')
      .line()
      .line()
      .cut();

    return encoder.encode();
  }

  // Render Roll Barcode Label (Decal 75x50mm)
  renderRollLabel(data: {
    rollNumber: string;
    fabricType: string;
    meters: number;
    weightKg: number;
    colorName: string;
  }): Uint8Array {
    const encoder = new EscPosEncoder();
    encoder
      .init()
      .align('center')
      .bold(true)
      .line('DET MAY VINH PHAT')
      .bold(false)
      .line(`Cay: ${data.rollNumber} - Mau: ${data.colorName}`)
      .line(data.fabricType)
      .barcodeCode128(data.rollNumber, 40)
      .bold(true)
      .line(`Dai: ${data.meters}m  |  Nang: ${data.weightKg}kg`)
      .line()
      .cut();

    return encoder.encode();
  }
}
