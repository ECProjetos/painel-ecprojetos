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
  type FeriasAlerta,
  type FeriasPeriodoResumo,
  type FeriasStatus,
  type FeriasTipo,
} from "@/app/actions/ferias"

import ProgramacaoFerias from "@/components/ferias/programacao-ferias"
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
  data_admissao: string | null
  configuracao_ferias: {
    id: string
    regime_contratacao: "clt" | "estagio" | "pj" | "outro"
    ativo_gestao_ferias: boolean
    data_admissao_referencia: string | null
    dias_direito_padrao: number
    observacao: string | null
  } | null
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

type CorColaborador = {
  solid: string
  soft: string
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
  programacao: FeriasPeriodoResumo[]
  alertasVencimento: FeriasAlerta[]
  podeEditarProgramacao: boolean
  filtrosIniciais: {
    ano: number
    mes: number
    status: FeriasStatus | "todos"
    colaborador: string
    equipe: string
  }
}

const meses = [
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

const WEEK_DAYS = ["D", "S", "T", "Q", "Q", "S", "S"]

export default function GestaoFerias({
  colaboradores,
  solicitacoes,
  pendencias,
  resumo,
  conflitos,
  programacao,
  alertasVencimento,
  podeEditarProgramacao,
  filtrosIniciais,
}: GestaoFeriasProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [ano, setAno] = useState(String(filtrosIniciais.ano))
  const [mes, setMes] = useState(String(filtrosIniciais.mes))
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
    setAno(String(filtrosIniciais.ano))
    setMes(String(filtrosIniciais.mes))
    setStatusFiltro(filtrosIniciais.status)
    setEquipeFiltro(filtrosIniciais.equipe || "todos")
    setColaboradorBusca(filtrosIniciais.colaborador || "")
  }, [
    filtrosIniciais.ano,
    filtrosIniciais.mes,
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

  const anosDisponiveis = useMemo(() => {
    const anoBase = filtrosIniciais.ano

    return [anoBase - 1, anoBase, anoBase + 1, anoBase + 2]
  }, [filtrosIniciais.ano])

  const diasDoMes = useMemo(() => {
    const total = new Date(Number(ano), Number(mes), 0).getDate()

    return Array.from({ length: total }, (_, index) => index + 1)
  }, [ano, mes])

  const inicioMes = useMemo(() => {
    return new Date(Number(ano), Number(mes) - 1, 1)
  }, [ano, mes])

  const fimMes = useMemo(() => {
    return new Date(Number(ano), Number(mes), 0)
  }, [ano, mes])

  const solicitacoesDoMes = useMemo(() => {
    return solicitacoes
      .filter(
        (item) => item.status !== "reprovada" && item.status !== "cancelada",
      )
      .filter((item) => {
        const inicio = parseDate(item.data_inicio)
        const fim = parseDate(item.data_fim)

        return inicio <= fimMes && fim >= inicioMes
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
  }, [solicitacoes, inicioMes, fimMes])

  const coresPorColaborador = useMemo(() => {
    const nomesPorId = new Map<string, string>()

    colaboradores.forEach((colaborador) => {
      nomesPorId.set(colaborador.id, colaborador.nome)
    })

    solicitacoes.forEach((solicitacao) => {
      nomesPorId.set(solicitacao.colaborador_id, solicitacao.colaborador_nome)
    })

    const colaboradoresOrdenados = Array.from(nomesPorId.entries()).sort(
      ([, nomeA], [, nomeB]) => nomeA.localeCompare(nomeB, "pt-BR"),
    )

    return new Map(
      colaboradoresOrdenados.map(([colaboradorId], index) => [
        colaboradorId,
        gerarCorColaborador(index),
      ]),
    )
  }, [colaboradores, solicitacoes])

  function aplicarFiltros() {
    const params = new URLSearchParams()

    params.set("ano", ano)
    params.set("mes", mes)

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
            Controle visual das férias e ausências por mês, com foco em quem
            realmente estará fora no período selecionado.
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
            Filtre o mês, ano, status, equipe e colaborador para analisar as
            férias do período.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
            <div className="space-y-2">
              <Label>Mês</Label>

              <Select value={mes} onValueChange={setMes}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Mês" />
                </SelectTrigger>

                <SelectContent>
                  {meses.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Ano</Label>

              <Select value={ano} onValueChange={setAno}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Ano" />
                </SelectTrigger>

                <SelectContent>
                  {anosDisponiveis.map((item) => (
                    <SelectItem key={item} value={String(item)}>
                      {item}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
          <TabsList className="grid w-full max-w-[680px] grid-cols-4">
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

            <TabsTrigger value="programacao">
              <CalendarCheck2 className="mr-2 h-4 w-4" />
              Programação
              {alertasVencimento.length > 0 && (
                <span className="ml-2 inline-flex min-w-5 items-center justify-center rounded-full bg-rose-500 px-1.5 text-xs font-semibold text-white">
                  {alertasVencimento.length > 99
                    ? "99+"
                    : alertasVencimento.length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="calendario" className="mt-4">
          <div className="grid items-start gap-4 xl:grid-cols-[320px_minmax(0,1fr)]">
            <Card className="h-fit">
              <CardHeader>
                <CardTitle>Férias neste mês</CardTitle>

                <CardDescription>
                  Somente colaboradores com férias/ausências no mês selecionado.
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-3">
                {solicitacoesDoMes.length === 0 ? (
                  <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                    Nenhum colaborador com férias ou ausência neste mês.
                  </div>
                ) : (
                  solicitacoesDoMes.map((item) => {
                    const cor =
                      coresPorColaborador.get(item.colaborador_id) ??
                      gerarCorColaborador(0)

                    return (
                      <ResumoFeriasMesCard
                        key={item.id}
                        item={item}
                        cor={cor}
                      />
                    )
                  })
                )}
              </CardContent>
            </Card>

            <Card className="h-fit self-start">
              <CardHeader>
                <CardTitle>
                  {meses.find((item) => item.value === mes)?.label} de {ano}
                </CardTitle>

                <CardDescription>
                  Visualização mensal no estilo agenda, com barras por
                  colaborador.
                </CardDescription>
              </CardHeader>

              <CardContent>
                {solicitacoesDoMes.length === 0 ? (
                  <div className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
                    Nenhuma programação encontrada para este mês.
                  </div>
                ) : (
                  <>
                    <div className="overflow-hidden rounded-xl border">
                      <div className="w-full bg-white">
                        <div
                          className="grid border-b bg-slate-50"
                          style={{
                            gridTemplateColumns: `minmax(190px, 250px) repeat(${diasDoMes.length}, minmax(0, 1fr))`,
                          }}
                        >
                          <div className="border-r p-3 font-medium">
                            Colaborador
                          </div>

                          {diasDoMes.map((dia) => {
                            const dataDia = new Date(
                              Number(ano),
                              Number(mes) - 1,
                              dia,
                            )

                            const dayOfWeek = dataDia.getDay()
                            const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
                            const isToday = isSameDay(dataDia, new Date())

                            return (
                              <div
                                key={dia}
                                className={cn(
                                  "min-w-0 border-r px-0.5 py-2 text-center",
                                  isWeekend && "bg-slate-100",
                                  isToday && "bg-blue-50",
                                )}
                              >
                                <div className="text-[9px] text-muted-foreground">
                                  {WEEK_DAYS[dayOfWeek]}
                                </div>

                                <div className="text-xs font-semibold">
                                  {dia}
                                </div>
                              </div>
                            )
                          })}
                        </div>

                        {solicitacoesDoMes.map((item) => {
                          const corColaborador =
                            coresPorColaborador.get(item.colaborador_id) ??
                            gerarCorColaborador(0)

                          const inicioOriginal = parseDate(item.data_inicio)
                          const fimOriginal = parseDate(item.data_fim)

                          const inicioVisivel =
                            inicioOriginal < inicioMes
                              ? inicioMes
                              : inicioOriginal

                          const fimVisivel =
                            fimOriginal > fimMes ? fimMes : fimOriginal

                          const startDay = inicioVisivel.getDate()
                          const endDay = fimVisivel.getDate()

                          const leftPercent =
                            ((startDay - 1) / diasDoMes.length) * 100

                          const widthPercent =
                            ((endDay - startDay + 1) / diasDoMes.length) * 100

                          return (
                            <div
                              key={item.id}
                              className="grid border-b last:border-b-0"
                              style={{
                                gridTemplateColumns:
                                  "minmax(190px, 250px) minmax(0, 1fr)",
                              }}
                            >
                              <div className="border-r p-3">
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
                                    gridTemplateColumns: `repeat(${diasDoMes.length}, minmax(0, 1fr))`,
                                  }}
                                >
                                  {diasDoMes.map((dia) => {
                                    const dataDia = new Date(
                                      Number(ano),
                                      Number(mes) - 1,
                                      dia,
                                    )

                                    const dayOfWeek = dataDia.getDay()
                                    const isWeekend =
                                      dayOfWeek === 0 || dayOfWeek === 6
                                    const isToday = isSameDay(
                                      dataDia,
                                      new Date(),
                                    )

                                    return (
                                      <div
                                        key={`${item.id}-${dia}`}
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
                                    ...getCalendarBarStyle(
                                      item,
                                      corColaborador,
                                    ),
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

                    <div className="mt-4 flex flex-wrap items-center gap-3 text-xs">
                      <Badge
                        variant="outline"
                        className={statusClasses.aprovada}
                      >
                        Aprovada
                      </Badge>

                      <Badge
                        variant="outline"
                        className={statusClasses.pendente}
                      >
                        Pendente
                      </Badge>

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

                        <TableCell>{tipoLabels[solicitacao.tipo]}</TableCell>

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
                              onClick={() => excluirSolicitacao(solicitacao.id)}
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

        <TabsContent value="programacao" className="mt-4">
          <ProgramacaoFerias
            colaboradores={colaboradores}
            programacao={programacao}
            alertas={alertasVencimento}
            podeEditar={podeEditarProgramacao}
          />
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

function ResumoFeriasMesCard({
  item,
  cor,
}: {
  item: FeriasSolicitacao
  cor: CorColaborador
}) {
  return (
    <div className="rounded-xl border bg-white p-3 shadow-sm">
      <div
        className="mb-3 h-2.5 w-20 rounded-full"
        style={{
          backgroundColor: cor.solid,
        }}
      />

      <div className="flex items-start gap-3">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold"
          style={getAvatarStyle(cor)}
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


function gerarCorColaborador(index: number): CorColaborador {
  const hue = Math.round((190 + index * 137.508) % 360)

  return {
    solid: `hsl(${hue} 68% 50%)`,
    soft: `hsl(${hue} 68% 50% / 0.16)`,
  }
}

function getCalendarBarStyle(
  item: FeriasSolicitacao,
  cor: CorColaborador,
) {
  if (item.status === "reprovada" || item.status === "cancelada") {
    return {
      backgroundColor: "#E2E8F0",
      color: "#475569",
      opacity: 1,
    }
  }

  return {
    backgroundColor: cor.solid,
    color: "#FFFFFF",
    opacity: item.status === "pendente" ? 0.9 : 1,
  }
}

function getAvatarStyle(cor: CorColaborador) {
  return {
    backgroundColor: cor.soft,
    color: cor.solid,
  }
}
