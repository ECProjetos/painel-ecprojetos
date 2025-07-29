import {
  Macroprocesso,
} from "@/types/activity-hierarchy/macroprocesso";
import { MacroprocessoTable } from "@/components/atividades/macroprocessos/table";
import { macroprocessoColumns } from "@/components/atividades/macroprocessos/columns";
import { SkeletonTable } from "@/components/skeleton-table";
import { ProcessoDialog } from "@/components/atividades/processos/dialog";
type PainelMacroprocessosProps = {
  loading: boolean;
  onUpdate: () => void;
  data: Macroprocesso[];
};

export function PainelProcessos({
  loading,
  onUpdate,
  data,
}: PainelMacroprocessosProps) {
  return (
    <div className="flex flex-col space-y-4">
      <div className="flex items-center align-center justify-between">
        <h1 className="text-xl font-semibold">
          Painel de Gestão de Processos
        </h1>
        <div className="flex items-center space-x-2">
          <ProcessoDialog onSuccess={onUpdate} />
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
