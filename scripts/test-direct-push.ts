import 'dotenv/config';

async function testPushDispatch() {
  const edgeFunctionUrl =
    'https://sxphijrofljxkccdwtub.supabase.co/functions/v1/send-web-push?sync=true';
  const anonKey =
    process.env.VITE_SUPABASE_ANON_KEY ||
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN4cGhpanJvZmxqeGtjY2R3dHViIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ1MDk1NTksImV4cCI6MjA5MDA4NTU1OX0.8e-qbhqv6UgCZ46Yx7sa9FWGCdT50q27i4kAiMtCpxc';
  const customerUserId = '6c8cc401-487d-4468-8aa7-fe2997093767'; // Customer Monz brand

  console.log(
    '[Probe 2.1] Gửi payload notification tiêu chuẩn để trích xuất error.message chi tiết từ Edge Function...',
  );

  const payload = {
    user_id: customerUserId,
    title: '[PROBE-TEST] Chẩn đoán Web Push',
    body: 'Nội dung chẩn đoán mã lỗi Apple APNs',
    domain: 'chat',
    type: 'probe_diagnostic',
    notification_id: `probe-${Date.now()}`,
  };

  const startTime = Date.now();
  try {
    const res = await fetch(edgeFunctionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${anonKey}`,
      },
      body: JSON.stringify(payload),
    });

    const elapsed = Date.now() - startTime;
    console.log(
      `[Probe 2.1] HTTP Status: ${res.status} (Thời gian phản hồi: ${elapsed}ms)`,
    );
    const json = await res.json();
    console.log(
      '[Probe 2.1] Phản hồi chi tiết:',
      JSON.stringify(json, null, 2),
    );
  } catch (err) {
    console.error('[Probe 2.1] Lỗi khi gọi Edge Function:', err);
  }
}

testPushDispatch();
