import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api/auth';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const auth = await requireAdmin();
  if (!auth.ok) {
    return auth.response;
  }

  const supabase = auth.supabase;
  
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
  const auth = await requireAdmin();
  if (!auth.ok) {
    return auth.response;
  }

  const supabase = auth.supabase;
  
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

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  return PUT(request, context);
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const auth = await requireAdmin();
  if (!auth.ok) {
    return auth.response;
  }

  const supabase = auth.supabase;
  
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
