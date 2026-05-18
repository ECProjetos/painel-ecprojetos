/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useEffect, useMemo, useState } from "react"
import Loading from "@/app/loading"
import { formatISODateBR } from "@/lib/utils"
import { getUserSession } from "@/app/(auth)/actions"
import { getHistoricoDetalhado } from "@/app/actions/inicio/get-hours"
import { HistoricoDetalhado } from "@/types/inicio/hora-projeto"

const MESES = [
  { value: "1", label: "Janeiro" },
  { value: "2", label: "Fevereiro" },
  { value: "3", label: "Março" },
  { value: "4", label: "Abril" },
  { value: "5", label: "Maio" },
  { value: "6", label: "Junho" },
  { value: "7", label: "Julho" },
  { value: "8", label: "Agosto" },
  { value: "9", label: "Setembro" },
  { value: "10", label: "Outubro" },
  { value: "11", label: "Novembro" },
  { value: "12", label: "Dezembro" },
]

function normalizeDateOnly(value?: string | null) {
  if (!value) return ""

  return String(value).slice(0, 10)
}

function getDateFromItem(item: HistoricoDetalhado) {
  const dateString = normalizeDateOnly(item.entry_date)

  if (!dateString) return null

  const date = new Date(`${dateString}T00:00:00`)

  if (Number.isNaN(date.getTime())) {
    return null
  }

  return {
    date,
    dateString,
    ano: date.getFullYear(),
    mes: date.getMonth() + 1,
  }
}

function formatHorasDecimal(horas: number) {
  const totalMinutos = Math.round(Number(horas ?? 0) * 60)
  const horasInteiras = Math.floor(totalMinutos / 60)
  const minutos = totalMinutos % 60

  return `${horasInteiras}h ${String(minutos).padStart(2, "0")}min`
}

export default function RelatorioColaborador() {
  const [historico, setHistorico] = useState<HistoricoDetalhado[]>([])
  const [loading, setLoading] = useState(true)

  const [anoFiltro, setAnoFiltro] = useState("all")
  const [mesFiltro, setMesFiltro] = useState("all")
  const [dataInicioFiltro, setDataInicioFiltro] = useState("")
  const [dataFimFiltro, setDataFimFiltro] = useState("")
  const [projetoFiltro, setProjetoFiltro] = useState("all")
  const [atividadeFiltro, setAtividadeFiltro] = useState("all")

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

  const anosDisponiveis = useMemo(() => {
    return Array.from(
      new Set(
        historico
          .map((item) => getDateFromItem(item)?.ano)
          .filter((ano): ano is number => Number.isFinite(Number(ano))),
      ),
    ).sort((a, b) => b - a)
  }, [historico])

  const projetosDisponiveis = useMemo(() => {
    return Array.from(
      new Set(
        historico
          .map((item) => String(item.projeto ?? "").trim())
          .filter(Boolean),
      ),
    ).sort((a, b) => a.localeCompare(b))
  }, [historico])

  const atividadesDisponiveis = useMemo(() => {
    return Array.from(
      new Set(
        historico
          .filter((item) => {
            const projeto = String(item.projeto ?? "").trim()

            return projetoFiltro === "all" || projeto === projetoFiltro
          })
          .map((item) => String(item.atividade ?? "").trim())
          .filter(Boolean),
      ),
    ).sort((a, b) => a.localeCompare(b))
  }, [historico, projetoFiltro])

  const historicoFiltrado = useMemo(() => {
    return historico
      .filter((item) => {
        const dateInfo = getDateFromItem(item)

        if (!dateInfo) return false

        const projeto = String(item.projeto ?? "").trim()
        const atividade = String(item.atividade ?? "").trim()

        const matchAno =
          anoFiltro === "all" || dateInfo.ano === Number(anoFiltro)

        const matchMes =
          mesFiltro === "all" || dateInfo.mes === Number(mesFiltro)

        const matchDataInicio =
          !dataInicioFiltro || dateInfo.dateString >= dataInicioFiltro

        const matchDataFim =
          !dataFimFiltro || dateInfo.dateString <= dataFimFiltro

        const matchProjeto =
          projetoFiltro === "all" || projeto === projetoFiltro

        const matchAtividade =
          atividadeFiltro === "all" || atividade === atividadeFiltro

        return (
          matchAno &&
          matchMes &&
          matchDataInicio &&
          matchDataFim &&
          matchProjeto &&
          matchAtividade
        )
      })
      .sort((a, b) => {
        const dateA = `${normalizeDateOnly(a.entry_date)} ${a.entry_time ?? ""}`
        const dateB = `${normalizeDateOnly(b.entry_date)} ${b.entry_time ?? ""}`

        return dateB.localeCompare(dateA)
      })
  }, [
    historico,
    anoFiltro,
    mesFiltro,
    dataInicioFiltro,
    dataFimFiltro,
    projetoFiltro,
    atividadeFiltro,
  ])

  const totalHorasFiltradas = useMemo(() => {
    return historicoFiltrado.reduce((acc, item) => {
      return acc + Number(item.horas ?? 0)
    }, 0)
  }, [historicoFiltrado])

  function limparFiltros() {
    setAnoFiltro("all")
    setMesFiltro("all")
    setDataInicioFiltro("")
    setDataFimFiltro("")
    setProjetoFiltro("all")
    setAtividadeFiltro("all")
  }

  if (loading) {
    return <Loading />
  }

  return (
    <div className="p-6">
      <div className="rounded-xl bg-white p-6 shadow">
        <div className="mb-6 flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
          <div>
            <h2 className="text-lg font-semibold">Meu Histórico Detalhado</h2>
            <p className="text-sm text-gray-500">
              Registros detalhados de horas lançadas por data, período, projeto
              e atividade.
            </p>
          </div>

          <div className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700">
            Total filtrado:{" "}
            <strong>{formatHorasDecimal(totalHorasFiltradas)}</strong>
          </div>
        </div>

        <div className="mb-6 rounded-2xl border border-gray-200 bg-gray-50 p-4">
          <div className="mb-4">
            <h3 className="text-base font-semibold text-gray-900">Filtros</h3>
            <p className="text-sm text-gray-500">
              Filtre o histórico por ano, mês, intervalo de datas, projeto e
              atividade.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-6">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-medium uppercase tracking-wide text-gray-500">
                Ano
              </label>

              <select
                value={anoFiltro}
                onChange={(event) => setAnoFiltro(event.target.value)}
                className="h-10 rounded-md border border-gray-300 bg-white px-3 text-sm"
              >
                <option value="all">Todos</option>
                {anosDisponiveis.map((ano) => (
                  <option key={ano} value={String(ano)}>
                    {ano}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-medium uppercase tracking-wide text-gray-500">
                Mês
              </label>

              <select
                value={mesFiltro}
                onChange={(event) => setMesFiltro(event.target.value)}
                className="h-10 rounded-md border border-gray-300 bg-white px-3 text-sm"
              >
                <option value="all">Todos</option>
                {MESES.map((mes) => (
                  <option key={mes.value} value={mes.value}>
                    {mes.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-medium uppercase tracking-wide text-gray-500">
                Data início
              </label>

              <input
                type="date"
                value={dataInicioFiltro}
                onChange={(event) => setDataInicioFiltro(event.target.value)}
                className="h-10 rounded-md border border-gray-300 bg-white px-3 text-sm"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-medium uppercase tracking-wide text-gray-500">
                Data fim
              </label>

              <input
                type="date"
                value={dataFimFiltro}
                onChange={(event) => setDataFimFiltro(event.target.value)}
                className="h-10 rounded-md border border-gray-300 bg-white px-3 text-sm"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-medium uppercase tracking-wide text-gray-500">
                Projeto
              </label>

              <select
                value={projetoFiltro}
                onChange={(event) => {
                  setProjetoFiltro(event.target.value)
                  setAtividadeFiltro("all")
                }}
                className="h-10 rounded-md border border-gray-300 bg-white px-3 text-sm"
              >
                <option value="all">Todos</option>
                {projetosDisponiveis.map((projeto) => (
                  <option key={projeto} value={projeto}>
                    {projeto}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-medium uppercase tracking-wide text-gray-500">
                Atividade
              </label>

              <select
                value={atividadeFiltro}
                onChange={(event) => setAtividadeFiltro(event.target.value)}
                className="h-10 rounded-md border border-gray-300 bg-white px-3 text-sm"
              >
                <option value="all">Todas</option>
                {atividadesDisponiveis.map((atividade) => (
                  <option key={atividade} value={atividade}>
                    {atividade}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <p className="text-sm text-gray-500">
              {historicoFiltrado.length} registro(s) encontrado(s).
            </p>

            <button
              type="button"
              onClick={limparFiltros}
              className="h-10 rounded-md border border-gray-300 bg-white px-4 text-sm font-medium text-gray-700 hover:bg-gray-100"
            >
              Limpar filtros
            </button>
          </div>
        </div>

        {historico.length === 0 ? (
          <p className="text-sm text-gray-500">Nenhum registro encontrado.</p>
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
                {historicoFiltrado.length ? (
                  historicoFiltrado.map((item, idx) => {
                    const inicio = item.entry_time
                      ? item.entry_time.slice(0, 5)
                      : ""

                    const fim = item.fim_time ? item.fim_time.slice(0, 5) : ""

                    return (
                      <tr key={`${item.entry_date}-${item.entry_time}-${idx}`}>
                        <td className="px-4 py-2">
                          {formatISODateBR(item.entry_date)}
                        </td>

                        <td className="px-4 py-2">
                          {inicio}
                          {fim ? ` - ${fim}` : ""}
                        </td>

                        <td className="px-4 py-2">{item.projeto || ""}</td>

                        <td className="px-4 py-2">{item.atividade || ""}</td>

                        <td className="px-4 py-2 font-semibold">
                          {formatHorasDecimal(Number(item.horas ?? 0))}
                        </td>
                      </tr>
                    )
                  })
                ) : (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-8 text-center text-gray-500"
                    >
                      Nenhum registro encontrado para os filtros selecionados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}