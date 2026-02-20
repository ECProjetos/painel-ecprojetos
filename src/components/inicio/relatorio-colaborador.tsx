/* eslint-disable @typescript-eslint/no-explicit-any */

import ResumoCard from "./resumo-card"
import { formatISODateBR } from "@/lib/utils"
import { useEffect, useState } from "react"
import { getUserSession } from "@/app/(auth)/actions"
import {
  getHistoricoDetalhado,
  getHoursById,
  getHoursProAct,
} from "@/app/actions/inicio/get-hours"
import Loading from "@/app/loading"
import {
  relatorioColaborador,
  relatorioColaboradorSchema,
} from "@/types/inicio/relatorio-colaborador"
import { HistoricoDetalhado, horaProjeto } from "@/types/inicio/hora-projeto"
import { MinhasHorasPorProjeto } from "@/components/hora-projeto"
import Link from "next/link"

export default function RelatorioColaborador() {
  const [userId, setUserId] = useState<any>()
  const [hoursData, setHours] = useState<relatorioColaborador>()
  const [hourProject, setHourProject] = useState<horaProjeto>({
    projetos: [],
    atividades: [],
  })
  console.log("AQUI", hourProject)
  const [historico, setHistorico] = useState<HistoricoDetalhado[]>([])

  useEffect(() => {
    const fetchHistorico = async () => {
      if (!userId) return
      const result = await getHistoricoDetalhado(userId)
      console.log("HISTORICO", result)
      if (result.success) {
        setHistorico(result.data)
      }
    }
    fetchHistorico()
  }, [userId])

  useEffect(() => {
    const fetchUser = async () => {
      const session = await getUserSession()
      setUserId(session?.user.id || null)
      console.log(session)
    }
    fetchUser()
  }, [])

  useEffect(() => {
    const fetchHours = async () => {
      if (!userId) return
      const hoursData = await getHoursById(userId)
      if (hoursData && hoursData.data) {
        const parsedResult = relatorioColaboradorSchema.safeParse(
          hoursData.data,
        )
        if (parsedResult.success) {
          setHours(parsedResult.data)
        } else {
          setHours(undefined)
        }
      }
    }
    fetchHours()
  }, [userId])

  useEffect(() => {
    const fetchHoursProAct = async () => {
      if (!userId) return
      const hoursResult = await getHoursProAct(userId)
      if (hoursResult?.success && hoursResult.data) {
        setHourProject(hoursResult.data)
      } else {
        setHourProject({ projetos: [], atividades: [] })
      }
    }
    fetchHoursProAct()
  }, [userId])

  return userId ? (
    <div className="p-6 space-y-6">
      
      {/* 🔹 Top Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5 mb-10">
        <ResumoCard
          title="Total Trabalhado"
          value={
            hoursData?.actual_hours !== undefined
              ? `${hoursData.actual_hours.toFixed(1)} horas`
              : ""
          }
          gradient="from-blue-600 to-blue-500"
        />
        <ResumoCard
          title="Banco de Horas"
          value={
            hoursData?.banco_horas_atual !== undefined
              ? `${hoursData.banco_horas_atual.toFixed(1)} horas`
              : ""
          }
          gradient="from-green-600 to-green-500"
        />
        
        <ResumoCard
          title="Dias Trabalhados"
          value={
            hoursData?.business_days_passed !== undefined
              ? `${hoursData.business_days_passed}`
              : ""
          }
          gradient="from-purple-600 to-purple-500"
        />
        <Link
            href="/controle-horarios/inicio/detalhado"
            className="text-sm text-blue-600 hover:underline"
          >
            Visão Detalhada
          </Link>
      </div>

      {/* 🔹 Gráficos de Projeto e Atividade */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <MinhasHorasPorProjeto
          dados={(hourProject.projetos ?? []).map((item) => ({
            ...item,
            user_id: userId,
            tipo_agrupamento: "projeto",
          }))}
          titulo="Minhas Horas por Projeto"
          cor="blue"
        />

        <MinhasHorasPorProjeto
          dados={(hourProject.atividades ?? []).map((item) => ({
            ...item,
            user_id: userId,
            tipo_agrupamento: "atividade",
          }))}
          titulo="Minhas Horas por Atividade"
          cor="green"
        />
      </div>
      <div></div>
      <div className="bg-white rounded-xl shadow p-6 mt-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold mb-4">
            Meu Histórico Detalhado
          </h2>

        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-2 text-left font-semibold text-gray-700">
                  Data
                </th>
                <th className="px-4 py-2 text-left font-semibold text-gray-700">
                  Período
                </th>
                <th className="px-4 py-2 text-left font-semibold text-gray-700">
                  Projeto
                </th>
                <th className="px-4 py-2 text-left font-semibold text-gray-700">
                  Atividade
                </th>
                <th className="px-4 py-2 text-left font-semibold text-gray-700">
                  Horas
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {historico.map((item, idx) => (
                <tr key={idx}>
                  <td className="px-4 py-2">
                    {formatISODateBR(item.entry_date)}
                  </td>
                  <td className="px-4 py-2">
                    {item.entry_time.slice(0, 5)} - {item.fim_time.slice(0, 5)}
                  </td>
                  <td className="px-4 py-2">{item.projeto}</td>
                  <td className="px-4 py-2">{item.atividade}</td>
                  <td className="px-4 py-2 font-semibold">
                    {`${Math.floor(item.horas)}h ${Math.round((item.horas % 1) * 60)}m`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  ) : (
    <Loading />
  )
}
