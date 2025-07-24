"use client";

import { useEffect, useState } from "react";
import { getHours } from "@/app/actions/inicio/get-hours";
import { BancoHorasType, BancoHorasResponseSchema } from "@/types/inicio/banco-horas";
import { Card } from "../ui/card";
import Loading from "@/app/loading";

export default function BancoHorasPage() {
  const [timeData, setTimeData] = useState<BancoHorasType >();

  useEffect(() => {
    async function fetchData() {
      const data = await getHours();
      const parsedData = BancoHorasResponseSchema.safeParse(data);

      if (parsedData.success) {
        setTimeData(parsedData.data);
      }
    }
    fetchData();
  }, []);

  function formatHour(hour: number) {
    if (typeof hour !== "number" || isNaN(hour)) return "-";
    return `${hour.toFixed(1)}h`;
  }

  function sum(field: keyof BancoHorasType["data"][number]) {
    if (!timeData || !Array.isArray(timeData.data)) return 0;
    return timeData.data.reduce((acc, curr) => acc + (Number(curr[field] || 0)), 0);
  }

  if (!timeData) return <Loading></Loading>;

  // Calculando totais corretamente:
  const totalHoras = sum("actual_hours");
  const horasExtras = timeData.data
    .filter((item) => item.banco_horas_atual > 0)
    .reduce((acc, curr) => acc + curr.banco_horas_atual, 0);
  const horasDebito = timeData.data
    .filter((item) => item.banco_horas_atual < 0)
    .reduce((acc, curr) => acc + Math.abs(curr.banco_horas_atual), 0);

  return (
    <>
    <Card>
    <div className="flex gap-6 m-6">
      <div className="flex-1 bg-[#fafbfc] rounded-xl p-6">
        <h2 className="font-semibold mb-4">Saldo por Funcionário</h2>
        {timeData.data.map((user) => (
          <div
            key={user.user_id}
            className={`bg-white rounded-lg p-4 mb-3 shadow-sm border-l-4 ${
              user.banco_horas_atual < 0 ? "border-[#f25d5d]" : "border-[#4ca554]"
            }`}
          >
            <div className="font-semibold">{user.user_name}</div>
            <div className="text-sm text-[#444] mb-1">
              Trabalhadas: {formatHour(user.actual_hours)} | Esperadas: {formatHour(user.expected_hours)}
            </div>
            <div className="text-xs text-[#888]">
              Carga: {user.working_hours_per_day}h/dia • {user.business_days_passed} dias
            </div>
            <div
              className={`float-right font-bold mt-[-2rem] ${
                user.banco_horas_atual < 0 ? "text-[#d63434]" : "text-[#36af36]"
              }`}
            >
              {user.banco_horas_atual < 0 ? (
                <>
                  <span className="mr-1">⚠️</span>
                  {formatHour(user.banco_horas_atual)}
                </>
              ) : (
                formatHour(user.banco_horas_atual)
              )}
            </div>
          </div>
        ))}
      </div>
      <div className="flex-[0.7] bg-[#fafbfc] rounded-xl p-6">
        <h2>Resumo Geral</h2>
        <div className="bg-white rounded-lg p-4 mb-3">
          <span>Total de Horas Registradas:</span>
          <span className="float-right text-[#2662f0] font-semibold">{formatHour(totalHoras)}</span>
        </div>
        <div className="bg-white rounded-lg p-4 mb-3">
          <span>Horas Extras Acumuladas:</span>
          <span className="float-right text-[#36af36] font-semibold">{formatHour(horasExtras)}</span>
        </div>
        <div className="bg-white rounded-lg p-4">
          <span>Horas em Débito:</span>
          <span className="float-right text-[#d63434] font-semibold">{formatHour(horasDebito)}</span>
        </div>
      </div>
    </div>
    </Card>
    </>
  );
}


