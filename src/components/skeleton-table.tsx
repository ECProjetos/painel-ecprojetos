import { Skeleton } from "@/components/ui/skeleton";

export function SkeletonTable() {
  return (
    <div className="space-y-2">
      {/* Cabeçalho da tabela */}
      <div className="flex justify-between px-4 py-2">
        <Skeleton className="h-4 w-[180px]" />
        <Skeleton className="h-4 w-[50px]" />
        <Skeleton className="h-4 w-[150px]" />
        <Skeleton className="h-4 w-[300px]" />
        <Skeleton className="h-4 w-[100px]" />
        <Skeleton className="h-4 w-[40px]" />
      </div>

      {/* Linhas da tabela (simulação de 5 linhas) */}
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="flex justify-between px-4 py-4 items-center border-b"
        >
          <Skeleton className="h-4 w-[180px]" />
          <Skeleton className="h-4 w-[50px]" />
          <Skeleton className="h-4 w-[150px]" />
          <Skeleton className="h-4 w-[300px]" />
          <Skeleton className="h-4 w-[100px]" />
          <Skeleton className="h-4 w-[40px]" />
        </div>
      ))}
    </div>
  );
}
