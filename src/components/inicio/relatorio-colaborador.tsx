/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { Card } from "@/components/ui/card";
import ResumoCard from "./resumo-card";
import { useEffect, useState } from "react";
import { getUserSession } from "@/app/(auth)/actions";
import { getHoursById } from "@/app/actions/inicio/get-hours";

export default function RelatorioColaborador() {
    const [userId, setUserId] = useState<any>();
    const [hoursData, setHours] = useState<any>();
    
      useEffect(() => {
        const fetchUser = async () => {
          const session = await getUserSession();
          setUserId(session?.user.id || null);
        };
        fetchUser();
      }, []);
      
    useEffect(() => {
        const fetchHours = async () => {
        const hoursData = getHoursById(userId)
        setHours(hoursData)
    }},[]);

  return (
    <div className="p-6 space-y-6">

      {/* 🔹 Top Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
        <ResumoCard
          title="Total Trabalhado"
          value="2.0h"
          gradient="from-blue-600 to-blue-500"
        />
        <ResumoCard
          title="Banco de Horas"
          value="-4.0h"
          gradient="from-green-600 to-green-500"
        />
        <ResumoCard
          title="Dias Trabalhados"
          value="1"
          gradient="from-purple-600 to-purple-500"
        />
      </div>

      {/* 🔹 Gráficos de Projeto e Atividade */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Card className="p-5 shadow">
          <h3 className="font-semibold mb-4">Minhas Horas por Projeto</h3>
          <div>
            <div className="flex justify-between text-sm font-medium">
              <span>Projeto Alpha</span>
              <span>2.0h</span>
            </div>
            <div className="w-full h-2 bg-gray-200 rounded mt-2 mb-1">
              <div className="h-2 bg-blue-600 rounded w-[100%]" />
            </div>
            <p className="text-xs text-blue-600">100.0% do meu tempo</p>
          </div>
        </Card>

        <Card className="p-5 shadow">
          <h3 className="font-semibold mb-4">Minhas Horas por Atividade</h3>
          <div>
            <div className="flex justify-between text-sm font-medium">
              <span>Desenvolvimento</span>
              <span>2.0h</span>
            </div>
            <div className="w-full h-2 bg-gray-200 rounded mt-2 mb-1">
              <div className="h-2 bg-green-600 rounded w-[100%]" />
            </div>
            <p className="text-xs text-green-600">100.0% do meu tempo</p>
          </div>
        </Card>
      </div>

      {/* 🔹 Histórico detalhado */}
      <Card className="p-5 shadow">
        <h3 className="font-semibold mb-4">Meu Histórico Detalhado</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-100 text-left">
              <tr>
                <th className="p-2">Data</th>
                <th className="p-2">Período</th>
                <th className="p-2">Projeto</th>
                <th className="p-2">Atividade</th>
                <th className="p-2 text-right">Horas</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t">
                <td className="p-2">23/07/2025</td>
                <td className="p-2">10:00 - 12:00</td>
                <td className="p-2">Projeto Alpha</td>
                <td className="p-2">Desenvolvimento</td>
                <td className="p-2 text-right font-semibold">2.0h</td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>

      {/* 🔹 Resumo Semanal */}
      <Card className="p-5 shadow">
        <h3 className="font-semibold mb-4">Resumo das Últimas Semanas</h3>
        <div className="flex justify-between text-sm bg-gray-50 p-4 rounded-md">
          <div>
            <p className="font-medium">20/07/2025 - 26/07/2025</p>
            <p className="text-gray-500">1 dias • 2.0h trabalhadas</p>
          </div>
          <div className="text-red-600 font-semibold">-4.0h</div>
        </div>
      </Card>
    </div>
  );
}

