"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import Loading from "@/app/loading"
import { formatISODateBR } from "@/lib/utils"

// Ajuste se o caminho real for diferente no seu projeto
import { getUserSession } from "@/app/(auth)/actions"
import { getHistoricoDetalhado } from "@/app/actions/inicio/get-hours"

type HistoricoDetalhadoItem = {
  entry_date: string // YYYY-MM-DD
  entry_time: string // HH:mm:ss
  fim_time?: string | null // HH:mm:ss
  projeto?: string | null
  atividade?: string | null
  horas?: number | null
}

type HistoricoDetalhadoResult =
  | { success: true; data: HistoricoDetalhadoItem[] }
  | { success: false; error?: string }

function toMonthValue(isoDate: string) {
  // "YYYY-MM-DD" -> "YYYY-MM"
  if (!isoDate) return ""
  return isoDate.slice(0, 7)
}

function downloadTextFile(filename: string, text: string, mime = "text/plain") {
  const blob = new Blob([text], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

function toCSV(rows: Array<Record<string, string | number>>) {
  if (rows.length === 0) return ""
  const headers = Object.keys(rows[0])
  const escape = (v: string) => `"${v.replace(/"/g, '""')}"`
  const lines = [
    headers.map(escape).join(","),
    ...rows.map((r) =>
      headers
        .map((h) => {
          const val = r[h]
          return escape(val === undefined || val === null ? "" : String(val))
        })
        .join(","),
    ),
  ]
  return lines.join("\n")
}

export default function DetalhadoPage() {
  const [userId, setUserId] = useState<string | null>(null)
  const [historico, setHistorico] = useState<HistoricoDetalhadoItem[]>([])
  const [loading, setLoading] = useState(true)

  // filtros
  const [filterDay, setFilterDay] = useState<string>("") // YYYY-MM-DD
  const [filterMonth, setFilterMonth] = useState<string>("") // YYYY-MM
  const [searchText, setSearchText] = useState<string>("") // projeto/atividade

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

  // default: mês atual
  useEffect(() => {
    const now = new Date()
    const y = now.getFullYear()
    const m = String(now.getMonth() + 1).padStart(2, "0")
    setFilterMonth(`${y}-${m}`)
  }, [])

  const filtered = useMemo(() => {
    const q = searchText.trim().toLowerCase()

    return historico.filter((item) => {
      if (filterDay && item.entry_date !== filterDay) return false
      if (!filterDay && filterMonth) {
        if (toMonthValue(item.entry_date) !== filterMonth) return false
      }
      if (q) {
        const p = (item.projeto ?? "").toLowerCase()
        const a = (item.atividade ?? "").toLowerCase()
        if (!p.includes(q) && !a.includes(q)) return false
      }
      return true
    })
  }, [historico, filterDay, filterMonth, searchText])

  const handleExportCSV = () => {
    const rows = filtered.map((item) => {
      const inicio = String(item.entry_time ?? "").slice(0, 5)
      const fim = String(item.fim_time ?? "").slice(0, 5)
      const horasNum = Number(item.horas ?? 0)

      return {
        data: formatISODateBR(item.entry_date),
        inicio,
        fim,
        projeto: item.projeto ?? "",
        atividade: item.atividade ?? "",
        horas: horasNum,
      }
    })

    const csv = toCSV(rows)
    const stamp = new Date().toISOString().slice(0, 10)
    downloadTextFile(`visao-detalhada-${stamp}.csv`, csv, "text/csv;charset=utf-8")
  }

  if (loading) return <Loading />

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4 gap-3">
        <div>
          <h1 className="text-lg font-semibold">Visão detalhada</h1>
          <p className="text-xs text-gray-500">
            Filtros por dia ou mês, busca por projeto/atividade e exportação CSV.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExportCSV}
            className="text-sm px-3 py-2 rounded-md border bg-white hover:bg-gray-50"
            type="button"
          >
            Exportar CSV
          </button>

          <Link
            href="/controle-horarios/inicio"
            className="text-sm text-blue-600 hover:underline"
          >
            Voltar
          </Link>
        </div>
      </div>

      {!userId ? (
        <p className="text-gray-500">Nenhum registro encontrado.</p>
      ) : (
        <>
          <div className="bg-white rounded-xl shadow p-4 mb-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div className="flex flex-col">
                <label className="text-xs text-gray-600 mb-1">Dia específico</label>
                <input
                  type="date"
                  value={filterDay}
                  onChange={(e) => setFilterDay(e.target.value)}
                  className="border rounded-md px-3 py-2 text-sm"
                />
                <button
                  type="button"
                  onClick={() => setFilterDay("")}
                  className="text-xs text-blue-600 mt-1 text-left"
                >
                  Limpar dia
                </button>
              </div>

              <div className="flex flex-col">
                <label className="text-xs text-gray-600 mb-1">Mês</label>
                <input
                  type="month"
                  value={filterMonth}
                  onChange={(e) => setFilterMonth(e.target.value)}
                  className="border rounded-md px-3 py-2 text-sm"
                  disabled={Boolean(filterDay)}
                  title={filterDay ? "Desative o filtro de dia para filtrar por mês" : ""}
                />
                <p className="text-[11px] text-gray-500 mt-1">
                  Se escolher dia, o mês fica desativado.
                </p>
              </div>

              <div className="flex flex-col md:col-span-2">
                <label className="text-xs text-gray-600 mb-1">
                  Buscar (projeto ou atividade)
                </label>
                <input
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  placeholder="Ex: INT, EXT, orçamento, reunião..."
                  className="border rounded-md px-3 py-2 text-sm"
                />
                <button
                  type="button"
                  onClick={() => setSearchText("")}
                  className="text-xs text-blue-600 mt-1 text-left"
                >
                  Limpar busca
                </button>
              </div>
            </div>
          </div>

          {filtered.length === 0 ? (
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
                    {filtered.map((item, idx) => {
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
        </>
      )}
    </div>
  )
}