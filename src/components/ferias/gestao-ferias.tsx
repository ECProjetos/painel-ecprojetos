"use client"

import { useEffect, useMemo, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  AlertTriangle,
  Ban,
  Bell,
  CalendarCheck2,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Plane,
  RefreshCcw,
  Search,
  Trash2,
  Users,
  type LucideIcon,
} from "lucide-react"

import {
  atualizarStatusFerias,
  excluirFeriasSolicitacao,
  type FeriasStatus,
  type FeriasTipo,
} from "@/app/actions/ferias"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"

type ColaboradorFerias = {
  id: string
  nome: string
  email: string | null
  status: string
  cargo: string | null
  equipe: string | null
}

type FeriasSolicitacao = {
  id: string
  colaborador_id: string
  colaborador_nome: string
  equipe: string | null
  cargo: string | null
  data_inicio: string
  data_fim: string
  dias_corridos: number
  tipo: FeriasTipo
  status: FeriasStatus
  observacao: string | null
  motivo_reprovacao: string | null
}

type FeriasResumo = {
  total: number
  pendentes: number
  aprovadas: number
  reprovadas: number
  canceladas: number
  emFeriasHoje: number
  conflitos: number
}

type FeriasConflito = {
  equipe: string
  colaboradorA: string
  colaboradorB: string
  inicioA: string
  fimA: string
  inicioB: string
  fimB: string
}

type GestaoFeriasProps = {
  colaboradores: ColaboradorFerias[]
  solicitacoes: FeriasSolicitacao[]
  pendencias: FeriasSolicitacao[]
  resumo: FeriasResumo
  conflitos: FeriasConflito[]
  filtrosIniciais: {
    dataInicio: string
    dataFim: string
    status: FeriasStatus | "todos"
    colaborador: string
    equipe: string
  }
}

const statusLabels: Record<FeriasStatus, string> = {
  pendente: "Pendente",
  aprovada: "Aprovada",
  reprovada: "Reprovada",
  cancelada: "Cancelada",
}

const tipoLabels: Record<FeriasTipo, string> = {
  ferias: "Férias",
  ausencia: "Ausência",
  atestado: "Atestado",
  day_off: "Day off",
  licenca: "Licença",
}

const statusClasses: Record<FeriasStatus, string> = {
  pendente: "border-amber-200 bg-amber-50 text-amber-700",
  aprovada: "border-emerald-200 bg-emerald-50 text-emerald-700",
  reprovada: "border-rose-200 bg-rose-50 text-rose-700",
  cancelada: "border-slate-200 bg-slate-50 text-slate-600",
}

const pastelBarColors = [
  "#22C55E",
  "#06B6D4",
  "#A855F7",
  "#F59E0B",
  "#EC4899",
  "#3B82F6",
  "#14B8A6",
  "#F97316",
  "#8B5CF6",
  "#10B981",
]

const WEEK_DAYS = ["D", "S", "T", "Q", "Q", "S", "S"]

export default function GestaoFerias({
  colaboradores,
  solicitacoes,
  pendencias,
  resumo,
  conflitos,
  filtrosIniciais,
}: GestaoFeriasProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [dataInicio, setDataInicio] = useState(filtrosIniciais.dataInicio)
  const [dataFim, setDataFim] = useState(filtrosIniciais.dataFim)
  const [statusFiltro, setStatusFiltro] = useState<FeriasStatus | "todos">(
    filtrosIniciais.status,
  )
  const [equipeFiltro, setEquipeFiltro] = useState(
    filtrosIniciais.equipe || "todos",
  )
  const [colaboradorBusca, setColaboradorBusca] = useState(
    filtrosIniciais.colaborador || "",
  )

  useEffect(() => {
    setDataInicio(filtrosIniciais.dataInicio)
    setDataFim(filtrosIniciais.dataFim)
    setStatusFiltro(filtrosIniciais.status)
    setEquipeFiltro(filtrosIniciais.equipe || "todos")
    setColaboradorBusca(filtrosIniciais.colaborador || "")
  }, [
    filtrosIniciais.dataInicio,
    filtrosIniciais.dataFim,
    filtrosIniciais.status,
    filtrosIniciais.equipe,
    filtrosIniciais.colaborador,
  ])

  const equipes = useMemo(() => {
    return Array.from(
      new Set(
        colaboradores
          .map((colaborador) => colaborador.equipe)
          .filter((equipe): equipe is string => Boolean(equipe)),
      ),
    ).sort((a, b) => a.localeCompare(b))
  }, [colaboradores])

  const inicioPeriodo = useMemo(() => parseDate(dataInicio), [dataInicio])
  const fimPeriodo = useMemo(() => parseDate(dataFim), [dataFim])

  const periodoValido =
    isValidDate(inicioPeriodo) &&
    isValidDate(fimPeriodo) &&
    inicioPeriodo <= fimPeriodo

  const diasDoPeriodo = useMemo(() => {
    if (!periodoValido) {
      return []
    }

    const dias: Date[] = []
    const cursor = new Date(inicioPeriodo)

    while (cursor <= fimPeriodo) {
      dias.push(new Date(cursor))
      cursor.setDate(cursor.getDate() + 1)
    }

    return dias
  }, [fimPeriodo, inicioPeriodo, periodoValido])

  const solicitacoesDoPeriodo = useMemo(() => {
    if (!periodoValido) {
      return []
    }

    return solicitacoes
      .filter(
        (item) => item.status !== "reprovada" && item.status !== "cancelada",
      )
      .filter((item) => {
        const inicio = parseDate(item.data_inicio)
        const fim = parseDate(item.data_fim)

        return inicio <= fimPeriodo && fim >= inicioPeriodo
      })
      .sort((a, b) => {
        const diferenca =
          parseDate(a.data_inicio).getTime() -
          parseDate(b.data_inicio).getTime()

        if (diferenca !== 0) {
          return diferenca
        }

        return a.colaborador_nome.localeCompare(b.colaborador_nome)
      })
  }, [solicitacoes, inicioPeriodo, fimPeriodo, periodoValido])

  function aplicarFiltros() {
    if (!dataInicio || !dataFim) {
      toast.error("Informe a data inicial e a data final.")
      return
    }

    if (dataFim < dataInicio) {
      toast.error("A data final não pode ser anterior à data inicial.")
      return
    }

    const params = new URLSearchParams()

    params.set("dataInicio", dataInicio)
    params.set("dataFim", dataFim)

    if (statusFiltro !== "todos") {
      params.set("status", statusFiltro)
    }

    if (equipeFiltro !== "todos") {
      params.set("equipe", equipeFiltro)
    }

    if (colaboradorBusca.trim()) {
      params.set("colaborador", colaboradorBusca.trim())
    }

    router.push(`/rh/ferias?${params.toString()}`)
  }

  function limparFiltros() {
    router.push("/rh/ferias")
  }

  function alterarStatus(solicitacaoId: string, status: FeriasStatus) {
    let observacao: string | undefined

    if (status === "reprovada" || status === "cancelada") {
      const texto = window.prompt("Informe uma observação/motivo:")

      if (texto === null) {
        return
      }

      observacao = texto
    }

    startTransition(() => {
      void (async () => {
        try {
          await atualizarStatusFerias(solicitacaoId, status, observacao)

          toast.success(`Solicitação ${statusLabels[status].toLowerCase()}.`)
          router.refresh()
        } catch (error) {
          toast.error(
            error instanceof Error
              ? error.message
              : "Erro ao atualizar solicitação.",
          )
        }
      })()
    })
  }

  function excluirSolicitacao(solicitacaoId: string) {
    const confirmado = window.confirm(
      "Tem certeza que deseja excluir esta solicitação?",
    )

    if (!confirmado) {
      return
    }

    startTransition(() => {
      void (async () => {
        try {
          await excluirFeriasSolicitacao(solicitacaoId)

          toast.success("Solicitação excluída.")
          router.refresh()
        } catch (error) {
          toast.error(
            error instanceof Error
              ? error.message
              : "Erro ao excluir solicitação.",
          )
        }
      })()
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Gestão de Férias
          </h1>

          <p className="text-sm text-muted-foreground">
            Controle visual das férias e ausências por período, com foco em
            quem realmente estará fora nas datas selecionadas.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="outline"
                className="flex items-center gap-2 px-3 py-2"
                aria-label="Solicitações pendentes"
              >
                <Bell className="h-4 w-4" />

                <span className="font-medium">Solicitações</span>

                <span className="ml-1 inline-flex min-w-6 items-center justify-center rounded-full bg-rose-500 px-2 py-0.5 text-xs font-bold text-white">
                  {pendencias.length > 99 ? "99+" : pendencias.length}
                </span>
              </Button>
            </PopoverTrigger>

            <PopoverContent
              align="end"
              className="w-[calc(100vw-2rem)] p-0 sm:w-[380px]"
            >
              <div className="border-b p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold">Solicitações pendentes</p>

                    <p className="text-xs text-muted-foreground">
                      Pedidos aguardando aprovação ou reprovação.
                    </p>
                  </div>

                  <Badge variant="secondary">{pendencias.length}</Badge>
                </div>
              </div>

              <div className="max-h-[460px] overflow-y-auto">
                {pendencias.length === 0 ? (
                  <div className="p-6 text-center text-sm text-muted-foreground">
                    Nenhuma solicitação pendente.
                  </div>
                ) : (
                  pendencias.map((solicitacao) => (
                    <div
                      key={solicitacao.id}
                      className="space-y-3 border-b p-4 last:border-b-0"
                    >
                      <div>
                        <p className="font-medium">
                          {solicitacao.colaborador_nome}
                        </p>

                        <p className="text-xs text-muted-foreground">
                          {solicitacao.equipe ?? "Sem equipe"}
                        </p>
                      </div>

                      <div className="text-sm">
                        <p>
                          {formatarData(solicitacao.data_inicio)} a{" "}
                          {formatarData(solicitacao.data_fim)}
                        </p>

                        <p className="text-xs text-muted-foreground">
                          {tipoLabels[solicitacao.tipo]} ·{" "}
                          {solicitacao.dias_corridos} dias
                        </p>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          type="button"
                          size="sm"
                          className="flex-1"
                          disabled={isPending}
                          onClick={() =>
                            alterarStatus(solicitacao.id, "aprovada")
                          }
                        >
                          Aprovar
                        </Button>

                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="flex-1"
                          disabled={isPending}
                          onClick={() =>
                            alterarStatus(solicitacao.id, "reprovada")
                          }
                        >
                          Reprovar
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
        <ResumoCard
          title="Total"
          value={resumo.total}
          description="no período"
          icon={Users}
        />

        <ResumoCard
          title="Pendentes"
          value={resumo.pendentes}
          description="aguardando análise"
          icon={Clock3}
        />

        <ResumoCard
          title="Aprovadas"
          value={resumo.aprovadas}
          description="confirmadas"
          icon={CheckCircle2}
        />

        <ResumoCard
          title="Em férias hoje"
          value={resumo.emFeriasHoje}
          description="ausentes hoje"
          icon={Plane}
        />

        <ResumoCard
          title="Conflitos"
          value={resumo.conflitos}
          description="mesma equipe/período"
          icon={AlertTriangle}
          className={resumo.conflitos > 0 ? "border-amber-300" : ""}
        />

        <ResumoCard
          title="Canceladas"
          value={resumo.canceladas}
          description="canceladas"
          icon={Ban}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>

          <CardDescription>
            Selecione a data inicial e final e combine com os demais filtros
            para analisar férias, ausências e possíveis conflitos.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
            <div className="space-y-2">
              <Label htmlFor="ferias-data-inicio">Data inicial</Label>

              <Input
                id="ferias-data-inicio"
                type="date"
                value={dataInicio}
                max={dataFim || undefined}
                onChange={(event) => setDataInicio(event.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ferias-data-fim">Data final</Label>

              <Input
                id="ferias-data-fim"
                type="date"
                value={dataFim}
                min={dataInicio || undefined}
                onChange={(event) => setDataFim(event.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Status</Label>

              <Select
                value={statusFiltro}
                onValueChange={(value) =>
                  setStatusFiltro(value as FeriasStatus | "todos")
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="pendente">Pendentes</SelectItem>
                  <SelectItem value="aprovada">Aprovadas</SelectItem>
                  <SelectItem value="reprovada">Reprovadas</SelectItem>
                  <SelectItem value="cancelada">Canceladas</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Equipe</Label>

              <Select value={equipeFiltro} onValueChange={setEquipeFiltro}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Equipe" />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="todos">Todas</SelectItem>

                  {equipes.map((equipe) => (
                    <SelectItem key={equipe} value={equipe}>
                      {equipe}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 xl:col-span-2">
              <Label>Colaborador</Label>

              <div className="flex gap-2">
                <Input
                  value={colaboradorBusca}
                  onChange={(event) => setColaboradorBusca(event.target.value)}
                  placeholder="Buscar por nome"
                />

                <Button
                  type="button"
                  onClick={aplicarFiltros}
                  aria-label="Aplicar filtros"
                >
                  <Search className="h-4 w-4" />
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={limparFiltros}
                  aria-label="Limpar filtros"
                >
                  <RefreshCcw className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="calendario" className="w-full">
        <div className="flex justify-center">
          <TabsList className="grid w-full max-w-[460px] grid-cols-3">
            <TabsTrigger value="calendario">
              <CalendarDays className="mr-2 h-4 w-4" />
              Calendário
            </TabsTrigger>

            <TabsTrigger value="tabela">
              <CalendarCheck2 className="mr-2 h-4 w-4" />
              Tabela
            </TabsTrigger>

            <TabsTrigger value="conflitos">
              <AlertTriangle className="mr-2 h-4 w-4" />
              Conflitos
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="calendario" className="mt-4">
          <div className="grid items-start gap-4 xl:grid-cols-[320px_minmax(0,1fr)]">
            <Card className="h-fit">
              <CardHeader>
                <CardTitle>Férias no período</CardTitle>

                <CardDescription>
                  Somente colaboradores com férias ou ausências nas datas
                  selecionadas.
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-3">
                {solicitacoesDoPeriodo.length === 0 ? (
                  <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                    Nenhum colaborador com férias ou ausência neste período.
                  </div>
                ) : (
                  solicitacoesDoPeriodo.map((item) => (
                    <ResumoFeriasMesCard key={item.id} item={item} />
                  ))
                )}
              </CardContent>
            </Card>

            <Card className="h-fit self-start">
              <CardHeader>
                <CardTitle>
                  Período de {formatarData(dataInicio)} a {formatarData(dataFim)}
                </CardTitle>

                <CardDescription>
                  Visualização em linha do tempo, com uma cor por colaborador.
                </CardDescription>
              </CardHeader>

              <CardContent>
                {solicitacoesDoPeriodo.length === 0 ? (
                  <div className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
                    Nenhuma programação encontrada para o período selecionado.
                  </div>
                ) : (
                  <>
                    <div className="overflow-x-auto rounded-xl border">
                      <div
                        className="bg-white"
                        style={{
                          minWidth: `${250 + diasDoPeriodo.length * 36}px`,
                        }}
                      >
                        <div
                          className="grid border-b bg-slate-50"
                          style={{
                            gridTemplateColumns: `minmax(190px, 250px) repeat(${diasDoPeriodo.length}, minmax(36px, 1fr))`,
                          }}
                        >
                          <div className="sticky left-0 z-20 border-r bg-slate-50 p-3 font-medium">
                            Colaborador
                          </div>

                          {diasDoPeriodo.map((dataDia) => {
                            const dayOfWeek = dataDia.getDay()
                            const isWeekend =
                              dayOfWeek === 0 || dayOfWeek === 6
                            const isToday = isSameDay(dataDia, new Date())
                            const dataIso = formatarDataIso(dataDia)

                            return (
                              <div
                                key={dataIso}
                                className={cn(
                                  "min-w-0 border-r px-0.5 py-2 text-center",
                                  isWeekend && "bg-slate-100",
                                  isToday && "bg-blue-50",
                                )}
                                title={formatarDataCompleta(dataDia)}
                              >
                                <div className="text-[9px] text-muted-foreground">
                                  {WEEK_DAYS[dayOfWeek]}
                                </div>

                                <div className="text-[11px] font-semibold">
                                  {formatarDiaMes(dataDia)}
                                </div>
                              </div>
                            )
                          })}
                        </div>

                        {solicitacoesDoPeriodo.map((item) => {
                          const inicioOriginal = parseDate(item.data_inicio)
                          const fimOriginal = parseDate(item.data_fim)

                          const inicioVisivel =
                            inicioOriginal < inicioPeriodo
                              ? inicioPeriodo
                              : inicioOriginal

                          const fimVisivel =
                            fimOriginal > fimPeriodo ? fimPeriodo : fimOriginal

                          const startIndex = diferencaEmDias(
                            inicioPeriodo,
                            inicioVisivel,
                          )
                          const duracaoVisivel =
                            diferencaEmDias(inicioVisivel, fimVisivel) + 1

                          const leftPercent =
                            (startIndex / diasDoPeriodo.length) * 100

                          const widthPercent =
                            (duracaoVisivel / diasDoPeriodo.length) * 100

                          return (
                            <div
                              key={item.id}
                              className="grid border-b last:border-b-0"
                              style={{
                                gridTemplateColumns:
                                  "minmax(190px, 250px) minmax(0, 1fr)",
                              }}
                            >
                              <div className="sticky left-0 z-10 border-r bg-white p-3">
                                <div className="font-medium leading-tight">
                                  {item.colaborador_nome}
                                </div>

                                <div className="mt-1 text-xs text-muted-foreground">
                                  {item.equipe ?? "Sem equipe"}
                                </div>

                                <div className="mt-2 flex items-center gap-2">
                                  <Badge
                                    variant="outline"
                                    className={statusClasses[item.status]}
                                  >
                                    {statusLabels[item.status]}
                                  </Badge>

                                  <span className="text-xs text-muted-foreground">
                                    {item.dias_corridos} dias
                                  </span>
                                </div>
                              </div>

                              <div className="relative h-[68px] min-w-0">
                                <div
                                  className="absolute inset-0 grid"
                                  style={{
                                    gridTemplateColumns: `repeat(${diasDoPeriodo.length}, minmax(36px, 1fr))`,
                                  }}
                                >
                                  {diasDoPeriodo.map((dataDia) => {
                                    const dayOfWeek = dataDia.getDay()
                                    const isWeekend =
                                      dayOfWeek === 0 || dayOfWeek === 6
                                    const isToday = isSameDay(
                                      dataDia,
                                      new Date(),
                                    )
                                    const dataIso = formatarDataIso(dataDia)

                                    return (
                                      <div
                                        key={`${item.id}-${dataIso}`}
                                        className={cn(
                                          "min-w-0 border-r",
                                          isWeekend && "bg-slate-50",
                                          isToday && "bg-blue-50/70",
                                        )}
                                      />
                                    )
                                  })}
                                </div>

                                <div
                                  className="absolute top-1/2 flex h-9 -translate-y-1/2 items-center overflow-hidden rounded-full px-3 text-[10px] font-semibold shadow-sm xl:text-xs"
                                  style={{
                                    left: `calc(${leftPercent}% + 4px)`,
                                    width: `max(4px, calc(${widthPercent}% - 8px))`,
                                    ...getCalendarBarStyle(item),
                                  }}
                                  title={`${item.colaborador_nome} • ${formatarData(
                                    item.data_inicio,
                                  )} a ${formatarData(item.data_fim)}`}
                                >
                                  <span className="truncate">
                                    {item.colaborador_nome}
                                  </span>
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <span className="h-3 w-8 rounded-full border bg-slate-300" />
                        <span>Cada colaborador possui uma cor própria</span>
                      </div>

                      <LegendaItem
                        color="#EFF6FF"
                        borderColor="#CBD5E1"
                        label="Hoje"
                      />
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="tabela" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Solicitações</CardTitle>

              <CardDescription>
                Lista completa das solicitações cadastradas no período.
              </CardDescription>
            </CardHeader>

            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Colaborador</TableHead>
                    <TableHead>Equipe</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Início</TableHead>
                    <TableHead>Fim</TableHead>
                    <TableHead>Dias</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {solicitacoes.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={8}
                        className="h-24 text-center text-muted-foreground"
                      >
                        Nenhuma solicitação encontrada para os filtros
                        selecionados.
                      </TableCell>
                    </TableRow>
                  ) : (
                    solicitacoes.map((solicitacao) => (
                      <TableRow key={solicitacao.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">
                              {solicitacao.colaborador_nome}
                            </p>

                            <p className="text-xs text-muted-foreground">
                              {solicitacao.cargo ?? "Cargo não informado"}
                            </p>
                          </div>
                        </TableCell>

                        <TableCell>
                          {solicitacao.equipe ?? "Sem equipe"}
                        </TableCell>

                        <TableCell>
                          {tipoLabels[solicitacao.tipo]}
                        </TableCell>

                        <TableCell>
                          {formatarData(solicitacao.data_inicio)}
                        </TableCell>

                        <TableCell>
                          {formatarData(solicitacao.data_fim)}
                        </TableCell>

                        <TableCell>{solicitacao.dias_corridos}</TableCell>

                        <TableCell>
                          <Badge
                            variant="outline"
                            className={statusClasses[solicitacao.status]}
                          >
                            {statusLabels[solicitacao.status]}
                          </Badge>
                        </TableCell>

                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            {solicitacao.status === "pendente" && (
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={isPending}
                                onClick={() =>
                                  alterarStatus(solicitacao.id, "aprovada")
                                }
                              >
                                Aprovar
                              </Button>
                            )}

                            {solicitacao.status === "pendente" && (
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={isPending}
                                onClick={() =>
                                  alterarStatus(solicitacao.id, "reprovada")
                                }
                              >
                                Reprovar
                              </Button>
                            )}

                            {["pendente", "aprovada"].includes(
                              solicitacao.status,
                            ) && (
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={isPending}
                                onClick={() =>
                                  alterarStatus(solicitacao.id, "cancelada")
                                }
                              >
                                Cancelar
                              </Button>
                            )}

                            <Button
                              size="sm"
                              variant="ghost"
                              disabled={isPending}
                              onClick={() =>
                                excluirSolicitacao(solicitacao.id)
                              }
                              aria-label={`Excluir solicitação de ${solicitacao.colaborador_nome}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="conflitos" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Conflitos de período</CardTitle>

              <CardDescription>
                Pessoas da mesma equipe com datas sobrepostas.
              </CardDescription>
            </CardHeader>

            <CardContent>
              {conflitos.length === 0 ? (
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
                  Nenhum conflito identificado para o período selecionado.
                </div>
              ) : (
                <div className="space-y-3">
                  {conflitos.map((conflito, index) => (
                    <div
                      key={`${conflito.equipe}-${index}`}
                      className="rounded-lg border border-amber-200 bg-amber-50 p-4"
                    >
                      <div className="mb-2 flex items-center gap-2 font-medium text-amber-800">
                        <AlertTriangle className="h-4 w-4" />
                        {conflito.equipe}
                      </div>

                      <p className="text-sm text-amber-800">
                        <strong>{conflito.colaboradorA}</strong> estará ausente
                        de {formatarData(conflito.inicioA)} a{" "}
                        {formatarData(conflito.fimA)} e{" "}
                        <strong>{conflito.colaboradorB}</strong> estará ausente
                        de {formatarData(conflito.inicioB)} a{" "}
                        {formatarData(conflito.fimB)}.
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function ResumoCard({
  title,
  value,
  description,
  icon: Icon,
  className,
}: {
  title: string
  value: number
  description: string
  icon: LucideIcon
  className?: string
}) {
  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>

        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>

      <CardContent>
        <div className="text-2xl font-bold">{value}</div>

        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  )
}

function ResumoFeriasMesCard({ item }: { item: FeriasSolicitacao }) {
  return (
    <div className="rounded-xl border bg-white p-3 shadow-sm">
      <div
        className="mb-3 h-2.5 w-20 rounded-full"
        style={{
          backgroundColor: getPastelBarColor(item.colaborador_id),
        }}
      />

      <div className="flex items-start gap-3">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold"
          style={getAvatarStyle(item.colaborador_id)}
        >
          {getInitials(item.colaborador_nome)}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="truncate font-medium">{item.colaborador_nome}</p>

            <Badge variant="outline" className={statusClasses[item.status]}>
              {statusLabels[item.status]}
            </Badge>
          </div>

          <p className="text-xs text-muted-foreground">
            {item.equipe ?? "Sem equipe"}
          </p>

          <p className="mt-2 text-sm text-sky-700">
            {formatarData(item.data_inicio)} - {formatarData(item.data_fim)}
          </p>

          <p className="text-sm font-medium text-amber-600">
            {item.dias_corridos} dias
          </p>
        </div>
      </div>
    </div>
  )
}

function LegendaItem({
  color,
  borderColor,
  label,
}: {
  color: string
  borderColor?: string
  label: string
}) {
  return (
    <div className="flex items-center gap-2">
      <span
        className="h-3 w-8 rounded-full border"
        style={{
          backgroundColor: color,
          borderColor: borderColor ?? color,
        }}
      />

      <span>{label}</span>
    </div>
  )
}

function parseDate(value: string) {
  const [year, month, day] = value.split("-").map(Number)

  return new Date(year, month - 1, day)
}

function isValidDate(data: Date) {
  return !Number.isNaN(data.getTime())
}

function diferencaEmDias(inicio: Date, fim: Date) {
  const inicioUtc = Date.UTC(
    inicio.getFullYear(),
    inicio.getMonth(),
    inicio.getDate(),
  )
  const fimUtc = Date.UTC(fim.getFullYear(), fim.getMonth(), fim.getDate())

  return Math.round((fimUtc - inicioUtc) / (1000 * 60 * 60 * 24))
}

function formatarDataIso(data: Date) {
  const ano = data.getFullYear()
  const mes = String(data.getMonth() + 1).padStart(2, "0")
  const dia = String(data.getDate()).padStart(2, "0")

  return `${ano}-${mes}-${dia}`
}

function formatarDiaMes(data: Date) {
  const dia = String(data.getDate()).padStart(2, "0")
  const mes = data
    .toLocaleDateString("pt-BR", { month: "short" })
    .replace(".", "")

  return `${dia}/${mes}`
}

function formatarDataCompleta(data: Date) {
  return data.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  })
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

function getInitials(nome: string) {
  const partes = nome.trim().split(" ").filter(Boolean)
  const primeira = partes[0]?.[0] ?? ""
  const segunda = partes[1]?.[0] ?? ""

  return `${primeira}${segunda}`.toUpperCase()
}

function formatarData(data: string) {
  if (!data) {
    return "-"
  }

  const [ano, mes, dia] = data.split("-")

  return `${dia}/${mes}/${ano}`
}

function getPastelBarColor(chave: string) {
  let hash = 0

  for (let index = 0; index < chave.length; index++) {
    hash = chave.charCodeAt(index) + ((hash << 5) - hash)
  }

  const colorIndex = Math.abs(hash) % pastelBarColors.length

  return pastelBarColors[colorIndex]
}

function getCalendarBarStyle(item: FeriasSolicitacao) {
  if (item.status === "reprovada" || item.status === "cancelada") {
    return {
      backgroundColor: "#E2E8F0",
      color: "#475569",
      opacity: 1,
    }
  }

  const cor = getPastelBarColor(item.colaborador_id)

  return {
    backgroundColor: cor,
    color: "#FFFFFF",
    opacity: item.status === "pendente" ? 0.95 : 1,
  }
}

function getAvatarStyle(chave: string) {
  const cor = getPastelBarColor(chave)

  return {
    backgroundColor: hexToRgba(cor, 0.16),
    color: cor,
  }
}

function hexToRgba(hex: string, alpha: number) {
  const normalized = hex.replace("#", "")
  const bigint = Number.parseInt(normalized, 16)

  const red = (bigint >> 16) & 255
  const green = (bigint >> 8) & 255
  const blue = bigint & 255

  return `rgba(${red}, ${green}, ${blue}, ${alpha})`
}