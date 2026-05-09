import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

console.log('Chat AI Orchestrator Function up and running!');

serve(async (req) => {
  try {
    const payload = await req.json();
    console.log('Received payload:', payload);

    // Only process INSERT events
    if (payload.type !== 'INSERT') {
      return new Response(JSON.stringify({ message: 'Not an insert event' }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const record = payload.record;
    if (!record || !record.content) {
      return new Response(JSON.stringify({ message: 'No content' }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabase = createClient(supabaseUrl, supabaseKey);

    const content = record.content.toLowerCase();
    const mentions = record.mentions || [];

    console.log('Mentions:', mentions);

    // AI Intent Detection (Mock Logic - Replace with actual LLM API call later)
    // Here we use heuristics: if the message mentions a role/user and contains keywords like 'kiểm tra', 'xử lý', 'chuẩn bị', 'báo cáo'
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
      console.log('Actionable message detected!');

      // Extract context (e.g. document mentioned)
      const docMention = mentions.find((m: any) => m.type === 'document');
      const userMentions = mentions.filter((m: any) => m.type === 'user');
      const roleMentions = mentions.filter((m: any) => m.type === 'role');

      // Build task details
      let title = `[Tự động tạo] Từ tin nhắn của ${record.sender_id || 'System'}`;
      let description = `Nội dung: ${record.content}\nPhòng chat: ${record.room_id}`;

      const assigneeId = userMentions.length > 0 ? userMentions[0].id : null;
      // If role mention, we might assign to a generic role pool or supervisor. For MVP, keep null if no specific user.

      // Try to determine entity linkage from the room
      const { data: room } = await supabase
        .from('chat_rooms')
        .select('entity_type, entity_id')
        .eq('id', record.room_id)
        .single();

      // Create a task
      const { data: task, error: taskError } = await supabase
        .from('tasks')
        .insert({
          title: `Action Item: ${record.content.substring(0, 50)}...`,
          description: description,
          status: 'todo',
          priority: 'medium',
          assignee_id: assigneeId,
          // Link task to the room's entity if applicable
          // Assuming 'tasks' table has an 'order_id' or 'work_order_id' depending on entity type
          ...(room?.entity_type === 'order'
            ? { order_id: room.entity_id }
            : {}),
          ...(room?.entity_type === 'work_order'
            ? { work_order_id: room.entity_id }
            : {}),
        })
        .select()
        .single();

      if (taskError) {
        console.error('Error creating task:', taskError);
        throw taskError;
      }

      console.log('Task created successfully:', task);

      // Optionally, send a bot message back to the chat room
      await supabase.from('chat_messages').insert({
        room_id: record.room_id,
        content: `🤖 Đã tự động tạo công việc: "${task.title}"`,
        message_type: 'system',
        status: 'sent',
      });

      return new Response(JSON.stringify({ message: 'Task created', task }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ message: 'No action needed' }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error in chat-ai-orchestrator:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
