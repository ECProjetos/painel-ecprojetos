"use client"

import { useEffect, useMemo, useState } from "react"
import { getHours } from "@/app/actions/inicio/get-hours"
import {
  BancoHorasType,
  BancoHorasResponseSchema,
} from "@/types/inicio/banco-horas"
import { Card } from "../ui/card"
import Loading from "@/app/loading"
import { formatMinutesToHHMM } from "@/lib/utils"

type BancoHorasRow = BancoHorasType["data"][number]

export default function BancoHorasPage() {
  const [timeData, setTimeData] = useState<BancoHorasType>()
  const [filtroColaborador, setFiltroColaborador] = useState<string>("")
  const [filtroSetor, setFiltroSetor] = useState<string>("")

  useEffect(() => {
    async function fetchData() {
      const data = await getHours()
      const parsedData = BancoHorasResponseSchema.safeParse(data)

      if (parsedData.success) {
        setTimeData(parsedData.data)
      }
    }
    fetchData()
  }, [])

  function sum(list: BancoHorasRow[], field: keyof BancoHorasRow) {
    return list.reduce((acc, curr) => acc + Number(curr[field] || 0), 0)
  }

  const allRows = timeData?.data ?? []

  // Opções dos filtros
  const colaboradoresOptions = useMemo(() => {
    return [...allRows]
      .map((r) => ({ id: r.user_id, name: r.user_name }))
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [allRows])

  // O backend precisa enviar esse campo (veja o passo 2 abaixo)
  // Aqui eu uso fallback para não quebrar: (row as any).departamento_nome
  const setoresOptions = useMemo(() => {
    const set = new Set<string>()
    for (const row of allRows) {
      const setor =
        (row as unknown as { departamento_nome?: string }).departamento_nome ??
        ""
      if (setor) set.add(setor)
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b))
  }, [allRows])

  const filteredRows = useMemo(() => {
    return allRows.filter((row) => {
      const okColab =
        !filtroColaborador || String(row.user_id) === String(filtroColaborador)

      const setor =
        (row as unknown as { departamento_nome?: string }).departamento_nome ??
        ""

      const okSetor = !filtroSetor || setor === filtroSetor

      return okColab && okSetor
    })
  }, [allRows, filtroColaborador, filtroSetor])

  if (!timeData) return <Loading />

  // Totais com base no que está filtrado
  const totalHoras = sum(filteredRows, "actual_hours")

  const horasExtras = filteredRows
    .filter((item) => item.banco_horas_atual > 0)
    .reduce((acc, curr) => acc + curr.banco_horas_atual, 0)

  const horasDebito = filteredRows
    .filter((item) => item.banco_horas_atual < 0)
    .reduce((acc, curr) => acc + Math.abs(curr.banco_horas_atual), 0)

  return (
    <Card>
      <div className="m-6 space-y-4">
        {/* Filtros */}
        <div className="bg-[#fafbfc] rounded-xl p-4 border">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
            <div className="flex flex-col">
              <label className="text-xs text-gray-600 mb-1">Colaborador</label>
              <select
                value={filtroColaborador}
                onChange={(e) => setFiltroColaborador(e.target.value)}
                className="border rounded-md px-3 py-2 text-sm bg-white"
              >
                <option value="">Todos</option>
                {colaboradoresOptions.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col">
              <label className="text-xs text-gray-600 mb-1">Setor</label>
              <select
                value={filtroSetor}
                onChange={(e) => setFiltroSetor(e.target.value)}
                className="border rounded-md px-3 py-2 text-sm bg-white"
                disabled={setoresOptions.length === 0}
                title={
                  setoresOptions.length === 0
                    ? "Setor só aparece quando o backend enviar o departamento."
                    : ""
                }
              >
                <option value="">Todos</option>
                {setoresOptions.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              {setoresOptions.length === 0 ? (
                <span className="text-[11px] text-gray-500 mt-1">
                  Para o filtro de setor funcionar, precisamos retornar o
                  departamento no getHours.
                </span>
              ) : null}
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setFiltroColaborador("")
                  setFiltroSetor("")
                }}
                className="border rounded-md px-3 py-2 text-sm bg-white hover:bg-gray-50"
              >
                Limpar filtros
              </button>
            </div>
          </div>
        </div>

        {/* Conteúdo */}
        <div className="flex gap-6">
          <div className="flex-1 bg-[#fafbfc] rounded-xl p-6">
            <h2 className="font-semibold mb-4">Saldo por Funcionário</h2>

            {filteredRows.length === 0 ? (
              <p className="text-sm text-gray-500">Nenhum resultado.</p>
            ) : (
              filteredRows.map((user) => {
                const dept =
                  (user as unknown as { departamento_nome?: string })
                    .departamento_nome ?? ""

                return (
                  <div
                    key={user.user_id}
                    className={`bg-white rounded-lg p-4 mb-3 shadow-sm border-l-4 ${
                      user.banco_horas_atual < 0
                        ? "border-[#f25d5d]"
                        : "border-[#4ca554]"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="font-semibold">{user.user_name}</div>
                        {dept ? (
                          <div className="text-xs text-gray-500">{dept}</div>
                        ) : null}
                      </div>

                      <div
                        className={`font-bold ${
                          user.banco_horas_atual < 0
                            ? "text-[#d63434]"
                            : "text-[#36af36]"
                        }`}
                      >
                        {user.banco_horas_atual < 0 ? (
                          <>
                            <span className="mr-1">⚠️</span>
                            {formatMinutesToHHMM(user.banco_horas_atual * 60)}
                          </>
                        ) : (
                          formatMinutesToHHMM(user.banco_horas_atual * 60)
                        )}
                      </div>
                    </div>

                    <div className="text-sm text-[#444] mt-2">
                      Trabalhadas: {formatMinutesToHHMM(user.actual_hours * 60)}{" "}
                      | Esperadas:{" "}
                      {formatMinutesToHHMM(user.expected_hours * 60)}
                    </div>

                    <div className="text-xs text-[#888] mt-1">
                      Carga: {user.working_hours_per_day}h/dia •{" "}
                      {user.business_days_passed} dias
                    </div>
                  </div>
                )
              })
            )}
          </div>

          <div className="flex-[0.7] bg-[#fafbfc] rounded-xl p-6">
            <h2 className="font-semibold mb-4">Resumo Geral</h2>

            <div className="bg-white rounded-lg p-4 mb-3">
              <span>Total de Horas Registradas:</span>
              <span className="float-right text-[#2662f0] font-semibold">
                {formatMinutesToHHMM(totalHoras * 60)}
              </span>
            </div>

            <div className="bg-white rounded-lg p-4 mb-3">
              <span>Horas Extras Acumuladas:</span>
              <span className="float-right text-[#36af36] font-semibold">
                {formatMinutesToHHMM(horasExtras * 60)}
              </span>
            </div>

            <div className="bg-white rounded-lg p-4">
              <span>Horas em Débito:</span>
              <span className="float-right text-[#d63434] font-semibold">
                {formatMinutesToHHMM(horasDebito * 60)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}