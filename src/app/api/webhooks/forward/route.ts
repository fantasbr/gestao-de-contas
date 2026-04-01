import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// POST /api/webhooks/forward
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const body = await request.json();

  const { nome_evento, arquivo_base64, mime_type, conta_id, dados } = body;

  try {
    // Buscar webhook configurado
    const { data: webhook, error: webhookError } = await supabase
      .from('app_webhooks')
      .select('*')
      .eq('nome_evento', nome_evento)
      .eq('ativo', true)
      .single();

    if (webhookError || !webhook) {
      return NextResponse.json(
        { error: 'Webhook não encontrado ou inativo' },
        { status: 404 }
      );
    }

    // Buscar token da API
    const { data: config } = await supabase
      .from('api_configuracoes')
      .select('api_token')
      .eq('id', 1)
      .single();

    // Preparar payload
    const payload = {
      nome_evento,
      dados,
      arquivo_base64,
      mime_type,
      conta_id,
      timestamp: new Date().toISOString(),
    };

    // Enviar para n8n
    const inicio = Date.now();
    const response = await fetch(webhook.url_webhook, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(config?.api_token && { 'Authorization': `Bearer ${config.api_token}` }),
      },
      body: JSON.stringify(payload),
    });

    const tempo = Date.now() - inicio;
    const resposta = await response.text();

    // Registrar log
    await supabase.from('webhooks_log').insert({
      webhook_id: webhook.id,
      conta_id,
      tipo: 'envio_n8n',
      payload: payload as any,
      resposta: { status: response.status, body: resposta },
      status: response.ok ? 'sucesso' : 'erro',
      codigo_http: response.status,
      tempo_resposta_ms: tempo,
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Erro ao enviar webhook', detalhes: resposta },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      webhook_id: webhook.id,
      tempo_ms: tempo,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
