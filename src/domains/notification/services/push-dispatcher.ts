import { supabase } from '@/services/supabase/client';
import type { CreateNotificationInput } from '@/domains/notification/models/types';

export interface PushDispatchOptions {
  notificationId?: string;
  skipMasking?: boolean;
}

/**
 * Sanitizes push message body to guarantee enterprise privacy on lock screens
 */
export function sanitizePushPayloadBody(body: string): string {
  if (!body) return '';
  // Mask explicit monetary amount patterns (e.g. 1.250.000.000đ, 50.000.000 VND, 100,000$)
  return body.replace(
    /(\d{1,3}[.,]\d{3}[.,]\d{3}[.,]\d{3}|\d{1,3}[.,]\d{3}[.,]\d{3}|\d{1,3}[.,]\d{3})\s*(đ|VND|vnđ|USD|\$)/gi,
    '***',
  );
}

export class PushDispatcher {
  /**
   * Dispatches a Web Push notification to all active devices of a user.
   */
  static async dispatchPush(
    input: CreateNotificationInput,
    options: PushDispatchOptions = {},
  ): Promise<boolean> {
    try {
      const sanitizedBody = options.skipMasking
        ? input.body
        : sanitizePushPayloadBody(input.body);

      const payload = {
        notification_id: options.notificationId,
        user_id: input.user_id,
        domain: input.domain,
        type: input.type,
        title: input.title,
        body: sanitizedBody,
        entity_type: input.entity_type,
        entity_id: input.entity_id,
        action: input.action ?? 'view',
        priority: input.priority ?? 'normal',
        metadata: input.metadata ?? {},
      };

      const { data, error } = await supabase.functions.invoke('send-web-push', {
        body: payload,
      });

      if (error) {
        // eslint-disable-next-line no-console
        console.debug(
          '[PushDispatcher] Edge function dispatch notice:',
          error.message,
        );
        return false;
      }

      return Boolean(data?.ok);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      // eslint-disable-next-line no-console
      console.debug('[PushDispatcher] dispatchPush exception:', message);
      return false;
    }
  }
}
