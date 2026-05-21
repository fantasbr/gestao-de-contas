import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, requireRole } from '@/lib/api/auth';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/fornecedores/[id]
export async function GET(request: NextRequest, { params }: RouteParams) {
  const auth = await requireRole(['admin', 'atendente']);
  if (!auth.ok) {
    return auth.response;
  }

  const { id } = await params;
  const supabase = auth.supabase;

  const { data, error } = await supabase
    .from('fornecedores')
    .select('*')
    .eq('id', id)
    .is('deleted_at', null)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: 'Fornecedor nao encontrado' }, { status: 404 });
  }

  return NextResponse.json(data);
}

// PATCH /api/fornecedores/[id]
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const auth = await requireRole(['admin', 'atendente']);
  if (!auth.ok) {
    return auth.response;
  }

  const { id } = await params;
  const supabase = auth.supabase;
  const body = await request.json();

  const { data, error } = await supabase
    .from('fornecedores')
    .update(body)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

// DELETE /api/fornecedores/[id]
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return auth.response;
  }

  const { id } = await params;
  const supabase = auth.supabase;

  const { error } = await supabase
    .from('fornecedores')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
