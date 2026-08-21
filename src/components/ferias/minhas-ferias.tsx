"use client"

import { FormEvent, useMemo, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  Ban,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Plus,
  TimerReset,
  XCircle,
  type LucideIcon,
} from "lucide-react"

import {
  cancelarMinhaSolicitacaoFerias,
  criarMinhaSolicitacaoAusencia,
  type AusenciaPeriodoDia,
  type BancoHorasAusenciasResumo,
  type FeriasPeriodoResumo,
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
import { Textarea } from "@/components/ui/textarea"

type Colaborador = {
  id: string
  nome: string
  email: string | null
  status: string
  cargo: string | null
  equipe: string | null
}

type Solicitacao = {
  id: string
  colaborador_id: string
  colaborador_nome: string
  equipe: string | null
  cargo: string | null
  data_inicio: string
  data_fim: string
  dias_corridos: number
  tipo: FeriasTipo
  periodo_dia: AusenciaPeriodoDia
  horas_solicitadas: number | null
  status: FeriasStatus
  observacao: string | null
  motivo_reprovacao: string | null
}

type Resumo = {
  total: number
  pendentes: number
  aprovadas: number
  reprovadas: number
  canceladas: number
}

type MinhasFeriasProps = {
  colaborador: Colaborador
  solicitacoes: Solicitacao[]
  resumo: Resumo
  periodosDisponiveis: FeriasPeriodoResumo[]
  saldoBancoHoras: BancoHorasAusenciasResumo
}

type TipoSolicitavel = "ferias" | "day_off" | "folga_banco_horas"

type Formulario = {
  tipo: TipoSolicitavel
  periodoDia: AusenciaPeriodoDia
  dataInicio: string
  dataFim: string
  periodoAquisitivoId: string
  observacao: string
}

const formularioInicial: Formulario = {
  tipo: "ferias",
  periodoDia: "integral",
  dataInicio: "",
  dataFim: "",
  periodoAquisitivoId: "",
  observacao: "",
}

const statusLabels: Record<FeriasStatus, string> = {
  pendente: "Pendente",
  aprovada: "Aprovada",
  reprovada: "Reprovada",
  cancelada: "Cancelada",
}

const statusClasses: Record<FeriasStatus, string> = {
  pendente: "border-amber-200 bg-amber-50 text-amber-700",
  aprovada: "border-emerald-200 bg-emerald-50 text-emerald-700",
  reprovada: "border-rose-200 bg-rose-50 text-rose-700",
  cancelada: "border-slate-200 bg-slate-50 text-slate-600",
}

const tipoLabels: Record<TipoSolicitavel, string> = {
  ferias: "Férias",
  day_off: "Day off",
  folga_banco_horas: "Folga banco de horas",
}

export default function MinhasFerias({
  colaborador,
  solicitacoes,
  resumo,
  periodosDisponiveis,
  saldoBancoHoras,
}: MinhasFeriasProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [dialogAberto, setDialogAberto] = useState(false)
  const [form, setForm] = useState<Formulario>(formularioInicial)

  const periodoSelecionado = useMemo(
    () =>
      periodosDisponiveis.find(
        (periodo) => periodo.periodo_id === form.periodoAquisitivoId,
      ) ?? null,
    [form.periodoAquisitivoId, periodosDisponiveis],
  )

  function atualizarForm<K extends keyof Formulario>(
    campo: K,
    valor: Formulario[K],
  ) {
    setForm((atual) => {
      const proximo = {
        ...atual,
        [campo]: valor,
      } as Formulario

      if (campo === "dataInicio") {
        const novaData = String(valor)
        const exigeDataUnica =
          atual.tipo === "day_off" || atual.periodoDia !== "integral"

        if (exigeDataUnica) {
          proximo.dataFim = novaData
        }
      }

      if (campo === "periodoDia" && valor !== "integral" && atual.dataInicio) {
        proximo.dataFim = atual.dataInicio
      }

      return proximo
    })
  }

  function alterarTipo(tipo: TipoSolicitavel) {
    setForm((atual) => ({
      ...atual,
      tipo,
      periodoDia: "integral",
      dataFim: tipo === "day_off" && atual.dataInicio ? atual.dataInicio : atual.dataFim,
      periodoAquisitivoId: tipo === "ferias" ? atual.periodoAquisitivoId : "",
    }))
  }

  function criarSolicitacao(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    startTransition(() => {
      void (async () => {
        try {
          await criarMinhaSolicitacaoAusencia({
            tipo: form.tipo,
            periodoDia: form.periodoDia,
            dataInicio: form.dataInicio,
            dataFim: form.dataFim,
            observacao: form.observacao || undefined,
            periodoAquisitivoId:
              form.tipo === "ferias" && form.periodoAquisitivoId
                ? form.periodoAquisitivoId
                : undefined,
          })

          toast.success(`${tipoLabels[form.tipo]} enviado(a) para análise.`)
          setForm(formularioInicial)
          setDialogAberto(false)
          router.refresh()
        } catch (error) {
          toast.error(
            error instanceof Error
              ? error.message
              : "Erro ao enviar a solicitação.",
          )
        }
      })()
    })
  }

  function cancelarSolicitacao(solicitacaoId: string) {
    const confirmado = window.confirm(
      "Tem certeza que deseja cancelar esta solicitação pendente?",
    )

    if (!confirmado) return

    startTransition(() => {
      void (async () => {
        try {
          await cancelarMinhaSolicitacaoFerias(solicitacaoId)
          toast.success("Solicitação cancelada.")
          router.refresh()
        } catch (error) {
          toast.error(
            error instanceof Error
              ? error.message
              : "Erro ao cancelar a solicitação.",
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
            Minhas Ausências
          </h1>
          <p className="text-sm text-muted-foreground">
            Solicite férias, day-off ou folga de banco de horas e acompanhe o
            andamento dos seus pedidos.
          </p>
        </div>

        <Button onClick={() => setDialogAberto(true)}>
          <Plus className="h-4 w-4" />
          Nova solicitação
        </Button>
      </div>

      <Card>
        <CardContent className="flex flex-col gap-1 p-5">
          <p className="font-medium">{colaborador.nome}</p>
          <p className="text-sm text-muted-foreground">
            {colaborador.cargo ?? "Cargo não informado"}
          </p>
          <p className="text-sm text-muted-foreground">
            {colaborador.equipe ?? "Equipe não informada"}
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
        <ResumoCard
          title="Total"
          value={resumo.total}
          description="solicitações"
          icon={CalendarDays}
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
          title="Reprovadas"
          value={resumo.reprovadas}
          description="não aprovadas"
          icon={XCircle}
        />
        <ResumoCard
          title="Canceladas"
          value={resumo.canceladas}
          description="canceladas"
          icon={Ban}
        />
        <ResumoCard
          title="Banco disponível"
          value={formatarHoras(saldoBancoHoras.saldoDisponivel)}
          description={`${formatarHoras(saldoBancoHoras.horasReservadas)} reservadas`}
          icon={TimerReset}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Minhas solicitações</CardTitle>
          <CardDescription>
            Histórico de férias, day-offs e folgas de banco de horas.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Período</TableHead>
                  <TableHead>Datas</TableHead>
                  <TableHead>Quantidade</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Observação</TableHead>
                  <TableHead className="text-right">Ação</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {solicitacoes.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="h-24 text-center text-muted-foreground"
                    >
                      Você ainda não possui solicitações de ausência.
                    </TableCell>
                  </TableRow>
                ) : (
                  solicitacoes.map((solicitacao) => (
                    <TableRow key={solicitacao.id}>
                      <TableCell>
                        {labelTipo(solicitacao.tipo)}
                      </TableCell>
                      <TableCell>
                        {formatarPeriodoDia(solicitacao.periodo_dia)}
                      </TableCell>
                      <TableCell>
                        {formatarData(solicitacao.data_inicio)}
                        {solicitacao.data_fim !== solicitacao.data_inicio
                          ? ` a ${formatarData(solicitacao.data_fim)}`
                          : ""}
                      </TableCell>
                      <TableCell>
                        {solicitacao.horas_solicitadas != null
                          ? formatarHoras(solicitacao.horas_solicitadas)
                          : `${solicitacao.dias_corridos} dia(s)`}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={statusClasses[solicitacao.status]}
                        >
                          {statusLabels[solicitacao.status]}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-[360px] whitespace-normal">
                        {solicitacao.motivo_reprovacao ||
                          solicitacao.observacao ||
                          "Sem observação"}
                      </TableCell>
                      <TableCell className="text-right">
                        {solicitacao.status === "pendente" ? (
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            disabled={isPending}
                            onClick={() => cancelarSolicitacao(solicitacao.id)}
                          >
                            Cancelar
                          </Button>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            Sem ações
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={dialogAberto} onOpenChange={setDialogAberto}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Nova solicitação de ausência</DialogTitle>
            <DialogDescription>
              O pedido ficará pendente até a análise. Pedidos pendentes também
              aparecem no calendário de gestão para antecipar conflitos.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={criarSolicitacao} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <Label>Tipo de ausência</Label>
                <Select
                  value={form.tipo}
                  onValueChange={(value) => alterarTipo(value as TipoSolicitavel)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ferias">Férias</SelectItem>
                    <SelectItem value="day_off">Day off</SelectItem>
                    <SelectItem value="folga_banco_horas">
                      Folga de banco de horas
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {form.tipo === "ferias" && periodosDisponiveis.length > 0 && (
                <div className="space-y-2 md:col-span-2">
                  <Label>Período aquisitivo</Label>
                  <Select
                    value={form.periodoAquisitivoId}
                    onValueChange={(value) =>
                      atualizarForm("periodoAquisitivoId", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o período" />
                    </SelectTrigger>
                    <SelectContent>
                      {periodosDisponiveis.map((periodo) => (
                        <SelectItem
                          key={periodo.periodo_id}
                          value={periodo.periodo_id}
                        >
                          {formatarData(periodo.aquisitivo_inicio)} a {" "}
                          {formatarData(periodo.aquisitivo_fim)} · saldo {" "}
                          {periodo.saldo_apos_pendencias} dia(s)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {periodoSelecionado && (
                    <p className="text-xs text-muted-foreground">
                      Período concessivo até {" "}
                      {formatarData(periodoSelecionado.concessivo_fim)}.
                    </p>
                  )}
                </div>
              )}

              {form.tipo !== "ferias" && (
                <div className="space-y-2 md:col-span-2">
                  <Label>Período do dia</Label>
                  <Select
                    value={form.periodoDia}
                    onValueChange={(value) =>
                      atualizarForm(
                        "periodoDia",
                        value as AusenciaPeriodoDia,
                      )
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="integral">Dia inteiro</SelectItem>
                      <SelectItem value="manha">Manhã</SelectItem>
                      <SelectItem value="tarde">Tarde</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <Label>Data de início</Label>
                <Input
                  type="date"
                  value={form.dataInicio}
                  onChange={(event) =>
                    atualizarForm("dataInicio", event.target.value)
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Data de fim</Label>
                <Input
                  type="date"
                  value={form.dataFim}
                  min={form.dataInicio || undefined}
                  onChange={(event) =>
                    atualizarForm("dataFim", event.target.value)
                  }
                  disabled={
                    form.tipo === "day_off" || form.periodoDia !== "integral"
                  }
                  required
                />
                {(form.tipo === "day_off" ||
                  form.periodoDia !== "integral") && (
                  <p className="text-xs text-muted-foreground">
                    Para este tipo de solicitação, início e fim usam a mesma data.
                  </p>
                )}
              </div>

              {form.tipo === "folga_banco_horas" && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm md:col-span-2">
                  <p className="font-medium text-amber-900">
                    Saldo disponível: {formatarHoras(saldoBancoHoras.saldoDisponivel)}
                  </p>
                  <p className="mt-1 text-xs text-amber-800">
                    O sistema reserva as horas enquanto o pedido estiver pendente
                    ou aprovado. A aprovação não faz uma baixa manual no banco;
                    isso evita descontar as mesmas horas duas vezes.
                  </p>
                </div>
              )}

              <div className="space-y-2 md:col-span-2">
                <Label>Observação</Label>
                <Textarea
                  value={form.observacao}
                  onChange={(event) =>
                    atualizarForm("observacao", event.target.value)
                  }
                  placeholder="Inclua uma observação, se necessário"
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogAberto(false)}
              >
                Fechar
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Enviando..." : "Enviar solicitação"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function ResumoCard({
  title,
  value,
  description,
  icon: Icon,
}: {
  title: string
  value: number | string
  description: string
  icon: LucideIcon
}) {
  return (
    <Card>
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

function labelTipo(tipo: FeriasTipo) {
  if (tipo === "ferias") return "Férias"
  if (tipo === "day_off") return "Day off"
  if (tipo === "folga_banco_horas") return "Folga banco de horas"
  if (tipo === "atestado") return "Atestado"
  if (tipo === "licenca") return "Licença"
  return "Ausência"
}

function formatarPeriodoDia(periodo: AusenciaPeriodoDia) {
  if (periodo === "manha") return "Manhã"
  if (periodo === "tarde") return "Tarde"
  return "Dia inteiro"
}

function formatarHoras(valor: number) {
  return `${Number(valor).toLocaleString("pt-BR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}h`
}

function formatarData(data: string) {
  if (!data) return "-"

  const [ano, mes, dia] = data.split("-")
  return `${dia}/${mes}/${ano}`
}
