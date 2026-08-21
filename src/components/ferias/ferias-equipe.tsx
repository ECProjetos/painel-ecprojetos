"use client"

import { useMemo, useTransition } from "react"
import { useRouter } from "next/navigation"
import {
  CalendarCheck2,
  CalendarDays,
  Clock3,
  Users,
} from "lucide-react"

import {
  type AusenciaPeriodoDia,
  type FeriasStatus,
  type FeriasTipo,
} from "@/app/actions/ferias"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
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
import { cn } from "@/lib/utils"

type ColaboradorEquipe = {
  id: string
  nome: string
  cargo: string | null
  equipe: string | null
}

type FeriasEquipeSolicitacao = {
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
  periodo_dia: AusenciaPeriodoDia
  horas_solicitadas: number | null
}

type FeriasEquipeProps = {
  lider: {
    id: string
    nome: string
  }
  equipes: string[]
  colaboradores: ColaboradorEquipe[]
  solicitacoes: FeriasEquipeSolicitacao[]
  resumo: {
    total: number
    aprovadas: number
    pendentes: number
    emFeriasHoje: number
    proximas: number
    colaboradoresComFerias: number
  }
  filtros: {
    ano: number
    mes: number
  }
}

const meses = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
]

const statusClasses: Record<FeriasStatus, string> = {
  pendente: "border-amber-200 bg-amber-50 text-amber-700",
  aprovada: "border-emerald-200 bg-emerald-50 text-emerald-700",
  reprovada: "border-rose-200 bg-rose-50 text-rose-700",
  cancelada: "border-slate-200 bg-slate-50 text-slate-600",
}

const tipoCores: Record<FeriasTipo, { solid: string; soft: string }> = {
  ferias: { solid: "#2563EB", soft: "#DBEAFE" },
  day_off: { solid: "#7C3AED", soft: "#EDE9FE" },
  folga_banco_horas: { solid: "#D97706", soft: "#FEF3C7" },
  ausencia: { solid: "#475569", soft: "#E2E8F0" },
  atestado: { solid: "#0891B2", soft: "#CFFAFE" },
  licenca: { solid: "#059669", soft: "#D1FAE5" },
}

export default function FeriasEquipe({
  lider,
  equipes,
  colaboradores,
  solicitacoes,
  resumo,
  filtros,
}: FeriasEquipeProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const diasDoMes = useMemo(() => {
    const total = new Date(filtros.ano, filtros.mes, 0).getDate()
    return Array.from({ length: total }, (_, index) => index + 1)
  }, [filtros.ano, filtros.mes])

  const anosDisponiveis = useMemo(
    () => [filtros.ano - 1, filtros.ano, filtros.ano + 1, filtros.ano + 2],
    [filtros.ano],
  )

  const solicitacoesPorColaborador = useMemo(() => {
    const mapa = new Map<string, FeriasEquipeSolicitacao[]>()

    for (const solicitacao of solicitacoes) {
      const atuais = mapa.get(solicitacao.colaborador_id) ?? []
      atuais.push(solicitacao)
      mapa.set(solicitacao.colaborador_id, atuais)
    }

    return mapa
  }, [solicitacoes])

  const colaboradoresComSolicitacao = useMemo(
    () =>
      colaboradores
        .filter((colaborador) => solicitacoesPorColaborador.has(colaborador.id))
        .sort((a, b) => a.nome.localeCompare(b.nome)),
    [colaboradores, solicitacoesPorColaborador],
  )

  function atualizarPeriodo(ano: number, mes: number) {
    startTransition(() => {
      router.push(`/rh/ferias-equipe?ano=${ano}&mes=${mes}`)
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">
            Ausências da Equipe
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Férias, day-offs e folgas de banco de horas aprovadas ou pendentes
            das equipes sob sua liderança.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {equipes.map((equipe) => (
              <Badge key={equipe} variant="secondary">
                {equipe}
              </Badge>
            ))}
          </div>
        </div>

        <Card className="w-full lg:w-auto lg:min-w-[340px]">
          <CardContent className="flex flex-col gap-3 p-4 sm:flex-row">
            <div className="min-w-[150px]">
              <p className="mb-1 text-xs font-medium text-muted-foreground">
                Mês
              </p>
              <Select
                value={String(filtros.mes)}
                onValueChange={(value) =>
                  atualizarPeriodo(filtros.ano, Number(value))
                }
                disabled={isPending}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {meses.map((mes, index) => (
                    <SelectItem key={mes} value={String(index + 1)}>
                      {mes}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="min-w-[120px]">
              <p className="mb-1 text-xs font-medium text-muted-foreground">
                Ano
              </p>
              <Select
                value={String(filtros.ano)}
                onValueChange={(value) =>
                  atualizarPeriodo(Number(value), filtros.mes)
                }
                disabled={isPending}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {anosDisponiveis.map((ano) => (
                    <SelectItem key={ano} value={String(ano)}>
                      {ano}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <ResumoCard
          titulo="Colaboradores da equipe"
          valor={colaboradores.length}
          descricao="usuários ativos"
          icon={Users}
        />
        <ResumoCard
          titulo="Ausências aprovadas"
          valor={resumo.aprovadas}
          descricao={`em ${meses[filtros.mes - 1].toLowerCase()}`}
          icon={CalendarCheck2}
        />
        <ResumoCard
          titulo="Pedidos pendentes"
          valor={resumo.pendentes}
          descricao="potenciais conflitos"
          icon={CalendarDays}
        />
        <ResumoCard
          titulo="Ausentes hoje"
          valor={resumo.emFeriasHoje}
          descricao="ausências aprovadas"
          icon={Clock3}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Calendário da equipe</CardTitle>
          <CardDescription>
            Solicitações aprovadas e pendentes em {meses[filtros.mes - 1]} de {" "}
            {filtros.ano}. Pendências usam contorno tracejado.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {colaboradoresComSolicitacao.length === 0 ? (
            <EmptyState />
          ) : (
            <>
              <div className="overflow-x-auto rounded-lg border">
                <div
                  className="min-w-[980px]"
                  style={{
                    display: "grid",
                    gridTemplateColumns: `240px repeat(${diasDoMes.length}, minmax(24px, 1fr))`,
                  }}
                >
                  <div className="sticky left-0 z-20 border-b border-r bg-muted/90 px-3 py-2 text-sm font-semibold backdrop-blur">
                    Colaborador
                  </div>

                  {diasDoMes.map((dia) => (
                    <div
                      key={`cabecalho-${dia}`}
                      className={cn(
                        "border-b border-r px-1 py-2 text-center text-xs font-semibold",
                        isFimDeSemana(filtros.ano, filtros.mes, dia)
                          ? "bg-muted/80 text-muted-foreground"
                          : "bg-muted/40",
                      )}
                    >
                      {dia}
                    </div>
                  ))}

                  {colaboradoresComSolicitacao.map((colaborador) => (
                    <CalendarRow
                      key={colaborador.id}
                      colaborador={colaborador}
                      periodos={
                        solicitacoesPorColaborador.get(colaborador.id) ?? []
                      }
                      diasDoMes={diasDoMes}
                      ano={filtros.ano}
                      mes={filtros.mes}
                    />
                  ))}
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-4 text-xs text-muted-foreground">
                <Legenda tipo="ferias" label="Férias" />
                <Legenda tipo="day_off" label="Day off" />
                <Legenda tipo="folga_banco_horas" label="Banco de horas" />
                <span>Contorno tracejado = pendente</span>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Solicitações no período</CardTitle>
          <CardDescription>
            Relação das ausências aprovadas e pendentes que alcançam o mês
            selecionado.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Colaborador</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Período</TableHead>
                  <TableHead>Datas</TableHead>
                  <TableHead>Quantidade</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {solicitacoes.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="h-28 text-center text-muted-foreground"
                    >
                      Nenhuma ausência para o período selecionado.
                    </TableCell>
                  </TableRow>
                ) : (
                  solicitacoes.map((solicitacao) => (
                    <TableRow key={solicitacao.id}>
                      <TableCell>
                        <div className="font-medium">
                          {solicitacao.colaborador_nome}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {solicitacao.equipe ?? "Sem equipe"}
                        </div>
                      </TableCell>
                      <TableCell>{labelTipo(solicitacao.tipo)}</TableCell>
                      <TableCell>
                        {formatarPeriodoDia(solicitacao.periodo_dia)}
                      </TableCell>
                      <TableCell>
                        {formatarData(solicitacao.data_inicio)}
                        {solicitacao.data_inicio !== solicitacao.data_fim
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
                          {solicitacao.status === "aprovada"
                            ? "Aprovada"
                            : "Pendente"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">
        Visualização disponível para {lider.nome}. Reprovações, cancelamentos e
        dados administrativos de férias permanecem restritos à gestão/RH.
      </p>
    </div>
  )
}

function ResumoCard({
  titulo,
  valor,
  descricao,
  icon: Icon,
}: {
  titulo: string
  valor: number
  descricao: string
  icon: typeof Users
}) {
  return (
    <Card>
      <CardContent className="flex items-start justify-between p-5">
        <div>
          <p className="text-sm font-medium">{titulo}</p>
          <p className="mt-4 text-3xl font-semibold">{valor}</p>
          <p className="mt-1 text-xs text-muted-foreground">{descricao}</p>
        </div>
        <Icon className="h-5 w-5 text-muted-foreground" />
      </CardContent>
    </Card>
  )
}

function CalendarRow({
  colaborador,
  periodos,
  diasDoMes,
  ano,
  mes,
}: {
  colaborador: ColaboradorEquipe
  periodos: FeriasEquipeSolicitacao[]
  diasDoMes: number[]
  ano: number
  mes: number
}) {
  return (
    <>
      <div className="sticky left-0 z-10 border-b border-r bg-background px-3 py-3">
        <div className="truncate text-sm font-medium">{colaborador.nome}</div>
        <div className="truncate text-xs text-muted-foreground">
          {colaborador.cargo ?? colaborador.equipe ?? "Colaborador"}
        </div>
      </div>

      {diasDoMes.map((dia) => {
        const data = montarDataISO(ano, mes, dia)
        const periodo = periodos.find(
          (item) => item.data_inicio <= data && item.data_fim >= data,
        )
        const fimDeSemana = isFimDeSemana(ano, mes, dia)

        return (
          <div
            key={`${colaborador.id}-${dia}`}
            className={cn(
              "flex min-h-14 items-center justify-center border-b border-r p-0.5",
              fimDeSemana && "bg-muted/40",
            )}
            title={
              periodo
                ? `${labelTipo(periodo.tipo)} · ${formatarPeriodoDia(
                    periodo.periodo_dia,
                  )} · ${periodo.status === "pendente" ? "Pendente" : "Aprovada"}`
                : undefined
            }
          >
            {periodo && <MarcadorAusencia periodo={periodo} />}
          </div>
        )
      })}
    </>
  )
}

function MarcadorAusencia({
  periodo,
}: {
  periodo: FeriasEquipeSolicitacao
}) {
  const cor = tipoCores[periodo.tipo]

  return (
    <div
      className="h-8 w-full rounded-md"
      style={{
        backgroundColor:
          periodo.status === "pendente" ? cor.soft : cor.solid,
        border:
          periodo.status === "pendente"
            ? `2px dashed ${cor.solid}`
            : `1px solid ${cor.solid}`,
      }}
      aria-label={`${labelTipo(periodo.tipo)} de ${periodo.colaborador_nome}`}
    />
  )
}

function Legenda({ tipo, label }: { tipo: FeriasTipo; label: string }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span
        className="h-3 w-7 rounded-full"
        style={{ backgroundColor: tipoCores[tipo].solid }}
      />
      {label}
    </span>
  )
}

function EmptyState() {
  return (
    <div className="flex min-h-48 flex-col items-center justify-center rounded-lg border border-dashed p-6 text-center">
      <CalendarDays className="mb-3 h-8 w-8 text-muted-foreground" />
      <p className="font-medium">Nenhuma ausência neste mês</p>
      <p className="mt-1 max-w-md text-sm text-muted-foreground">
        A página exibirá férias, day-offs e folgas de banco de horas aprovadas
        ou pendentes da equipe.
      </p>
    </div>
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
    maximumFractionDigits: 2,
  })}h`
}

function montarDataISO(ano: number, mes: number, dia: number) {
  return `${ano}-${String(mes).padStart(2, "0")}-${String(dia).padStart(2, "0")}`
}

function isFimDeSemana(ano: number, mes: number, dia: number) {
  const semana = new Date(ano, mes - 1, dia, 12).getDay()
  return semana === 0 || semana === 6
}

function formatarData(data: string) {
  const [ano, mes, dia] = data.split("-")
  return `${dia}/${mes}/${ano}`
}
