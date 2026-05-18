/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useEffect, useState } from "react"
import Loading from "@/app/loading"
import { formatISODateBR } from "@/lib/utils"
import { getUserSession } from "@/app/(auth)/actions"
import { getHistoricoDetalhado } from "@/app/actions/inicio/get-hours"
import { HistoricoDetalhado } from "@/types/inicio/hora-projeto"

export default function RelatorioColaborador() {
  const [historico, setHistorico] = useState<HistoricoDetalhado[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchHistorico = async () => {
      try {
        const session = await getUserSession()
        const userId = session?.user?.id || null

        if (!userId) {
          setHistorico([])
          return
        }

        const result = await getHistoricoDetalhado(userId)

        if (result.success) {
          setHistorico(result.data ?? [])
        } else {
          setHistorico([])
        }
      } catch (error) {
        console.error("Erro ao buscar histórico detalhado:", error)
        setHistorico([])
      } finally {
        setLoading(false)
      }
    }

    fetchHistorico()
  }, [])

  if (loading) {
    return <Loading />
  }

  return (
    <div className="p-6">
      <div className="bg-white rounded-xl shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold">Meu Histórico Detalhado</h2>
            <p className="text-sm text-gray-500">
              Registros detalhados de horas lançadas por data, período, projeto e atividade.
            </p>
          </div>
        </div>

        {historico.length === 0 ? (
          <p className="text-sm text-gray-500">
            Nenhum registro encontrado.
          </p>
        ) : (
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
                {historico.map((item, idx) => {
                  const inicio = item.entry_time
                    ? item.entry_time.slice(0, 5)
                    : ""

                  const fim = item.fim_time
                    ? item.fim_time.slice(0, 5)
                    : ""

                  const horas = Number(item.horas ?? 0)
                  const horasInteiras = Math.floor(horas)
                  const minutos = Math.round((horas % 1) * 60)

                  return (
                    <tr key={`${item.entry_date}-${item.entry_time}-${idx}`}>
                      <td className="px-4 py-2">
                        {formatISODateBR(item.entry_date)}
                      </td>

                      <td className="px-4 py-2">
                        {inicio}
                        {fim ? ` - ${fim}` : ""}
                      </td>

                      <td className="px-4 py-2">
                        {item.projeto || ""}
                      </td>

                      <td className="px-4 py-2">
                        {item.atividade || ""}
                      </td>

                      <td className="px-4 py-2 font-semibold">
                        {`${horasInteiras}h ${minutos}m`}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}