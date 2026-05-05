"use client"

import { useEffect, useMemo, useState } from "react"
import {
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  CircleAlert,
  Download,
  Gauge,
  Loader2,
  RefreshCcw,
  Search,
  Target,
  TrendingDown,
  TrendingUp,
  Users,
} from "lucide-react"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { toast } from "sonner"

import {
  getIndicadoresDashboard,
  type IndicadorDashboardItem,
} from "@/app/actions/indicadores-dashboard"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type IndicadorKey = "idi" | "ies" | "ip" | "iq" | "iev"
type StatusIndicador = "OK" | "Atenção" | "Crítico"
type SortKey =
  | "risco"
  | "idi_desc"
  | "idi_asc"
  | "entregas_desc"
  | "nome_asc"

type FiltrosState = {
  ano: string
  trimestre: string
  equipe: string
  colaboradorId: string
  busca: string
  status: string
}

type IndicadorComStatus = IndicadorDashboardItem & {
  status: StatusIndicador
  mediaIdiTrimestre: number
  limiteAtencao: number
  diferencaMedia: number
}

type MediaEquipe = {
  equipe: string
  idi: number
  indicadorSelecionado: number
  entregas: number
  colaboradores: number
}

type EvolucaoPeriodo = {
  periodo: string
  ano: number
  trimestre: number
  idi: number
  indicadorSelecionado: number
  entregas: number
}

const INDICADORES: Record<
  IndicadorKey,
  {
    label: string
    shortLabel: string
    description: string
    weight: string
  }
> = {
  idi: {
    label: "IDI",
    shortLabel: "IDI",
    description: "Indicador individual consolidado",
    weight: "resultado final",
  },
  ies: {
    label: "IES",
    shortLabel: "Esforço",
    description: "Aprovação na primeira submissão",
    weight: "peso 20%",
  },
  ip: {
    label: "IP",
    shortLabel: "Prazo",
    description: "Entregas feitas dentro do prazo combinado",
    weight: "peso 20%",
  },
  iq: {
    label: "IQ",
    shortLabel: "Qualidade",
    description: "Média das notas técnicas por entrega",
    weight: "peso 40%",
  },
  iev: {
    label: "IEV",
    shortLabel: "Evolução",
    description: "Nota de evolução do colaborador no período",
    weight: "peso 20%",
  },
}

const STATUS_ORDER: Record<StatusIndicador, number> = {
  Crítico: 0,
  Atenção: 1,
  OK: 2,
}

const STATUS_STYLE: Record<
  StatusIndicador,
  {
    label: StatusIndicador
    textClass: string
    softClass: string
    borderClass: string
    fill: string
    icon: typeof CheckCircle2
  }
> = {
  OK: {
    label: "OK",
    textClass: "text-emerald-700",
    softClass: "bg-emerald-50",
    borderClass: "border-emerald-200",
    fill: "#10b981",
    icon: CheckCircle2,
  },
  Atenção: {
    label: "Atenção",
    textClass: "text-amber-700",
    softClass: "bg-amber-50",
    borderClass: "border-amber-200",
    fill: "#f59e0b",
    icon: CircleAlert,
  },
  Crítico: {
    label: "Crítico",
    textClass: "text-rose-700",
    softClass: "bg-rose-50",
    borderClass: "border-rose-200",
    fill: "#ef4444",
    icon: AlertTriangle,
  },
}

const INDICADOR_COLORS: Record<IndicadorKey, string> = {
  idi: "#4f46e5",
  ies: "#0ea5e9",
  ip: "#14b8a6",
  iq: "#8b5cf6",
  iev: "#f97316",
}

const MEDIA_TRIMESTRE_FIELD: Record<IndicadorKey, keyof IndicadorDashboardItem> = {
  idi: "media_idi_trimestre",
  ies: "media_ies_trimestre",
  ip: "media_ip_trimestre",
  iq: "media_iq_trimestre",
  iev: "media_iev_trimestre",
}

function toFiniteNumber(value: unknown) {
  const numberValue = Number(value ?? 0)

  return Number.isFinite(numberValue) ? numberValue : 0
}

function formatIndicador(value?: number | null, digits = 0) {
  return toFiniteNumber(value).toFixed(digits).replace(".", ",")
}

function formatNumber(value?: number | null, digits = 1) {
  return toFiniteNumber(value).toFixed(digits).replace(".", ",")
}

function formatInteger(value?: number | null) {
  return new Intl.NumberFormat("pt-BR").format(Math.round(toFiniteNumber(value)))
}

function formatDelta(value: number) {
  const signal = value > 0 ? "+" : ""

  return `${signal}${formatNumber(value)} pts.`
}

function getPeriodoKey(item: Pick<IndicadorDashboardItem, "ano" | "trimestre">) {
  return `${item.ano}-T${item.trimestre}`
}

function getPeriodoLabel(ano: number, trimestre: number) {
  return `${trimestre}º tri. ${ano}`
}

function getPreviousPeriod(ano: number, trimestre: number) {
  if (trimestre > 1) {
    return { ano, trimestre: trimestre - 1 }
  }

  return { ano: ano - 1, trimestre: 4 }
}

function getPeriodoMaisRecenteFromItems(
  data: Pick<IndicadorDashboardItem, "ano" | "trimestre">[],
) {
  if (!data.length) return null

  return [...data].sort(
    (a, b) => b.ano - a.ano || b.trimestre - a.trimestre,
  )[0]
}

function buildDefaultFiltros(data: IndicadorDashboardItem[] = []): FiltrosState {
  const periodoMaisRecente = getPeriodoMaisRecenteFromItems(data)

  return {
    ano: periodoMaisRecente ? String(periodoMaisRecente.ano) : "",
    trimestre: periodoMaisRecente ? String(periodoMaisRecente.trimestre) : "",
    equipe: "",
    colaboradorId: "",
    busca: "",
    status: "",
  }
}

function normalizeText(value: unknown) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
}

function getMedia(items: IndicadorDashboardItem[], field: IndicadorKey) {
  if (!items.length) return 0

  const soma = items.reduce((acc, item) => acc + toFiniteNumber(item[field]), 0)

  return soma / items.length
}

function getSomaEntregas(items: IndicadorDashboardItem[]) {
  return items.reduce((acc, item) => acc + toFiniteNumber(item.total_entregas), 0)
}

function getMediaIdiPorTrimestre(items: IndicadorDashboardItem[]) {
  const mediasDoBanco = new Map<string, number>()
  const mapa = new Map<string, { soma: number; quantidade: number }>()

  for (const item of items) {
    const key = getPeriodoKey(item)
    const mediaDoBanco = toFiniteNumber(item.media_idi_trimestre)

    if (mediaDoBanco > 0 && !mediasDoBanco.has(key)) {
      mediasDoBanco.set(key, mediaDoBanco)
    }

    const atual = mapa.get(key) ?? { soma: 0, quantidade: 0 }

    atual.soma += toFiniteNumber(item.idi)
    atual.quantidade += 1

    mapa.set(key, atual)
  }

  return new Map(
    Array.from(mapa.entries()).map(([key, value]) => [
      key,
      mediasDoBanco.get(key) ??
        (value.quantidade ? value.soma / value.quantidade : 0),
    ]),
  )
}

function deveUsarMediaDoBanco(filtros: FiltrosState) {
  return Boolean(
    filtros.ano &&
      filtros.trimestre &&
      !filtros.equipe &&
      !filtros.colaboradorId &&
      !filtros.busca.trim() &&
      !filtros.status,
  )
}

function getMediaDoRecorte(
  items: IndicadorDashboardItem[],
  field: IndicadorKey,
  filtros: FiltrosState,
) {
  if (deveUsarMediaDoBanco(filtros)) {
    const mediaField = MEDIA_TRIMESTRE_FIELD[field]
    const mediaDoBanco = items
      .map((item) => toFiniteNumber(item[mediaField]))
      .find((value) => value > 0)

    if (mediaDoBanco !== undefined) {
      return mediaDoBanco
    }
  }

  return getMedia(items, field)
}

function getStatusByMediaTrimestre(idi: number, mediaTrimestre: number) {
  if (mediaTrimestre <= 0) return "OK" satisfies StatusIndicador

  if (idi >= mediaTrimestre) return "OK" satisfies StatusIndicador
  if (idi >= mediaTrimestre * 0.9) return "Atenção" satisfies StatusIndicador

  return "Crítico" satisfies StatusIndicador
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

function getIndicadorValue(item: IndicadorDashboardItem, indicador: IndicadorKey) {
  return toFiniteNumber(item[indicador])
}

function getBarChartHeight(length: number) {
  return Math.max(340, Math.min(760, length * 42 + 90))
}

export default function IndicadoresDashboard() {
  const [items, setItems] = useState<IndicadorDashboardItem[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [indicadorSelecionado, setIndicadorSelecionado] =
    useState<IndicadorKey>("idi")
  const [sortKey, setSortKey] = useState<SortKey>("risco")
  const [filtros, setFiltros] = useState<FiltrosState>(() =>
    buildDefaultFiltros(),
  )

  async function carregarIndicadores(showToast = false) {
    try {
      if (items.length) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }

      const data = await getIndicadoresDashboard()
      setItems(data)
      setFiltros((prev) => {
        const usuarioJaEscolheuPeriodo = Boolean(prev.ano || prev.trimestre)

        return usuarioJaEscolheuPeriodo ? prev : buildDefaultFiltros(data)
      })

      if (showToast) {
        toast.success("Indicadores atualizados com sucesso.")
      }
    } catch (error) {
      console.error(error)
      toast.error("Não foi possível carregar os indicadores.")
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    carregarIndicadores()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function updateFiltro<K extends keyof FiltrosState>(
    field: K,
    value: FiltrosState[K],
  ) {
    setFiltros((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  function limparFiltros() {
    setFiltros(buildDefaultFiltros(items))
  }

  const filtrosOpcoes = useMemo(() => {
    const anos: number[] = Array.from(new Set<number>(items.map((item) => item.ano)))
      .filter((ano): ano is number => Number.isFinite(ano))
      .sort((a, b) => b - a)

    const trimestres: number[] = Array.from(new Set<number>(items.map((item) => item.trimestre)))
      .filter((trimestre): trimestre is number => Number.isFinite(trimestre))
      .sort((a, b) => a - b)

    const equipes: string[] = Array.from(
      new Set<string>(
        items
          .map((item) => item.equipe)
          .filter(
            (equipe): equipe is string =>
              typeof equipe === "string" && equipe.trim().length > 0,
          ),
      ),
    ).sort((a, b) => a.localeCompare(b, "pt-BR"))

    const colaboradores: { id: string; nome: string }[] = Array.from(
      new Map<string, { id: string; nome: string }>(
        items
          .filter((item) => item.colaborador_id && item.colaborador_nome)
          .map((item) => [
            item.colaborador_id,
            {
              id: item.colaborador_id,
              nome: item.colaborador_nome,
            },
          ]),
      ).values(),
    ).sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"))

    return {
      anos,
      trimestres,
      equipes,
      colaboradores,
    }
  }, [items])

  const mediaIdiPorTrimestre = useMemo(
    () => getMediaIdiPorTrimestre(items),
    [items],
  )

  const itemsComStatus = useMemo<IndicadorComStatus[]>(() => {
    return items.map((item) => {
      const mediaIdiTrimestre = mediaIdiPorTrimestre.get(getPeriodoKey(item)) ?? 0
      const limiteAtencao = mediaIdiTrimestre * 0.9
      const idi = toFiniteNumber(item.idi)
      const status = getStatusByMediaTrimestre(idi, mediaIdiTrimestre)

      return {
        ...item,
        status,
        mediaIdiTrimestre,
        limiteAtencao,
        diferencaMedia: idi - mediaIdiTrimestre,
      }
    })
  }, [items, mediaIdiPorTrimestre])

  const itemsFiltrados = useMemo(() => {
    const termo = normalizeText(filtros.busca)

    return itemsComStatus.filter((item) => {
      const textoBusca = normalizeText(
        `${item.colaborador_nome} ${item.equipe ?? ""} ${item.ano} ${item.trimestre}`,
      )

      const matchBusca = !termo || textoBusca.includes(termo)
      const matchAno = !filtros.ano || item.ano === Number(filtros.ano)
      const matchTrimestre =
        !filtros.trimestre || item.trimestre === Number(filtros.trimestre)
      const matchEquipe = !filtros.equipe || item.equipe === filtros.equipe
      const matchColaborador =
        !filtros.colaboradorId || item.colaborador_id === filtros.colaboradorId
      const matchStatus = !filtros.status || item.status === filtros.status

      return (
        matchBusca &&
        matchAno &&
        matchTrimestre &&
        matchEquipe &&
        matchColaborador &&
        matchStatus
      )
    })
  }, [itemsComStatus, filtros])

  const itemsOrdenados = useMemo(() => {
    const sorted = [...itemsFiltrados]

    if (sortKey === "idi_desc") {
      return sorted.sort((a, b) => b.idi - a.idi)
    }

    if (sortKey === "idi_asc") {
      return sorted.sort((a, b) => a.idi - b.idi)
    }

    if (sortKey === "entregas_desc") {
      return sorted.sort((a, b) => b.total_entregas - a.total_entregas)
    }

    if (sortKey === "nome_asc") {
      return sorted.sort((a, b) =>
        a.colaborador_nome.localeCompare(b.colaborador_nome, "pt-BR"),
      )
    }

    return sorted.sort((a, b) => {
      const statusDiff = STATUS_ORDER[a.status] - STATUS_ORDER[b.status]

      if (statusDiff !== 0) return statusDiff

      return a.idi - b.idi
    })
  }, [itemsFiltrados, sortKey])

  const metricas = useMemo(() => {
    const totalColaboradores = new Set(
      itemsFiltrados.map((item) => item.colaborador_id),
    ).size
    const totalEntregas = getSomaEntregas(itemsFiltrados)
    const mediaIDI = getMediaDoRecorte(itemsFiltrados, "idi", filtros)
    const mediaIES = getMediaDoRecorte(itemsFiltrados, "ies", filtros)
    const mediaIP = getMediaDoRecorte(itemsFiltrados, "ip", filtros)
    const mediaIQ = getMediaDoRecorte(itemsFiltrados, "iq", filtros)
    const mediaIEV = getMediaDoRecorte(itemsFiltrados, "iev", filtros)

    const totalOk = itemsFiltrados.filter((item) => item.status === "OK").length
    const totalAtencao = itemsFiltrados.filter(
      (item) => item.status === "Atenção",
    ).length
    const totalCritico = itemsFiltrados.filter(
      (item) => item.status === "Crítico",
    ).length

    const menorIndicador = [
      { key: "ies" as const, label: "IES", valor: mediaIES },
      { key: "ip" as const, label: "IP", valor: mediaIP },
      { key: "iq" as const, label: "IQ", valor: mediaIQ },
      { key: "iev" as const, label: "IEV", valor: mediaIEV },
    ].sort((a, b) => a.valor - b.valor)[0]

    const maiorIndicador = [
      { key: "ies" as const, label: "IES", valor: mediaIES },
      { key: "ip" as const, label: "IP", valor: mediaIP },
      { key: "iq" as const, label: "IQ", valor: mediaIQ },
      { key: "iev" as const, label: "IEV", valor: mediaIEV },
    ].sort((a, b) => b.valor - a.valor)[0]

    return {
      totalRegistros: itemsFiltrados.length,
      totalColaboradores,
      totalEntregas,
      mediaIDI,
      mediaIES,
      mediaIP,
      mediaIQ,
      mediaIEV,
      totalOk,
      totalAtencao,
      totalCritico,
      menorIndicador,
      maiorIndicador,
      taxaOk: itemsFiltrados.length ? (totalOk / itemsFiltrados.length) * 100 : 0,
    }
  }, [itemsFiltrados, filtros])

  const subindicadoresData = useMemo(
    () => [
      {
        indicador: "IES",
        valor: Number(metricas.mediaIES.toFixed(2)),
        peso: "20%",
        descricao: "1ª submissão",
        key: "ies" as const,
      },
      {
        indicador: "IP",
        valor: Number(metricas.mediaIP.toFixed(2)),
        peso: "20%",
        descricao: "Prazo",
        key: "ip" as const,
      },
      {
        indicador: "IQ",
        valor: Number(metricas.mediaIQ.toFixed(2)),
        peso: "40%",
        descricao: "Qualidade",
        key: "iq" as const,
      },
      {
        indicador: "IEV",
        valor: Number(metricas.mediaIEV.toFixed(2)),
        peso: "20%",
        descricao: "Evolução",
        key: "iev" as const,
      },
    ],
    [metricas.mediaIES, metricas.mediaIP, metricas.mediaIQ, metricas.mediaIEV],
  )

  const rankingColaboradores = useMemo(() => {
    return [...itemsFiltrados]
      .sort(
        (a, b) =>
          getIndicadorValue(b, indicadorSelecionado) -
          getIndicadorValue(a, indicadorSelecionado),
      )
      .slice(0, 18)
      .map((item) => ({
        nome: item.colaborador_nome,
        colaborador: item.colaborador_nome,
        equipe: item.equipe ?? "Sem equipe",
        valor: Number(getIndicadorValue(item, indicadorSelecionado).toFixed(2)),
        idi: Number(item.idi.toFixed(2)),
        status: item.status,
      }))
  }, [itemsFiltrados, indicadorSelecionado])

  const mediaPorEquipe = useMemo<MediaEquipe[]>(() => {
    const mapa = new Map<
      string,
      {
        somaIdi: number
        somaIndicador: number
        entregas: number
        colaboradores: Set<string>
        quantidade: number
      }
    >()

    for (const item of itemsFiltrados) {
      const equipe = item.equipe?.trim() || "Sem equipe"
      const atual = mapa.get(equipe) ?? {
        somaIdi: 0,
        somaIndicador: 0,
        entregas: 0,
        colaboradores: new Set<string>(),
        quantidade: 0,
      }

      atual.somaIdi += item.idi
      atual.somaIndicador += getIndicadorValue(item, indicadorSelecionado)
      atual.entregas += item.total_entregas
      atual.colaboradores.add(item.colaborador_id)
      atual.quantidade += 1

      mapa.set(equipe, atual)
    }

    return Array.from(mapa.entries())
      .map(([equipe, value]) => ({
        equipe,
        idi: value.quantidade ? Number((value.somaIdi / value.quantidade).toFixed(2)) : 0,
        indicadorSelecionado: value.quantidade
          ? Number((value.somaIndicador / value.quantidade).toFixed(2))
          : 0,
        entregas: value.entregas,
        colaboradores: value.colaboradores.size,
      }))
      .sort((a, b) => b.indicadorSelecionado - a.indicadorSelecionado)
  }, [itemsFiltrados, indicadorSelecionado])

  const evolucaoData = useMemo<EvolucaoPeriodo[]>(() => {
    const mapa = new Map<
      string,
      {
        ano: number
        trimestre: number
        somaIdi: number
        somaIndicador: number
        entregas: number
        quantidade: number
      }
    >()

    for (const item of itemsFiltrados) {
      const key = getPeriodoKey(item)
      const atual = mapa.get(key) ?? {
        ano: item.ano,
        trimestre: item.trimestre,
        somaIdi: 0,
        somaIndicador: 0,
        entregas: 0,
        quantidade: 0,
      }

      atual.somaIdi += item.idi
      atual.somaIndicador += getIndicadorValue(item, indicadorSelecionado)
      atual.entregas += item.total_entregas
      atual.quantidade += 1

      mapa.set(key, atual)
    }

    return Array.from(mapa.values())
      .sort((a, b) => a.ano - b.ano || a.trimestre - b.trimestre)
      .map((value) => ({
        periodo: getPeriodoLabel(value.ano, value.trimestre),
        ano: value.ano,
        trimestre: value.trimestre,
        idi: value.quantidade ? Number((value.somaIdi / value.quantidade).toFixed(2)) : 0,
        indicadorSelecionado: value.quantidade
          ? Number((value.somaIndicador / value.quantidade).toFixed(2))
          : 0,
        entregas: value.entregas,
      }))
  }, [itemsFiltrados, indicadorSelecionado])

  const periodoMaisRecente = useMemo(() => {
    if (!itemsFiltrados.length) return null

    return [...itemsFiltrados].sort(
      (a, b) => b.ano - a.ano || b.trimestre - a.trimestre,
    )[0]
  }, [itemsFiltrados])

  const analiseContinua = useMemo(() => {
    if (!periodoMaisRecente) {
      return {
        periodoAtualLabel: "Sem período",
        mediaAtual: 0,
        mediaAnterior: 0,
        delta: 0,
      }
    }

    const periodoAtual = {
      ano: periodoMaisRecente.ano,
      trimestre: periodoMaisRecente.trimestre,
    }
    const periodoAnterior = getPreviousPeriod(
      periodoAtual.ano,
      periodoAtual.trimestre,
    )

    const itensAtual = itemsFiltrados.filter(
      (item) =>
        item.ano === periodoAtual.ano && item.trimestre === periodoAtual.trimestre,
    )
    const itensAnterior = itemsFiltrados.filter(
      (item) =>
        item.ano === periodoAnterior.ano &&
        item.trimestre === periodoAnterior.trimestre,
    )

    const mediaAtual = getMedia(itensAtual, "idi")
    const mediaAnterior = getMedia(itensAnterior, "idi")

    return {
      periodoAtualLabel: getPeriodoLabel(periodoAtual.ano, periodoAtual.trimestre),
      mediaAtual,
      mediaAnterior,
      delta: mediaAnterior ? mediaAtual - mediaAnterior : 0,
    }
  }, [itemsFiltrados, periodoMaisRecente])

  const destaques = useMemo(() => {
    const equipeDestaque = mediaPorEquipe[0]
    const equipeAtencao = [...mediaPorEquipe].sort(
      (a, b) => a.indicadorSelecionado - b.indicadorSelecionado,
    )[0]

    const colaboradoresCriticos = itemsFiltrados
      .filter((item) => item.status === "Crítico")
      .sort((a, b) => a.idi - b.idi)
      .slice(0, 4)

    const colaboradoresAtencao = itemsFiltrados
      .filter((item) => item.status === "Atenção")
      .sort((a, b) => a.idi - b.idi)
      .slice(0, 4)

    return {
      equipeDestaque,
      equipeAtencao,
      colaboradoresCriticos,
      colaboradoresAtencao,
    }
  }, [itemsFiltrados, mediaPorEquipe])

  function exportarCsv() {
    const header = [
      "Ano",
      "Trimestre",
      "Colaborador",
      "Equipe",
      "Entregas no período",
      "IES",
      "IP",
      "IQ",
      "IEV",
      "IDI",
      "Média IDI do trimestre",
      "Limite atenção",
      "Diferença para média",
      "Status",
    ]

    const rows = itemsOrdenados.map((item) => [
      String(item.ano),
      `${item.trimestre}º`,
      item.colaborador_nome,
      item.equipe ?? "Sem equipe",
      String(item.total_entregas),
      formatNumber(item.ies),
      formatNumber(item.ip),
      formatNumber(item.iq),
      formatNumber(item.iev),
      formatNumber(item.idi),
      formatNumber(item.mediaIdiTrimestre),
      formatNumber(item.limiteAtencao),
      formatNumber(item.diferencaMedia),
      item.status,
    ])

    downloadCsv("indicadores-dashboard.csv", [header, ...rows])
    toast.success("Arquivo CSV exportado com sucesso.")
  }

  const indicadorAtual = INDICADORES[indicadorSelecionado]

  if (loading) {
    return (
      <Card className="rounded-2xl border bg-card p-6 shadow-sm">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Carregando painel de indicadores...
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-6 overflow-x-hidden">
      <Card className="rounded-2xl border bg-card p-5 shadow-sm md:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border bg-muted/40 px-3 py-1 text-xs font-medium text-muted-foreground">
              <Gauge className="h-3.5 w-3.5" />
              Painel executivo de desempenho
            </div>
            <h2 className="mt-3 text-2xl font-bold tracking-tight">
              Indicadores de Desempenho
            </h2>
            <p className="mt-2 max-w-4xl text-sm text-muted-foreground">
              Visão consolidada para decisão: desempenho individual, médias da
              empresa, comparativo entre equipes, análise contínua por trimestre
              e leitura dos subindicadores IES, IP, IQ e IEV.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => carregarIndicadores(true)}
              disabled={refreshing}
              className="rounded-xl"
            >
              {refreshing ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCcw className="mr-2 h-4 w-4" />
              )}
              Atualizar
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={exportarCsv}
              disabled={!itemsOrdenados.length}
              className="rounded-xl"
            >
              <Download className="mr-2 h-4 w-4" />
              Exportar CSV
            </Button>
          </div>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-6">
          <div className="space-y-2 lg:col-span-2">
            <Label htmlFor="busca_indicadores">Buscar</Label>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="busca_indicadores"
                value={filtros.busca}
                onChange={(event: { target: { value: string } }) => updateFiltro("busca", event.target.value)}
                placeholder="Colaborador, equipe, ano ou trimestre"
                className="h-11 rounded-xl pl-9"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="filtro_ano">Ano</Label>
            <select
              id="filtro_ano"
              value={filtros.ano}
              onChange={(event: { target: { value: string } }) => updateFiltro("ano", event.target.value)}
              className="flex h-11 w-full rounded-xl border bg-background px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-ring"
            >
              <option value="">Todos</option>
              {filtrosOpcoes.anos.map((ano) => (
                <option key={ano} value={String(ano)}>
                  {ano}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="filtro_trimestre">Trimestre</Label>
            <select
              id="filtro_trimestre"
              value={filtros.trimestre}
              onChange={(event: { target: { value: string } }) =>
                updateFiltro("trimestre", event.target.value)
              }
              className="flex h-11 w-full rounded-xl border bg-background px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-ring"
            >
              <option value="">Todos</option>
              {filtrosOpcoes.trimestres.map((trimestre) => (
                <option key={trimestre} value={String(trimestre)}>
                  {trimestre}º trimestre
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="filtro_equipe">Equipe</Label>
            <select
              id="filtro_equipe"
              value={filtros.equipe}
              onChange={(event: { target: { value: string } }) => updateFiltro("equipe", event.target.value)}
              className="flex h-11 w-full rounded-xl border bg-background px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-ring"
            >
              <option value="">Todas</option>
              {filtrosOpcoes.equipes.map((equipe) => (
                <option key={equipe} value={equipe}>
                  {equipe}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="filtro_status">Status</Label>
            <select
              id="filtro_status"
              value={filtros.status}
              onChange={(event: { target: { value: string } }) => updateFiltro("status", event.target.value)}
              className="flex h-11 w-full rounded-xl border bg-background px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-ring"
            >
              <option value="">Todos</option>
              <option value="OK">OK</option>
              <option value="Atenção">Atenção</option>
              <option value="Crítico">Crítico</option>
            </select>
          </div>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_220px_160px]">
          <div className="space-y-2">
            <Label htmlFor="filtro_colaborador">Colaborador</Label>
            <select
              id="filtro_colaborador"
              value={filtros.colaboradorId}
              onChange={(event: { target: { value: string } }) =>
                updateFiltro("colaboradorId", event.target.value)
              }
              className="flex h-11 w-full rounded-xl border bg-background px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-ring"
            >
              <option value="">Todos</option>
              {filtrosOpcoes.colaboradores.map((colaborador) => (
                <option key={colaborador.id} value={colaborador.id}>
                  {colaborador.nome}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="indicador_grafico">Indicador dos gráficos</Label>
            <select
              id="indicador_grafico"
              value={indicadorSelecionado}
              onChange={(event: { target: { value: string } }) =>
                setIndicadorSelecionado(event.target.value as IndicadorKey)
              }
              className="flex h-11 w-full rounded-xl border bg-background px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-ring"
            >
              {Object.entries(INDICADORES).map(([key, value]) => (
                <option key={key} value={key}>
                  {value.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <Button
              type="button"
              variant="outline"
              onClick={limparFiltros}
              className="h-11 w-full rounded-xl"
            >
              Limpar filtros
            </Button>
          </div>
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        <Card className="rounded-2xl border bg-card p-4 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm text-muted-foreground">Média IDI</p>
              <p className="mt-2 text-3xl font-bold">
                {formatIndicador(metricas.mediaIDI)}
              </p>
            </div>
            <Target className="h-5 w-5 text-indigo-500" />
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Indicador individual consolidado do período selecionado.
          </p>
        </Card>

        <Card className="rounded-2xl border bg-card p-4 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm text-muted-foreground">Média IES</p>
              <p className="mt-2 text-3xl font-bold">
                {formatIndicador(metricas.mediaIES)}
              </p>
            </div>
            <CheckCircle2 className="h-5 w-5 text-sky-500" />
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Esforço: aprovação na primeira submissão · peso 20%.
          </p>
        </Card>

        <Card className="rounded-2xl border bg-card p-4 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm text-muted-foreground">Média IP</p>
              <p className="mt-2 text-3xl font-bold">
                {formatIndicador(metricas.mediaIP)}
              </p>
            </div>
            <BarChart3 className="h-5 w-5 text-emerald-500" />
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Prazo: entregas dentro do prazo combinado · peso 20%.
          </p>
        </Card>

        <Card className="rounded-2xl border bg-card p-4 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm text-muted-foreground">Média IQ</p>
              <p className="mt-2 text-3xl font-bold">
                {formatIndicador(metricas.mediaIQ)}
              </p>
            </div>
            <Gauge className="h-5 w-5 text-violet-500" />
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Qualidade: média das avaliações técnicas · peso 40%.
          </p>
        </Card>

        <Card className="rounded-2xl border bg-card p-4 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm text-muted-foreground">Média IEV</p>
              <p className="mt-2 text-3xl font-bold">
                {formatIndicador(metricas.mediaIEV)}
              </p>
            </div>
            <TrendingUp className="h-5 w-5 text-orange-500" />
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Evolução: nota trimestral do colaborador · peso 20%.
          </p>
        </Card>

        <Card className="rounded-2xl border bg-card p-4 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm text-muted-foreground">Entregas no período</p>
              <p className="mt-2 text-3xl font-bold">
                {formatInteger(metricas.totalEntregas)}
              </p>
            </div>
            <BarChart3 className="h-5 w-5 text-cyan-500" />
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Soma das entregas avaliadas no recorte atual.
          </p>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card
          className={`rounded-2xl border p-4 shadow-sm ${STATUS_STYLE.OK.borderClass} ${STATUS_STYLE.OK.softClass}`}
        >
          <div className="flex items-center gap-3">
            <CheckCircle2 className={`h-5 w-5 ${STATUS_STYLE.OK.textClass}`} />
            <div>
              <p className={`text-sm font-medium ${STATUS_STYLE.OK.textClass}`}>
                OK
              </p>
              <p className={`text-2xl font-bold ${STATUS_STYLE.OK.textClass}`}>
                {metricas.totalOk}
              </p>
              <p className="text-xs text-muted-foreground">
                IDI ≥ média do trimestre
              </p>
            </div>
          </div>
        </Card>

        <Card
          className={`rounded-2xl border p-4 shadow-sm ${STATUS_STYLE.Atenção.borderClass} ${STATUS_STYLE.Atenção.softClass}`}
        >
          <div className="flex items-center gap-3">
            <CircleAlert
              className={`h-5 w-5 ${STATUS_STYLE.Atenção.textClass}`}
            />
            <div>
              <p
                className={`text-sm font-medium ${STATUS_STYLE.Atenção.textClass}`}
              >
                Atenção
              </p>
              <p
                className={`text-2xl font-bold ${STATUS_STYLE.Atenção.textClass}`}
              >
                {metricas.totalAtencao}
              </p>
              <p className="text-xs text-muted-foreground">
                90% da média ≤ IDI &lt; média
              </p>
            </div>
          </div>
        </Card>

        <Card
          className={`rounded-2xl border p-4 shadow-sm ${STATUS_STYLE.Crítico.borderClass} ${STATUS_STYLE.Crítico.softClass}`}
        >
          <div className="flex items-center gap-3">
            <AlertTriangle
              className={`h-5 w-5 ${STATUS_STYLE.Crítico.textClass}`}
            />
            <div>
              <p
                className={`text-sm font-medium ${STATUS_STYLE.Crítico.textClass}`}
              >
                Crítico
              </p>
              <p
                className={`text-2xl font-bold ${STATUS_STYLE.Crítico.textClass}`}
              >
                {metricas.totalCritico}
              </p>
              <p className="text-xs text-muted-foreground">
                IDI &lt; 90% da média do trimestre
              </p>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="rounded-2xl border bg-card p-5 shadow-sm md:p-6">
          <div className="mb-5 flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
            <div>
              <h3 className="text-xl font-semibold">
                Evolução trimestral: {indicadorAtual.label}
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Leitura contínua por ano e trimestre, para evitar análise isolada
                de um único trimestre.
              </p>
            </div>
            <div className="rounded-xl border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
              {indicadorAtual.description} · {indicadorAtual.weight}
            </div>
          </div>

          {evolucaoData.length === 0 ? (
            <EmptyState message="Nenhum dado disponível para a evolução." />
          ) : (
            <div className="h-[360px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={evolucaoData}
                  margin={{ top: 10, right: 24, left: 0, bottom: 24 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="periodo"
                    tick={{ fontSize: 12 }}
                    angle={-10}
                    textAnchor="end"
                    height={55}
                  />
                  <YAxis domain={[0, 100]} tickFormatter={(value: number | string) => String(value).replace(".", ",")} />
                  <Tooltip
                    formatter={(value: number | string) => formatIndicador(Number(value))}
                    labelFormatter={(label: string | number) => `Período: ${label}`}
                  />
                  <Line
                    type="monotone"
                    dataKey="idi"
                    name="IDI médio"
                    stroke={INDICADOR_COLORS.idi}
                    strokeWidth={3}
                    dot={{ r: 4 }}
                  />
                  {indicadorSelecionado !== "idi" && (
                    <Line
                      type="monotone"
                      dataKey="indicadorSelecionado"
                      name={`${indicadorAtual.label} médio`}
                      stroke={INDICADOR_COLORS[indicadorSelecionado]}
                      strokeWidth={3}
                      dot={{ r: 4 }}
                    />
                  )}
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>

        <Card className="rounded-2xl border bg-card p-5 shadow-sm md:p-6">
          <div className="mb-5">
            <h3 className="text-xl font-semibold">Subindicadores médios</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Mostra qual dimensão está puxando o IDI para cima ou para baixo.
            </p>
          </div>

          {subindicadoresData.length === 0 ? (
            <EmptyState message="Nenhum subindicador disponível." />
          ) : (
            <div className="h-[360px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={subindicadoresData}
                  margin={{ top: 10, right: 14, left: 0, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="indicador" />
                  <YAxis domain={[0, 100]} tickFormatter={(value: number | string) => String(value).replace(".", ",")} />
                  <Tooltip
                    formatter={(value: number | string) => formatIndicador(Number(value))}
                    labelFormatter={(label: string | number) => `Indicador: ${label}`}
                  />
                  <ReferenceLine y={metricas.mediaIDI} strokeDasharray="4 4" />
                  <Bar dataKey="valor" name="Média" radius={[8, 8, 0, 0]}>
                    {subindicadoresData.map((entry) => (
                      <Cell
                        key={`subindicador-${entry.indicador}`}
                        fill={INDICADOR_COLORS[entry.key]}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="rounded-2xl border bg-card p-5 shadow-sm md:p-6">
          <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h3 className="text-xl font-semibold">
                Ranking por colaborador: {indicadorAtual.label}
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                As cores indicam o status calculado pela média do IDI do
                trimestre, mesmo quando o gráfico mostra outro subindicador.
              </p>
            </div>
            <div className="rounded-xl border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
              Exibindo até 18 colaboradores
            </div>
          </div>

          {rankingColaboradores.length === 0 ? (
            <EmptyState message="Nenhum colaborador encontrado para o ranking." />
          ) : (
            <div className="min-w-0">
              <div style={{ height: getBarChartHeight(rankingColaboradores.length) }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={rankingColaboradores}
                    layout="vertical"
                    margin={{ top: 8, right: 16, left: 20, bottom: 8 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" domain={[0, 100]} tickFormatter={(value: number | string) => String(value).replace(".", ",")} />
                    <YAxis
                      type="category"
                      dataKey="nome"
                      width={165}
                      tick={{ fontSize: 12 }}
                    />
                    <Tooltip
                      formatter={(value: number | string) => formatIndicador(Number(value))}
                      labelFormatter={(label: string | number) => `Colaborador: ${label}`}
                    />
                    <ReferenceLine
                      x={metricas.mediaIDI}
                      strokeDasharray="4 4"
                      label="Média IDI"
                    />
                    <Bar dataKey="valor" name={indicadorAtual.label} radius={[0, 8, 8, 0]}>
                      {rankingColaboradores.map((entry) => (
                        <Cell
                          key={`ranking-${entry.colaborador}-${entry.status}`}
                          fill={STATUS_STYLE[entry.status].fill}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </Card>

        <Card className="rounded-2xl border bg-card p-5 shadow-sm md:p-6">
          <div className="mb-5">
            <h3 className="text-xl font-semibold">Leitura executiva</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Síntese automática para orientar a tomada de decisão.
            </p>
          </div>

          <div className="space-y-4">
            <InsightBox
              title="Principal força"
              value={`${metricas.maiorIndicador.label} · ${formatIndicador(
                metricas.maiorIndicador.valor,
              )}`}
              description="Subindicador com melhor média no recorte atual."
              icon={TrendingUp}
              tone="success"
            />

            <InsightBox
              title="Ponto de atenção"
              value={`${metricas.menorIndicador.label} · ${formatIndicador(
                metricas.menorIndicador.valor,
              )}`}
              description="Subindicador que mais reduz o desempenho consolidado."
              icon={TrendingDown}
              tone="warning"
            />

            <InsightBox
              title="Equipe destaque"
              value={
                destaques.equipeDestaque
                  ? `${destaques.equipeDestaque.equipe} · ${formatIndicador(
                      destaques.equipeDestaque.indicadorSelecionado,
                    )}`
                  : "Sem dados"
              }
              description={`Melhor média para ${indicadorAtual.label} no recorte atual.`}
              icon={CheckCircle2}
              tone="success"
            />

            <InsightBox
              title="Equipe a acompanhar"
              value={
                destaques.equipeAtencao
                  ? `${destaques.equipeAtencao.equipe} · ${formatIndicador(
                      destaques.equipeAtencao.indicadorSelecionado,
                    )}`
                  : "Sem dados"
              }
              description={`Menor média para ${indicadorAtual.label} no recorte atual.`}
              icon={AlertTriangle}
              tone="danger"
            />
          </div>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="rounded-2xl border bg-card p-5 shadow-sm md:p-6">
          <div className="mb-5">
            <h3 className="text-xl font-semibold">Comparativo por equipe</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Média de {indicadorAtual.label}, volume de entregas e quantidade de
              colaboradores avaliados por equipe.
            </p>
          </div>

          {mediaPorEquipe.length === 0 ? (
            <EmptyState message="Nenhuma equipe encontrada para os filtros." />
          ) : (
            <div className="overflow-hidden rounded-xl border">
              <table className="w-full table-fixed text-xs md:text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold">Equipe</th>
                    <th className="px-4 py-3 text-center font-semibold">
                      {indicadorAtual.label}
                    </th>
                    <th className="px-4 py-3 text-center font-semibold">IDI</th>
                    <th className="px-4 py-3 text-center font-semibold">
                      Entregas
                    </th>
                    <th className="px-4 py-3 text-center font-semibold">
                      Colab.
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {mediaPorEquipe.map((item) => (
                    <tr key={item.equipe} className="border-t hover:bg-muted/30">
                      <td className="px-4 py-3 font-medium">{item.equipe}</td>
                      <td className="px-4 py-3 text-center font-semibold">
                        {formatIndicador(item.indicadorSelecionado)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {formatIndicador(item.idi)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {formatInteger(item.entregas)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {formatInteger(item.colaboradores)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <Card className="rounded-2xl border bg-card p-5 shadow-sm md:p-6">
          <div className="mb-5">
            <h3 className="text-xl font-semibold">Colaboradores prioritários</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Lista objetiva para acompanhamento gerencial, reuniões individuais
              e plano de desenvolvimento.
            </p>
          </div>

          {destaques.colaboradoresCriticos.length === 0 &&
          destaques.colaboradoresAtencao.length === 0 ? (
            <EmptyState message="Nenhum colaborador em atenção ou crítico." />
          ) : (
            <div className="space-y-4">
              {destaques.colaboradoresCriticos.length > 0 && (
                <PriorityGroup
                  title="Crítico"
                  items={destaques.colaboradoresCriticos}
                />
              )}

              {destaques.colaboradoresAtencao.length > 0 && (
                <PriorityGroup
                  title="Atenção"
                  items={destaques.colaboradoresAtencao}
                />
              )}
            </div>
          )}
        </Card>
      </div>

      <Card className="rounded-2xl border bg-card p-5 shadow-sm md:p-6">
        <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h3 className="text-xl font-semibold">Base consolidada do painel</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Tabela com os mesmos dados essenciais do painel geral do Excel,
              acrescida da média de referência, limite de atenção e status
              dinâmico por trimestre.
            </p>
          </div>

          <div className="w-full max-w-xs space-y-2">
            <Label htmlFor="ordenacao_tabela">Ordenação</Label>
            <select
              id="ordenacao_tabela"
              value={sortKey}
              onChange={(event: { target: { value: string } }) => setSortKey(event.target.value as SortKey)}
              className="flex h-11 w-full rounded-xl border bg-background px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-ring"
            >
              <option value="risco">Risco primeiro</option>
              <option value="idi_desc">Maior IDI</option>
              <option value="idi_asc">Menor IDI</option>
              <option value="entregas_desc">Mais entregas</option>
              <option value="nome_asc">Nome A-Z</option>
            </select>
          </div>
        </div>

        {itemsOrdenados.length === 0 ? (
          <EmptyState message="Nenhum indicador encontrado para os filtros selecionados." />
        ) : (
          <div className="rounded-xl border">
            <table className="w-full table-fixed text-xs md:text-sm">
              <thead className="sticky top-0 z-10 bg-muted">
                <tr className="border-b">
                  <th className="px-4 py-3 text-left font-semibold">
                    Colaborador
                  </th>
                  <th className="px-4 py-3 text-left font-semibold">Equipe</th>
                  <th className="px-4 py-3 text-center font-semibold">Período</th>
                  <th className="px-4 py-3 text-center font-semibold">
                    Entregas
                  </th>
                  <th className="px-4 py-3 text-center font-semibold">IES</th>
                  <th className="px-4 py-3 text-center font-semibold">IP</th>
                  <th className="px-4 py-3 text-center font-semibold">IQ</th>
                  <th className="px-4 py-3 text-center font-semibold">IEV</th>
                  <th className="px-4 py-3 text-center font-semibold">IDI</th>
                  <th className="px-4 py-3 text-center font-semibold">
                    Média T.
                  </th>
                  <th className="px-4 py-3 text-center font-semibold">
                    Diferença
                  </th>
                  <th className="px-4 py-3 text-center font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {itemsOrdenados.map((item) => {
                  const status = STATUS_STYLE[item.status]
                  const Icon = status.icon

                  return (
                    <tr
                      key={`${item.colaborador_id}-${item.ano}-${item.trimestre}`}
                      className="border-b last:border-b-0 hover:bg-muted/40"
                    >
                      <td className="px-4 py-3 font-medium">
                        {item.colaborador_nome}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {item.equipe ?? "Sem equipe"}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {getPeriodoLabel(item.ano, item.trimestre)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {formatInteger(item.total_entregas)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {formatIndicador(item.ies)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {formatIndicador(item.ip)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {formatIndicador(item.iq)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {formatIndicador(item.iev)}
                      </td>
                      <td className="px-4 py-3 text-center font-semibold">
                        {formatIndicador(item.idi)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {formatIndicador(item.mediaIdiTrimestre)}
                      </td>
                      <td
                        className={`px-4 py-3 text-center font-semibold ${
                          item.diferencaMedia >= 0
                            ? "text-emerald-700"
                            : "text-rose-700"
                        }`}
                      >
                        {formatDelta(item.diferencaMedia)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold ${status.borderClass} ${status.softClass} ${status.textClass}`}
                        >
                          <Icon className="h-3.5 w-3.5" />
                          {status.label}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-dashed p-6 text-sm text-muted-foreground">
      {message}
    </div>
  )
}

function InsightBox({
  title,
  value,
  description,
  icon: Icon,
  tone,
}: {
  title: string
  value: string
  description: string
  icon: typeof CheckCircle2
  tone: "success" | "warning" | "danger"
}) {
  const toneClass = {
    success: "border-emerald-200 bg-emerald-50 text-emerald-700",
    warning: "border-amber-200 bg-amber-50 text-amber-700",
    danger: "border-rose-200 bg-rose-50 text-rose-700",
  }[tone]

  return (
    <div className={`rounded-xl border p-4 ${toneClass}`}>
      <div className="flex items-start gap-3">
        <Icon className="mt-0.5 h-5 w-5" />
        <div>
          <p className="text-sm font-medium">{title}</p>
          <p className="mt-1 text-lg font-bold">{value}</p>
          <p className="mt-1 text-xs opacity-80">{description}</p>
        </div>
      </div>
    </div>
  )
}

function PriorityGroup({
  title,
  items,
}: {
  title: StatusIndicador
  items: IndicadorComStatus[]
}) {
  const style = STATUS_STYLE[title]
  const Icon = style.icon

  return (
    <div>
      <div className={`mb-2 flex items-center gap-2 ${style.textClass}`}>
        <Icon className="h-4 w-4" />
        <h4 className="text-sm font-semibold">{title}</h4>
      </div>

      <div className="space-y-2">
        {items.map((item) => (
          <div
            key={`priority-${item.colaborador_id}-${item.ano}-${item.trimestre}`}
            className={`rounded-xl border p-3 ${style.borderClass} ${style.softClass}`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-medium">{item.colaborador_nome}</p>
                <p className="text-xs text-muted-foreground">
                  {item.equipe ?? "Sem equipe"} · {getPeriodoLabel(item.ano, item.trimestre)}
                </p>
              </div>
              <div className={`text-right text-sm font-bold ${style.textClass}`}>
                {formatIndicador(item.idi)}
              </div>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Média do trimestre: {formatIndicador(item.mediaIdiTrimestre)} · Dif. {formatDelta(item.diferencaMedia)}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
