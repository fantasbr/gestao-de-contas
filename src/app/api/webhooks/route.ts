export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createClient();
  
  try {
    const { data, error } = await supabase
      .from('app_webhooks')
      .select('*')
      .order('nome_evento');

    if (error) throw error;

    return NextResponse.json({ data: data || [], error: null });
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao buscar webhooks' }, { status: 500 });
  }
}
