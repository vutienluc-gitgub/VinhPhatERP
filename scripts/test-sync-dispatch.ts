import 'dotenv/config';

async function main() {
  const supabaseUrl =
    process.env.VITE_SUPABASE_URL || 'https://quantri.detmayvinhphat.com';
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceRoleKey) {
    console.error('SUPABASE_SERVICE_ROLE_KEY is missing');
    process.exit(1);
  }

  const endpointUrl = `${supabaseUrl}/functions/v1/send-web-push?sync=true`;
  console.log(`=== SYNC PROBE TO EDGE FUNCTION (${endpointUrl}) ===\n`);

  const payload = {
    type: 'CHAT_MESSAGE',
    message_id: 'e224aeae-8934-48c0-b6ac-b11c9ebf6a74',
    sender_name: 'Vũ Tiến Lực (Probe Test)',
    outbox_id: '35c49e21-96b9-43f6-8e46-a8c2c0ee6eca',
    metadata: { sync: true },
  };

  const response = await fetch(endpointUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${serviceRoleKey}`,
      apikey: serviceRoleKey,
    },
    body: JSON.stringify(payload),
  });

  const statusCode = response.status;
  const resBody = await response.text();

  console.log('HTTP Status Code:', statusCode);
  console.log('Response Body:', resBody);
}

main().catch(console.error);
