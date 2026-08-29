import { supabase, untypedDb } from '@/services/supabase/client';
import type { Json } from '@/services/supabase/database.types';
import {
  CHAT_MESSAGES_PAGE_SIZE,
  chatMessageResponseSchema,
} from '@/schema/chat.schema';
import type {
  ChatMessage,
  ChatRoom,
  ChatMention,
  UnifiedTimelineItem,
} from '@/schema/chat.schema';

function toError(error: unknown, fallbackMessage: string): Error {
  if (error instanceof Error) return error;
  if (error && typeof error === 'object') {
    const errRecord = error as Record<string, unknown>;
    const msg =
      (typeof errRecord.message === 'string' && errRecord.message) ||
      (typeof errRecord.details === 'string' && errRecord.details) ||
      (typeof errRecord.hint === 'string' && errRecord.hint) ||
      fallbackMessage;
    return new Error(msg);
  }
  return new Error(String(error || fallbackMessage));
}

// ── Get or Create Room (Atomic) ──

export async function getOrCreateChatRoom(
  entityType: string,
  entityId: string,
): Promise<string> {
  // Guard: ensure user is authenticated before calling RPC
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    throw new Error('Authentication session required to access chat rooms');
  }

  const { data, error } = await supabase.rpc('rpc_get_or_create_chat_room', {
    p_entity_type: entityType,
    p_entity_id: entityId,
  });

  if (error) {
    console.error(
      '[Chat] getOrCreateChatRoom error:',
      error.message,
      error.hint,
      error.code,
      error.details,
    );
    throw toError(error, 'Không thể tạo hoặc lấy thông tin phòng chat');
  }
  return data as string;
}

// ── Fetch Room by Entity ──

export async function fetchChatRoomByEntity(
  entityType: string,
  entityId: string,
): Promise<ChatRoom | null> {
  const { data, error } = await supabase
    .from('chat_rooms')
    .select('*')
    .eq('entity_type', entityType)
    .eq('entity_id', entityId)
    .maybeSingle();

  if (error) {
    console.error(
      '[Chat] fetchChatRoomByEntity error:',
      error.message,
      error.hint,
      error.code,
      error.details,
    );
    throw toError(error, 'Không thể tìm phòng chat theo đối tượng');
  }
  return data as ChatRoom | null;
}

// ── Fetch Messages (paginated, cursor-based) ──

export async function fetchChatMessages(
  roomId: string,
  cursor?: string,
): Promise<ChatMessage[]> {
  const { data, error } = await untypedDb.rpc('rpc_get_chat_messages', {
    p_room_id: roomId,
    p_cursor: cursor ?? undefined,
    p_limit: CHAT_MESSAGES_PAGE_SIZE,
  });

  if (error) {
    console.error(
      '[Chat] fetchChatMessages error:',
      error.message,
      error.hint,
      error.code,
      error.details,
    );
    throw toError(error, 'Không thể tải danh sách tin nhắn');
  }

  return (data as ChatMessage[]) ?? [];
}

// ── Send Message (via RPC — uses same tenant resolution as RLS) ──

export async function sendChatMessage(params: {
  roomId: string;
  clientId: string;
  content?: string;
  messageType?: string;
  imageUrl?: string;
  fileUrl?: string;
  fileName?: string;
  fileType?: string;
  mentions?: ChatMention[];
  replyToId?: string | null;
  replyToMessage?: ChatMessage['reply_to_message'];
}): Promise<ChatMessage> {
  const { data, error } = await untypedDb.rpc('rpc_send_chat_message', {
    p_client_id: params.clientId,
    p_room_id: params.roomId,
    p_content: params.content || '',
    p_message_type: params.messageType ?? 'text',
    p_image_url: params.imageUrl ?? undefined,
    p_mentions: params.mentions
      ? (params.mentions as unknown as Json)
      : undefined,
    p_file_url: params.fileUrl ?? undefined,
    p_file_name: params.fileName ?? undefined,
    p_file_type: params.fileType ?? undefined,
    p_reply_to_id: params.replyToId ?? undefined,
    p_reply_to_message: params.replyToMessage
      ? (params.replyToMessage as unknown as Json)
      : undefined,
  });

  if (error) {
    console.error(
      '[Chat] sendChatMessage error:',
      error.message,
      error.hint,
      error.code,
      error.details,
    );
    throw toError(error, 'Không thể gửi tin nhắn');
  }

  const messageId = data as string;

  // 1. Attempt non-blocking DB read for triggers/timestamps
  const { data: msg } = await supabase
    .from('chat_messages')
    .select('*')
    .eq('id', messageId)
    .maybeSingle();

  if (msg) {
    return msg as ChatMessage;
  }

  // 2. Authoritative client construction (never reject when RPC insert succeeded)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return {
    id: messageId,
    client_id: params.clientId,
    tenant_id: '',
    room_id: params.roomId,
    sender_id: user?.id ?? null,
    message_type: (params.messageType ?? 'text') as
      | 'text'
      | 'image'
      | 'file'
      | 'system',
    content: params.content || '',
    image_url: params.imageUrl ?? null,
    file_url: params.fileUrl ?? null,
    file_name: params.fileName ?? null,
    file_type: params.fileType ?? null,
    reply_to_id: params.replyToId ?? null,
    reply_to_message: params.replyToMessage ?? null,
    status: 'sent',
    is_pinned: false,
    pinned_at: null,
    pinned_by: null,
    mentions: params.mentions ?? [],
    reactions: [],
    created_at: new Date().toISOString(),
    deleted_at: null,
  };
}

// ── Update Read Receipt ──

export async function updateReadReceipt(
  roomId: string,
  lastMessageId?: string,
): Promise<void> {
  // Get current user to filter correctly
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  const updatePayload: {
    last_read_at: string;
    last_read_message_id?: string;
    unread_count: number;
  } = {
    last_read_at: new Date().toISOString(),
    unread_count: 0,
  };
  if (lastMessageId) {
    updatePayload.last_read_message_id = lastMessageId;
  }

  const { error } = await supabase
    .from('chat_room_participants')
    .update(updatePayload)
    .eq('room_id', roomId)
    .eq('user_id', user.id);

  if (error) {
    console.error('[Chat] updateReadReceipt error:', error);
    throw toError(error, 'Không thể cập nhật trạng thái đã đọc');
  }
}

export type MyChatRoomSummary = {
  roomId: string;
  entityType: string;
  entityId: string;
  roomStatus: string;
  updatedAt: string;
  unreadCount: number;
  lastMessage: string | null;
  lastMessageAt: string | null;
  lastMessageType: string | null;
  // Computed fields on client
  entityName?: string;
  entityCode?: string;
};

export async function fetchMyChatRooms(): Promise<MyChatRoomSummary[]> {
  const { data, error } = await supabase.rpc('rpc_get_my_chat_rooms');

  if (error) {
    throw toError(error, 'Không thể tải danh sách phòng chat');
  }
  if (!data || data.length === 0) return [];

  // Data contains basic info, we need to fetch entity details
  // Collect IDs by type
  const entityMap = new Map<string, Set<string>>();
  for (const row of data) {
    if (!entityMap.has(row.entity_type)) {
      entityMap.set(row.entity_type, new Set());
    }
    entityMap.get(row.entity_type)!.add(row.entity_id);
  }

  // Fetch details for each type
  const detailsMap = new Map<string, { name: string; code: string }>();

  await Promise.all(
    Array.from(entityMap.entries()).map(async ([type, ids]) => {
      const idArray = Array.from(ids);
      if (type === 'customer') {
        const { data: customers } = await supabase
          .from('customers')
          .select('id, name, code')
          .in('id', idArray);
        customers?.forEach((c) => {
          detailsMap.set(c.id, { name: c.name, code: c.code });
        });
      } else if (type === 'shipment') {
        const { data: shipments } = await supabase
          .from('shipments')
          .select('id, shipment_number')
          .in('id', idArray);
        shipments?.forEach((s) => {
          detailsMap.set(s.id, {
            name: `Lô hàng ${s.shipment_number}`,
            code: s.shipment_number,
          });
        });
      } else if (type === 'order') {
        const { data: orders } = await supabase
          .from('orders')
          .select('id, order_number')
          .in('id', idArray);
        orders?.forEach((o) => {
          detailsMap.set(o.id, {
            name: `Đơn hàng ${o.order_number}`,
            code: o.order_number,
          });
        });
      } else if (type === 'work_order') {
        const { data: wos } = await supabase
          .from('work_orders')
          .select('id, work_order_number')
          .in('id', idArray);
        wos?.forEach((w) => {
          detailsMap.set(w.id, {
            name: `Lệnh sản xuất ${w.work_order_number}`,
            code: w.work_order_number,
          });
        });
      } else if (type === 'yarn_receipt') {
        const { data: receipts } = await supabase
          .from('yarn_receipts')
          .select('id, receipt_number')
          .in('id', idArray);
        receipts?.forEach((r) => {
          detailsMap.set(r.id, {
            name: `Phiếu nhập sợi ${r.receipt_number}`,
            code: r.receipt_number,
          });
        });
      } else if (type === 'raw_fabric') {
        const { data: rolls } = await supabase
          .from('raw_fabric_rolls')
          .select('id, roll_number')
          .in('id', idArray);
        rolls?.forEach((r) => {
          detailsMap.set(r.id, {
            name: `Vải thô ${r.roll_number}`,
            code: r.roll_number,
          });
        });
      } else if (type === 'finished_fabric') {
        const { data: fabrics } = await supabase
          .from('finished_fabric_rolls')
          .select('id, roll_number')
          .in('id', idArray);
        fabrics?.forEach((f) => {
          detailsMap.set(f.id, {
            name: `Vải thành phẩm ${f.roll_number}`,
            code: f.roll_number,
          });
        });
      } else if (type === 'purchase_order') {
        const { data: pos } = await supabase
          .from('purchase_orders')
          .select('id, po_code')
          .in('id', idArray);
        pos?.forEach((p) => {
          detailsMap.set(p.id, {
            name: `PO ${p.po_code}`,
            code: p.po_code,
          });
        });
      } else if (type === 'supplier') {
        const { data: suppliers } = await supabase
          .from('suppliers')
          .select('id, name, code')
          .in('id', idArray);
        suppliers?.forEach((s) => {
          detailsMap.set(s.id, {
            name: s.name,
            code: s.code,
          });
        });
      }
    }),
  );

  return data.map((row) => {
    const details = detailsMap.get(row.entity_id);
    const typeLabel =
      row.entity_type === 'shipment'
        ? 'Lô hàng'
        : row.entity_type === 'order'
          ? 'Đơn hàng'
          : row.entity_type === 'customer'
            ? 'Khách hàng'
            : row.entity_type === 'supplier'
              ? 'Nhà cung cấp'
              : row.entity_type;
    return {
      roomId: row.room_id,
      entityType: row.entity_type,
      entityId: row.entity_id,
      roomStatus: row.room_status,
      updatedAt: row.updated_at,
      unreadCount: Number(row.unread_count),
      lastMessage: row.last_message,
      lastMessageAt: row.last_message_at,
      lastMessageType: row.last_message_type,
      entityName: details?.name || `${typeLabel} #${row.entity_id.slice(0, 8)}`,
      entityCode: details?.code || '',
    };
  });
}

// ── Pin Messages ──

export async function togglePinMessage(messageId: string): Promise<boolean> {
  const { data, error } = await supabase.rpc('rpc_toggle_pin_message', {
    p_message_id: messageId,
  });
  if (error) throw toError(error, 'Không thể ghim tin nhắn');
  return data as boolean;
}

export async function fetchPinnedMessages(
  roomId: string,
): Promise<ChatMessage[]> {
  const { data, error } = await supabase.rpc('rpc_get_pinned_messages', {
    p_room_id: roomId,
  });
  if (error) throw toError(error, 'Không thể tải tin nhắn đã ghim');

  const parsed = chatMessageResponseSchema
    .array()
    .parse(data ?? []) as unknown as ChatMessage[];
  return parsed;
}

// ── Soft Delete Message ──

export async function softDeleteMessage(messageId: string): Promise<void> {
  const { error } = await supabase
    .from('chat_messages')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', messageId);

  if (error) throw toError(error, 'Không thể xóa tin nhắn');
}

// ── Fetch Unread Count for a Room ──

export async function fetchUnreadCount(roomId: string): Promise<number> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return 0;

  // Get the user's unread_count for this room
  const { data: participant, error: pErr } = await supabase
    .from('chat_room_participants')
    .select('unread_count')
    .eq('room_id', roomId)
    .eq('user_id', user.id)
    .maybeSingle();

  if (pErr) {
    console.error('[Chat] fetchUnreadCount participant query error:', pErr);
    throw toError(pErr, 'Không thể tải số tin nhắn chưa đọc');
  }

  return participant?.unread_count ?? 0;
}

// ── Unified Timeline ──

export async function fetchUnifiedTimeline(params: {
  pageParam?: number;
  limit?: number;
}): Promise<UnifiedTimelineItem[]> {
  const limit = params.limit ?? 20;
  const offset = params.pageParam ?? 0;

  const { data, error } = await supabase.rpc('rpc_get_unified_timeline', {
    p_limit: limit,
    p_offset: offset,
  });

  if (error) {
    throw toError(error, 'Không thể tải bảng tin thống nhất');
  }

  return (data as unknown as UnifiedTimelineItem[]) || [];
}

// ── Message Reactions ──

export async function addReaction(
  messageId: string,
  emoji: string,
): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Authentication required');

  const { error } = await untypedDb
    .from('chat_message_reactions')
    .upsert(
      { message_id: messageId, emoji, user_id: user.id },
      { onConflict: 'message_id,user_id,emoji', ignoreDuplicates: true },
    );

  if (error) throw toError(error, 'Không thể thêm cảm xúc');
}

export async function removeReaction(
  messageId: string,
  emoji: string,
): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Authentication required');

  const { error } = await untypedDb
    .from('chat_message_reactions')
    .delete()
    .eq('message_id', messageId)
    .eq('user_id', user.id)
    .eq('emoji', emoji);

  if (error) throw toError(error, 'Không thể gỡ cảm xúc');
}

type ReactionRow = { emoji: string; user_id: string };

export async function fetchReactions(
  messageId: string,
): Promise<{ emoji: string; count: number; user_ids: string[] }[]> {
  const { data, error } = await untypedDb
    .from('chat_message_reactions')
    .select('emoji, user_id')
    .eq('message_id', messageId);

  if (error) throw toError(error, 'Không thể tải cảm xúc');

  // Group by emoji
  const grouped = new Map<
    string,
    { emoji: string; count: number; user_ids: string[] }
  >();
  for (const row of (data as ReactionRow[] | null) ?? []) {
    const existing = grouped.get(row.emoji);
    if (existing) {
      existing.count++;
      existing.user_ids.push(row.user_id);
    } else {
      grouped.set(row.emoji, {
        emoji: row.emoji,
        count: 1,
        user_ids: [row.user_id],
      });
    }
  }

  return Array.from(grouped.values());
}

// ── Search Messages ──

export async function searchMessages(params: {
  roomId: string;
  query: string;
}): Promise<ChatMessage[]> {
  if (!params.query.trim()) return [];

  const { data, error } = await supabase
    .from('chat_messages')
    .select('*')
    .eq('room_id', params.roomId)
    .ilike('content', `%${params.query}%`)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) throw toError(error, 'Không thể tìm kiếm tin nhắn');
  return (data as ChatMessage[]) ?? [];
}
