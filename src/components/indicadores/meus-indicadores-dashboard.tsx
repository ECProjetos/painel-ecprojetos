"use client"

import { useEffect, useMemo, useState } from "react"
import {
  AlertCircle,
  BarChart3,
  CheckCircle2,
  Download,
  FileText,
  Gauge,
  Loader2,
  RefreshCcw,
  Target,
  TrendingUp,
} from "lucide-react"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { toast } from "sonner"

import {
  getMeusIndicadores,
  type MeuPerfilIndicadores,
  type MeuRelatorioIndicador,
  type MinhaEntregaIndicador,
} from "@/app/actions/indicadores/get-meus-indicadores"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

type MeuIndicadorItem = {
  ano: number
  trimestre: number
  idi: number | string | null
  ies: number | string | null
  ip: number | string | null
  iq: number | string | null
  iev: number | string | null
  media_idi_trimestre?: number | string | null
  total_entregas?: number | string | null
}

type PainelData = {
  perfil: MeuPerfilIndicadores
  indicadores: MeuIndicadorItem[]
  entregas: MinhaEntregaIndicador[]
  relatorios: MeuRelatorioIndicador[]
}

type IndicadorKey = "idi" | "ies" | "ip" | "iq" | "iev"

const STATUS_STYLE = {
  OK: {
    className: "border-emerald-200 bg-emerald-50 text-emerald-700",
    fill: "#22c55e",
  },
  Atenção: {
    className: "border-amber-200 bg-amber-50 text-amber-700",
    fill: "#f59e0b",
  },
  Crítico: {
    className: "border-red-200 bg-red-50 text-red-700",
    fill: "#ef4444",
  },
}

function toFiniteNumber(value: unknown) {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0
  }

  if (typeof value === "string") {
    const normalized = value.replace(",", ".")
    const parsed = Number(normalized)

    return Number.isFinite(parsed) ? parsed : 0
  }

  const parsed = Number(value ?? 0)

  return Number.isFinite(parsed) ? parsed : 0
}

function formatNumber(value: number, decimals = 1) {
  return toFiniteNumber(value).toFixed(decimals).replace(".", ",")
}

function formatPercent(value: number) {
  return `${formatNumber(value, 1)}%`
}

function formatDate(value?: string | null) {
  if (!value) return "-"

  const parsed = new Date(`${value}T00:00:00`)

  if (Number.isNaN(parsed.getTime())) {
    return value
  }

  return parsed.toLocaleDateString("pt-BR")
}

function getPeriodoLabel(item: MeuIndicadorItem) {
  return `${item.ano} T${item.trimestre}`
}

function getStatusByMediaTrimestre(idi: number, mediaTrimestre: number) {
  if (mediaTrimestre <= 0) return "OK" as const
  if (idi >= mediaTrimestre) return "OK" as const
  if (idi >= mediaTrimestre * 0.9) return "Atenção" as const

  return "Crítico" as const
}

function getMedia(items: MeuIndicadorItem[], key: IndicadorKey) {
  if (!items.length) return 0

  const soma = items.reduce((acc, item) => {
    return acc + toFiniteNumber(item[key])
  }, 0)

  return soma / items.length
}

function getTotalEntregas(items: MeuIndicadorItem[]) {
  return items.reduce((acc, item) => {
    return acc + toFiniteNumber(item.total_entregas)
  }, 0)
}

function getDefaultFiltros(items: MeuIndicadorItem[]) {
  if (!items.length) {
    return {
      ano: "all",
      trimestre: "all",
    }
  }

  const sorted = [...items].sort((a, b) => {
    if (b.ano !== a.ano) return b.ano - a.ano

    return b.trimestre - a.trimestre
  })

  return {
    ano: String(sorted[0].ano),
    trimestre: String(sorted[0].trimestre),
  }
}

function downloadCsv(filename: string, rows: string[][]) {
  const csv = rows
    .map((row) =>
      row
        .map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`)
        .join(";"),
    )
    .join("\n")

  const blob = new Blob([`\uFEFF${csv}`], {
    type: "text/csv;charset=utf-8;",
  })

  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")

  link.href = url
  link.download = filename
  link.click()

  URL.revokeObjectURL(url)
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
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="mt-3 text-3xl font-semibold tracking-tight text-gray-900">
            {value}
          </p>
          {subtitle ? (
            <p className="mt-2 text-sm leading-5 text-gray-500">{subtitle}</p>
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
  action,
}: {
  title: string
  subtitle?: string
  children: React.ReactNode
  action?: React.ReactNode
}) {
  return (
    <Card className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="mb-5 flex flex-col justify-between gap-3 md:flex-row md:items-start">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          {subtitle ? (
            <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
          ) : null}
        </div>

        {action}
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

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload || payload.length === 0) return null

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-3 shadow-md">
      <p className="text-sm font-semibold text-gray-900">{label}</p>
      {payload.map((item: any) => (
        <p key={item.name} className="text-sm text-gray-600">
          {item.name}: {formatPercent(item.value)}
        </p>
      ))}
    </div>
  )
}

export default function MeusIndicadoresDashboard() {
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [data, setData] = useState<PainelData | null>(null)

  const [ano, setAno] = useState("all")
  const [trimestre, setTrimestre] = useState("all")

  async function carregar(showToast = false) {
    try {
      if (data) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }

      const result = await getMeusIndicadores()

      if (!result.success || !result.data) {
        throw new Error(result.message)
      }

      const nextData = result.data as PainelData

      setData(nextData)

      const defaultFiltros = getDefaultFiltros(nextData.indicadores)

      setAno((prev) => (prev === "all" ? defaultFiltros.ano : prev))
      setTrimestre((prev) =>
        prev === "all" ? defaultFiltros.trimestre : prev,
      )

      if (showToast) {
        toast.success("Indicadores atualizados com sucesso.")
      }
    } catch (error) {
      console.error(error)
      toast.error("Não foi possível carregar seus indicadores.")
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    carregar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const indicadores = data?.indicadores ?? []
  const entregas = data?.entregas ?? []
  const relatorios = data?.relatorios ?? []

  const anosOptions = useMemo(() => {
    const anos = Array.from(new Set(indicadores.map((item) => item.ano)))
      .filter((item) => Number.isFinite(item))
      .sort((a, b) => b - a)

    return [
      { value: "all", label: "Todos" },
      ...anos.map((item) => ({
        value: String(item),
        label: String(item),
      })),
    ]
  }, [indicadores])

  const trimestresOptions = useMemo(() => {
    const trimestres = Array.from(
      new Set(indicadores.map((item) => item.trimestre)),
    )
      .filter((item) => Number.isFinite(item))
      .sort((a, b) => a - b)

    return [
      { value: "all", label: "Todos" },
      ...trimestres.map((item) => ({
        value: String(item),
        label: `${item}º trimestre`,
      })),
    ]
  }, [indicadores])

  const indicadoresFiltrados = useMemo(() => {
    return indicadores.filter((item) => {
      const matchAno = ano === "all" || item.ano === Number(ano)
      const matchTrimestre =
        trimestre === "all" || item.trimestre === Number(trimestre)

      return matchAno && matchTrimestre
    })
  }, [indicadores, ano, trimestre])

  const entregasFiltradas = useMemo(() => {
    return entregas.filter((item) => {
      const matchAno = ano === "all" || item.ano === Number(ano)
      const matchTrimestre =
        trimestre === "all" || item.trimestre === Number(trimestre)

      return matchAno && matchTrimestre
    })
  }, [entregas, ano, trimestre])

  const relatoriosFiltrados = useMemo(() => {
    return relatorios.filter((item) => {
      const matchAno = ano === "all" || item.ano === Number(ano)
      const matchTrimestre =
        trimestre === "all" || item.trimestre === Number(trimestre)

      return matchAno && matchTrimestre
    })
  }, [relatorios, ano, trimestre])

  const metricas = useMemo(() => {
    const mediaIDI = getMedia(indicadoresFiltrados, "idi")
    const mediaIES = getMedia(indicadoresFiltrados, "ies")
    const mediaIP = getMedia(indicadoresFiltrados, "ip")
    const mediaIQ = getMedia(indicadoresFiltrados, "iq")
    const mediaIEV = getMedia(indicadoresFiltrados, "iev")
    const totalEntregas = getTotalEntregas(indicadoresFiltrados)

    const mediaTrimestre =
      indicadoresFiltrados
        .map((item) => toFiniteNumber(item.media_idi_trimestre))
        .find((value) => value > 0) ?? mediaIDI

    const status = getStatusByMediaTrimestre(mediaIDI, mediaTrimestre)

    return {
      mediaIDI,
      mediaIES,
      mediaIP,
      mediaIQ,
      mediaIEV,
      totalEntregas,
      mediaTrimestre,
      status,
    }
  }, [indicadoresFiltrados])

  const evolucaoData = useMemo(() => {
    return indicadores
      .slice()
      .sort((a, b) => {
        if (a.ano !== b.ano) return a.ano - b.ano

        return a.trimestre - b.trimestre
      })
      .map((item) => ({
        periodo: getPeriodoLabel(item),
        IDI: Number(toFiniteNumber(item.idi).toFixed(1)),
        IES: Number(toFiniteNumber(item.ies).toFixed(1)),
        IP: Number(toFiniteNumber(item.ip).toFixed(1)),
        IQ: Number(toFiniteNumber(item.iq).toFixed(1)),
        IEV: Number(toFiniteNumber(item.iev).toFixed(1)),
      }))
  }, [indicadores])

  const subindicadoresData = useMemo(
    () => [
      {
        indicador: "IES",
        valor: Number(metricas.mediaIES.toFixed(1)),
        fill: "#60a5fa",
      },
      {
        indicador: "IP",
        valor: Number(metricas.mediaIP.toFixed(1)),
        fill: "#34d399",
      },
      {
        indicador: "IQ",
        valor: Number(metricas.mediaIQ.toFixed(1)),
        fill: "#a78bfa",
      },
      {
        indicador: "IEV",
        valor: Number(metricas.mediaIEV.toFixed(1)),
        fill: "#f59e0b",
      },
    ],
    [metricas],
  )

  function exportarEntregasCsv() {
    const rows = [
      [
        "Projeto",
        "Entrega",
        "Data entrega",
        "Data revisão",
        "IES aprovado primeira",
        "IP no prazo",
        "Clareza",
        "Profundidade",
        "Alinhamento",
        "Forma",
        "IQ",
        "Pontos fortes",
        "Pontos fracos",
        "Comentário geral",
      ],
      ...entregasFiltradas.map((item) => [
        item.codigo_projeto ?? "",
        item.entrega_avaliada ?? "",
        formatDate(item.data_entrega),
        formatDate(item.data_revisao),
        item.ies_aprovado_primeira ? "Sim" : "Não",
        item.ip_no_prazo ? "Sim" : "Não",
        formatNumber(item.clareza_estrutura),
        formatNumber(item.profundidade_rigor),
        formatNumber(item.alinhamento_demanda),
        formatNumber(item.forma_profissionalismo),
        formatNumber(item.iq),
        item.pontos_fortes ?? "",
        item.pontos_fracos ?? "",
        item.comentario_geral ?? "",
      ]),
    ]

    downloadCsv("meus-indicadores-entregas.csv", rows)
  }

  if (loading) {
    return (
      <div className="flex min-h-[320px] items-center justify-center">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          Carregando seus indicadores...
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <Card className="rounded-2xl border border-red-100 bg-red-50 p-6">
        <div className="flex gap-3">
          <AlertCircle className="mt-1 h-5 w-5 text-red-600" />
          <div>
            <h2 className="font-semibold text-red-800">
              Não foi possível carregar seus indicadores.
            </h2>
            <p className="mt-1 text-sm text-red-700">
              Verifique se existem avaliações vinculadas ao seu usuário.
            </p>
          </div>
        </div>
      </Card>
    )
  }

  const statusStyle = STATUS_STYLE[metricas.status]

  return (
    <div className="space-y-6">
      <Card className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div>
            <p className="text-sm font-medium text-gray-500">
              Painel individual
            </p>
            <h1 className="mt-1 text-2xl font-semibold text-gray-900">
              Meus Indicadores de Desempenho
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              {data.perfil.nome}
              {data.perfil.departamento_nome
                ? ` • ${data.perfil.departamento_nome}`
                : ""}
              {data.perfil.cargo_nome ? ` • ${data.perfil.cargo_nome}` : ""}
            </p>
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={() => carregar(true)}
            disabled={refreshing}
          >
            <RefreshCcw
              className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
            />
            Atualizar
          </Button>
        </div>
      </Card>

      <SectionCard
        title="Filtros"
        subtitle="Use os filtros para visualizar seus indicadores por ano e trimestre."
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <FilterSelect
            label="Ano"
            value={ano}
            onChange={setAno}
            options={anosOptions}
          />

          <FilterSelect
            label="Trimestre"
            value={trimestre}
            onChange={setTrimestre}
            options={trimestresOptions}
          />

          <div className="flex items-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setAno("all")
                setTrimestre("all")
              }}
              className="h-10 w-full"
            >
              Limpar filtros
            </Button>
          </div>
        </div>
      </SectionCard>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-6">
        <KpiCard
          title="IDI"
          value={formatPercent(metricas.mediaIDI)}
          subtitle="Indicador individual consolidado"
          icon={<Gauge className="h-5 w-5" />}
        />

        <KpiCard
          title="IES"
          value={formatPercent(metricas.mediaIES)}
          subtitle="Aprovação na primeira submissão"
          icon={<CheckCircle2 className="h-5 w-5" />}
        />

        <KpiCard
          title="IP"
          value={formatPercent(metricas.mediaIP)}
          subtitle="Entregas dentro do prazo"
          icon={<Target className="h-5 w-5" />}
        />

        <KpiCard
          title="IQ"
          value={formatPercent(metricas.mediaIQ)}
          subtitle="Qualidade técnica média"
          icon={<BarChart3 className="h-5 w-5" />}
        />

        <KpiCard
          title="IEV"
          value={formatPercent(metricas.mediaIEV)}
          subtitle="Evolução no período"
          icon={<TrendingUp className="h-5 w-5" />}
        />

        <Card
          className={`rounded-2xl border p-5 shadow-sm ${statusStyle.className}`}
        >
          <p className="text-sm font-medium">Status</p>
          <p className="mt-3 text-3xl font-semibold">{metricas.status}</p>
          <p className="mt-2 text-sm">
            Média do trimestre: {formatPercent(metricas.mediaTrimestre)}
          </p>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <SectionCard
          title="Evolução dos indicadores"
          subtitle="Histórico trimestral dos seus indicadores."
        >
          {evolucaoData.length ? (
            <div className="h-[340px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={evolucaoData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="periodo" tick={{ fontSize: 12 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="IDI"
                    stroke="#111827"
                    strokeWidth={3}
                    dot={{ r: 4 }}
                  />
                  <Line type="monotone" dataKey="IES" stroke="#60a5fa" />
                  <Line type="monotone" dataKey="IP" stroke="#34d399" />
                  <Line type="monotone" dataKey="IQ" stroke="#a78bfa" />
                  <Line type="monotone" dataKey="IEV" stroke="#f59e0b" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="rounded-2xl border border-gray-100 bg-gray-50 p-5 text-sm text-gray-600">
              Nenhum indicador encontrado para montar a evolução.
            </div>
          )}
        </SectionCard>

        <SectionCard
          title="Subindicadores do período"
          subtitle="Composição média do período filtrado."
        >
          {subindicadoresData.some((item) => item.valor > 0) ? (
            <div className="h-[340px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={subindicadoresData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="indicador" tick={{ fontSize: 12 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="valor" radius={[8, 8, 0, 0]}>
                    {subindicadoresData.map((item) => (
                      <Cell key={item.indicador} fill={item.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="rounded-2xl border border-gray-100 bg-gray-50 p-5 text-sm text-gray-600">
              Nenhum subindicador encontrado para o período filtrado.
            </div>
          )}
        </SectionCard>
      </div>

      <SectionCard
        title="Minhas entregas avaliadas"
        subtitle="Lista das entregas usadas para compor seus indicadores."
        action={
          <Button
            type="button"
            variant="outline"
            onClick={exportarEntregasCsv}
            disabled={!entregasFiltradas.length}
          >
            <Download className="h-4 w-4" />
            Exportar CSV
          </Button>
        }
      >
        <div className="overflow-x-auto rounded-xl border border-gray-100">
          <table className="min-w-[1100px] w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-3">Projeto</th>
                <th className="px-4 py-3">Entrega</th>
                <th className="px-4 py-3">Revisão</th>
                <th className="px-4 py-3">IES</th>
                <th className="px-4 py-3">IP</th>
                <th className="px-4 py-3">IQ</th>
                <th className="px-4 py-3">Pontos fortes</th>
                <th className="px-4 py-3">Pontos fracos</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {entregasFiltradas.length ? (
                entregasFiltradas.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {item.codigo_projeto ?? "-"}
                    </td>
                    <td className="px-4 py-3">
                      {item.entrega_avaliada ?? "-"}
                    </td>
                    <td className="px-4 py-3">
                      {formatDate(item.data_revisao)}
                    </td>
                    <td className="px-4 py-3">
                      {item.ies_aprovado_primeira ? "Sim" : "Não"}
                    </td>
                    <td className="px-4 py-3">
                      {item.ip_no_prazo ? "Sim" : "Não"}
                    </td>
                    <td className="px-4 py-3 font-semibold">
                      {formatNumber(item.iq)}
                    </td>
                    <td className="max-w-[260px] px-4 py-3 text-gray-600">
                      <span className="line-clamp-2">
                        {item.pontos_fortes ?? "-"}
                      </span>
                    </td>
                    <td className="max-w-[260px] px-4 py-3 text-gray-600">
                      <span className="line-clamp-2">
                        {item.pontos_fracos ?? "-"}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-8 text-center text-gray-500"
                  >
                    Nenhuma entrega encontrada para o período selecionado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </SectionCard>

      <SectionCard
        title="Meus relatórios"
        subtitle="Relatórios vinculados às suas entregas avaliadas."
      >
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {relatoriosFiltrados.length ? (
            relatoriosFiltrados.map((item) => {
              const status =
                STATUS_STYLE[item.status as keyof typeof STATUS_STYLE] ??
                STATUS_STYLE.OK

              return (
                <div
                  key={item.id}
                  className="rounded-2xl border border-gray-100 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        {item.codigo_relatorio}
                      </p>
                      <p className="mt-1 text-sm text-gray-600">
                        {item.titulo}
                      </p>
                      <p className="mt-1 text-xs text-gray-500">
                        Projeto: {item.projeto} • Data:{" "}
                        {formatDate(item.data_referencia)}
                      </p>
                    </div>

                    <span
                      className={`rounded-full border px-2 py-1 text-xs font-medium ${status.className}`}
                    >
                      {item.status}
                    </span>
                  </div>

                  <div className="mt-4 flex items-center gap-2 text-xs text-gray-500">
                    <FileText className="h-4 w-4" />
                    Relatório individual da entrega
                  </div>
                </div>
              )
            })
          ) : (
            <div className="rounded-2xl border border-gray-100 bg-gray-50 p-5 text-sm text-gray-600">
              Nenhum relatório encontrado para o período selecionado.
            </div>
          )}
        </div>
      </SectionCard>
    </div>
  )
}