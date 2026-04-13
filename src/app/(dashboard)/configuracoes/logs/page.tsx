// Página temporariamente desabilitada para build Docker
// A funcionalidade está disponível via API: /api/webhooks/logs

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
