import { describe, expect, it } from 'vitest';

import {
  orderItemBaseSchema,
  FULFILLMENT_STATUS_LABELS,
  FULFILLMENT_STATUS_OPTIONS,
  type FulfillmentStatus,
} from '@/schema/order.schema';
import {
  deliveryTripSchema,
  deliveryTripStopSchema,
  podEvidenceSchema,
  TRIP_STATUS_LABELS,
  STOP_STATUS_LABELS,
} from '@/schema/delivery-trip.schema';

describe('Order Fulfillment Lifecycle Specification', () => {
  describe('Line-Item Fulfillment Statuses', () => {
    it('supports all 4 fulfillment statuses', () => {
      const statuses: FulfillmentStatus[] = [
        'unfulfilled',
        'partially_fulfilled',
        'fulfilled',
        'closed_shortage',
      ];
      statuses.forEach((status) => {
        expect(FULFILLMENT_STATUS_LABELS[status]).toBeDefined();
      });
      expect(FULFILLMENT_STATUS_OPTIONS).toHaveLength(4);
    });

    it('defaults fulfillmentStatus to unfulfilled when parsing order item', () => {
      const parsed = orderItemBaseSchema.parse({
        fabricType: 'Cotton 40s',
        quantity: 500,
        unitPrice: 75000,
      });

      expect(parsed.fulfillmentStatus).toBe('unfulfilled');
      expect(parsed.orderedQty).toBeUndefined();
    });

    it('allows setting line-level fulfillment tracking fields', () => {
      const parsed = orderItemBaseSchema.parse({
        fabricType: 'Cotton 40s',
        quantity: 500,
        unitPrice: 75000,
        orderedQty: 500,
        fulfilledQty: 300,
        returnedQty: 0,
        cancelledQty: 0,
        fulfillmentStatus: 'partially_fulfilled',
      });

      expect(parsed.fulfilledQty).toBe(300);
      expect(parsed.fulfillmentStatus).toBe('partially_fulfilled');
    });
  });

  describe('Delivery Trip & Multi-Stop Schema', () => {
    it('validates correct trip schema', () => {
      const validTrip = {
        tripNumber: 'TRIP-2026-0001',
        vehiclePlate: '51C-987.65',
        maxPayloadKg: 5000,
        notes: 'Chuyến giao Tân Bình - Bình Tân',
      };

      const parsed = deliveryTripSchema.parse(validTrip);
      expect(parsed.tripNumber).toBe('TRIP-2026-0001');
      expect(parsed.vehiclePlate).toBe('51C-987.65');
      expect(TRIP_STATUS_LABELS.in_transit).toBe('Đang vận chuyển');
    });

    it('validates trip stops with sequence order', () => {
      const validStop = {
        tripId: '550e8400-e29b-41d4-a716-446655440000',
        shipmentId: '550e8400-e29b-41d4-a716-446655440001',
        stopSequence: 1,
      };

      const parsed = deliveryTripStopSchema.parse(validStop);
      expect(parsed.stopSequence).toBe(1);
      expect(STOP_STATUS_LABELS.pending).toBe('Chờ giao');
    });
  });

  describe('POD Evidence Schema (Immutable ePOD)', () => {
    it('validates complete POD evidence capture', () => {
      const podData = {
        shipmentId: '550e8400-e29b-41d4-a716-446655440000',
        receiverName: 'Nguyễn Văn A',
        receiverPhone: '0901234567',
        signatureImageUrl: 'data:image/png;base64,signature_mock',
        evidencePhotos: ['https://storage.vp.vn/pod-photo-1.jpg'],
        geoLatitude: 10.762622,
        geoLongitude: 106.660172,
        notes: 'Đã nhận đủ 20 cuộn nguyên đai nguyên kiện',
      };

      const parsed = podEvidenceSchema.parse(podData);
      expect(parsed.receiverName).toBe('Nguyễn Văn A');
      expect(parsed.signatureImageUrl).toContain('data:image/png');
      expect(parsed.evidencePhotos).toHaveLength(1);
    });

    it('requires receiver name and signature image', () => {
      const invalidPod = {
        shipmentId: '550e8400-e29b-41d4-a716-446655440000',
        receiverName: '',
        signatureImageUrl: '',
      };

      const result = podEvidenceSchema.safeParse(invalidPod);
      expect(result.success).toBe(false);
    });
  });
});
