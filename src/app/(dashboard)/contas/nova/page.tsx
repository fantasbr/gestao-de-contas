import { queryLookup } from '@/lib/supabase/queries';
import { NovaContaClient } from '@/components/contas/NovaContaClient';

export const dynamic = 'force-dynamic';

export default async function NovaContaPage() {
  const lookup = await queryLookup();

  return <NovaContaClient lookup={lookup} />;
}
