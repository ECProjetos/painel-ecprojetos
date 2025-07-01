"use client";

import { useEffect, useState } from "react";
import { getStatusUsuario } from "@/app/actions/time-sheet/clock-controller";

interface Status {
  ultimaMarcacao: string | null;
  bancoHorasAtual: number;
}

export function StatusUsuario({ userId }: { userId: string }) {
  const [status, setStatus] = useState<Status | null>(null);

  useEffect(() => {
    getStatusUsuario(userId).then(setStatus);
  }, [userId]);

  if (!status) return <p>Carregando...</p>;

  // compute the color class once
  const hoursColorClass =
    status.bancoHorasAtual >= 0 ? "text-green-600" : "text-red-600";

  return (
    <div className="flex justify-between items-center p-4 bg-white shadow rounded-lg border border-solid border-zinc-200">
      <div className="space-y-2">
        <h2 className="text-lg font-semibold">Status Atual</h2>
        <p>
          Última marcação:{" "}
          {status.ultimaMarcacao
            ? new Date(status.ultimaMarcacao).toLocaleString("pt-BR")
            : "Nenhuma marcação registrada"}
        </p>
      </div>
      <div className="text-right">
        <h2 className="text-lg font-semibold">Banco de Horas</h2>
        <p className={`text-2xl font-bold ${hoursColorClass}`}>
          {status.bancoHorasAtual.toFixed(2)} h
        </p>
      </div>
    </div>
  );
}
