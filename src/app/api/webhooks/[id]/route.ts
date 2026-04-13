import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  
  try {
    const { data, error } = await supabase
      .from('app_webhooks')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;

    return NextResponse.json({ data, error: null });
  } catch (error) {
    return NextResponse.json({ error: 'Webhook não encontrado' }, { status: 404 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  
  try {
    const body = await request.json();
    const { data, error } = await supabase
      .from('app_webhooks')
      .update(body)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ data, error: null });
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao atualizar webhook' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  
  try {
    const { error } = await supabase
      .from('app_webhooks')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ data: true, error: null });
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao excluir webhook' }, { status: 500 });
  }
}
