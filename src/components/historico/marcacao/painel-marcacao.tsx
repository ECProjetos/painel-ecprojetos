"use client";

import { useState, useEffect } from "react";
import { MetricsCards, Insights } from "./metrics-cards";
import MonthFilter from "./month-filter";
import TimeEntriesTable from "./time-entries-table";
import type { TimeEntryDaily } from "@/types/time-sheet/time-entry-daily ";
import { fetchTimeEntriesByMonth } from "@/app/actions/time-sheet/clock-controller";

interface MarcacaoPainelProps {
  insights: Insights;
  userId: string;
  month: number;
  year: number;
}

export function MarcacaoPainel({
  userId,
  month,
  year,
  insights,
}: MarcacaoPainelProps) {
  const [entries, setEntries] = useState<TimeEntryDaily[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadEntries() {
      setLoading(true);
      try {
        const data = await fetchTimeEntriesByMonth(userId, month, year);
        setEntries(data);
      } catch (error) {
        console.error("Erro ao carregar entradas:", error);
      } finally {
        setLoading(false);
      }
    }

    loadEntries();
  }, [userId, month, year]);

  return (
    <div>
      <MetricsCards insights={insights} />
      {loading ? (
        <div className="text-center text-gray-500">Carregando entradas...</div>
      ) : (
        <div className="space-y-4">
          <MonthFilter initialMonth={month} initialYear={year} />
          <TimeEntriesTable data={entries} />
        </div>
      )}
    </div>
  );
}
