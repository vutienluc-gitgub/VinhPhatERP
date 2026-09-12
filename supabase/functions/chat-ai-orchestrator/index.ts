// Supabase Edge Function: chat-ai-orchestrator
// Hardened with Webhook Security Guard, HMAC-SHA256, Idempotency, Atomic RPC & Reliability Engine

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import { WebhookSecurity } from '../_shared/webhook-security.ts';
import { WebhookReliability } from '../_shared/webhook-reliability.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-webhook-signature, x-webhook-timestamp, x-webhook-id',
};

interface ChatMention {
  type: string;
  id?: string;
}

interface ChatRecord {
  id: string;
  room_id: string;
  sender_id?: string;
  content: string;
  mentions?: ChatMention[];
}

interface WebhookPayload {
  type?: string;
  event_id?: string;
  record?: ChatRecord;
}

serve(async (req: Request) => {
  const startTime = Date.now();

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const signatureHeader = req.headers.get('x-webhook-signature');
  const timestampHeader = req.headers.get('x-webhook-timestamp');
  const eventIdHeader = req.headers.get('x-webhook-id');
  const authHeader = req.headers.get('Authorization');

  let activeEventId = eventIdHeader ?? 'unknown';

  try {
    const rawBody = await req.text();
    const webhookSecret = Deno.env.get('WEBHOOK_SECRET');
    const internalServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    let isAuthenticated = false;

    // 1. Webhook Signature Verification
    if (signatureHeader && timestampHeader && eventIdHeader) {
      const verifyRes = await WebhookSecurity.verifyWebhook({
        rawBody,
        signatureHeader,
        timestampHeader,
        eventIdHeader,
        secret: webhookSecret,
      });

      if (!verifyRes.valid) {
        WebhookReliability.logWarn(
          'Inbound webhook signature verification failed',
          {
            eventId: eventIdHeader,
            reason: verifyRes.message,
          },
        );
        return new Response(
          JSON.stringify({ error: verifyRes.message || 'Unauthorized' }),
          {
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          },
        );
      }
      isAuthenticated = true;
    } else if (authHeader && internalServiceKey) {
      // 2. Bearer Authentication for internal triggers
      const token = authHeader.replace(/^Bearer\s+/i, '').trim();
      if (
        token === internalServiceKey ||
        token === Deno.env.get('INTERNAL_TRIGGER_TOKEN')
      ) {
        isAuthenticated = true;
      }
    }

    if (!isAuthenticated) {
      WebhookReliability.logWarn('Unauthorized webhook attempt rejected', {
        eventId: eventIdHeader,
        hasAuthHeader: Boolean(authHeader),
      });
      return new Response(
        JSON.stringify({
          error: 'Unauthorized: Missing or invalid authentication credentials',
        }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      );
    }

    // 3. Parse and Validate JSON Body
    let payload: WebhookPayload;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      return new Response(JSON.stringify({ error: 'Malformed JSON payload' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (payload.type !== 'INSERT') {
      return new Response(JSON.stringify({ message: 'Not an insert event' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const record = payload.record;
    if (!record || !record.content || !record.id || !record.room_id) {
      return new Response(
        JSON.stringify({ message: 'Invalid or missing message record' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      );
    }

    activeEventId = payload.event_id || eventIdHeader || record.id;

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabase = createClient(supabaseUrl, supabaseKey);

    const content = record.content.toLowerCase();
    const mentions = record.mentions || [];

    const actionKeywords = [
      'kiểm tra',
      'xử lý',
      'chuẩn bị',
      'báo cáo',
      'giao',
      'cập nhật',
      'review',
    ];
    const hasAction = actionKeywords.some((kw) => content.includes(kw));
    const hasMention = mentions.length > 0;

    if (hasAction && hasMention) {
      const userMentions = mentions.filter((m) => m.type === 'user');
      const assigneeId =
        userMentions.length > 0 && userMentions[0].id
          ? userMentions[0].id
          : null;
      const title = `Action Item: ${record.content.substring(0, 50)}...`;

      // 4. Atomic Transaction via PostgreSQL RPC
      const { data: rpcResult, error: rpcError } = await supabase.rpc(
        'rpc_process_chat_ai_action_item',
        {
          p_event_id: activeEventId,
          p_room_id: record.room_id,
          p_sender_id: record.sender_id || null,
          p_content: record.content,
          p_task_title: title,
          p_assignee_id: assigneeId,
        },
      );

      if (rpcError) {
        // Schedule retry for transient error
        const delayMs = WebhookReliability.calculateBackoffDelayMs(1);
        await supabase.rpc('rpc_schedule_inbound_webhook_retry', {
          p_source: 'chat-ai-orchestrator',
          p_event_id: activeEventId,
          p_error: rpcError.message,
          p_delay_ms: delayMs,
        });

        WebhookReliability.logError(
          'Failed to process chat action item via RPC',
          rpcError,
          {
            eventId: activeEventId,
            roomId: record.room_id,
            durationMs: Date.now() - startTime,
          },
        );

        return new Response(JSON.stringify({ error: rpcError.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      WebhookReliability.logInfo('Chat action item processed successfully', {
        eventId: activeEventId,
        roomId: record.room_id,
        isDuplicate: rpcResult?.is_duplicate ?? false,
        durationMs: Date.now() - startTime,
      });

      return new Response(
        JSON.stringify({
          message: rpcResult?.is_duplicate
            ? 'Event already processed'
            : 'Task created atomically',
          result: rpcResult,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      );
    }

    return new Response(JSON.stringify({ message: 'No action needed' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    WebhookReliability.logError(
      'Unhandled error in chat-ai-orchestrator',
      error,
      {
        eventId: activeEventId,
        durationMs: Date.now() - startTime,
      },
    );
    const errorMessage = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
