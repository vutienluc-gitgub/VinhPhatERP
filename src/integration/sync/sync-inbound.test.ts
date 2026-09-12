import { describe, it, expect } from 'vitest';

import {
  parseShipmentImportRow,
  type RawShipmentImportRow,
} from '@/integration/sync/sheet-mappers/shipment-import.mapper';
import {
  parseOrderImportRow,
  type RawOrderImportRow,
} from '@/integration/sync/sheet-mappers/order-import.mapper';

describe('Inbound Import Mappers (Phase 3)', () => {
  describe('parseShipmentImportRow', () => {
    it('should successfully parse and validate a complete shipment import row', () => {
      const raw: RawShipmentImportRow = {
        _rowIndex: 2,
        'Import ID': 'IMP-XK-001',
        Ngay: '2026-09-12',
        'Khach hang': 'Công ty May Nhà Bè',
        'Ma VT': 'COTTON-60S',
        SL: 1500,
        'Ghi chu': 'Giao trong buổi sáng',
        'Trang thai': 'READY',
      };

      const result = parseShipmentImportRow(raw);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.importId).toBe('IMP-XK-001');
        expect(result.data.rowIndex).toBe(2);
        expect(result.data.customerName).toBe('Công ty May Nhà Bè');
        expect(result.data.materialCode).toBe('COTTON-60S');
        expect(result.data.quantity).toBe(1500);
        expect(result.data.notes).toBe('Giao trong buổi sáng');
        expect(result.data.shipmentDate).toContain('2026-09-12');
      }
    });

    it('should fail when customer name is missing', () => {
      const raw: RawShipmentImportRow = {
        _rowIndex: 3,
        'Khach hang': '',
        'Ma VT': 'COTTON-60S',
        SL: 100,
      };

      const result = parseShipmentImportRow(raw);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Thiếu thông tin khách hàng');
        expect(result.rowIndex).toBe(3);
      }
    });

    it('should fail when material code is missing', () => {
      const raw: RawShipmentImportRow = {
        _rowIndex: 4,
        'Khach hang': 'Công ty Dệt May',
        'Ma VT': '',
        SL: 100,
      };

      const result = parseShipmentImportRow(raw);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Thiếu mã vật tư');
      }
    });

    it('should fail when quantity is zero or negative or not a number', () => {
      const zeroQty = parseShipmentImportRow({
        _rowIndex: 5,
        'Khach hang': 'Cty A',
        'Ma VT': 'VT-01',
        SL: 0,
      });
      expect(zeroQty.success).toBe(false);

      const negativeQty = parseShipmentImportRow({
        _rowIndex: 6,
        'Khach hang': 'Cty A',
        'Ma VT': 'VT-01',
        SL: -50,
      });
      expect(negativeQty.success).toBe(false);

      const invalidQty = parseShipmentImportRow({
        _rowIndex: 7,
        'Khach hang': 'Cty A',
        'Ma VT': 'VT-01',
        SL: 'abc',
      });
      expect(invalidQty.success).toBe(false);
    });

    it('should correctly parse DD/MM/YYYY date strings', () => {
      const raw: RawShipmentImportRow = {
        _rowIndex: 8,
        Ngay: '25/12/2026',
        'Khach hang': 'Cty May Mặc',
        'Ma VT': 'VT-02',
        SL: 200,
      };

      const result = parseShipmentImportRow(raw);
      expect(result.success).toBe(true);
      if (result.success) {
        const d = new Date(result.data.shipmentDate);
        expect(d.getDate()).toBe(25);
        expect(d.getMonth()).toBe(11); // 0-indexed month
        expect(d.getFullYear()).toBe(2026);
      }
    });
  });

  describe('parseOrderImportRow', () => {
    it('should successfully parse and calculate totalAmount', () => {
      const raw: RawOrderImportRow = {
        _rowIndex: 2,
        'Import ID': 'IMP-DH-001',
        Ngay: '2026-09-12',
        'Khach hang': 'Đại lý Dệt Việt',
        'San pham': 'Vải Kaki Xanh',
        SL: 500,
        'Don gia': 120000,
        'Ghi chu': 'Hàng xuất khẩu',
      };

      const result = parseOrderImportRow(raw);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.importId).toBe('IMP-DH-001');
        expect(result.data.customerName).toBe('Đại lý Dệt Việt');
        expect(result.data.productName).toBe('Vải Kaki Xanh');
        expect(result.data.quantity).toBe(500);
        expect(result.data.unitPrice).toBe(120000);
        expect(result.data.totalAmount).toBe(60000000);
      }
    });

    it('should fail when product name is missing', () => {
      const raw: RawOrderImportRow = {
        _rowIndex: 3,
        'Khach hang': 'Đại lý Dệt',
        'San pham': '',
        SL: 200,
      };

      const result = parseOrderImportRow(raw);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Thiếu tên sản phẩm');
      }
    });

    it('should fail when unit price is negative', () => {
      const raw: RawOrderImportRow = {
        _rowIndex: 4,
        'Khach hang': 'Đại lý Dệt',
        'San pham': 'Vải Cotton',
        SL: 200,
        'Don gia': -1000,
      };

      const result = parseOrderImportRow(raw);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Đơn giá không hợp lệ');
      }
    });
  });
});
