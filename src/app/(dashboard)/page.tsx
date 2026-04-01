import { Header } from '@/components/layout';

export default function DashboardPage() {
  return (
    <>
      <Header />
      <div className="flex-1 p-6 overflow-auto">
        <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
        <p className="text-muted-foreground">
          Bem-vindo ao sistema de controle de contas a pagar.
        </p>
      </div>
    </>
  );
}
