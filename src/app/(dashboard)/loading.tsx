import { Loader2 } from 'lucide-react';

export default function DashboardLoading() {
  return (
    <div className="flex h-full w-full flex-col p-6 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between mb-6">
        <div className="space-y-2">
          <div className="h-8 w-48 bg-muted rounded"></div>
          <div className="h-4 w-32 bg-muted rounded"></div>
        </div>
        <div className="h-10 w-32 bg-muted rounded"></div>
      </div>

      {/* Filters/Cards Skeleton */}
      <div className="grid gap-4 md:grid-cols-4 mb-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-12 w-full bg-muted rounded"></div>
        ))}
      </div>

      {/* Main Content Area Skeleton */}
      <div className="flex-1 w-full bg-muted/50 rounded-xl flex items-center justify-center border border-border">
        <div className="flex flex-col items-center gap-2 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p>Carregando dados...</p>
        </div>
      </div>
    </div>
  );
}
