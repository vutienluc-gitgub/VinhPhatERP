import { describe, expect, it } from 'vitest';

import {
  buildShipmentPrintHtml,
  makeShipmentDocumentFileName,
  toShipmentDocumentRows,
} from './shipment-document';
import type { ShipmentDocument } from './types';

const shipmentFixture: ShipmentDocument = {
  id: 'shipment-1',
  shipment_number: 'XK2604-0001',
  order_id: 'order-1',
  customer_id: 'customer-1',
  shipment_date: '2026-04-02',
  delivery_address: '123 Duong Le Loi, Quan 1, TP.HCM',
  carrier: null,
  tracking_number: null,
  status: 'shipped',
  notes: 'Giao buoi sang',
  created_by: null,
  created_at: '2026-04-02T08:00:00.000Z',
  updated_at: '2026-04-02T08:30:00.000Z',
  delivery_staff_id: null,
  shipping_rate_id: null,
  shipping_cost: 0,
  loading_fee: 0,
  total_weight_kg: null,
  total_meters: null,
  vehicle_info: null,
  prepared_at: null,
  shipped_at: null,
  delivered_at: null,
  delivery_proof: null,
  receiver_name: null,
  receiver_phone: null,
  employee_id: null,
  tenant_id: null,
  journey_status: null,
  orders: { order_number: 'DH2604-0012' },
  customers: {
    name: 'Cong ty Det <B>',
    code: 'KH001',
    address: '456 Duong Nguyen Hue, Quan 1',
    phone: '0909123456',
    contact_person: 'Tran Thi A',
  },
  shipment_items: [
    {
      id: 'item-2',
      shipment_id: 'shipment-1',
      finished_roll_id: null,
      fabric_type: 'Cotton 65/35',
      color_name: null,
      quantity: 42,
      unit: 'm',
      notes: null,
      sort_order: 2,
      roll_number: null,
      roll_length_m: null,
      warehouse_location: null,
      price_per_meter: null,
      tenant_id: null,
      total_amount: null,
    },
    {
      id: 'item-1',
      shipment_id: 'shipment-1',
      finished_roll_id: 'roll-1',
      fabric_type: 'Kate Silk',
      color_name: 'Trang',
      quantity: 120.5,
      unit: 'm',
      notes: 'Canh met dau tien',
      sort_order: 1,
      roll_number: 'FIN-2604-0007',
      roll_length_m: 120.5,
      warehouse_location: 'A-R3',
      price_per_meter: null,
      tenant_id: null,
      total_amount: null,
    },
  ],
};

describe('shipment-document', () => {
  it('maps shipment items into sorted printable rows', () => {
    const rows = toShipmentDocumentRows(shipmentFixture);

    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({
      index: 1,
      rollNumber: 'FIN-2604-0007 (120,5m)',
      fabricType: 'Kate Silk',
      colorName: 'Trang',
      quantityText: '120,5 m',
    });
    expect(rows[1]).toMatchObject({
      index: 2,
      rollNumber: '—',
      colorName: '—',
      quantityText: '42 m',
    });
  });

  it('builds escaped printable html with shipment summary', () => {
    const { html } = buildShipmentPrintHtml(shipmentFixture);

    expect(html).toContain('Phiếu xuất kho');
    expect(html).toContain('XK2604-0001');
    expect(html).toContain('DH2604-0012');
    expect(html).toContain('Cong ty Det &lt;B&gt;');
    expect(html).toContain('Tổng số lượng:</strong> 162,5 m');
  });

  it('creates a stable shipment pdf file name', () => {
    expect(makeShipmentDocumentFileName(shipmentFixture)).toBe(
      'phieu_xuat_XK2604-0001_2026-04-02.pdf',
    );
  });
});
