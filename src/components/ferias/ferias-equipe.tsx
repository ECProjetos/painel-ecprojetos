"use client"

import { useMemo, useTransition } from "react"
import { useRouter } from "next/navigation"
import {
  CalendarCheck2,
  CalendarDays,
  Clock3,
  Users,
} from "lucide-react"

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

  const anosDisponiveis = useMemo(() => {
    return [
      filtros.ano - 1,
      filtros.ano,
      filtros.ano + 1,
      filtros.ano + 2,
    ]
  }, [filtros.ano])

  const solicitacoesPorColaborador = useMemo(() => {
    const mapa = new Map<string, FeriasEquipeSolicitacao[]>()

    for (const solicitacao of solicitacoes) {
      const atuais = mapa.get(solicitacao.colaborador_id) ?? []
      atuais.push(solicitacao)
      mapa.set(solicitacao.colaborador_id, atuais)
    }

    return mapa
  }, [solicitacoes])

  const colaboradoresComSolicitacao = useMemo(() => {
    return colaboradores
      .filter((colaborador) =>
        solicitacoesPorColaborador.has(colaborador.id),
      )
      .sort((a, b) => a.nome.localeCompare(b.nome))
  }, [colaboradores, solicitacoesPorColaborador])

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
            Férias da Equipe
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Consulte somente as férias aprovadas dos colaboradores das suas
            equipes.
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
          titulo="Férias aprovadas"
          valor={resumo.total}
          descricao={`em ${meses[filtros.mes - 1].toLowerCase()}`}
          icon={CalendarCheck2}
        />
        <ResumoCard
          titulo="Em férias hoje"
          valor={resumo.emFeriasHoje}
          descricao="colaboradores ausentes"
          icon={Clock3}
        />
        <ResumoCard
          titulo="Com férias no mês"
          valor={resumo.colaboradoresComFerias}
          descricao={`${resumo.proximas} período(s) futuro(s)`}
          icon={CalendarDays}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Calendário da equipe</CardTitle>
          <CardDescription>
            Períodos aprovados em {meses[filtros.mes - 1]} de {filtros.ano}.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {colaboradoresComSolicitacao.length === 0 ? (
            <EmptyState />
          ) : (
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

                {colaboradoresComSolicitacao.map((colaborador) => {
                  const periodos =
                    solicitacoesPorColaborador.get(colaborador.id) ?? []

                  return (
                    <CalendarRow
                      key={colaborador.id}
                      colaborador={colaborador}
                      periodos={periodos}
                      diasDoMes={diasDoMes}
                      ano={filtros.ano}
                      mes={filtros.mes}
                    />
                  )
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Períodos aprovados</CardTitle>
          <CardDescription>
            Relação completa das férias aprovadas que alcançam o mês
            selecionado.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Colaborador</TableHead>
                  <TableHead>Equipe</TableHead>
                  <TableHead>Início</TableHead>
                  <TableHead>Fim</TableHead>
                  <TableHead className="text-right">Dias</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {solicitacoes.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="h-28 text-center text-muted-foreground"
                    >
                      Nenhuma férias aprovada para o período selecionado.
                    </TableCell>
                  </TableRow>
                ) : (
                  solicitacoes.map((solicitacao) => (
                    <TableRow key={solicitacao.id}>
                      <TableCell>
                        <div className="font-medium">
                          {solicitacao.colaborador_nome}
                        </div>
                        {solicitacao.cargo && (
                          <div className="text-xs text-muted-foreground">
                            {solicitacao.cargo}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>{solicitacao.equipe ?? "Sem equipe"}</TableCell>
                      <TableCell>{formatarData(solicitacao.data_inicio)}</TableCell>
                      <TableCell>{formatarData(solicitacao.data_fim)}</TableCell>
                      <TableCell className="text-right font-medium">
                        {solicitacao.dias_corridos}
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
        Visualização disponível para {lider.nome}. Solicitações pendentes,
        reprovadas, canceladas e informações administrativas não são exibidas.
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
                ? `${colaborador.nome}: ${formatarData(periodo.data_inicio)} a ${formatarData(periodo.data_fim)}`
                : undefined
            }
          >
            {periodo && (
              <div
                className={cn(
                  "h-8 w-full bg-blue-500/85",
                  data === periodo.data_inicio && "rounded-l-md",
                  data === periodo.data_fim && "rounded-r-md",
                )}
                aria-label={`Férias de ${colaborador.nome}`}
              />
            )}
          </div>
        )
      })}
    </>
  )
}

function EmptyState() {
  return (
    <div className="flex min-h-48 flex-col items-center justify-center rounded-lg border border-dashed p-6 text-center">
      <CalendarDays className="mb-3 h-8 w-8 text-muted-foreground" />
      <p className="font-medium">Nenhuma férias aprovada neste mês</p>
      <p className="mt-1 max-w-md text-sm text-muted-foreground">
        A página será atualizada quando o RH aprovar uma solicitação de alguém
        pertencente à equipe do líder.
      </p>
    </div>
  )
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