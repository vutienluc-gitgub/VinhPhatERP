-- Thêm chính sách cho phép Khách hàng thiết lập Đơn hàng mới qua mạng (portal)

CREATE POLICY "customer_portal_orders_insert" ON orders FOR INSERT 
WITH CHECK (
    auth.uid() IN (
        SELECT id
        FROM profiles
        WHERE customer_id = orders.customer_id
    )
);

CREATE POLICY "customer_portal_order_items_insert" ON order_items FOR INSERT 
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM orders o
        JOIN profiles p ON p.customer_id = o.customer_id
        WHERE o.id = order_items.order_id
        AND p.id = auth.uid()
    )
);
