import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const optionalContaFields = [
  'fornecedor_id',
  'favorecido_nome',
  'favorecido_documento',
  'empresa_pagadora_id',
  'categoria_id',
  'linha_digitavel',
  'codigo_barras',
  'observacoes',
] as const;

// POST /api/upload
// Recebe arquivo, converte para base64 e envia para o webhook (n8n)
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const tipo = formData.get('tipo') as string || 'contas';
    const conta_id = formData.get('conta_id') as string | null;
    const descricao = String(formData.get('descricao') || '').trim();
    const valor = String(formData.get('valor') || '').trim();
    const data_vencimento = String(formData.get('data_vencimento') || '').trim();

    if (!file) {
      return NextResponse.json({ error: 'Nenhum arquivo enviado' }, { status: 400 });
    }

    if (tipo === 'contas' && (!descricao || !valor || !data_vencimento)) {
      return NextResponse.json(
        { error: 'Campos obrigatórios ausentes para contas: descricao, valor e data_vencimento' },
        { status: 400 }
      );
    }

    // Validar tipos de arquivo conforme o tipo
    const tiposPermitidos: Record<string, string[]> = {
      contas: ['application/pdf'],
      comprovantes: ['application/pdf', 'image/jpeg', 'image/png'],
    };

    const allowedTypes = tiposPermitidos[tipo] || ['application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: `Tipo de arquivo não permitido para ${tipo}. Permitidos: ${allowedTypes.join(', ')}` },
        { status: 400 }
      );
    }

    // Validar tamanho (máximo 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json({ error: 'Arquivo muito grande (máximo 10MB)' }, { status: 400 });
    }

    // Converter para base64
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = buffer.toString('base64');

    const supabase = await createClient();

    // Mapear tipo para nome do webhook
    const webhookMap: Record<string, string> = {
      contas: 'conta_cadastro',
      comprovantes: 'conta_pagamento',
    };

    const nomeWebhook = webhookMap[tipo];
    if (!nomeWebhook) {
      return NextResponse.json(
        { error: `Tipo de upload não reconhecido: ${tipo}` },
        { status: 400 }
      );
    }

    // Buscar webhook configurado
    const { data: webhook, error: webhookError } = await supabase
      .from('app_webhooks')
      .select('*')
      .eq('nome_evento', nomeWebhook)
      .eq('ativo', true)
      .single();

    if (webhookError || !webhook) {
      return NextResponse.json(
        { error: `Webhook "${nomeWebhook}" não configurado ou inativo` },
        { status: 500 }
      );
    }

    // Buscar token da API
    const { data: config } = await supabase
      .from('api_configuracoes')
      .select('api_token')
      .eq('id', 1)
      .single();

    // Preparar payload com arquivo em base64
    const dados: Record<string, string> = {};
    if (tipo === 'contas') {
      dados.descricao = descricao;
      dados.valor = valor;
      dados.data_vencimento = data_vencimento;

      for (const field of optionalContaFields) {
        const rawValue = formData.get(field);
        const value = typeof rawValue === 'string' ? rawValue.trim() : '';
        if (value) {
          dados[field] = value;
        }
      }
    }

    const payload: Record<string, any> = {
      nome_evento: nomeWebhook,
      arquivo_base64: base64,
      mime_type: file.type,
      nome_arquivo: file.name,
      tipo,
      ...(Object.keys(dados).length > 0 && { dados }),
      timestamp: new Date().toISOString(),
    };

    // Se for comprovante, incluir conta_id e data_pagamento
    if (tipo === 'comprovantes' && conta_id) {
      payload.conta_id = conta_id;
      payload.data_pagamento = formData.get('data_pagamento') || null;
    }

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

    // Registrar log do webhook
    await supabase.from('webhooks_log').insert({
      webhook_id: webhook.id,
      conta_id: conta_id || null,
      tipo: 'envio_n8n',
      payload: payload,
      resposta: { status: response.status, body: resposta.substring(0, 500) },
      status: response.ok ? 'sucesso' : 'erro',
      codigo_http: response.status,
      tempo_resposta_ms: tempo,
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Erro ao enviar arquivo para processamento', detalhes: resposta },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      mensagem: 'Arquivo enviado para processamento',
      tipo,
      tempo_ms: tempo,
    });

  } catch (error: any) {
    console.error('Erro no upload:', error);
    return NextResponse.json(
      { error: error.message || 'Erro interno ao processar upload' },
      { status: 500 }
    );
  }
}
