// Força renderização dinâmica — evita pré-renderização no build do Docker
// onde as variáveis NEXT_PUBLIC_SUPABASE_* ainda não estão disponíveis
export const dynamic = 'force-dynamic';


export default function LogsPage() {
  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <h1 className="text-2xl font-bold mb-4">Logs de Webhooks</h1>
      <p className="text-muted-foreground">
        Página em manutenção. Use a API /api/webhooks/logs para acessar os logs.
      </p>
    </div>
  );
}
