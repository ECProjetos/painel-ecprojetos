"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import Loading from "@/app/loading"
import { formatISODateBR } from "@/lib/utils"

// Ajuste estes imports se no seu projeto o caminho/nome estiver diferente:
import { getUserSession } from "@/app/(auth)/actions"
import { getHistoricoDetalhado } from "@/app/actions/inicio/get-hours"

// Tipo local para evitar "any" e ficar compatível com o que a tela usa
type HistoricoDetalhadoItem = {
  entry_date: string
  entry_time: string
  fim_time?: string | null
  projeto?: string | null
  atividade?: string | null
  horas?: number | null
}

type HistoricoDetalhadoResult =
  | { success: true; data: HistoricoDetalhadoItem[] }
  | { success: false; error?: string }

export default function DetalhadoPage() {
  const [userId, setUserId] = useState<string | null>(null)
  const [historico, setHistorico] = useState<HistoricoDetalhadoItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const run = async () => {
      const session = await getUserSession()
      const id = session?.user?.id ?? null
      setUserId(id)

      if (!id) {
        setLoading(false)
        return
      }

      const result = (await getHistoricoDetalhado(id)) as HistoricoDetalhadoResult

      if (result?.success) {
        setHistorico(result.data ?? [])
      }

      setLoading(false)
    }

    run()
  }, [])

  if (loading) return <Loading />

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-semibold">Visão detalhada</h1>

        <Link
          href="/controle-horarios/inicio"
          className="text-sm text-blue-600 hover:underline"
        >
          Voltar
        </Link>
      </div>

      {!userId || historico.length === 0 ? (
        <p className="text-gray-500">Nenhum registro encontrado.</p>
      ) : (
        <div className="bg-white rounded-xl shadow p-6">
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
                  const inicio = String(item.entry_time ?? "").slice(0, 5)
                  const fim = String(item.fim_time ?? "").slice(0, 5)

                  const horasNum = Number(item.horas ?? 0)
                  const h = Math.floor(horasNum)
                  const m = Math.round((horasNum % 1) * 60)

                  return (
                    <tr key={`${item.entry_date}-${item.entry_time}-${idx}`}>
                      <td className="px-4 py-2">
                        {formatISODateBR(String(item.entry_date))}
                      </td>

                      <td className="px-4 py-2">
                        {inicio} {fim ? `a ${fim}` : ""}
                      </td>

                      <td className="px-4 py-2">{item.projeto ?? ""}</td>

                      <td className="px-4 py-2">{item.atividade ?? ""}</td>

                      <td className="px-4 py-2 font-semibold">{`${h}h ${m}m`}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}