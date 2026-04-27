"use client"

import { useEffect, useMemo, useState, useTransition } from "react"
import {
  getIndicadoresDashboard,
  getIndicadoresDashboardFiltros,
  type IndicadorDashboardItem,
} from "@/app/actions/indicadores-dashboard"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import {
  AlertTriangle,
  CheckCircle2,
  CircleAlert,
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

type DashboardFiltros = {
  anos: number[]
  trimestres: number[]
  equipes: string[]
  colaboradores: {
    id: string
    nome: string
  }[]
}

type FiltrosState = {
  ano: string
  trimestre: string
  equipe: string
  colaboradorId: string
}

function formatPercent(value: number) {
  return `${value.toFixed(2)}%`
}

function getStatus(idi: number) {
  if (idi < 60) {
    return {
      label: "Crítico",
      textClass: "text-red-600",
      bgClass: "bg-red-50 border-red-200",
      fill: "#ef4444",
      icon: AlertTriangle,
    }
  }

  if (idi < 75) {
    return {
      label: "Atenção",
      textClass: "text-amber-600",
      bgClass: "bg-amber-50 border-amber-200",
      fill: "#f59e0b",
      icon: CircleAlert,
    }
  }

  return {
    label: "Ok",
    textClass: "text-emerald-600",
    bgClass: "bg-emerald-50 border-emerald-200",
    fill: "#22c55e",
    icon: CheckCircle2,
  }
}

function getMedia(
  items: IndicadorDashboardItem[],
  field: keyof Pick<
    IndicadorDashboardItem,
    "ies" | "ip" | "iq" | "iev" | "idi"
  >,
) {
  if (!items.length) return 0

  const soma = items.reduce((acc, item) => acc + Number(item[field] ?? 0), 0)
  return soma / items.length
}

export default function IndicadoresDashboard() {
  const [items, setItems] = useState<IndicadorDashboardItem[]>([])
  const [filtrosOpcoes, setFiltrosOpcoes] = useState<DashboardFiltros>({
    anos: [],
    trimestres: [],
    equipes: [],
    colaboradores: [],
  })
  const [filtros, setFiltros] = useState<FiltrosState>({
    ano: "",
    trimestre: "",
    equipe: "",
    colaboradorId: "",
  })
  const [isPending, startTransition] = useTransition()
  const [isLoadingInitial, setIsLoadingInitial] = useState(true)

  useEffect(() => {
    async function loadInitial() {
      try {
        setIsLoadingInitial(true)

        const [filtrosData, indicadoresData] = await Promise.all([
          getIndicadoresDashboardFiltros(),
          getIndicadoresDashboard(),
        ])

        setFiltrosOpcoes(filtrosData)
        setItems(indicadoresData)
      } catch (error) {
        console.error(error)
        toast.error("Não foi possível carregar os indicadores.")
      } finally {
        setIsLoadingInitial(false)
      }
    }

    loadInitial()
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

  function aplicarFiltros() {
    startTransition(async () => {
      try {
        const data = await getIndicadoresDashboard({
          ano: filtros.ano ? Number(filtros.ano) : undefined,
          trimestre: filtros.trimestre ? Number(filtros.trimestre) : undefined,
          equipe: filtros.equipe || undefined,
          colaboradorId: filtros.colaboradorId || undefined,
        })

        setItems(data)
      } catch (error) {
        console.error(error)
        toast.error("Não foi possível aplicar os filtros.")
      }
    })
  }

  function limparFiltros() {
    setFiltros({
      ano: "",
      trimestre: "",
      equipe: "",
      colaboradorId: "",
    })

    startTransition(async () => {
      try {
        const data = await getIndicadoresDashboard()
        setItems(data)
      } catch (error) {
        console.error(error)
        toast.error("Não foi possível limpar os filtros.")
      }
    })
  }

  const mediaIES = useMemo(() => getMedia(items, "ies"), [items])
  const mediaIP = useMemo(() => getMedia(items, "ip"), [items])
  const mediaIQ = useMemo(() => getMedia(items, "iq"), [items])
  const mediaIEV = useMemo(() => getMedia(items, "iev"), [items])
  const mediaIDI = useMemo(() => getMedia(items, "idi"), [items])

  const itemsOrdenadosPorRisco = useMemo(() => {
    return [...items].sort((a, b) => a.idi - b.idi)
  }, [items])

  const colaboradoresEmAtencao = useMemo(() => {
    return [...items]
      .filter((item) => item.idi < 75)
      .sort((a, b) => a.idi - b.idi)
  }, [items])

  const rankingColaboradores = useMemo(() => {
    return [...items]
      .sort((a, b) => b.idi - a.idi)
      .map((item) => ({
        nome: item.colaborador_nome,
        idi: Number(item.idi.toFixed(2)),
      }))
  }, [items])

  const mediaPorEquipe = useMemo(() => {
    const mapa = new Map<string, { soma: number; quantidade: number }>()

    for (const item of items) {
      const equipe = item.equipe?.trim() || "Sem equipe"
      const atual = mapa.get(equipe) ?? { soma: 0, quantidade: 0 }

      atual.soma += item.idi
      atual.quantidade += 1

      mapa.set(equipe, atual)
    }

    return Array.from(mapa.entries())
      .map(([equipe, valores]) => ({
        equipe,
        idi: Number((valores.soma / valores.quantidade).toFixed(2)),
      }))
      .sort((a, b) => b.idi - a.idi)
  }, [items])

  const totalCriticos = items.filter((item) => item.idi < 60).length
  const totalAtencao = items.filter(
    (item) => item.idi >= 60 && item.idi < 75,
  ).length
  const totalOk = items.filter((item) => item.idi >= 75).length

  return (
    <div className="space-y-6">
      <Card className="rounded-2xl border bg-card p-5 shadow-sm md:p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold tracking-tight">Indicadores</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Visualização consolidada dos indicadores por colaborador, equipe e
            período.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <div className="space-y-2">
            <Label htmlFor="filtro_ano">Ano</Label>
            <select
              id="filtro_ano"
              value={filtros.ano}
              onChange={(e) => updateFiltro("ano", e.target.value)}
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
              onChange={(e) => updateFiltro("trimestre", e.target.value)}
              className="flex h-11 w-full rounded-xl border bg-background px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-ring"
            >
              <option value="">Todos</option>
              {filtrosOpcoes.trimestres.map((tri) => (
                <option key={tri} value={String(tri)}>
                  {tri}º trimestre
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="filtro_equipe">Equipe</Label>
            <select
              id="filtro_equipe"
              value={filtros.equipe}
              onChange={(e) => updateFiltro("equipe", e.target.value)}
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
            <Label htmlFor="filtro_colaborador">Colaborador</Label>
            <select
              id="filtro_colaborador"
              value={filtros.colaboradorId}
              onChange={(e) => updateFiltro("colaboradorId", e.target.value)}
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
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          <Button
            type="button"
            onClick={aplicarFiltros}
            disabled={isPending}
            className="rounded-xl"
          >
            {isPending ? "Aplicando..." : "Aplicar filtros"}
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={limparFiltros}
            disabled={isPending}
            className="rounded-xl"
          >
            Limpar filtros
          </Button>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
        <Card className="rounded-2xl border p-4 shadow-sm">
          <p className="text-sm text-muted-foreground">Média IES</p>
          <p className="mt-2 text-2xl font-semibold">
            {formatPercent(mediaIES)}
          </p>
        </Card>

        <Card className="rounded-2xl border p-4 shadow-sm">
          <p className="text-sm text-muted-foreground">Média IP</p>
          <p className="mt-2 text-2xl font-semibold">
            {formatPercent(mediaIP)}
          </p>
        </Card>

        <Card className="rounded-2xl border p-4 shadow-sm">
          <p className="text-sm text-muted-foreground">Média IQ</p>
          <p className="mt-2 text-2xl font-semibold">
            {formatPercent(mediaIQ)}
          </p>
        </Card>

        <Card className="rounded-2xl border p-4 shadow-sm">
          <p className="text-sm text-muted-foreground">Média IEV</p>
          <p className="mt-2 text-2xl font-semibold">
            {formatPercent(mediaIEV)}
          </p>
        </Card>

        <Card className="rounded-2xl border p-4 shadow-sm">
          <p className="text-sm text-muted-foreground">Média IDI</p>
          <p className="mt-2 text-2xl font-semibold">
            {formatPercent(mediaIDI)}
          </p>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card className="rounded-2xl border border-red-200 bg-red-50 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <div>
              <p className="text-sm font-medium text-red-700">Crítico</p>
              <p className="text-2xl font-semibold text-red-700">
                {totalCriticos}
              </p>
              <p className="text-xs text-red-600">IDI abaixo de 60%</p>
            </div>
          </div>
        </Card>

        <Card className="rounded-2xl border border-amber-200 bg-amber-50 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <CircleAlert className="h-5 w-5 text-amber-600" />
            <div>
              <p className="text-sm font-medium text-amber-700">Atenção</p>
              <p className="text-2xl font-semibold text-amber-700">
                {totalAtencao}
              </p>
              <p className="text-xs text-amber-600">IDI entre 60% e 75%</p>
            </div>
          </div>
        </Card>

        <Card className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            <div>
              <p className="text-sm font-medium text-emerald-700">Ok</p>
              <p className="text-2xl font-semibold text-emerald-700">
                {totalOk}
              </p>
              <p className="text-xs text-emerald-600">IDI igual ou acima de 75%</p>
            </div>
          </div>
        </Card>
      </div>

      <Card className="rounded-2xl border bg-card p-5 shadow-sm md:p-6">
        <div className="mb-4 flex items-start gap-3">
          <TrendingUp className="mt-1 h-5 w-5 text-amber-500" />
          <div>
            <h3 className="text-xl font-semibold">Colaboradores em atenção</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Lista automática com colaboradores cujo IDI está abaixo de 75%.
            </p>
          </div>
        </div>

        {colaboradoresEmAtencao.length === 0 ? (
          <div className="rounded-xl border p-4">
            <p className="text-sm text-muted-foreground">
              Nenhum colaborador em atenção nos filtros selecionados.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            {colaboradoresEmAtencao.map((item) => {
              const status = getStatus(item.idi)
              const Icon = status.icon

              return (
                <div
                  key={`${item.colaborador_id}-${item.ano}-${item.trimestre}-alerta`}
                  className={`rounded-xl border p-4 ${status.bgClass}`}
                >
                  <div className="flex items-start gap-3">
                    <Icon className={`mt-0.5 h-5 w-5 ${status.textClass}`} />
                    <div>
                      <p className="font-semibold">{item.colaborador_nome}</p>
                      <p className="text-sm text-muted-foreground">
                        {item.equipe ?? "Sem equipe"} · {item.trimestre}º tri.{" "}
                        {item.ano}
                      </p>
                      <p className={`mt-2 text-lg font-bold ${status.textClass}`}>
                        {formatPercent(item.idi)} · {status.label}
                      </p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </Card>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Card className="rounded-2xl border bg-card p-5 shadow-sm md:p-6">
          <div className="mb-4">
            <h3 className="text-xl font-semibold">IDI por colaborador</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Ranking dos colaboradores conforme os filtros aplicados.
            </p>
          </div>

          {rankingColaboradores.length === 0 ? (
            <div className="rounded-xl border p-4">
              <p className="text-sm text-muted-foreground">
                Nenhum dado disponível para o gráfico.
              </p>
            </div>
          ) : (
            <div className="h-[380px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={rankingColaboradores}
                  layout="vertical"
                  margin={{ left: 24, right: 16 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" domain={[0, 100]} />
                  <YAxis
                    type="category"
                    dataKey="nome"
                    width={150}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip
                    formatter={(value: number) => `${value.toFixed(2)}%`}
                  />
                  <Bar dataKey="idi" radius={[0, 8, 8, 0]}>
                    {rankingColaboradores.map((entry, index) => (
                      <Cell
                        key={`cell-colab-${index}`}
                        fill={getStatus(entry.idi).fill}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>

        <Card className="rounded-2xl border bg-card p-5 shadow-sm md:p-6">
          <div className="mb-4">
            <h3 className="text-xl font-semibold">Média de IDI por equipe</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Comparação entre equipes conforme os filtros aplicados.
            </p>
          </div>

          {mediaPorEquipe.length === 0 ? (
            <div className="rounded-xl border p-4">
              <p className="text-sm text-muted-foreground">
                Nenhum dado disponível para o gráfico.
              </p>
            </div>
          ) : (
            <div className="h-[380px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={mediaPorEquipe}
                  margin={{ top: 8, right: 16, left: 8, bottom: 32 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="equipe"
                    angle={-15}
                    textAnchor="end"
                    height={80}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis domain={[0, 100]} />
                  <Tooltip
                    formatter={(value: number) => `${value.toFixed(2)}%`}
                  />
                  <Bar dataKey="idi" radius={[8, 8, 0, 0]}>
                    {mediaPorEquipe.map((entry, index) => (
                      <Cell
                        key={`cell-equipe-${index}`}
                        fill={getStatus(entry.idi).fill}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>
      </div>

      <Card className="rounded-2xl border bg-card p-5 shadow-sm md:p-6">
        <div className="mb-4">
          <h3 className="text-xl font-semibold">Resultados por colaborador</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Base consolidada por ano e trimestre. A tabela está ordenada do menor
            para o maior IDI.
          </p>
        </div>

        {isLoadingInitial ? (
          <div className="rounded-xl border p-4">
            <p className="text-sm text-muted-foreground">Carregando dados...</p>
          </div>
        ) : itemsOrdenadosPorRisco.length === 0 ? (
          <div className="rounded-xl border p-4">
            <p className="text-sm text-muted-foreground">
              Nenhum indicador encontrado para os filtros selecionados.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border">
            <table className="min-w-full border-collapse text-sm">
              <thead className="bg-muted/40">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">
                    Colaborador
                  </th>
                  <th className="px-4 py-3 text-left font-semibold">Equipe</th>
                  <th className="px-4 py-3 text-left font-semibold">Ano</th>
                  <th className="px-4 py-3 text-left font-semibold">
                    Trimestre
                  </th>
                  <th className="px-4 py-3 text-left font-semibold">
                    Entregas
                  </th>
                  <th className="px-4 py-3 text-left font-semibold">IES</th>
                  <th className="px-4 py-3 text-left font-semibold">IP</th>
                  <th className="px-4 py-3 text-left font-semibold">IQ</th>
                  <th className="px-4 py-3 text-left font-semibold">IEV</th>
                  <th className="px-4 py-3 text-left font-semibold">IDI</th>
                  <th className="px-4 py-3 text-left font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {itemsOrdenadosPorRisco.map((item) => {
                  const status = getStatus(item.idi)
                  const Icon = status.icon

                  return (
                    <tr
                      key={`${item.colaborador_id}-${item.ano}-${item.trimestre}`}
                      className="border-t"
                    >
                      <td className="px-4 py-3">{item.colaborador_nome}</td>
                      <td className="px-4 py-3">{item.equipe ?? "-"}</td>
                      <td className="px-4 py-3">{item.ano}</td>
                      <td className="px-4 py-3">{item.trimestre}º</td>
                      <td className="px-4 py-3">{item.total_entregas}</td>
                      <td className="px-4 py-3">{formatPercent(item.ies)}</td>
                      <td className="px-4 py-3">{formatPercent(item.ip)}</td>
                      <td className="px-4 py-3">{formatPercent(item.iq)}</td>
                      <td className="px-4 py-3">{formatPercent(item.iev)}</td>
                      <td
                        className={`px-4 py-3 font-semibold ${status.textClass}`}
                      >
                        {formatPercent(item.idi)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-xs font-medium ${status.bgClass} ${status.textClass}`}
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