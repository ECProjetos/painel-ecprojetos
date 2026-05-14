"use client"

import { useEffect, useMemo, useState } from "react"
import {
  AlertCircle,
  BriefcaseBusiness,
  CalendarDays,
  Clock3,
  Filter,
  TrendingUp,
} from "lucide-react"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Loading from "@/app/loading"
import {
  getMeuPainelHoras,
  getMeusProjetosHorasOptions,
  type MeuProjetoHorasOption,
} from "@/app/actions/inicio/get-meu-painel-horas"

type ProjetoHoras = {
  projeto_id: number
  projeto_codigo: string
  projeto_nome: string
  status: string
  horas_estimadas: number
  horas_feitas: number
  saldo_horas: number
  percentual_consumido: number
  data_inicio_projeto: string | null
  data_ultima_apontada: string | null
}

type PainelData = {
  resumo: {
    user_id: string
    user_name: string
    mes_referencia: string | null
    horas_trabalhadas_mes: number
    horas_a_fazer_mes: number
    banco_horas_anterior: number
    banco_horas_atual: number
    horas_somadas_banco: number
    business_days_passed: number
    working_hours_per_day: number
  } | null
  projetos: ProjetoHoras[]
  totalHorasRecorte: number
  totalHorasInt: number
  totalHorasExt: number
  totalProjetos: number
}

function formatHours(value: number) {
  const safeValue = Number.isFinite(value) ? value : 0
  const isNegative = safeValue < 0
  const absolute = Math.abs(safeValue)

  let hours = Math.floor(absolute)
  let minutes = Math.round((absolute - hours) * 60)

  if (minutes === 60) {
    hours += 1
    minutes = 0
  }

  return `${isNegative ? "-" : ""}${hours}h ${String(minutes).padStart(
    2,
    "0",
  )}min`
}

function formatPercent(value: number) {
  const safeValue = Number.isFinite(value) ? value : 0

  return `${safeValue.toFixed(1)}%`
}

function getStatusConsumo(percentual: number) {
  if (percentual >= 100) {
    return {
      label: "Estourado",
      badge: "bg-red-100 text-red-700 border-red-200",
      bar: "#ef4444",
    }
  }

  if (percentual >= 80) {
    return {
      label: "Atenção",
      badge: "bg-yellow-100 text-yellow-700 border-yellow-200",
      bar: "#eab308",
    }
  }

  return {
    label: "OK",
    badge: "bg-green-100 text-green-700 border-green-200",
    bar: "#22c55e",
  }
}

function KpiCard({
  title,
  value,
  subtitle,
  icon,
}: {
  title: string
  value: string
  subtitle?: string
  icon: React.ReactNode
}) {
  return (
    <Card className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="mt-3 text-2xl font-semibold tracking-tight text-gray-900">
            {value}
          </p>
          {subtitle ? (
            <p className="mt-2 text-xs leading-5 text-gray-500">{subtitle}</p>
          ) : null}
        </div>

        <div className="rounded-2xl bg-gray-50 p-3 text-gray-600">{icon}</div>
      </div>
    </Card>
  )
}

function SectionCard({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle?: string
  children: React.ReactNode
}) {
  return (
    <Card className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
        {subtitle ? <p className="text-sm text-gray-500">{subtitle}</p> : null}
      </div>

      {children}
    </Card>
  )
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  options: Array<{ value: string; label: string }>
}) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-xs font-medium uppercase tracking-wide text-gray-500">
        {label}
      </label>

      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 rounded-md border border-gray-300 bg-white px-3 text-sm"
      >
        {options.map((option) => (
          <option key={`${label}-${option.value}`} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  )
}

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean
  payload?: Array<{
    value: number
    payload: {
      nomeCompleto: string
      percentual: number
    }
  }>
}) {
  if (!active || !payload || payload.length === 0) return null

  const item = payload[0]

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-3 shadow-md">
      <p className="text-sm font-semibold text-gray-900">
        {item.payload.nomeCompleto}
      </p>
      <p className="text-sm text-gray-600">{formatHours(item.value)}</p>
      <p className="text-xs text-gray-500">
        Consumo: {formatPercent(item.payload.percentual)}
      </p>
    </div>
  )
}

export default function MeuPainelHoras() {
  const currentYear = new Date().getFullYear()

  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<PainelData | null>(null)
  const [projetoOptions, setProjetoOptions] = useState<MeuProjetoHorasOption[]>(
    [],
  )

  const [selectedYear, setSelectedYear] = useState(String(currentYear))
  const [selectedQuarter, setSelectedQuarter] = useState("all")
  const [selectedMonth, setSelectedMonth] = useState("all")
  const [selectedWeek, setSelectedWeek] = useState("all")
  const [selectedProjeto, setSelectedProjeto] = useState("all")

  const yearOptions = useMemo(() => {
    return [
      { value: "all", label: "Todos" },
      { value: String(currentYear - 1), label: String(currentYear - 1) },
      { value: String(currentYear), label: String(currentYear) },
      { value: String(currentYear + 1), label: String(currentYear + 1) },
    ]
  }, [currentYear])

  const quarterOptions = [
    { value: "all", label: "Todos" },
    { value: "1", label: "1º trimestre" },
    { value: "2", label: "2º trimestre" },
    { value: "3", label: "3º trimestre" },
    { value: "4", label: "4º trimestre" },
  ]

  const monthOptions = [
    { value: "all", label: "Todos" },
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

  const weekOptions = [
    { value: "all", label: "Todas" },
    { value: "1", label: "Semana 1" },
    { value: "2", label: "Semana 2" },
    { value: "3", label: "Semana 3" },
    { value: "4", label: "Semana 4" },
    { value: "5", label: "Semana 5" },
  ]

  const projetoFiltroOptions = useMemo(() => {
    return [
      { value: "all", label: "Todos os projetos" },
      ...projetoOptions.map((item) => ({
        value: String(item.id),
        label: `${item.code} • ${item.name}`,
      })),
    ]
  }, [projetoOptions])

  useEffect(() => {
    async function loadOptions() {
      const result = await getMeusProjetosHorasOptions()

      if (result.success) {
        setProjetoOptions(result.data)
      }
    }

    loadOptions()
  }, [])

  useEffect(() => {
    async function loadData() {
      setLoading(true)

      try {
        const result = await getMeuPainelHoras({
          year: selectedYear,
          quarter: selectedQuarter,
          month: selectedMonth,
          week: selectedWeek,
          projetoId: selectedProjeto,
        })

        if (result.success && result.data) {
          setData(result.data as PainelData)
        } else {
          setData(null)
        }
      } catch (error) {
        console.error("Erro ao carregar meu painel de horas:", error)
        setData(null)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [
    selectedYear,
    selectedQuarter,
    selectedMonth,
    selectedWeek,
    selectedProjeto,
  ])

  const projetosOrdenados = useMemo(() => {
    return [...(data?.projetos ?? [])].sort(
      (a, b) => b.horas_feitas - a.horas_feitas,
    )
  }, [data?.projetos])

  const projetosGrafico = useMemo(() => {
    return projetosOrdenados.map((item) => ({
      nome: item.projeto_codigo,
      nomeCompleto: `${item.projeto_codigo} • ${item.projeto_nome}`,
      horas: Number(item.horas_feitas.toFixed(2)),
      percentual: item.percentual_consumido,
      color: getStatusConsumo(item.percentual_consumido).bar,
    }))
  }, [projetosOrdenados])

  const projetosChartHeight = Math.max(projetosGrafico.length * 44, 320)

  function limparFiltros() {
    setSelectedYear(String(currentYear))
    setSelectedQuarter("all")
    setSelectedMonth("all")
    setSelectedWeek("all")
    setSelectedProjeto("all")
  }

  if (loading) return <Loading />

  if (!data) {
    return (
      <div className="p-6">
        <Card className="rounded-2xl border border-red-100 bg-red-50 p-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-1 h-5 w-5 text-red-600" />
            <div>
              <h2 className="font-semibold text-red-800">
                Não foi possível carregar o painel.
              </h2>
              <p className="mt-1 text-sm text-red-700">
                Verifique se o usuário está logado e se existem lançamentos de
                horas vinculados a ele.
              </p>
            </div>
          </div>
        </Card>
      </div>
    )
  }

  const saldoBanco = data.resumo?.banco_horas_atual ?? 0

  return (
    <div className="min-w-0 space-y-6 p-4 md:p-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold text-gray-900">
          Meu Painel de Horas
        </h1>

        <p className="text-sm text-gray-500">
          Acompanhe suas horas lançadas, seus projetos e seu banco de horas.
        </p>
      </div>

      <SectionCard
        title="Filtros"
        subtitle="Use os filtros para acompanhar suas horas por período ou por projeto."
      >
        <div className="grid grid-cols-1 items-end gap-4 md:grid-cols-2 xl:grid-cols-6">
          <FilterSelect
            label="Ano"
            value={selectedYear}
            onChange={setSelectedYear}
            options={yearOptions}
          />

          <FilterSelect
            label="Trimestre"
            value={selectedQuarter}
            onChange={setSelectedQuarter}
            options={quarterOptions}
          />

          <FilterSelect
            label="Mês"
            value={selectedMonth}
            onChange={setSelectedMonth}
            options={monthOptions}
          />

          <FilterSelect
            label="Semana"
            value={selectedWeek}
            onChange={setSelectedWeek}
            options={weekOptions}
          />

          <FilterSelect
            label="Projeto"
            value={selectedProjeto}
            onChange={setSelectedProjeto}
            options={projetoFiltroOptions}
          />

          <Button
            type="button"
            variant="outline"
            onClick={limparFiltros}
            className="h-10"
          >
            <Filter className="h-4 w-4" />
            Limpar
          </Button>
        </div>
      </SectionCard>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        <KpiCard
          title="Horas no recorte"
          value={formatHours(data.totalHorasRecorte)}
          subtitle="Total de horas conforme os filtros selecionados"
          icon={<Clock3 className="h-5 w-5" />}
        />

        <KpiCard
          title="Horas em projetos INT"
          value={formatHours(data.totalHorasInt)}
          subtitle="Horas lançadas em projetos internos"
          icon={<BriefcaseBusiness className="h-5 w-5" />}
        />

        <KpiCard
          title="Horas em projetos EXT"
          value={formatHours(data.totalHorasExt)}
          subtitle="Horas lançadas em projetos externos"
          icon={<BriefcaseBusiness className="h-5 w-5" />}
        />

        <KpiCard
          title="Banco de horas atual"
          value={formatHours(saldoBanco)}
          subtitle={
            saldoBanco < 0
              ? "Saldo negativo no mês atual"
              : "Saldo positivo ou zerado no mês atual"
          }
          icon={<TrendingUp className="h-5 w-5" />}
        />

        <KpiCard
          title="Horas previstas no mês"
          value={formatHours(data.resumo?.horas_a_fazer_mes ?? 0)}
          subtitle="Carga prevista conforme calendário do mês atual"
          icon={<CalendarDays className="h-5 w-5" />}
        />

        <KpiCard
          title="Dias úteis considerados"
          value={`${data.resumo?.business_days_passed ?? 0}`}
          subtitle="Base usada no cálculo mensal"
          icon={<CalendarDays className="h-5 w-5" />}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <SectionCard
          title="Minhas horas por projeto"
          subtitle="Projetos com maior volume de horas no período selecionado."
        >
          {projetosGrafico.length > 0 ? (
            <div className="h-[360px] overflow-y-auto pr-2">
              <div style={{ height: projetosChartHeight, minWidth: "100%" }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={projetosGrafico}
                    layout="vertical"
                    margin={{ top: 8, right: 20, left: 10, bottom: 8 }}
                    barCategoryGap={10}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      horizontal={true}
                      vertical={false}
                    />
                    <XAxis type="number" tick={{ fontSize: 12 }} />
                    <YAxis
                      type="category"
                      dataKey="nome"
                      width={105}
                      interval={0}
                      tick={{ fontSize: 12 }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="horas" radius={[0, 8, 8, 0]}>
                      {projetosGrafico.map((entry) => (
                        <Cell key={entry.nomeCompleto} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-gray-100 bg-gray-50 p-5 text-sm text-gray-600">
              Nenhum lançamento encontrado para o recorte selecionado.
            </div>
          )}
        </SectionCard>

        <SectionCard
          title="Resumo mensal"
          subtitle="Informações do banco de horas do mês atual."
        >
          <div className="space-y-3">
            <div className="rounded-2xl border border-gray-100 p-4">
              <p className="text-sm text-gray-500">Colaborador</p>
              <p className="mt-1 font-semibold text-gray-900">
                {data.resumo?.user_name ?? "-"}
              </p>
            </div>

            <div className="rounded-2xl border border-gray-100 p-4">
              <p className="text-sm text-gray-500">Horas trabalhadas no mês</p>
              <p className="mt-1 font-semibold text-gray-900">
                {formatHours(data.resumo?.horas_trabalhadas_mes ?? 0)}
              </p>
            </div>

            <div className="rounded-2xl border border-gray-100 p-4">
              <p className="text-sm text-gray-500">Horas previstas no mês</p>
              <p className="mt-1 font-semibold text-gray-900">
                {formatHours(data.resumo?.horas_a_fazer_mes ?? 0)}
              </p>
            </div>

            <div className="rounded-2xl border border-gray-100 p-4">
              <p className="text-sm text-gray-500">Banco anterior</p>
              <p className="mt-1 font-semibold text-gray-900">
                {formatHours(data.resumo?.banco_horas_anterior ?? 0)}
              </p>
            </div>

            <div
              className={`rounded-2xl border p-4 ${
                saldoBanco < 0
                  ? "border-red-100 bg-red-50"
                  : "border-green-100 bg-green-50"
              }`}
            >
              <p
                className={`text-sm ${
                  saldoBanco < 0 ? "text-red-700" : "text-green-700"
                }`}
              >
                Banco atual
              </p>
              <p
                className={`mt-1 text-xl font-semibold ${
                  saldoBanco < 0 ? "text-red-700" : "text-green-700"
                }`}
              >
                {formatHours(saldoBanco)}
              </p>
            </div>
          </div>
        </SectionCard>
      </div>

      <SectionCard
        title="Detalhamento por projeto"
        subtitle="Tabela com suas horas, saldo e percentual consumido por projeto."
      >
        <div className="overflow-x-auto rounded-xl border border-gray-100">
          <table className="min-w-[980px] w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-3">Projeto</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Horas estimadas</th>
                <th className="px-4 py-3">Minhas horas</th>
                <th className="px-4 py-3">Saldo do projeto</th>
                <th className="px-4 py-3">% consumido</th>
                <th className="px-4 py-3">Último lançamento</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {projetosOrdenados.length > 0 ? (
                projetosOrdenados.map((item) => {
                  const status = getStatusConsumo(item.percentual_consumido)

                  return (
                    <tr key={item.projeto_id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">
                        {item.projeto_codigo} • {item.projeto_nome}
                      </td>

                      <td className="px-4 py-3">
                        <span className="rounded-full border border-gray-200 bg-gray-50 px-2 py-1 text-xs font-medium text-gray-600">
                          {item.status}
                        </span>
                      </td>

                      <td className="px-4 py-3">
                        {formatHours(item.horas_estimadas)}
                      </td>

                      <td className="px-4 py-3 font-semibold text-gray-900">
                        {formatHours(item.horas_feitas)}
                      </td>

                      <td
                        className={`px-4 py-3 font-medium ${
                          item.saldo_horas < 0
                            ? "text-red-600"
                            : "text-green-600"
                        }`}
                      >
                        {formatHours(item.saldo_horas)}
                      </td>

                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full border px-2 py-1 text-xs font-medium ${status.badge}`}
                        >
                          {status.label} •{" "}
                          {formatPercent(item.percentual_consumido)}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-gray-600">
                        {item.data_ultima_apontada ?? "-"}
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                    Nenhum projeto encontrado para os filtros selecionados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </div>
  )
}