import { supabase } from '@/services/supabase/client';
import {
  chatMessageResponseSchema,
  CHAT_MESSAGES_PAGE_SIZE,
} from '@/schema/chat.schema';
import type { ChatMessage, ChatRoom } from '@/schema/chat.schema';

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
    throw error;
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
    throw error;
  }
  return data as ChatRoom | null;
}

// ── Fetch Messages (paginated, cursor-based) ──

export async function fetchChatMessages(
  roomId: string,
  cursor?: string,
): Promise<ChatMessage[]> {
  let query = supabase
    .from('chat_messages')
    .select('*')
    .eq('room_id', roomId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(CHAT_MESSAGES_PAGE_SIZE);

  if (cursor) {
    query = query.lt('created_at', cursor);
  }

  const { data, error } = await query;
  if (error) {
    console.error(
      '[Chat] fetchChatMessages error:',
      error.message,
      error.hint,
      error.code,
      error.details,
    );
    throw error;
  }

  const parsed = chatMessageResponseSchema
    .array()
    .parse(data ?? []) as unknown as ChatMessage[];

  return parsed;
}

// ── Send Message (via RPC — uses same tenant resolution as RLS) ──

export async function sendChatMessage(params: {
  roomId: string;
  clientId: string;
  content: string;
  messageType?: string;
  imageUrl?: string;
}): Promise<ChatMessage> {
  const { data, error } = await supabase.rpc('rpc_send_chat_message', {
    p_client_id: params.clientId,
    p_room_id: params.roomId,
    p_content: params.content,
    p_message_type: params.messageType ?? 'text',
    p_image_url: params.imageUrl ?? undefined,
  });

  if (error) {
    console.error(
      '[Chat] sendChatMessage error:',
      error.message,
      error.hint,
      error.code,
      error.details,
    );
    throw error;
  }

  // RPC returns message ID — fetch full row for cache reconciliation
  const messageId = data as string;
  const { data: msg, error: fetchErr } = await supabase
    .from('chat_messages')
    .select('*')
    .eq('id', messageId)
    .single();

  if (fetchErr) {
    console.error(
      '[Chat] fetchMessage after send error:',
      fetchErr.message,
      fetchErr.hint,
    );
    throw fetchErr;
  }

  return msg as ChatMessage;
}

// ── Update Read Receipt ──

export async function updateReadReceipt(
  roomId: string,
  lastMessageId: string,
): Promise<void> {
  // Get current user to filter correctly
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase
    .from('chat_room_participants')
    .update({
      last_read_message_id: lastMessageId,
      last_read_at: new Date().toISOString(),
    })
    .eq('room_id', roomId)
    .eq('user_id', user?.id ?? '');

  if (error) throw error;
}

// ── Fetch Customer Chat Rooms (for admin inbox) ──

export type CustomerChatRoomSummary = {
  roomId: string;
  customerId: string;
  customerName: string;
  customerCode: string;
  lastMessage: string | null;
  lastMessageAt: string | null;
  updatedAt: string;
};

export async function fetchCustomerChatRooms(): Promise<
  CustomerChatRoomSummary[]
> {
  const { data: rooms, error: rErr } = await supabase
    .from('chat_rooms')
    .select('id, entity_id, updated_at')
    .eq('entity_type', 'customer')
    .order('updated_at', { ascending: false });

  if (rErr) throw rErr;
  if (!rooms || rooms.length === 0) return [];

  const entityIds = rooms.map((r) => r.entity_id as string);

  const { data: customers, error: cErr } = await supabase
    .from('customers')
    .select('id, name, code')
    .in('id', entityIds);

  if (cErr) throw cErr;

  const customerMap = new Map(
    (customers ?? []).map((c) => [
      c.id as string,
      c as { id: string; name: string; code: string },
    ]),
  );

  const summaries = await Promise.all(
    rooms.map(async (room) => {
      const customer = customerMap.get(room.entity_id as string);
      const { data: msgs } = await supabase
        .from('chat_messages')
        .select('content, created_at, message_type')
        .eq('room_id', room.id as string)
        .is('deleted_at', null)
        .not('message_type', 'in', '("system","system_epod")')
        .order('created_at', { ascending: false })
        .limit(1);

      const last = msgs?.[0] ?? null;
      return {
        roomId: room.id as string,
        customerId: room.entity_id as string,
        customerName: customer?.name ?? 'Khách hàng',
        customerCode: customer?.code ?? '',
        lastMessage: last?.content ?? null,
        lastMessageAt: last?.created_at ?? null,
        updatedAt: room.updated_at as string,
      } satisfies CustomerChatRoomSummary;
    }),
  );

  return summaries;
}

// ── Soft Delete Message ──

export async function softDeleteMessage(messageId: string): Promise<void> {
  const { error } = await supabase
    .from('chat_messages')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', messageId);

  if (error) throw error;
}

// ── Fetch Unread Count for a Room ──

export async function fetchUnreadCount(roomId: string): Promise<number> {
  // Get the user's last_read_at for this room
  const { data: participant, error: pErr } = await supabase
    .from('chat_room_participants')
    .select('last_read_at')
    .eq('room_id', roomId)
    .maybeSingle();

  if (pErr) throw pErr;

  const lastReadAt = (participant as { last_read_at: string } | null)
    ?.last_read_at;

  // Count messages newer than last_read_at
  let query = supabase
    .from('chat_messages')
    .select('id', { count: 'exact', head: true })
    .eq('room_id', roomId)
    .is('deleted_at', null)
    .neq('message_type', 'system');

  if (lastReadAt) {
    query = query.gt('created_at', lastReadAt);
  }

  const { count, error: cErr } = await query;
  if (cErr) throw cErr;

  return count ?? 0;
}
