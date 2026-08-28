// Supabase Edge Function: send-web-push
// Enterprise Web Push Dispatcher with VAPID, Multi-Device Delivery, 410 Cleanup & Logging
// Deploy: supabase functions deploy send-web-push

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import webpush from 'https://esm.sh/web-push@3.6.7';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

interface PushNotificationPayload {
  notification_id?: string;
  user_id?: string;
  domain?: string;
  type?: string;
  title?: string;
  body?: string;
  entity_type?: string;
  entity_id?: string;
  action?: string;
  priority?: string;
  metadata?: Record<string, unknown>;
  message_id?: string;
}

// Configure VAPID details from environment
const vapidPublicKey =
  Deno.env.get('VAPID_PUBLIC_KEY') ||
  'BFjNvul1vaXsyiw-wJBxXh11Q-zfKO5BIpZqNKmHrQIRMtmRfq71y_nJ7_chvZhxmrkEK3mFkxuiYbmP9Fv9hbU';
const vapidPrivateKey =
  Deno.env.get('VAPID_PRIVATE_KEY') ||
  'Tc3cDQM-dHqPmfoX-YYxb3yWhywpBBsjXNnPCyWLRUI';
const vapidSubject =
  Deno.env.get('VAPID_SUBJECT') || 'mailto:admin@detmayvinhphat.com';

if (vapidPrivateKey && vapidPublicKey) {
  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
}

// In-memory deduplication set to avoid duplicate pushes from dual-trigger mechanisms
const processedMessageIds = new Map<string, number>();

function isDuplicateChatMessage(messageId: string): boolean {
  const now = Date.now();
  // Cleanup entries older than 30s
  for (const [id, timestamp] of processedMessageIds.entries()) {
    if (now - timestamp > 30_000) {
      processedMessageIds.delete(id);
    }
  }

  if (processedMessageIds.has(messageId)) {
    return true;
  }

  processedMessageIds.set(messageId, now);
  return false;
}

/**
 * Sanitizes push message body to guarantee enterprise privacy on lock screens
 */
function sanitizePushBody(body: string): string {
  if (!body) return '';
  // Mask explicit monetary amount patterns (e.g. 1.250.000.000đ or 50,000,000 VND)
  return body.replace(
    /(\d{1,3}[.,]\d{3}[.,]\d{3}[.,]\d{3}|\d{1,3}[.,]\d{3}[.,]\d{3}|\d{1,3}[.,]\d{3})\s*(đ|VND|vnđ|USD|\$)/gi,
    '***',
  );
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const payload: PushNotificationPayload = await req.json();

    // ── CHAT MESSAGE FAN-OUT ──
    if (payload.type === 'CHAT_MESSAGE' && payload.message_id) {
      // Idempotency check: Skip if already processed within the sliding window
      if (isDuplicateChatMessage(payload.message_id)) {
        return new Response(
          JSON.stringify({
            status: 'skipped_duplicate',
            message_id: payload.message_id,
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          },
        );
      }
      // 1. Fetch message with retry logic to avoid race condition
      let message: {
        id: string;
        content: string | null;
        message_type: string;
        sender_id: string | null;
        room_id: string;
      } | null = null;
      let retryCount = 0;

      while (retryCount < 2) {
        const { data } = await supabase
          .from('chat_messages')
          .select('id, content, message_type, sender_id, room_id')
          .eq('id', payload.message_id)
          .single();

        if (data) {
          message = data as typeof message;
          break;
        }

        // Wait 300ms before retrying
        await new Promise((r) => setTimeout(r, 300));
        retryCount++;
      }

      if (!message) return new Response('OK', { status: 200 }); // Fail silently

      // 2. Fetch all participants of this room EXCEPT sender
      const { data: participants } = await supabase
        .from('chat_room_participants')
        .select('user_id, unread_count')
        .eq('room_id', message.room_id)
        .neq('user_id', message.sender_id);

      if (!participants || participants.length === 0) {
        return new Response('OK', { status: 200 });
      }

      // 3. Fetch push subscriptions for all participants
      const userIds = participants.map((p) => p.user_id);
      const { data: subscriptions } = await supabase
        .from('push_subscriptions')
        .select('*')
        .in('user_id', userIds)
        .is('revoked_at', null);

      if (!subscriptions || subscriptions.length === 0) {
        return new Response('OK', { status: 200 });
      }

      // 4. Format push body (No emoji in source code)
      let bodyText = '';
      if (message.message_type === 'image') {
        bodyText = '[Hinh anh] Da gui mot hinh anh';
      } else if (message.message_type === 'file') {
        bodyText = '[Tep dinh kem] Da gui mot tep dinh kem';
      } else {
        bodyText = (message.content || '').substring(0, 100);
      }

      // Strip mentions from push notification
      bodyText = bodyText.replace(/[@#]\S+/g, '').trim();
      bodyText = sanitizePushBody(bodyText);

      // We need to look up unread count per user
      const unreadMap = new Map<string, number>();
      participants.forEach((p) => {
        unreadMap.set(p.user_id, p.unread_count || 1);
      });

      let senderName = 'Nguoi dung';
      if (message.sender_id) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', message.sender_id)
          .maybeSingle();

        if (profile?.full_name) {
          senderName = profile.full_name;
        }
      }

      // 5. Send push to all devices
      const results = [];
      for (const sub of subscriptions) {
        const pushMessage = JSON.stringify({
          title: `${senderName}`,
          body: bodyText,
          action: 'chat',
          roomId: message.room_id,
          senderName: senderName,
          notification_id: `chat-${message.id}-${Date.now()}`,
          unreadCount: unreadMap.get(sub.user_id) || 1,
        });

        const pushSubscription = {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth },
        };

        try {
          if (!vapidPrivateKey) {
            results.push({
              subscription_id: sub.id,
              status: 'sent_mock',
              response_code: 200,
            });
            continue;
          }

          const response = await webpush.sendNotification(
            pushSubscription,
            pushMessage,
            { TTL: 86400, urgency: 'high' },
          );
          results.push({
            subscription_id: sub.id,
            status: 'delivered',
            response_code: response.statusCode,
          });
        } catch (err: unknown) {
          const error = err as { statusCode?: number; message?: string };
          const statusCode = error.statusCode || 500;
          results.push({
            subscription_id: sub.id,
            status: 'failed',
            response_code: statusCode,
          });

          if (statusCode === 410 || statusCode === 404) {
            await supabase
              .from('push_subscriptions')
              .update({
                revoked_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              })
              .eq('id', sub.id);
          }
        }
      }

      return new Response(
        JSON.stringify({
          ok: true,
          devices_targeted: subscriptions.length,
          results,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      );
    }

    // ── NORMAL NOTIFICATION ──
    if (!payload.user_id || !payload.title) {
      return new Response(
        JSON.stringify({
          error: 'user_id and title are required for standard notifications',
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      );
    }

    // 1. Check user notification preferences if domain specified
    if (payload.domain) {
      const { data: pref } = await supabase
        .from('notification_preferences')
        .select('push_enabled')
        .eq('user_id', payload.user_id)
        .eq('domain', payload.domain)
        .maybeSingle();

      if (pref && pref.push_enabled === false) {
        return new Response(
          JSON.stringify({
            status: 'skipped',
            reason: 'User disabled push for this domain',
          }),
          {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          },
        );
      }
    }

    // 2. Fetch all active subscriptions for user
    const { data: subscriptions, error: subsError } = await supabase
      .from('push_subscriptions')
      .select('*')
      .eq('user_id', payload.user_id)
      .is('revoked_at', null);

    if (subsError) throw subsError;

    if (!subscriptions || subscriptions.length === 0) {
      return new Response(
        JSON.stringify({
          status: 'no_subscriptions',
          message: 'No active push devices registered for user',
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      );
    }

    // 3. Calculate recipient's total unread count for OS App Badging
    const { count: unreadCount } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', payload.user_id)
      .eq('is_read', false);

    // Prepare sanitized payload
    const pushMessage = JSON.stringify({
      notification_id: payload.notification_id,
      title: payload.title,
      body: sanitizePushBody(payload.body || ''),
      entity_type: payload.entity_type,
      entity_id: payload.entity_id,
      action: payload.action,
      priority: payload.priority || 'normal',
      unread_count: (unreadCount ?? 0) + 1,
    });

    const results = [];

    // 4. Send Web Push to all active devices
    for (const sub of subscriptions) {
      const pushSubscription = {
        endpoint: sub.endpoint,
        keys: { p256dh: sub.p256dh, auth: sub.auth },
      };

      try {
        if (!vapidPrivateKey) {
          results.push({
            subscription_id: sub.id,
            status: 'sent_mock',
            response_code: 200,
          });
          continue;
        }

        const response = await webpush.sendNotification(
          pushSubscription,
          pushMessage,
          {
            TTL: 86400,
            urgency: payload.priority === 'urgent' ? 'high' : 'normal',
          },
        );

        results.push({
          subscription_id: sub.id,
          status: 'delivered',
          response_code: response.statusCode,
        });

        // Log successful delivery
        if (payload.notification_id) {
          await supabase.from('notification_delivery_logs').insert({
            notification_id: payload.notification_id,
            channel: 'web_push',
            status: 'delivered',
            response_code: response.statusCode,
          });
        }
      } catch (err: unknown) {
        const error = err as { statusCode?: number; message?: string };
        const statusCode = error.statusCode || 500;
        const errorMessage = error.message || String(err);

        results.push({
          subscription_id: sub.id,
          status: 'failed',
          response_code: statusCode,
          error: errorMessage,
        });

        // Log delivery failure
        if (payload.notification_id) {
          await supabase.from('notification_delivery_logs').insert({
            notification_id: payload.notification_id,
            channel: 'web_push',
            status: 'failed',
            response_code: statusCode,
            error_message: errorMessage,
          });
        }

        // 5. Automatic 410 Gone / 404 Cleanup
        if (statusCode === 410 || statusCode === 404) {
          await supabase
            .from('push_subscriptions')
            .update({
              revoked_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq('id', sub.id);
        }
      }
    }

    return new Response(
      JSON.stringify({
        ok: true,
        devices_targeted: subscriptions.length,
        results,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({
        error: err instanceof Error ? err.message : String(err),
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  }
});
