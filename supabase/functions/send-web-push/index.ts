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
  user_id: string;
  domain?: string;
  type?: string;
  title: string;
  body: string;
  entity_type?: string;
  entity_id?: string;
  action?: string;
  priority?: string;
  metadata?: Record<string, unknown>;
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

if (vapidPrivateKey) {
  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
}

/**
 * Sanitizes push message body to guarantee enterprise privacy on lock screens
 */
function sanitizePushBody(body: string): string {
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

    if (!payload.user_id || !payload.title) {
      return new Response(
        JSON.stringify({ error: 'user_id and title are required' }),
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

    if (subsError) {
      throw subsError;
    }

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
        keys: {
          p256dh: sub.p256dh,
          auth: sub.auth,
        },
      };

      try {
        if (!vapidPrivateKey) {
          // In dev/mock mode without private key
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
            TTL: 86400, // 24 hours
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
