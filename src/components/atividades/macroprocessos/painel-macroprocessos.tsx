import { Button } from "@/components/ui/button";
import { Macroprocesso } from "@/types/activity-hierarchy/macroprocesso";
import { MacroprocessoTable } from "@/components/atividades/macroprocessos/table";
import { macroprocessoColumns } from "@/components/atividades/macroprocessos/columns";
import { toast } from "sonner";
import { Download, PlusCircle } from "lucide-react";
import { SkeletonTable } from "@/components/skeleton-table";

type PainelMacroprocessosProps = {
  loading: boolean;
  onUpdate: () => void;
  data: Macroprocesso[];
};

export function PainelMacroprocessos({
  loading,
  onUpdate,
  data,
}: PainelMacroprocessosProps) {
  return (
    <div className="flex flex-col space-y-4">
      <div className="flex items-center align-center justify-between">
        <h1 className="text-xl font-semibold">
          Painel de Gestão de Macroprocessos
        </h1>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              toast.success("Funcionalidade em desenvolvimento");
            }}
          >
            <Download className="mr-2 h-4 w-4" /> Exportar
          </Button>
          <Button variant="outline" size="sm">
            <PlusCircle className="mr-2 h-4 w-4" />
            Macroprocesso
          </Button>
        </div>
      </div>
      {loading ? (
        <SkeletonTable />
      ) : (
        <MacroprocessoTable
          data={data}
          columns={macroprocessoColumns({ onUpdate })}
        />
      )}
    </div>
  );
}
