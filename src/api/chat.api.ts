import { untypedDb } from '@/services/supabase/untyped';
import { safeUpsertOne } from '@/lib/db-guard';
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
  const { data, error } = await untypedDb.rpc('rpc_get_or_create_chat_room', {
    p_entity_type: entityType,
    p_entity_id: entityId,
  });

  if (error) throw error;
  return data as string;
}

// ── Fetch Room by Entity ──

export async function fetchChatRoomByEntity(
  entityType: string,
  entityId: string,
): Promise<ChatRoom | null> {
  const { data, error } = await untypedDb
    .from('chat_rooms')
    .select('*')
    .eq('entity_type', entityType)
    .eq('entity_id', entityId)
    .maybeSingle();

  if (error) throw error;
  return data as ChatRoom | null;
}

// ── Fetch Messages (paginated, cursor-based) ──

export async function fetchChatMessages(
  roomId: string,
  cursor?: string,
): Promise<ChatMessage[]> {
  let query = untypedDb
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
  if (error) throw error;

  const parsed = chatMessageResponseSchema
    .array()
    .parse(data ?? []) as unknown as ChatMessage[];

  return parsed;
}

// ── Send Message ──

export async function sendChatMessage(params: {
  roomId: string;
  clientId: string;
  content: string;
  messageType?: string;
  imageUrl?: string;
}): Promise<ChatMessage> {
  const result = await safeUpsertOne({
    table: 'chat_messages',
    data: {
      client_id: params.clientId,
      room_id: params.roomId,
      content: params.content,
      message_type: params.messageType ?? 'text',
      image_url: params.imageUrl ?? null,
      status: 'sent',
    },
    conflictKey: 'client_id',
  });

  return result as ChatMessage;
}

// ── Update Read Receipt ──

export async function updateReadReceipt(
  roomId: string,
  lastMessageId: string,
): Promise<void> {
  const { error } = await untypedDb
    .from('chat_room_participants')
    .update({
      last_read_message_id: lastMessageId,
      last_read_at: new Date().toISOString(),
    })
    .eq('room_id', roomId);

  if (error) throw error;
}

// ── Soft Delete Message ──

export async function softDeleteMessage(messageId: string): Promise<void> {
  const { error } = await untypedDb
    .from('chat_messages')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', messageId);

  if (error) throw error;
}

// ── Fetch Unread Count for a Room ──

export async function fetchUnreadCount(roomId: string): Promise<number> {
  // Get the user's last_read_at for this room
  const { data: participant, error: pErr } = await untypedDb
    .from('chat_room_participants')
    .select('last_read_at')
    .eq('room_id', roomId)
    .maybeSingle();

  if (pErr) throw pErr;

  const lastReadAt = (participant as { last_read_at: string } | null)
    ?.last_read_at;

  // Count messages newer than last_read_at
  let query = untypedDb
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
