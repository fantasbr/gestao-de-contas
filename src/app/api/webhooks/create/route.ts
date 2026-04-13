import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  const supabase = await createClient();
  
  try {
    const body = await request.json();
    const { data, error } = await supabase
      .from('app_webhooks')
      .insert(body)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ data, error: null }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao criar webhook' }, { status: 500 });
  }
}
