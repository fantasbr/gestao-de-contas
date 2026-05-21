import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/api/auth';

// GET /api/fornecedores
export async function GET(request: NextRequest) {
  const auth = await requireRole(['admin', 'atendente']);
  if (!auth.ok) {
    return auth.response;
  }

  const supabase = auth.supabase;
  const { searchParams } = new URL(request.url);
  const busca = searchParams.get('busca') || '';

  let query = supabase
    .from('fornecedores')
    .select('*', { count: 'exact' })
    .is('deleted_at', null);

  if (busca) {
    query = query.or(`nome.ilike.%${busca}%,cnpj_cpf.ilike.%${busca}%`);
  }

  query = query.order('nome');

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

// POST /api/fornecedores
export async function POST(request: NextRequest) {
  const auth = await requireRole(['admin', 'atendente']);
  if (!auth.ok) {
    return auth.response;
  }

  const supabase = auth.supabase;
  const body = await request.json();

  const { data, error } = await supabase
    .from('fornecedores')
    .insert({ ...body, created_by: auth.userId })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
