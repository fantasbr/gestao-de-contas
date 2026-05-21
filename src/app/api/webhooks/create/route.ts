import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api/auth';

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return auth.response;
  }

  const supabase = auth.supabase;
  
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
