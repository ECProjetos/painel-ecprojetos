import {
  Macroprocesso,
} from "@/types/activity-hierarchy/macroprocesso";
import { MacroprocessoTable } from "@/components/atividades/macroprocessos/table";
import { macroprocessoColumns } from "@/components/atividades/macroprocessos/columns";
import { SkeletonTable } from "@/components/skeleton-table";
import { MacroprocessDialog } from "@/components/atividades/macroprocessos/dialog";
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
        <div className="flex items-center space-x-2">
          <MacroprocessDialog onSuccess={onUpdate} />
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
