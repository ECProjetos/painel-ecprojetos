"use client"

import { useEffect, useMemo, useState } from "react"
import {
  AlertTriangle,
  Bell,
  BriefcaseBusiness,
  CalendarDays,
  Clock3,
  Filter,
  TrendingUp,
  Users,
} from "lucide-react"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Check, ChevronsUpDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  getColaboradoresDashboardOptions,
  getProjetosDashboardOptions,
} from "@/app/actions/inicio/get-dashboard-filters"
import { getDashboardDataFiltered } from "@/app/actions/inicio/get-dashboard-data"
import type {
  DashboardHorasColaboradorProjeto,
  DashboardHorasProjeto,
} from "@/types/inicio/dashboard"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

type ProjetoOption = {
  id: number
  code: string
  name: string
  status: string
}

type ColaboradorOption = {
  id: string
  nome: string
  status: string
}

type OrderField = "horas_feitas" | "saldo" | "percentual" | null
type OrderDirection = "asc" | "desc"

function getStatusConsumo(percentual: number) {
  if (percentual >= 100) {
    return {
      label: "Estourado",
      className: "bg-red-100 text-red-700",
      color: "#ef4444",
    }
  }

  if (percentual >= 80) {
    return {
      label: "Atenção",
      className: "bg-yellow-100 text-yellow-700",
      color: "#eab308",
    }
  }

  return {
    label: "OK",
    className: "bg-green-100 text-green-700",
    color: "#22c55e",
  }
}

function formatHours(value: number) {
  const safeValue = Number.isFinite(value) ? value : 0
  const negative = safeValue < 0
  const absoluteValue = Math.abs(safeValue)

  let horas = Math.floor(absoluteValue)
  let minutos = Math.round((absoluteValue % 1) * 60)

  if (minutos === 60) {
    horas += 1
    minutos = 0
  }

  const result = `${horas}h ${String(minutos).padStart(2, "0")}min`
  return negative ? `-${result}` : result
}

function formatPercent(value: number) {
  const safeValue = Number.isFinite(value) ? value : 0
  return `${safeValue.toFixed(2)}%`
}

function truncateLabel(value: string, max = 22) {
  if (value.length <= max) return value
  return `${value.slice(0, max)}...`
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
    <Card className="rounded-2xl border border-gray-200 p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="mt-3 break-words text-2xl font-semibold tracking-tight text-gray-900 md:text-3xl">
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
  rightContent,
  children,
}: {
  title: string
  subtitle?: string
  rightContent?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <Card className="rounded-2xl border border-gray-200 p-5 shadow-sm">
      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          {subtitle ? (
            <p className="text-sm text-gray-500">{subtitle}</p>
          ) : null}
        </div>
        {rightContent}
      </div>
      {children}
    </Card>
  )
}

type CustomTooltipProps = {
  active?: boolean
  payload?: Array<{
    value: number
    payload: {
      nome: string
      nomeCompleto?: string
      percentual?: number
    }
  }>
}

function CustomHoursTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null

  const item = payload[0]
  const nome = item.payload.nomeCompleto ?? item.payload.nome
  const horas = item.value
  const percentual = item.payload.percentual

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-3 shadow-md">
      <p className="text-sm font-semibold text-gray-900">{nome}</p>
      <p className="text-sm text-gray-600">{formatHours(horas)}</p>
      {typeof percentual === "number" ? (
        <p className="text-xs text-gray-500">{formatPercent(percentual)}</p>
      ) : null}
    </div>
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
        onChange={(e) => onChange(e.target.value)}
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

function SearchableFilterSelect({
  label,
  value,
  onChange,
  options,
  placeholder,
  searchPlaceholder,
  emptyText,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  options: Array<{ value: string; label: string }>
  placeholder: string
  searchPlaceholder: string
  emptyText: string
}) {
  const [open, setOpen] = useState(false)

  const selectedOption = options.find((option) => option.value === value)

  return (
    <div className="flex flex-col gap-2">
      <label className="text-xs font-medium uppercase tracking-wide text-gray-500">
        {label}
      </label>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="h-10 w-full justify-between rounded-md border border-gray-300 bg-white px-3 text-sm font-normal"
          >
            <span className="truncate">
              {selectedOption ? selectedOption.label : placeholder}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>

        <PopoverContent
          className="w-[--radix-popover-trigger-width] p-0"
          align="start"
        >
          <Command>
            <CommandInput placeholder={searchPlaceholder} />
            <CommandList>
              <CommandEmpty>{emptyText}</CommandEmpty>
              <CommandGroup>
                {options.map((option) => (
                  <CommandItem
                    key={`${label}-${option.value}`}
                    value={option.label}
                    onSelect={() => {
                      onChange(option.value)
                      setOpen(false)
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === option.value ? "opacity-100" : "opacity-0",
                      )}
                    />
                    <span className="truncate">{option.label}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  )
}

export default function RelatorioRh() {
  const [loading, setLoading] = useState(true)
  const [projetos, setProjetos] = useState<DashboardHorasProjeto[]>([])
  const [colaboradores, setColaboradores] = useState<
    DashboardHorasColaboradorProjeto[]
  >([])
  const [projetoOptions, setProjetoOptions] = useState<ProjetoOption[]>([])
  const [colaboradorOptions, setColaboradorOptions] = useState<
    ColaboradorOption[]
  >([])
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(
    null,
  )
  const currentYear = new Date().getFullYear()

  const [selectedYear, setSelectedYear] = useState<string>("all")
  const [selectedQuarter, setSelectedQuarter] = useState<string>("all")
  const [selectedMonth, setSelectedMonth] = useState<string>("all")
  const [selectedWeek, setSelectedWeek] = useState<string>("all")
  const [selectedProjetoFiltro, setSelectedProjetoFiltro] =
    useState<string>("all")
  const [selectedColaboradorFiltro, setSelectedColaboradorFiltro] =
    useState<string>("all")

  const [orderField, setOrderField] = useState<OrderField>(null)
  const [orderDirection, setOrderDirection] = useState<OrderDirection>("desc")

  function handleSort(field: Exclude<OrderField, null>) {
    if (orderField !== field) {
      setOrderField(field)
      setOrderDirection("desc")
      return
    }

    if (orderDirection === "desc") {
      setOrderDirection("asc")
      return
    }

    setOrderField(null)
    setOrderDirection("desc")
  }

  useEffect(() => {
    const loadDashboard = async () => {
      setLoading(true)

      try {
        const [projetosFiltroData, colaboradoresFiltroData, dashboardData] =
          await Promise.all([
            getProjetosDashboardOptions(),
            getColaboradoresDashboardOptions(),
            getDashboardDataFiltered({
              year: selectedYear,
              quarter: selectedQuarter,
              month: selectedMonth,
              week: selectedWeek,
              projetoId: selectedProjetoFiltro,
              colaboradorId: selectedColaboradorFiltro,
            }),
          ])

        setProjetoOptions((projetosFiltroData as ProjetoOption[]) ?? [])
        setColaboradorOptions(
          (colaboradoresFiltroData as ColaboradorOption[]) ?? [],
        )

        setProjetos(dashboardData.projetos as DashboardHorasProjeto[])
        setColaboradores(
          dashboardData.colaboradores as DashboardHorasColaboradorProjeto[],
        )

        if (dashboardData.projetos.length > 0) {
          setSelectedProjectId((current) => {
            const projetoExiste =
              current !== null &&
              dashboardData.projetos.some((p) => p.projeto_id === current)

            return projetoExiste ? current : null
          })
        } else {
          setSelectedProjectId(null)
        }
      } catch (error) {
        console.error("Erro ao carregar dashboard de relatórios:", error)
      } finally {
        setLoading(false)
      }
    }

    loadDashboard()
  }, [
    selectedYear,
    selectedQuarter,
    selectedMonth,
    selectedWeek,
    selectedProjetoFiltro,
    selectedColaboradorFiltro,
  ])

  const projetosFiltrados = useMemo(() => {
    let filtered = [...projetos]

    if (selectedProjetoFiltro !== "all") {
      filtered = filtered.filter(
        (item) => String(item.projeto_id) === selectedProjetoFiltro,
      )
    }

    if (!orderField) {
      return filtered
    }

    return filtered.sort((a, b) => {
      let valueA = 0
      let valueB = 0

      if (orderField === "horas_feitas") {
        valueA = a.horas_feitas
        valueB = b.horas_feitas
      }

      if (orderField === "saldo") {
        valueA = a.saldo_horas
        valueB = b.saldo_horas
      }

      if (orderField === "percentual") {
        valueA = a.percentual_consumido
        valueB = b.percentual_consumido
      }

      return orderDirection === "asc" ? valueA - valueB : valueB - valueA
    })
  }, [projetos, selectedProjetoFiltro, orderField, orderDirection])

  const colaboradoresOrdenados = useMemo(() => {
    let filtered = [...colaboradores]

    if (selectedColaboradorFiltro !== "all") {
      filtered = filtered.filter(
        (item) => item.user_id === selectedColaboradorFiltro,
      )
    }

    if (selectedProjectId !== null) {
      return filtered
        .filter((item) => item.projeto_id === selectedProjectId)
        .sort((a, b) => b.horas_feitas - a.horas_feitas)
    }

    const agrupadoPorColaborador = new Map<
      string,
      DashboardHorasColaboradorProjeto
    >()

    for (const item of filtered) {
      const existente = agrupadoPorColaborador.get(item.user_id)

      if (!existente) {
        agrupadoPorColaborador.set(item.user_id, {
          ...item,
          projeto_id: 0,
          projeto_codigo: "GERAL",
          projeto_nome: "Todos os projetos",
          horas_feitas: item.horas_feitas,
          total_horas_projeto: item.total_horas_projeto,
          percentual_participacao_projeto: 0,
        })
      } else {
        existente.horas_feitas += item.horas_feitas
      }
    }

    return [...agrupadoPorColaborador.values()].sort(
      (a, b) => b.horas_feitas - a.horas_feitas,
    )
  }, [colaboradores, selectedColaboradorFiltro, selectedProjectId])

  const projetoSelecionado = useMemo(() => {
    return (
      projetos.find((item) => item.projeto_id === selectedProjectId) ?? null
    )
  }, [projetos, selectedProjectId])

  const totalHorasProjetos = useMemo(() => {
    return projetosFiltrados.reduce((acc, item) => acc + item.horas_feitas, 0)
  }, [projetosFiltrados])

  const totalHorasInt = useMemo(() => {
    return projetosFiltrados
      .filter((item) => item.projeto_codigo?.toUpperCase().startsWith("INT-"))
      .reduce((acc, item) => acc + item.horas_feitas, 0)
  }, [projetosFiltrados])

  const totalHorasExt = useMemo(() => {
    return projetosFiltrados
      .filter((item) => item.projeto_codigo?.toUpperCase().startsWith("EXT-"))
      .reduce((acc, item) => acc + item.horas_feitas, 0)
  }, [projetosFiltrados])

  const totalProjetosAtivos = projetosFiltrados.length

  const projetosCriticos = useMemo(() => {
    return projetosFiltrados.filter((p) => p.percentual_consumido >= 100)
  }, [projetosFiltrados])

  const projetosAtencao = useMemo(() => {
    return projetosFiltrados.filter(
      (p) => p.percentual_consumido >= 80 && p.percentual_consumido < 100,
    )
  }, [projetosFiltrados])

  const projetosOk = useMemo(() => {
    return projetosFiltrados.filter((p) => p.percentual_consumido < 80)
  }, [projetosFiltrados])

  const totalProjetosCriticos = projetosCriticos.length

  const projetoMaisConsumido = useMemo(() => {
    if (projetosFiltrados.length === 0) return null
    return [...projetosFiltrados].sort(
      (a, b) => b.horas_feitas - a.horas_feitas,
    )[0]
  }, [projetosFiltrados])

  const projetosQueExigemAtencao = useMemo(() => {
    return [...projetosFiltrados]
      .filter((p) => p.percentual_consumido >= 80)
      .sort((a, b) => b.percentual_consumido - a.percentual_consumido)
  }, [projetosFiltrados])

  const statusChartData = useMemo(() => {
    return [
      { name: "OK", value: projetosOk.length, color: "#22c55e" },
      { name: "Atenção", value: projetosAtencao.length, color: "#eab308" },
      { name: "Estourado", value: projetosCriticos.length, color: "#ef4444" },
    ]
  }, [projetosOk.length, projetosAtencao.length, projetosCriticos.length])

  const projetosGrafico = useMemo(() => {
    return [...projetosFiltrados]
      .sort((a, b) => b.horas_feitas - a.horas_feitas)
      .map((item) => ({
        nome: item.projeto_codigo,
        nomeCompleto: `${item.projeto_codigo} • ${item.projeto_nome}`,
        horas: Number(item.horas_feitas.toFixed(2)),
        percentual: item.percentual_consumido,
        color: getStatusConsumo(item.percentual_consumido).color,
      }))
  }, [projetosFiltrados])

  const colaboradoresGrafico = useMemo(() => {
    return [...colaboradoresOrdenados]
      .slice(0, 10)
      .reverse()
      .map((item) => ({
        nome: truncateLabel(item.user_name, 18),
        nomeCompleto: item.user_name,
        horas: Number(item.horas_feitas.toFixed(2)),
        percentual:
          selectedProjectId !== null
            ? item.percentual_participacao_projeto
            : undefined,
      }))
  }, [colaboradoresOrdenados, selectedProjectId])

  const totalAlertas = useMemo(() => {
    return projetosCriticos.length + projetosAtencao.length
  }, [projetosCriticos.length, projetosAtencao.length])

  const notificationBadgeClass =
    projetosCriticos.length > 0
      ? "bg-red-500 text-white"
      : projetosAtencao.length > 0
        ? "bg-yellow-500 text-white"
        : "bg-gray-300 text-gray-700"

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

  const colaboradorFiltroOptions = useMemo(() => {
    return [
      { value: "all", label: "Todos os colaboradores" },
      ...colaboradorOptions.map((item) => ({
        value: item.id,
        label: item.nome,
      })),
    ]
  }, [colaboradorOptions])

  const projetosChartHeight = Math.max(projetosGrafico.length * 42, 360)

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <h1 className="text-2xl font-semibold text-gray-900">
          Relatórios Gerenciais
        </h1>

        <Skeleton className="h-28 w-full rounded-2xl" />

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
          <Skeleton className="h-32 w-full rounded-2xl" />
          <Skeleton className="h-32 w-full rounded-2xl" />
          <Skeleton className="h-32 w-full rounded-2xl" />
          <Skeleton className="h-32 w-full rounded-2xl" />
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <Skeleton className="h-80 w-full rounded-2xl" />
          <Skeleton className="h-80 w-full rounded-2xl" />
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <Skeleton className="h-96 w-full rounded-2xl" />
          <Skeleton className="h-96 w-full rounded-2xl" />
        </div>

        <Skeleton className="h-[420px] w-full rounded-2xl" />
      </div>
    )
  }

  return (
    <div className="min-w-0 space-y-6 p-4 md:p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold text-gray-900">
            Relatórios Gerenciais
          </h1>
          <p className="text-sm text-gray-500">
            Painel executivo para acompanhamento de horas, risco de consumo e
            alocação por projeto.
          </p>
        </div>

        <Popover>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              className="relative h-10 w-10 shrink-0 rounded-full border border-gray-300 p-0"
            >
              <Bell className="h-5 w-5 text-gray-700" />
              <span
                className={cn(
                  "absolute -right-1 -top-1 inline-flex min-h-[20px] min-w-[20px] items-center justify-center rounded-full px-1 text-[11px] font-semibold",
                  notificationBadgeClass,
                )}
              >
                {totalAlertas}
              </span>
            </Button>
          </PopoverTrigger>

          <PopoverContent
            align="end"
            className="w-[360px] rounded-2xl border border-gray-200 p-0 shadow-lg"
          >
            <div className="border-b border-gray-100 px-4 py-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-900">
                  Alertas de projetos
                </h3>
                <span className="text-xs text-gray-500">
                  {totalAlertas} alerta(s)
                </span>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Projetos que exigem atenção da gestão.
              </p>
            </div>

            <div className="max-h-[420px] overflow-y-auto px-4 py-3">
              {totalAlertas === 0 ? (
                <div className="rounded-2xl border border-green-100 bg-green-50 p-4 text-sm text-green-700">
                  Nenhum alerta no momento.
                </div>
              ) : (
                <div className="space-y-4">
                  {projetosCriticos.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-red-600" />
                        <p className="text-sm font-semibold text-red-700">
                          Projetos críticos
                        </p>
                      </div>

                      <div className="space-y-2">
                        {projetosCriticos.slice(0, 6).map((item) => (
                          <div
                            key={`critico-${item.projeto_id}`}
                            className="rounded-xl border border-red-100 bg-red-50 p-3"
                          >
                            <p className="text-sm font-medium text-gray-900">
                              {item.projeto_codigo} • {item.projeto_nome}
                            </p>
                            <p className="mt-1 text-xs text-gray-600">
                              Consumo:{" "}
                              <span className="font-semibold text-red-700">
                                {formatPercent(item.percentual_consumido)}
                              </span>
                            </p>
                            <p className="text-xs text-gray-500">
                              Horas feitas: {formatHours(item.horas_feitas)}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {projetosAtencao.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-yellow-600" />
                        <p className="text-sm font-semibold text-yellow-700">
                          Projetos em atenção
                        </p>
                      </div>

                      <div className="space-y-2">
                        {projetosAtencao.slice(0, 6).map((item) => (
                          <div
                            key={`atencao-${item.projeto_id}`}
                            className="rounded-xl border border-yellow-100 bg-yellow-50 p-3"
                          >
                            <p className="text-sm font-medium text-gray-900">
                              {item.projeto_codigo} • {item.projeto_nome}
                            </p>
                            <p className="mt-1 text-xs text-gray-600">
                              Consumo:{" "}
                              <span className="font-semibold text-yellow-700">
                                {formatPercent(item.percentual_consumido)}
                              </span>
                            </p>
                            <p className="text-xs text-gray-500">
                              Horas feitas: {formatHours(item.horas_feitas)}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </PopoverContent>
        </Popover>
      </div>

      <SectionCard
        title="Filtros do dashboard"
        subtitle="Selecione os recortes que deseja analisar"
        rightContent={
          <div className="rounded-2xl bg-gray-50 p-3 text-gray-600">
            <Filter className="h-5 w-5" />
          </div>
        }
      >
        <div className="grid grid-cols-1 items-end gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
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

          <SearchableFilterSelect
            label="Projeto"
            value={selectedProjetoFiltro}
            onChange={setSelectedProjetoFiltro}
            options={projetoFiltroOptions}
            placeholder="Selecionar projeto"
            searchPlaceholder="Digite o código ou nome do projeto"
            emptyText="Nenhum projeto encontrado."
          />

          <SearchableFilterSelect
            label="Colaborador"
            value={selectedColaboradorFiltro}
            onChange={setSelectedColaboradorFiltro}
            options={colaboradorFiltroOptions}
            placeholder="Selecionar colaborador"
            searchPlaceholder="Digite o nome do colaborador"
            emptyText="Nenhum colaborador encontrado."
          />
        </div>
      </SectionCard>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        <KpiCard
          title="Horas realizadas"
          value={formatHours(totalHorasProjetos)}
          subtitle="Somatório de horas registradas no recorte selecionado"
          icon={<Clock3 className="h-5 w-5" />}
        />

        <KpiCard
          title="Horas em projetos INT"
          value={formatHours(totalHorasInt)}
          subtitle="Somatório das horas em projetos internos no recorte selecionado"
          icon={<BriefcaseBusiness className="h-5 w-5" />}
        />

        <KpiCard
          title="Horas em projetos EXT"
          value={formatHours(totalHorasExt)}
          subtitle="Somatório das horas em projetos externos no recorte selecionado"
          icon={<BriefcaseBusiness className="h-5 w-5" />}
        />

        <KpiCard
          title="Projetos ativos"
          value={`${totalProjetosAtivos}`}
          subtitle="Projetos visíveis no recorte atual"
          icon={<BriefcaseBusiness className="h-5 w-5" />}
        />

        <KpiCard
          title="Projetos críticos"
          value={`${totalProjetosCriticos}`}
          subtitle="Projetos com consumo acima de 100%"
          icon={<AlertTriangle className="h-5 w-5" />}
        />

        <KpiCard
          title="Projeto mais demandado"
          value={projetoMaisConsumido?.projeto_codigo ?? "-"}
          subtitle={
            projetoMaisConsumido
              ? `${formatHours(projetoMaisConsumido.horas_feitas)} em ${projetoMaisConsumido.projeto_nome}`
              : "Sem dados"
          }
          icon={<TrendingUp className="h-5 w-5" />}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <SectionCard
          title="Projetos que exigem atenção"
          subtitle="Foco imediato da liderança"
        >
          {projetosQueExigemAtencao.length > 0 ? (
            <div className="max-h-[520px] space-y-3 overflow-y-auto pr-2">
              {projetosQueExigemAtencao.map((item) => {
                const status = getStatusConsumo(item.percentual_consumido)

                return (
                  <div
                    key={item.projeto_id}
                    className="flex flex-col gap-3 rounded-2xl border border-red-100 bg-red-50/50 p-4 md:flex-row md:items-center md:justify-between"
                  >
                    <div>
                      <p className="font-semibold text-gray-900">
                        {item.projeto_codigo} • {item.projeto_nome}
                      </p>
                      <p className="text-sm text-gray-600">
                        Horas feitas: {formatHours(item.horas_feitas)} | Saldo:{" "}
                        <span className="font-medium text-red-600">
                          {formatHours(item.saldo_horas)}
                        </span>
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold text-red-700">
                        {formatPercent(item.percentual_consumido)}
                      </span>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium ${status.className}`}
                      >
                        {status.label}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="rounded-2xl border border-green-100 bg-green-50 p-5 text-sm text-green-700">
              Nenhum projeto em atenção ou estourado no momento.
            </div>
          )}
        </SectionCard>

        <SectionCard
          title="Distribuição de status"
          subtitle="Visão consolidada do portfólio"
        >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-[0.95fr_1.05fr] md:items-center">
            <div className="h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusChartData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                  >
                    {statusChartData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-3">
              {statusChartData.map((item) => (
                <div
                  key={item.name}
                  className="flex items-center justify-between rounded-xl border border-gray-100 p-3"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-sm font-medium text-gray-700">
                      {item.name}
                    </span>
                  </div>
                  <span className="text-lg font-semibold text-gray-900">
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </SectionCard>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <SectionCard
          title="Top projetos por horas"
          subtitle="Projetos com maior volume de esforço acumulado"
        >
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
                  <Tooltip content={<CustomHoursTooltip />} />
                  <Bar dataKey="horas" radius={[0, 8, 8, 0]}>
                    {projetosGrafico.map((entry) => (
                      <Cell key={entry.nomeCompleto} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </SectionCard>

        <SectionCard
          title={
            selectedProjectId !== null
              ? "Top colaboradores do projeto selecionado"
              : "Top colaboradores por horas"
          }
          subtitle={
            selectedProjectId !== null && projetoSelecionado
              ? `${projetoSelecionado.projeto_codigo} • ${projetoSelecionado.projeto_nome}`
              : "Somatório geral de todos os projetos"
          }
        >
          <div className="h-[360px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={colaboradoresGrafico}
                layout="vertical"
                margin={{ left: 10 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" tick={{ fontSize: 12 }} />
                <YAxis
                  type="category"
                  dataKey="nome"
                  width={125}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip content={<CustomHoursTooltip />} />
                <Bar dataKey="horas" fill="#2563eb" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>
      </div>

      <SectionCard
        title="Tabela final de detalhamento"
        subtitle="Única visualização tabular para aprofundamento"
        rightContent={
          <div className="flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-600">
            <CalendarDays className="h-4 w-4" />
            <span>
              Ano: {selectedYear} • Trimestre: {selectedQuarter} • Mês:{" "}
              {selectedMonth} • Semana: {selectedWeek}
            </span>
          </div>
        }
      >
        <div className="overflow-x-auto rounded-xl border border-gray-100">
          <Table className="min-w-[1100px]">
            <TableHeader>
              <TableRow>
                <TableHead>Projeto</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Horas estimadas</TableHead>
                <TableHead>
                  <div
                    className="flex items-center gap-1 cursor-pointer select-none"
                    onClick={() => handleSort("horas_feitas")}
                  >
                    Horas feitas
                    {orderField === "horas_feitas" &&
                      (orderDirection === "asc" ? "↑" : "↓")}
                  </div>
                </TableHead>
                <TableHead>
                  <div
                    className="flex items-center gap-1 cursor-pointer"
                    onClick={() => handleSort("saldo")}
                  >
                    Saldo
                    {orderField === "saldo" &&
                      (orderDirection === "asc" ? "↑" : "↓")}
                  </div>
                </TableHead>

                <TableHead>
                  <div
                    className="flex items-center gap-1 cursor-pointer"
                    onClick={() => handleSort("percentual")}
                  >
                    % consumido
                    {orderField === "percentual" &&
                      (orderDirection === "asc" ? "↑" : "↓")}
                  </div>
                </TableHead>
                <TableHead>Colaborador destaque</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {projetosFiltrados.length > 0 ? (
                projetosFiltrados.map((item) => {
                  const status = getStatusConsumo(item.percentual_consumido)

                  const colaboradoresProjeto = colaboradores
                    .filter(
                      (colaborador) =>
                        colaborador.projeto_id === item.projeto_id,
                    )
                    .sort((a, b) => b.horas_feitas - a.horas_feitas)

                  const colaboradorDestaque =
                    colaboradoresProjeto.length > 0
                      ? colaboradoresProjeto[0].user_name
                      : "-"

                  return (
                    <TableRow
                      key={item.projeto_id}
                      className="cursor-pointer"
                      onClick={() => setSelectedProjectId(item.projeto_id)}
                    >
                      <TableCell className="font-medium">
                        {item.projeto_codigo} • {item.projeto_nome}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`rounded-full px-2 py-1 text-xs font-medium ${status.className}`}
                        >
                          {status.label}
                        </span>
                      </TableCell>
                      <TableCell>{formatHours(item.horas_estimadas)}</TableCell>
                      <TableCell>{formatHours(item.horas_feitas)}</TableCell>
                      <TableCell
                        className={
                          item.saldo_horas < 0
                            ? "font-medium text-red-600"
                            : "font-medium text-green-600"
                        }
                      >
                        {formatHours(item.saldo_horas)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 min-w-[120px] max-w-[140px]">
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${
                                item.percentual_consumido >= 100
                                  ? "bg-red-500"
                                  : item.percentual_consumido >= 80
                                    ? "bg-yellow-500"
                                    : "bg-green-500"
                              }`}
                              style={{
                                width: `${Math.min(item.percentual_consumido, 100)}%`,
                              }}
                            />
                          </div>

                          <span className="text-xs font-medium text-gray-700 whitespace-nowrap">
                            {formatPercent(item.percentual_consumido)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-gray-400" />
                          <span>{colaboradorDestaque}</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-gray-500">
                    Nenhum projeto encontrado.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </SectionCard>
    </div>
  )
}
