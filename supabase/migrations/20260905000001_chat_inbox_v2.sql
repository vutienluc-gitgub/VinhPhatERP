-- ============================================================
-- RPC: rpc_get_my_chat_rooms_v2
-- Reason: Replace unpaginated v1 and eliminate client fan-out.
-- Consumer: src/features/chat/ChatInboxDrawer.tsx
-- Deprecation Notice: rpc_get_my_chat_rooms (v1) is marked DEPRECATED.
-- Migration Deadline: v3.1 cleanup sprint
-- ============================================================

CREATE OR REPLACE FUNCTION rpc_get_my_chat_rooms_v2(
  p_limit INT DEFAULT 20,
  p_cursor_updated_at TIMESTAMPTZ DEFAULT NULL,
  p_cursor_room_id UUID DEFAULT NULL
)
RETURNS TABLE(
  room_id UUID,
  entity_type TEXT,
  entity_id UUID,
  entity_name TEXT,
  entity_code TEXT,
  room_status TEXT,
  updated_at TIMESTAMPTZ,
  unread_count BIGINT,
  last_message TEXT,
  last_message_at TIMESTAMPTZ,
  last_message_type TEXT
)
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    r.id AS room_id,
    r.entity_type::TEXT,
    r.entity_id,
    COALESCE(
      c.name,
      'Lô hàng ' || s.shipment_number,
      'Đơn hàng ' || o.order_number,
      'Lệnh SX ' || w.work_order_number,
      'Phiếu nhập sợi ' || yr.receipt_number,
      'Cuộn mộc ' || rfr.roll_number,
      'Phòng ' || r.entity_type::TEXT
    ) AS entity_name,
    COALESCE(
      c.code,
      s.shipment_number,
      o.order_number,
      w.work_order_number,
      yr.receipt_number,
      rfr.roll_number,
      ''
    ) AS entity_code,
    r.status::TEXT AS room_status,
    r.updated_at,
    (
      SELECT COUNT(*)
      FROM chat_messages m
      WHERE m.room_id = r.id
        AND m.deleted_at IS NULL
        AND m.message_type NOT IN ('system', 'system_epod')
        AND m.sender_id IS DISTINCT FROM auth.uid()
        AND (p.last_read_at IS NULL OR m.created_at > p.last_read_at)
    ) AS unread_count,
    lm.content AS last_message,
    lm.created_at AS last_message_at,
    lm.message_type::TEXT AS last_message_type
  FROM chat_room_participants p
  JOIN chat_rooms r ON r.id = p.room_id
  LEFT JOIN customers c ON r.entity_type = 'customer' AND r.entity_id = c.id
  LEFT JOIN shipments s ON r.entity_type = 'shipment' AND r.entity_id = s.id
  LEFT JOIN orders o ON r.entity_type = 'order' AND r.entity_id = o.id
  LEFT JOIN work_orders w ON r.entity_type = 'work_order' AND r.entity_id = w.id
  LEFT JOIN yarn_receipts yr ON r.entity_type = 'yarn_receipt' AND r.entity_id = yr.id
  LEFT JOIN raw_fabric_rolls rfr ON r.entity_type = 'raw_fabric' AND r.entity_id = rfr.id
  LEFT JOIN LATERAL (
    SELECT cm.content, cm.created_at, cm.message_type
    FROM chat_messages cm
    WHERE cm.room_id = r.id
      AND cm.deleted_at IS NULL
    ORDER BY cm.created_at DESC
    LIMIT 1
  ) lm ON TRUE
  WHERE p.user_id = auth.uid()
    AND (r.tenant_id = (SELECT current_tenant_id()) OR (SELECT current_tenant_id()) IS NULL)
    AND (
      p_cursor_updated_at IS NULL OR
      COALESCE(lm.created_at, r.updated_at) < p_cursor_updated_at OR
      (COALESCE(lm.created_at, r.updated_at) = p_cursor_updated_at AND r.id < p_cursor_room_id)
    )
  ORDER BY COALESCE(lm.created_at, r.updated_at) DESC, r.id DESC
  LIMIT p_limit;
END;
$$;

GRANT EXECUTE ON FUNCTION rpc_get_my_chat_rooms_v2(INT, TIMESTAMPTZ, UUID) TO authenticated;

COMMENT ON FUNCTION rpc_get_my_chat_rooms() IS '@deprecated: Use rpc_get_my_chat_rooms_v2 instead. Scheduled for removal in v3.1.';
