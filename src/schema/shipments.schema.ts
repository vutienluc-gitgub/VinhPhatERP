import { z } from 'zod';

/**
 * Schema for creating a shipment from finished fabric rolls.
 * Validates selected customer, shipment date, and selected rolls.
 */
export const CreateShipmentFromFinishedSchema = z.object({
  customerId: z.string().uuid('Vui lòng chọn khách hàng hợp lệ'),
  shipmentDate: z.string().min(1, 'Vui lòng chọn ngày xuất kho'),
  rollIds: z
    .array(z.string().uuid())
    .min(1, 'Vui lòng chọn ít nhất một cuộn vải để xuất kho'),
  pricePerMeter: z.number().min(0, 'Giá không được âm').default(0),
});

/**
 * Domain model for shipment creation from finished fabric.
 */
export type CreateShipmentFromFinishedInput = z.infer<
  typeof CreateShipmentFromFinishedSchema
>;
