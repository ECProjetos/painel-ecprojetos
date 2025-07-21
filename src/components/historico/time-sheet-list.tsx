/* eslint-disable @typescript-eslint/no-explicit-any */
// components/TimeSheetList.tsx
"use client";

import React, { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { Spinner } from "@/components/ui/spinner";

// Estrutura de cada alocação, com projeto e atividade
type TimeAllocationRecord = {
  id: number;
  project_id: number;
  activity_id: number;
  hours: number;
  comment: string | null;
  allocation_date: string;
  project: { id: number; name: string };
  activity: { id: number; name: string };
};

// Estrutura de cada registro de ponto
type TimeEntryRecord = {
  entry_date: string;
  period: number;
  entry_time: string | null;
  exit_time: string | null;
  time_allocations: TimeAllocationRecord[];
};

export default function TimeSheetList() {
  const supabase = createClient();
  const [records, setRecords] = useState<TimeEntryRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRecords() {
      // 1) Busca entradas/saídas do usuário por período
      const { data: entriesData, error: entriesError } = await supabase
        .from("time_entries")
        .select("entry_date, period, entry_time, exit_time")
        .order("entry_date", { ascending: false });

      if (entriesError) {
        console.error("Erro ao buscar entradas de ponto:", entriesError);
        setLoading(false);
        return;
      }

      // 2) Busca alocações
      const { data: allocData, error: allocError } = await supabase
        .from("time_allocations")
        .select(
          `
          id,
          project_id,
          activity_id,
          hours,
          comment,
          allocation_date,
          project:projects(id,name),
          activity:activities(id,name)
        `
        )
        .order("allocation_date", { ascending: false });

      if (allocError) {
        console.error("Erro ao buscar alocações:", allocError);
        setLoading(false);
        return;
      }

      // 3) Agrupa por data
      type RecordByDate = {
        entry_date: string;
        periods: Record<
          number,
          { entry_time: string | null; exit_time: string | null }
        >;
        time_allocations: TimeAllocationRecord[];
      };
      const map = new Map<string, RecordByDate>();

      // Inicializa datas
      entriesData?.forEach((e) => {
        if (!map.has(e.entry_date)) {
          map.set(e.entry_date, {
            entry_date: e.entry_date,
            periods: {},
            time_allocations: [],
          });
        }
        const rec = map.get(e.entry_date)!;
        rec.periods[e.period] = {
          entry_time: e.entry_time,
          exit_time: e.exit_time,
        };
      });

      // Agrupa alocações
      allocData?.forEach((a) => {
        const rec = map.get(a.allocation_date);
        if (rec) {
          const project = Array.isArray((a as any).project)
            ? (a as any).project[0]
            : (a as any).project;
          const activity = Array.isArray((a as any).activity)
            ? (a as any).activity[0]
            : (a as any).activity;
          rec.time_allocations.push({
            id: a.id,
            project_id: a.project_id,
            activity_id: a.activity_id,
            hours: a.hours,
            comment: a.comment,
            allocation_date: a.allocation_date,
            project,
            activity,
          });
        }
      });

      // Monta array final com períodos padrões
      const finalRecords: TimeEntryRecord[] = Array.from(map.values()).map(
        (r) => ({
          entry_date: r.entry_date,
          period: 0, // não usado
          entry_time: null,
          exit_time: null,
          time_allocations: r.time_allocations,
        })
      );

      // Armazena adicionalmente os períodos dentro de periodDetails
      type ListRecord = TimeEntryRecord & {
        periodDetails: Record<
          number,
          { entry_time: string | null; exit_time: string | null }
        >;
      };
      const list: ListRecord[] = finalRecords.map((r, idx) => {
        const byDate = Array.from(map.values())[idx];
        return {
          ...r,
          periodDetails: byDate.periods,
        };
      });

      setRecords(list);
      setLoading(false);
    }

    fetchRecords();
  }, [supabase]);

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Spinner />
      </div>
    );
  }

  if (records.length === 0) {
    return <p>Você não possui registros de ponto.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full table-auto border border-gray-200">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-2 text-left">Data</th>
            <th className="p-2 text-left">1º Entrada</th>
            <th className="p-2 text-left">1º Saída</th>
            <th className="p-2 text-left">2º Entrada</th>
            <th className="p-2 text-left">2º Saída</th>
            <th className="p-2 text-left">3º Entrada</th>
            <th className="p-2 text-left">3º Saída</th>
            <th className="p-2 text-left">Alocações</th>
          </tr>
        </thead>
        <tbody>
          {records.map((rec) => (
            <tr key={rec.entry_date} className="border-t even:bg-gray-50">
              <td className="p-2 align-top">{rec.entry_date}</td>
              {[1, 2, 3].map((p) => (
                <React.Fragment key={p}>
                  <td className="p-2 align-top">
                    {(rec as any).periodDetails[p]?.entry_time ?? "--:--"}
                  </td>
                  <td className="p-2 align-top">
                    {(rec as any).periodDetails[p]?.exit_time ?? "--:--"}
                  </td>
                </React.Fragment>
              ))}
              <td className="p-2">
                {rec.time_allocations.map((alloc) => (
                  <div key={alloc.id} className="mb-1">
                    <span className="font-semibold">{alloc.project.name}</span>
                    {" - "}
                    <span className="italic">{alloc.activity.name}</span>
                    {`: ${alloc.hours}h`}
                    {alloc.comment && (
                      <span className="text-gray-500"> ({alloc.comment})</span>
                    )}
                  </div>
                ))}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
