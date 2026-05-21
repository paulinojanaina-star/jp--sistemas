import 'jsr:@supabase/functions-js/edge-runtime.d.ts'

Deno.serve(async (req: Request) => {
  // Configuração de CORS para permitir invocações a partir do frontend, se necessário
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    })
  }

  try {
    const payload = await req.json()
    const record = payload.record

    if (!record || !record.message) {
      return new Response(JSON.stringify({ error: 'Nenhuma mensagem encontrada no payload.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const META_ACCESS_TOKEN = Deno.env.get('META_ACCESS_TOKEN')
    const META_PHONE_NUMBER_ID = Deno.env.get('META_PHONE_NUMBER_ID')
    const WHATSAPP_RECIPIENT_NUMBER = Deno.env.get('WHATSAPP_RECIPIENT_NUMBER')

    if (!META_ACCESS_TOKEN || !META_PHONE_NUMBER_ID || !WHATSAPP_RECIPIENT_NUMBER) {
      console.error('Credenciais da API da Meta ausentes no ambiente.')
      return new Response(JSON.stringify({ error: 'Credenciais da Meta ausentes' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Define um emoji com base no tipo de notificação
    let emoji = '🚨'
    if (record.type === 'CONSUMPTION_ALERT') emoji = '📈'
    else if (record.type === 'LOW_STOCK') emoji = '⚠️'
    else if (record.type === 'EXPIRING_SOON') emoji = '⏳'
    else if (record.type === 'TEST') emoji = '✅'

    const messageText = `${emoji} *${record.title}*\n\n${record.message}`

    const url = `https://graph.facebook.com/v18.0/${META_PHONE_NUMBER_ID}/messages`

    const body = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: WHATSAPP_RECIPIENT_NUMBER,
      type: 'text',
      text: {
        preview_url: false,
        body: messageText,
      },
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${META_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    const data = await response.json()

    if (!response.ok) {
      console.error('Erro na API do WhatsApp:', data)
      return new Response(
        JSON.stringify({ error: 'Falha ao enviar mensagem pelo WhatsApp', details: data }),
        {
          status: response.status,
          headers: { 'Content-Type': 'application/json' },
        },
      )
    }

    return new Response(JSON.stringify({ success: true, data }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Erro interno na Edge Function:', error)
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erro desconhecido' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      },
    )
  }
})
