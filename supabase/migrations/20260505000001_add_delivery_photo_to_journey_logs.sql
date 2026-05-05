-- Add photo_url to shipment_journey_logs for delivery proof images
-- Tài xế có thể chụp ảnh khi xác nhận giao hàng (delivered_confirmed)
-- NOTE: rpc_update_shipment_journey is updated in the next migration (20260505113739)

ALTER TABLE shipment_journey_logs
  ADD COLUMN IF NOT EXISTS photo_url TEXT;
