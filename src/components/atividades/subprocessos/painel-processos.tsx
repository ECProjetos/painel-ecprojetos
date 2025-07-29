'use client';

import { MacroprocessoTable } from "@/components/atividades/macroprocessos/table";
import { macroprocessoColumns } from "@/components/atividades/macroprocessos/columns";
import { SkeletonTable } from "@/components/skeleton-table";
import { SubProcesso } from "@/types/activity-hierarchy/sub-processo";
import { SubProcessoDialog } from "./dialog";

type Props = {
  loading: boolean;
  onUpdate: () => void;
  data: SubProcesso[];
};

export function PainelSubProcessos({ loading, onUpdate, data }: Props) {


  return (
    <div className="flex flex-col space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <SubProcessoDialog onSuccess={onUpdate} />
        </div>
      </div>
      {loading ? (
        <SkeletonTable />
      ) : (
        <MacroprocessoTable data={data} columns={macroprocessoColumns({ onUpdate })} />
      )}
    </div>
  );
}
