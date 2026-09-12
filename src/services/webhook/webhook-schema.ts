import { z } from 'zod';

/**
 * UUID regular expression pattern
 */
export const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Allowed Order Status Lifecycle Enum
 */
export const OrderStatusEnum = z.enum([
  'draft',
  'pending',
  'confirmed',
  'processing',
  'completed',
  'cancelled',
]);

export type OrderStatus = z.infer<typeof OrderStatusEnum>;

/**
 * Inbound Webhook Headers Schema
 */
export const InboundWebhookHeadersSchema = z.object({
  'x-webhook-signature': z.string().min(1, 'x-webhook-signature is required'),
  'x-webhook-timestamp': z
    .string()
    .regex(/^\d+$/, 'x-webhook-timestamp must be numeric epoch seconds'),
  'x-webhook-id': z.string().min(1, 'x-webhook-id is required'),
});

export type InboundWebhookHeaders = z.infer<typeof InboundWebhookHeadersSchema>;

/**
 * Chat Message Mention Schema
 */
export const ChatMentionSchema = z.object({
  type: z.enum(['user', 'role', 'document']),
  id: z.string().optional(),
  name: z.string().optional(),
});

/**
 * Chat Record Schema (from chat_messages table)
 */
export const ChatRecordSchema = z.object({
  id: z.string().regex(UUID_PATTERN, 'Message id must be a valid UUID'),
  room_id: z.string().regex(UUID_PATTERN, 'room_id must be a valid UUID'),
  sender_id: z
    .string()
    .regex(UUID_PATTERN, 'sender_id must be a valid UUID')
    .nullable()
    .optional(),
  content: z.string().min(1, 'content cannot be empty'),
  message_type: z.string().default('text'),
  mentions: z.array(ChatMentionSchema).optional().default([]),
  created_at: z.string().optional(),
});

/**
 * Chat AI Orchestrator Webhook Payload Schema
 */
export const ChatAiWebhookPayloadSchema = z.object({
  type: z.enum(['INSERT', 'UPDATE', 'DELETE']).default('INSERT'),
  event_id: z.string().optional(),
  table: z.string().optional(),
  schema: z.string().optional(),
  record: ChatRecordSchema,
});

export type ChatAiWebhookPayload = z.infer<typeof ChatAiWebhookPayloadSchema>;

/**
 * Notify Order Status Webhook Payload Schema
 */
export const OrderStatusWebhookPayloadSchema = z.object({
  orderId: z.string().regex(UUID_PATTERN, 'orderId must be a valid UUID'),
  newStatus: OrderStatusEnum,
  message: z
    .string()
    .max(500, 'message cannot exceed 500 characters')
    .optional(),
});

export type OrderStatusWebhookPayload = z.infer<
  typeof OrderStatusWebhookPayloadSchema
>;

/**
 * Push Notification Dispatch Payload Schema
 */
export const PushNotificationPayloadSchema = z.object({
  notification_id: z.string().regex(UUID_PATTERN).optional(),
  user_id: z.string().regex(UUID_PATTERN).optional(),
  domain: z.string().min(1).default('general'),
  type: z.string().optional(),
  title: z.string().min(1, 'title is required').max(150),
  body: z.string().max(500).default(''),
  entity_type: z.string().optional(),
  entity_id: z.string().optional(),
  action: z.string().default('view'),
  priority: z.enum(['normal', 'high', 'urgent']).default('normal'),
  metadata: z.record(z.unknown()).optional().default({}),
  message_id: z.string().optional(),
});

export type PushNotificationPayload = z.infer<
  typeof PushNotificationPayloadSchema
>;

/**
 * Safe Schema Validator Helper
 */
export function validateWebhookSchema<T>(
  data: unknown,
  schema: z.ZodSchema<T>,
): { success: true; data: T } | { success: false; errorMessage: string } {
  const result = schema.safeParse(data);
  if (!result.success) {
    const formattedErrors = result.error.issues
      .map((issue) => `${issue.path.join('.') || 'root'}: ${issue.message}`)
      .join('; ');
    return {
      success: false,
      errorMessage: `Schema validation error: ${formattedErrors}`,
    };
  }
  return {
    success: true,
    data: result.data,
  };
}
