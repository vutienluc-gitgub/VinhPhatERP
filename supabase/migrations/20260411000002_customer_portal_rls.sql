-- Migration: Customer Portal RLS Policies
-- Cách ly dữ liệu: customer chỉ thấy bản ghi của chính mình
-- orders: customer chỉ thấy đơn của mình
CREATE POLICY "customer_portal_orders_select" ON orders FOR
SELECT USING (
        auth.uid() IN (
            SELECT id
            FROM profiles
            WHERE customer_id = orders.customer_id
        )
    );
-- payments: customer chỉ thấy phiếu thu của mình
CREATE POLICY "customer_portal_payments_select" ON payments FOR
SELECT USING (
        auth.uid() IN (
            SELECT id
            FROM profiles
            WHERE customer_id = payments.customer_id
        )
    );
-- shipments: customer chỉ thấy phiếu giao của mình
CREATE POLICY "customer_portal_shipments_select" ON shipments FOR
SELECT USING (
        auth.uid() IN (
            SELECT id
            FROM profiles
            WHERE customer_id = shipments.customer_id
        )
    );
-- order_progress: thông qua orders
CREATE POLICY "customer_portal_order_progress_select" ON order_progress FOR
SELECT USING (
        EXISTS (
            SELECT 1
            FROM orders o
                JOIN profiles p ON p.customer_id = o.customer_id
            WHERE o.id = order_progress.order_id
                AND p.id = auth.uid()
        )
    );
-- order_items: thông qua orders
CREATE POLICY "customer_portal_order_items_select" ON order_items FOR
SELECT USING (
        EXISTS (
            SELECT 1
            FROM orders o
                JOIN profiles p ON p.customer_id = o.customer_id
            WHERE o.id = order_items.order_id
                AND p.id = auth.uid()
        )
    );
-- shipment_items: thông qua shipments
CREATE POLICY "customer_portal_shipment_items_select" ON shipment_items FOR
SELECT USING (
        EXISTS (
            SELECT 1
            FROM shipments s
                JOIN profiles p ON p.customer_id = s.customer_id
            WHERE s.id = shipment_items.shipment_id
                AND p.id = auth.uid()
        )
    );