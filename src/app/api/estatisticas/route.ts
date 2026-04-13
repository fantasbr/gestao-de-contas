export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createClient();
  const hoje = new Date().toISOString().split('T')[0];
  const seteDias = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  try {
    const [totalResult, pendentesResult, vencidasResult, proximosResult, valorResult] = await Promise.all([
      supabase
        .from('contas_pagar')
        .select('valor', { count: 'exact', head: true })
        .is('deleted_at', null)
        .neq('status', 'pago'),
      
      supabase
        .from('contas_pagar')
        .select('id', { count: 'exact', head: true })
        .is('deleted_at', null)
        .eq('status', 'pendente'),
      
      supabase
        .from('contas_pagar')
        .select('id', { count: 'exact', head: true })
        .is('deleted_at', null)
        .eq('status', 'pendente')
        .lt('data_vencimento', hoje),
      
      supabase
        .from('contas_pagar')
        .select('id', { count: 'exact', head: true })
        .is('deleted_at', null)
        .eq('status', 'pendente')
        .gte('data_vencimento', hoje)
        .lte('data_vencimento', seteDias),
        
      supabase
        .from('contas_pagar')
        .select('valor')
        .is('deleted_at', null)
        .neq('status', 'pago'),
    ]);

    const totalValor = valorResult.data?.reduce((acc: number, curr: any) => acc + Number(curr.valor || 0), 0) || 0;

    return NextResponse.json({
      data: {
        total: totalResult.count || 0,
        totalValor,
        pendentes: pendentesResult.count || 0,
        vencidas: vencidasResult.count || 0,
        proximosVencimentos: proximosResult.count || 0,
      },
      error: null,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao buscar estatísticas' }, { status: 500 });
  }
}
