// Supabase Edge Function: send-web-push
// Enterprise Web Push Dispatcher with VAPID, Multi-Device Delivery, Fast 202 Response, Error Classification & Logging
// Deploy: supabase functions deploy send-web-push

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import webpush from 'https://esm.sh/web-push@3.6.7';
import { WebhookReliability } from '../_shared/webhook-reliability.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

interface PushNotificationPayload {
  outbox_id?: string;
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
  room_id?: string;
  sender_id?: string;
  sender_name?: string;
}

// Authoritative VAPID Public Key fallback (Single Source of Truth matching client)
const AUTHORITATIVE_PUBLIC_KEY =
  'BCAplL58sPONGLlqHpdHNYMV6_p0A_NoZdyt9E6jjRxLcTjMpDjGgpj4ix0OL_YD8NVM3QtJ-mpWnu-aVo3JmGM';

// Configure VAPID details from environment
const vapidPublicKey =
  Deno.env.get('VAPID_PUBLIC_KEY') || AUTHORITATIVE_PUBLIC_KEY;
const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY');
const vapidSubject =
  Deno.env.get('VAPID_SUBJECT') || 'mailto:admin@detmayvinhphat.com';

if (vapidPrivateKey && vapidPublicKey) {
  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
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

/**
 * Core push dispatch worker function
 */
async function executePushDispatch(
  // deno-lint-ignore no-explicit-any
  supabase: any,
  payload: PushNotificationPayload,
  dedupEventId?: string,
): Promise<{ ok: boolean; devices_targeted: number; results: unknown[] }> {
  const results: unknown[] = [];

  // ── 1. CHAT MESSAGE FAN-OUT ──
  if (payload.type === 'CHAT_MESSAGE' && payload.message_id) {
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

      await new Promise((r) => setTimeout(r, 300));
      retryCount++;
    }

    if (!message) {
      return { ok: true, devices_targeted: 0, results: [] };
    }

    // Fetch all participants of this room EXCEPT sender
    let { data: participants } = await supabase
      .from('chat_room_participants')
      .select('user_id, unread_count')
      .eq('room_id', message.room_id)
      .neq('user_id', message.sender_id);

    // Defensive resolution: Self-healing fallback if participants not found
    if (!participants || participants.length === 0) {
      const { data: room } = await supabase
        .from('chat_rooms')
        .select('entity_type, entity_id, tenant_id')
        .eq('id', message.room_id)
        .maybeSingle();

      if (room) {
        let recipientQuery = supabase.from('profiles').select('id');
        if (room.entity_type === 'customer') {
          recipientQuery = recipientQuery.or(
            `customer_id.eq.${room.entity_id},and(tenant_id.eq.${room.tenant_id},role.in.(admin,manager,staff,kho,warehouse,sale,operator,accountant))`,
          );
        } else if (room.entity_type === 'supplier') {
          recipientQuery = recipientQuery.or(
            `supplier_id.eq.${room.entity_id},and(tenant_id.eq.${room.tenant_id},role.in.(admin,manager,staff,kho,warehouse,sale,operator,accountant))`,
          );
        } else {
          recipientQuery = recipientQuery
            .eq('tenant_id', room.tenant_id)
            .in('role', ['admin', 'manager', 'staff', 'kho', 'sale']);
        }

        const { data: fallbackProfiles } = await recipientQuery;
        if (fallbackProfiles && fallbackProfiles.length > 0) {
          participants = fallbackProfiles
            .filter((p: { id: string }) => p.id !== message?.sender_id)
            .map((p: { id: string }) => ({ user_id: p.id, unread_count: 1 }));
        }
      }
    }

    if (!participants || participants.length === 0) {
      return { ok: true, devices_targeted: 0, results: [] };
    }

    const userIds = participants.map((p: { user_id: string }) => p.user_id);
    const { data: subscriptions } = await supabase
      .from('push_subscriptions')
      .select('*')
      .in('user_id', userIds)
      .is('revoked_at', null);

    if (!subscriptions || subscriptions.length === 0) {
      return { ok: true, devices_targeted: 0, results: [] };
    }

    let bodyText = '';
    if (message.message_type === 'image') {
      bodyText = '[Hinh anh] Da gui mot hinh anh';
    } else if (message.message_type === 'file') {
      bodyText = '[Tep dinh kem] Da gui mot tep dinh kem';
    } else {
      bodyText = (message.content || '').substring(0, 100);
    }

    bodyText = bodyText.replace(/[@#]\S+/g, '').trim();
    bodyText = sanitizePushBody(bodyText);

    const unreadMap = new Map<string, number>();
    participants.forEach((p: { user_id: string; unread_count?: number }) => {
      unreadMap.set(p.user_id, p.unread_count || 1);
    });

    let senderName = payload.sender_name || 'Thanh vien';
    if (message.sender_id && !payload.sender_name) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', message.sender_id)
        .maybeSingle();

      if (profile?.full_name) {
        senderName = profile.full_name;
      }
    }

    for (const sub of subscriptions) {
      const pushMessage = JSON.stringify({
        title: `${senderName}`,
        body: bodyText,
        action: 'chat',
        roomId: message.room_id,
        senderName: senderName,
        messageId: message.id,
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

        const isAppleEndpoint =
          typeof sub.endpoint === 'string' &&
          sub.endpoint.includes('push.apple.com');
        const pushOptions: Record<string, unknown> = {
          TTL: 86400,
          urgency: 'high',
        };

        if (isAppleEndpoint) {
          pushOptions.headers = {
            'apns-push-type': 'alert',
            'apns-priority': '10',
            'apns-expiration': String(Math.floor(Date.now() / 1000) + 86400),
          };
        }

        const startTimeMs = Date.now();
        const response = await webpush.sendNotification(
          pushSubscription,
          pushMessage,
          pushOptions,
        );
        const latencyMs = Date.now() - startTimeMs;

        results.push({
          subscription_id: sub.id,
          status: 'delivered',
          response_code: response.statusCode,
          latency_ms: latencyMs,
        });

        if (payload.notification_id) {
          await supabase.from('notification_delivery_logs').insert({
            notification_id: payload.notification_id,
            subscription_id: sub.id,
            channel: 'web_push',
            status: 'delivered',
            response_code: response.statusCode,
            latency_ms: latencyMs,
          });
        }
      } catch (err: unknown) {
        const error = err as {
          statusCode?: number;
          message?: string;
          body?: string;
          headers?: Record<string, string>;
        };
        const statusCode = error.statusCode || 500;
        const rawBody = error.body || '';
        let reason = '';
        try {
          if (rawBody.startsWith('{')) {
            const parsed = JSON.parse(rawBody);
            reason = parsed.reason || '';
          }
        } catch {
          reason = rawBody;
        }

        const errorMessage = reason || error.message || String(err);

        results.push({
          subscription_id: sub.id,
          status: 'failed',
          response_code: statusCode,
          reason: reason || undefined,
          error: errorMessage,
        });

        // Strict Error Classification (NO naive 400 revoke!)
        const isDeadToken =
          statusCode === 410 ||
          statusCode === 404 ||
          (statusCode === 400 &&
            (reason === 'BadDeviceToken' ||
              reason === 'Unregistered' ||
              reason === 'DeviceTokenNotForTopic'));

        if (isDeadToken) {
          WebhookReliability.logWarn('Revoking dead push subscription', {
            subscriptionId: sub.id,
            statusCode,
            reason,
          });
          await supabase
            .from('push_subscriptions')
            .update({
              revoked_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq('id', sub.id);
        } else {
          WebhookReliability.logError(
            'Push delivery transient failure (token retained)',
            {
              subscriptionId: sub.id,
              statusCode,
              reason,
              error: error.message,
            },
          );
        }
      }
    }

    if (dedupEventId) {
      await supabase.rpc('rpc_complete_inbound_webhook_event', {
        p_source: 'send-web-push',
        p_event_id: dedupEventId,
        p_status: 'processed',
      });
    }

    if (payload.outbox_id) {
      // deno-lint-ignore no-explicit-any
      const hasSuccess = results.some(
        (r: any) => r.status === 'delivered' || r.status === 'sent_mock',
      );
      const outboxStatus =
        hasSuccess || subscriptions.length === 0 ? 'delivered' : 'failed';
      // deno-lint-ignore no-explicit-any
      const outboxError =
        !hasSuccess && results.length > 0
          ? String((results[0] as any)?.error || 'Push dispatch failed')
          : null;

      await supabase.rpc('rpc_complete_notification_outbox_item', {
        p_outbox_id: payload.outbox_id,
        p_status: outboxStatus,
        p_error: outboxError,
      });
    }

    return { ok: true, devices_targeted: subscriptions.length, results };
  }

  // ── 2. NORMAL NOTIFICATION FAN-OUT ──
  if (payload.user_id) {
    if (payload.domain) {
      const { data: pref } = await supabase
        .from('notification_preferences')
        .select('push_enabled')
        .eq('user_id', payload.user_id)
        .eq('domain', payload.domain)
        .maybeSingle();

      if (pref && pref.push_enabled === false) {
        return {
          ok: true,
          devices_targeted: 0,
          results: [{ status: 'skipped_user_preference' }],
        };
      }
    }

    const { data: subscriptions, error: subsError } = await supabase
      .from('push_subscriptions')
      .select('*')
      .eq('user_id', payload.user_id)
      .is('revoked_at', null);

    if (subsError || !subscriptions || subscriptions.length === 0) {
      return { ok: true, devices_targeted: 0, results: [] };
    }

    const pushMessage = JSON.stringify({
      notification_id: payload.notification_id,
      title: payload.title || 'Vinh Phat ERP',
      body: sanitizePushBody(payload.body || ''),
      entity_type: payload.entity_type,
      entity_id: payload.entity_id,
      action: payload.action,
      priority: payload.priority || 'normal',
    });

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

        const isAppleEndpoint =
          typeof sub.endpoint === 'string' &&
          sub.endpoint.includes('push.apple.com');
        const pushOptions: Record<string, unknown> = {
          TTL: 86400,
          urgency: payload.priority === 'urgent' ? 'high' : 'normal',
        };

        if (isAppleEndpoint) {
          pushOptions.headers = {
            'apns-push-type': 'alert',
            'apns-priority': payload.priority === 'urgent' ? '10' : '5',
            'apns-expiration': String(Math.floor(Date.now() / 1000) + 86400),
          };
        }

        const startTimeMs = Date.now();
        const response = await webpush.sendNotification(
          pushSubscription,
          pushMessage,
          pushOptions,
        );
        const latencyMs = Date.now() - startTimeMs;

        results.push({
          subscription_id: sub.id,
          status: 'delivered',
          response_code: response.statusCode,
          latency_ms: latencyMs,
        });

        if (payload.notification_id) {
          await supabase.from('notification_delivery_logs').insert({
            notification_id: payload.notification_id,
            subscription_id: sub.id,
            channel: 'web_push',
            status: 'delivered',
            response_code: response.statusCode,
            latency_ms: latencyMs,
          });
        }
      } catch (err: unknown) {
        const error = err as {
          statusCode?: number;
          message?: string;
          body?: string;
        };
        const statusCode = error.statusCode || 500;
        const rawBody = error.body || '';
        let reason = '';
        try {
          if (rawBody.startsWith('{')) {
            const parsed = JSON.parse(rawBody);
            reason = parsed.reason || '';
          }
        } catch {
          reason = rawBody;
        }

        const errorMessage = reason || error.message || String(err);

        results.push({
          subscription_id: sub.id,
          status: 'failed',
          response_code: statusCode,
          reason: reason || undefined,
          error: errorMessage,
        });

        // Strict Error Classification (NO naive 400 revoke!)
        const isDeadToken =
          statusCode === 410 ||
          statusCode === 404 ||
          (statusCode === 400 &&
            (reason === 'BadDeviceToken' ||
              reason === 'Unregistered' ||
              reason === 'DeviceTokenNotForTopic'));

        if (isDeadToken) {
          WebhookReliability.logWarn('Revoking dead push subscription', {
            subscriptionId: sub.id,
            statusCode,
            reason,
          });
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

    if (dedupEventId) {
      await supabase.rpc('rpc_complete_inbound_webhook_event', {
        p_source: 'send-web-push',
        p_event_id: dedupEventId,
        p_status: 'processed',
      });
    }

    if (payload.outbox_id) {
      // deno-lint-ignore no-explicit-any
      const hasSuccess = results.some(
        (r: any) => r.status === 'delivered' || r.status === 'sent_mock',
      );
      const outboxStatus =
        hasSuccess || subscriptions.length === 0 ? 'delivered' : 'failed';
      // deno-lint-ignore no-explicit-any
      const outboxError =
        !hasSuccess && results.length > 0
          ? String((results[0] as any)?.error || 'Push dispatch failed')
          : null;

      await supabase.rpc('rpc_complete_notification_outbox_item', {
        p_outbox_id: payload.outbox_id,
        p_status: outboxStatus,
        p_error: outboxError,
      });
    }

    return { ok: true, devices_targeted: subscriptions.length, results };
  }

  return { ok: true, devices_targeted: 0, results: [] };
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // 1. Fail Closed if VAPID credentials are unconfigured
  if (!vapidPublicKey || !vapidPrivateKey) {
    return new Response(
      JSON.stringify({
        error:
          'Fail Closed: VAPID private/public credentials unconfigured in environment',
      }),
      {
        status: 503,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // 2. Caller Authentication Guard (Hardened: No hardcoded keys, no public anon bypass)
    const authHeader = req.headers.get('Authorization') || '';
    const apiKeyHeader = req.headers.get('apikey') || '';
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const webhookSecret = Deno.env.get('WEBHOOK_SECRET');

    const token = authHeader.replace(/^Bearer\s+/i, '').trim();
    const isServiceRole =
      Boolean(
        serviceRoleKey &&
        (token === serviceRoleKey || apiKeyHeader === serviceRoleKey),
      ) ||
      Boolean(
        webhookSecret &&
        (token === webhookSecret || apiKeyHeader === webhookSecret),
      );

    if (!token && !apiKeyHeader) {
      return new Response(
        JSON.stringify({
          error: 'Unauthorized: Missing Authorization or apikey header',
        }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      );
    }

    if (!isServiceRole) {
      // Must be an authenticated user session
      const { data: userAuth, error: authErr } =
        await supabase.auth.getUser(token);
      if (authErr || !userAuth?.user) {
        return new Response(
          JSON.stringify({
            error: 'Unauthorized: Valid user session or service role required',
          }),
          {
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          },
        );
      }

      // Verify caller is active
      const { data: callerProfile, error: profileErr } = await supabase
        .from('profiles')
        .select('id, is_active')
        .eq('id', userAuth.user.id)
        .single();

      if (profileErr || !callerProfile?.is_active) {
        return new Response(
          JSON.stringify({
            error: 'Forbidden: Inactive or unauthorized profile',
          }),
          {
            status: 403,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          },
        );
      }
    }

    const payload: PushNotificationPayload = await req.json();

    // 3. Database-backed Idempotency Deduplication Guard
    const dedupEventId =
      payload.message_id || payload.notification_id || payload.entity_id;
    if (dedupEventId) {
      const { data: dedupRes } = await supabase.rpc(
        'rpc_record_inbound_webhook_event',
        {
          p_source: 'send-web-push',
          p_event_id: dedupEventId,
          p_event_type: payload.type || payload.action || 'web_push',
          p_payload: { user_id: payload.user_id, domain: payload.domain },
        },
      );

      if (dedupRes?.is_duplicate) {
        return new Response(
          JSON.stringify({
            status: 'skipped_duplicate',
            event_id: dedupEventId,
            message: 'Notification already dispatched',
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          },
        );
      }
    }

    // 4. Check if synchronous mode requested (e.g. for diagnostic probes/tests)
    const requestUrl = new URL(req.url);
    const isSync =
      requestUrl.searchParams.get('sync') === 'true' ||
      payload.metadata?.sync === true;

    if (isSync) {
      // Synchronous execution for test runner/diagnostics
      const result = await executePushDispatch(supabase, payload, dedupEventId);
      return new Response(JSON.stringify(result), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 5. Asynchronous Fast 202 Response for Postgres triggers & webhooks (< 30ms)
    const dispatchPromise = executePushDispatch(
      supabase,
      payload,
      dedupEventId,
    ).catch((err) => {
      WebhookReliability.logError(
        'Unhandled error in background push dispatch',
        err,
      );
    });

    // Register background execution with EdgeRuntime if supported
    // @ts-ignore
    if (
      typeof EdgeRuntime !== 'undefined' &&
      typeof EdgeRuntime.waitUntil === 'function'
    ) {
      // @ts-ignore
      EdgeRuntime.waitUntil(dispatchPromise);
    }

    return new Response(
      JSON.stringify({
        status: 'accepted',
        message: 'Push notification accepted for background dispatch',
        dedup_event_id: dedupEventId,
      }),
      {
        status: 202,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  } catch (err) {
    WebhookReliability.logError('Unhandled error in send-web-push', err);
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
