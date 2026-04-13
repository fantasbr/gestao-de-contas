export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createClient();
  
  try {
    const [fornecedoresResult, empresasResult, categoriasResult] = await Promise.all([
      supabase.from('fornecedores').select('*').is('deleted_at', null).order('nome'),
      supabase.from('empresas').select('*').order('nome'),
      supabase.from('categorias').select('*').order('nome'),
    ]);

    return NextResponse.json({
      data: {
        fornecedores: fornecedoresResult.data || [],
        empresas: empresasResult.data || [],
        categorias: categoriasResult.data || [],
      },
      error: null,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao buscar dados de lookup' }, { status: 500 });
  }
}
