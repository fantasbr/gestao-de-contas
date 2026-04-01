import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/fornecedores
export async function GET(request: NextRequest) {
  const supabase = await createClient();
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
  const supabase = await createClient();
  const body = await request.json();

  const { data: { user } } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from('fornecedores')
    .insert({ ...body, created_by: user?.id })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
